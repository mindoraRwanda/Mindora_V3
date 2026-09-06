# Mindora V3 — Engineering Onboarding

This is the "how does this thing actually work" doc. It's meant to be read start to
finish by a new engineer before they touch code. For step-by-step setup commands see
[`README.md`](README.md); for known security/product gaps see
[`BACKEND_COMPLETE.md`](BACKEND_COMPLETE.md); for production deployment see
[`DP.md`](DP.md). This doc focuses on the shape of the system and why it's built the
way it is.

## What is Mindora

A mental health platform: patients book appointments with therapists, track their mood,
chat 1-to-1 with therapists or with an AI chatbot, and participate in (optionally
anonymous) community groups. It's a Turborepo/npm-workspaces monorepo of **9
independently-owned backend services**, fronted by a **Kong API gateway**, communicating
synchronously over HTTP and asynchronously over **RabbitMQ**.

There is no frontend in this repo — this is backend-only. Mobile/web clients (and a
separate external AI chatbot service) talk to it over HTTP/WebSocket through Kong.

## Architecture at a glance

```
                         ┌─────────────────────────┐
  client (mobile/web) ──▶│   Kong Gateway :8000     │──▶ per-route JWT + rate limiting
                         └───────────┬─────────────┘
                                     │ host.docker.internal:<port> (dev)
                                     │ *.railway.internal:<port>  (prod bundle)
              ┌──────────────────────┼───────────────────────────────────┐
              ▼                      ▼                                   ▼
        auth-service :3001     user-service :3002                appointment-service :3003
        mood-tracking :3004    community-service :3005            messaging-service :3006
        ai-integration :3007   notification-service :3008         admin-service :3009
                                     │
                                     ▼
                              docs-gateway :3010  (Swagger aggregator only, prod bundle)

  Data stores: 7 separate Postgres DBs (one per service, one physical container) ·
               2 separate MongoDB DBs (community, messaging) · Redis (JWT blacklist,
               presence, rate/cache) · RabbitMQ (event bus)
```

Each service is its own Express app, its own `package.json`, and (where it persists
data) its own Prisma schema pointed at its own database. **There is no shared
database package** — every service owns its schema and migrations independently. This
is a deliberate, relatively recent change (2026-07-12): a `packages/database` package
used to hold one shared Prisma schema for everything, and it was split apart so
services could evolve their data models independently. If you see a stray
`dotenv.config({ path: '../../../packages/database/.env' })` in a service's
`src/index.ts`, that's a harmless leftover from before the split — the path no longer
exists, the call just silently no-ops.

## How a request flows through the system

1. **Client → Kong (`:8000`).** Kong is the only thing that should be reachable from
   outside. It owns CORS, per-route JWT verification, and per-route rate limiting —
   individual services trust that a request reaching them already has a valid,
   Kong-checked JWT (except for a handful of public routes: register/login/refresh/
   password-reset/OAuth/health checks, which Kong explicitly exempts from the JWT
   plugin — see `infrastructure/kong/kong.yml`).
2. **Kong → service.** Kong forwards to the target service over
   `host.docker.internal:<port>` in local dev (each service runs on the host, Kong runs
   in Docker) or `<bundle>.railway.internal:<port>` in the production bundle deploy.
   Whether `strip_path` is true or false per route depends on how that service mounts
   its own Express router — a few routes (`community-api`, `ai-api`) are pinned to
   `strip_path: false` because those services mount at the full `/api/v1/...` prefix
   internally, not the stripped remainder. Getting this wrong is a real, previously-hit
   footgun (see the comments in `infrastructure/kong/kong.yml`) — a route that 404s
   only when called *through Kong* but works fine when tested directly against the
   service is almost always a `strip_path` mismatch, not a routing bug in the service.
3. **Service-to-service calls.** When one service needs data it doesn't own (e.g.
   appointment-service needs to confirm a user is really a therapist, or admin-service
   needs to suspend a user that auth-service owns), it calls back out **through Kong**
   at a separate `/internal/<service>` route, authenticated with a long-lived
   `SERVICE`-role JWT stored as `INTERNAL_SERVICE_TOKEN`. These internal routes are
   deliberately kept out of the public `*-api` routes so a leaked user JWT can never
   exercise them. These calls go through `@mindora/http-client`, which wraps each
   outbound call in a circuit breaker (5s timeout, opens past 50% error rate, 10s
   reset) so one struggling downstream service degrades instead of cascading.
4. **Async side effects via RabbitMQ.** Anything that shouldn't block the request
   (push/email/SMS, admin alerting) is published as an event instead of called
   synchronously. See "Event-driven communication" below.

## The services

| Service | Port | Database | Owns |
|---|---|---|---|
| auth-service | 3001 | Postgres `mindora_auth` | Registration, login, JWT issue/refresh/rotation, Google OAuth, password reset |
| user-service | 3002 | Postgres `mindora_user` | Patient/therapist profile data |
| appointment-service | 3003 | Postgres `mindora_appointment` | Booking lifecycle (pending → confirmed → completed/cancelled), ratings |
| mood-tracking-service | 3004 | Postgres `mindora_mood` (TimescaleDB hypertable) | Mood/journal logging, streaks, insights |
| community-service | 3005 | MongoDB `mindora_community` | Groups, posts, comments, reactions, moderation reports |
| messaging-service | 3006 | MongoDB `mindora_messaging` | 1-to-1 chat over Socket.io, presence, typing indicators |
| ai-integration-service | 3007 | Postgres `mindora_ai` | Proxies chat to an external AI chatbot, crisis pre-filtering, encrypted audit log |
| notification-service | 3008 | Postgres `mindora_notifications` | Pure RabbitMQ consumer — push (FCM) / email (Resend) / SMS (Africa's Talking) |
| admin-service | 3009 | Postgres `mindora_admin` | Admin console: suspend/reactivate users, moderation, audit log, cross-service analytics rollup, system alerts |
| docs-gateway | 3010 | — | Aggregates every other service's OpenAPI spec into one Swagger UI (only relevant in the production bundle deploy) |

`auth-service`, `user-service`, `community-service`, `messaging-service`, and
`notification-service` are documented in detail (full route tables, Prisma models,
token/encryption behaviour) in [`README.md`](README.md) — that stays the canonical
reference for those five. The remaining five are covered in depth below since they
aren't documented elsewhere yet.

### appointment-service

Books and manages appointment slots. Has no local copy of user/therapist data — it
verifies a `therapistId` really belongs to a therapist by calling auth-service through
Kong at request time, rather than joining across databases.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/availability/:therapistId` | JWT | Computed open slots for a therapist in a date range |
| `POST` | `/` | JWT, `PATIENT` | Book an appointment (Postgres advisory lock keyed on `therapistId`, guards against double-booking) |
| `GET` | `/mine` | JWT, `PATIENT` | Paginated list of caller's own appointments |
| `GET` | `/schedule` | JWT, `THERAPIST` | Paginated schedule for the caller |
| `PUT` | `/:id/confirm` | JWT, assigned `THERAPIST` | PENDING → CONFIRMED; publishes `appointment.confirmed` |
| `PUT` | `/:id/cancel` | JWT, owner patient or assigned therapist | → CANCELLED; publishes `appointment.cancelled` |
| `PUT` | `/:id/complete` | JWT, assigned `THERAPIST` | CONFIRMED → COMPLETED; publishes `appointment.completed` |
| `POST` | `/:id/rate` | JWT, owner `PATIENT` | Rate a COMPLETED appointment |
| `GET` | `/internal/appointments/analytics` | JWT, `SERVICE` | Aggregate counts, used by admin-service |

**Data model:** single `Appointment` table — `patientId`, `therapistId`, `slotStart`/
`slotEnd`, `sessionType` (VIDEO/IN_PERSON/CHAT), `status`
(PENDING/CONFIRMED/CANCELLED/COMPLETED), `cancellationReason`, `rating`.

**Quirk:** booking takes `pg_advisory_xact_lock(hashtext(therapistId))` instead of
locking a row on `therapist_profiles`, because that table now lives in a different
database (`mindora_user`) — Postgres advisory locks are per-connection/session and
can't span databases the way a row lock inside one transaction could.

### mood-tracking-service

Patient mood/journal logging with streaks, weekly insights, and therapist-facing
reports. Journal notes are encrypted at rest (`MOOD_JOURNAL_ENCRYPTION_KEY`).

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/log` | JWT, `PATIENT` | Log a mood entry; rate-limited to 10/day via Redis; may publish `mood.concern`/`mood.streak` |
| `GET` | `/history` | JWT, `PATIENT` | Paginated entries, optional date range |
| `GET` | `/insights` | JWT, `PATIENT` | Weekly trend insights, Redis-cached 1h |
| `GET` | `/report/:userId` | JWT, `THERAPIST` | 30-day averages + streak + trend for a patient |
| `GET` | `/streak` | JWT, `PATIENT` | Current check-in streak |
| `GET` | `/internal/mood/analytics` | JWT, `SERVICE` | Platform-wide mood stats, used by admin-service |

**Data model:** single `MoodEntry` table with a **composite primary key
`(id, recordedAt)`** — required because `mood_entries` is a TimescaleDB hypertable
partitioned on `recordedAt` (`SELECT create_hypertable('mood_entries', 'recorded_at')`
runs once after migration). This is the only service that actually uses TimescaleDB,
even though the extension is preloaded server-wide on the shared Postgres container.

**Events published:** `mood.concern` (score trending low — best-effort, failures never
block the write) and `mood.streak` (at 7/14/30-day milestones).

### ai-integration-service

Proxies chat between patients and a **separate, external** "Therapy Chatbot" service
(`THERAPY_CHATBOT_BASE_URL`, authenticated via `MINDORA_INTEGRATION_KEY`), running a
keyword-based crisis pre-filter (levels 0–5) on
every message first. The entire service requires JWT except the Swagger docs routes —
there are no public endpoints by design.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/ai/chat` | JWT, `PATIENT` | Runs the crisis pre-filter first; level 5 short-circuits to a hard-coded safety response and never reaches the bot; otherwise calls the external chatbot and stores an encrypted audit row |
| `GET` / `DELETE` | `/api/v1/ai/history` | JWT, `PATIENT` | Not implemented (`501`) |
| `GET` | `/api/v1/ai/usage` | JWT, `ADMIN` | Token usage / crisis events / top users, consumed by admin-service |

**Data model:** `AiInteraction` (encrypted `user_message`/`ai_response`, `crisis_level`
0–5, `tokens_used`, `response_ms`) is Mindora's own audit trail — **not** the chat
transcript, which lives entirely on the external chatbot's side. `ChatbotAccount` is
the bridge between the two auth systems (see below).

**The two-auth-system quirk, worth understanding before touching this service:** the
external chatbot has its own JWT, completely separate from Mindora's — but it trusts
Mindora rather than authenticating the patient directly. On a patient's first message,
`getOrCreateSession()` exchanges the patient's real Mindora user id + email for a
short-lived access token via `POST /integration/session` (server-to-server, proven by
`MINDORA_INTEGRATION_KEY`, never sent to a browser) and opens one long-lived
conversation with the bot; the token and conversation id are cached in
`chatbot_accounts`. There is no per-patient password — calling `/integration/session`
again is cheap, safe and idempotent, so a stale/expired cached token (per
`token_expires_at`, 60s buffer) is simply re-requested rather than refreshed via login.
A 401 from the bot triggers exactly one retry with a forced re-request.

**Crisis pre-filter is explicitly flagged `⚠️ CLINICAL REVIEW REQUIRED`** in
`src/preFilter.ts` — it's an unreviewed keyword list, and levels 3/4 currently just
flag-and-continue with no formal escalation defined. Only level 5 has a real,
tested consequence (the hard-coded safety response + a fire-and-forget `ai.crisis`
event to RabbitMQ, consumed by admin-service to raise a `HIGH` severity alert).

### admin-service

The admin console's backend. Almost every route is a **proxy** to another service via
Kong (using the `SERVICE`-role `INTERNAL_SERVICE_TOKEN`) — admin-service is not the
data owner for users/community/mood/AI, it's an orchestration + audit layer on top.

> **Correction to `BACKEND_COMPLETE.md`:** that doc lists admin-service as
> "not database-backed." That's out of date — it has a real Postgres schema
> (`mindora_admin`) with three actively-written tables (below). It just has no
> *domain* data of its own (no users/appointments/mood rows) — everything domain-shaped
> is fetched live from the owning service.

| Method | Path | Description |
|---|---|---|
| `GET` | `/users` | Proxies to auth/user-service's `/internal/users` |
| `PUT` | `/users/:id/suspend` / `/reactivate` | Proxies the action, then writes `audit_logs` only after the downstream confirms |
| `GET` | `/moderation/queue` | Proxies pending reports from community-service (pull-based — not driven by any event) |
| `PUT` | `/moderation/:id/resolve` | Resolves via community-service, writes local `moderation_decisions` + `audit_logs` |
| `POST` | `/moderation/decrypt/:postId` | Reveals the real author of an anonymous post; writes `audit_logs` |
| `GET` | `/analytics` | Fans out to appointment/mood/AI/user analytics endpoints in parallel; each failure degrades independently (nulls) rather than failing the whole response |
| `GET` | `/audit-log` | Read-only over local `audit_logs` (no update/delete routes exist, by design — it's meant to be immutable) |
| `GET` | `/alerts` / `PUT /alerts/:id/resolve` | RabbitMQ-sourced system alerts |
| `GET` | `/ai/usage` | Proxies ai-integration-service, forwarding the *caller's own* JWT (not the service token) since that route specifically requires `ADMIN` role there |

**Events consumed:** `ai.crisis` (from `mindora.ai`) → `system_alerts` row, `HIGH`
severity. `mood.concern` only (from `mindora.mood`, ignores `mood.streak` on the same
exchange) → `system_alerts` row, `MEDIUM` severity. No retry/DLQ here — a malformed
payload is nacked without requeue and dropped, not retried.

### docs-gateway

A thin Swagger/OpenAPI aggregator with no database and no RabbitMQ involvement — a
single public page with a service-picker dropdown, proxying each service's own OpenAPI
JSON over `127.0.0.1:<port>` inside the same container. Only meaningful in the
production "bundle" deploy (see below) where all services run as sibling processes in
one container; in local dev, hit each service's own `/docs` directly instead. Each
service historically picked a different spec path
(`/docs/openapi.json`, `/openapi.json`, or `/docs.json`) — docs-gateway just hard-codes
which one per service.

## Event-driven communication

All async messaging goes through RabbitMQ. Exchanges and the events on them:

| Exchange | Type | Events | Published by | Consumed by |
|---|---|---|---|---|
| `mindora.appointments` | topic | `appointment.booked`, `.confirmed`, `.cancelled`, `.completed` | appointment-service | notification-service |
| `mindora.mood` | topic | `mood.concern`, `mood.streak` | mood-tracking-service | admin-service (`mood.concern` only), notification-service |
| `mindora.messages` | topic | `MessageReceivedEvent` | messaging-service | notification-service |
| `mindora.community` | topic | `CommunityReportedEvent`, `CommunityReplyEvent` | community-service | notification-service (reply only — nothing currently consumes `.reported` to drive the moderation queue; that's pulled on-demand instead) |
| `mindora.ai` | fanout | `ai.crisis` | ai-integration-service (fire-and-forget) | admin-service, notification-service (SMS crisis alert) |
| `mindora.notifications.retry` / `.dlq` | — | retry/dead-letter routing internal to notification-service | notification-service | notification-service |

Exchange/queue name constants and event TypeScript types live in `@mindora/events`, so
"what events exist and what shape are they" is a code search away rather than tribal
knowledge — start there before publishing or consuming anything new.

## Shared packages (`packages/*`)

| Package | Purpose |
|---|---|
| `@mindora/auth-middleware` | JWT verification (`createVerifyJwt`, `authenticate`, `requireRole`), Redis-backed blacklist checks |
| `@mindora/events` | Event type definitions + `EXCHANGES`/`QUEUES` constants |
| `@mindora/queue` | RabbitMQ connect/publish/subscribe helpers wrapping `amqplib` |
| `@mindora/validation` | Zod request-validation schemas, one file per domain |
| `@mindora/http-client` | Fetch wrapper for internal service-to-service HTTP calls, with a per-baseUrl circuit breaker (Opossum) and a uniform `{data, status, ok, error}` response shape |
| `@mindora/shared-types` | Just the canonical `UserRole` union type today — deliberately minimal so services don't need to pull in a full package just for a type |

There is **no** `@mindora/database` package — see the note in "Architecture at a
glance" above.

## Data stores

- **Postgres** — one physical container (`timescale/timescaledb` image, since
  mood-tracking-service needs the TimescaleDB extension), but **7 separate logical
  databases**, one per Postgres-backed service (`mindora_auth`, `mindora_user`,
  `mindora_appointment`, `mindora_mood`, `mindora_ai`, `mindora_notifications`,
  `mindora_admin`). No cross-database foreign keys or Prisma relations are possible —
  any lookup across service boundaries goes over HTTP through Kong, not SQL.
- **MongoDB** — one container, two databases (`mindora_community`,
  `mindora_messaging`), Mongoose ODM.
- **Redis** — JWT blacklist (logout), password-reset tokens, messaging presence/typing,
  mood-tracking rate limiting and insight caching.
- **RabbitMQ** — the event bus described above.

## Running it locally

Full step-by-step is in [`README.md`](README.md#quick-start) — the short version:

```bash
nvm use && npm install
cp .env.example .env
docker compose up -d        # Postgres, MongoDB, Redis, RabbitMQ, Kong
npm run db:migrate && npm run db:seed
npm run dev                  # all services via Turborepo, or npm run dev:auth etc.
curl http://localhost:8000/api/v1/auth/health   # via Kong
```

Known local-dev-only footgun: on Windows/Docker Desktop, Prisma's CLI (migrate/push)
cannot reach the Postgres container due to how Docker Desktop routes host↔container TCP
on that platform — the workaround (applying migrations by hand via `docker exec` +
`psql`) is documented in detail in `README.md`'s "Known Issues" section. This does not
affect Linux, CI, or production.

## Deployment

Production is a single-container "bundle" deploy on Railway: all 9 services +
docs-gateway run as sibling `pm2-runtime` processes in one container
(`Dockerfile.bundle` + `ecosystem.config.cjs`), fronted by a **separate** Kong
container, with Postgres/Redis/MongoDB/RabbitMQ each as their own managed Railway
service. Full step-by-step (including the Railway-specific Kong DNS/worker-count
gotchas) is in [`DP.md`](DP.md). CI (`.github/workflows/ci.yml`) gates every merge to
`main` on secret scanning, CodeQL, lint/format, tests against the same
`docker-compose.yml` infra as local dev, a full build, and a production dependency
audit.

## Things worth knowing before you dive in

- **Health-check paths and internal-service paths are exempt from JWT at the gateway,
  everything else isn't.** If a route works with `curl` straight to the service but
  401s/404s through Kong, check `infrastructure/kong/kong.yml` for that route's
  `strip_path` setting and whether a `jwt` plugin is attached, before assuming the bug
  is in the service.
- **A leaked user JWT can't reach `/internal/*` routes** — those require a
  `SERVICE`-role token (`INTERNAL_SERVICE_TOKEN`), checked by the receiving service
  itself after Kong validates the signature. If you're adding a new
  service-to-service call, follow that same pattern rather than reusing the public API.
- **Community-service's author-name resolution is a known unresolved bug** (returns
  `"Unknown"` for non-anonymous posts) — see `BACKEND_COMPLETE.md` before assuming
  it's something you broke.
- **FCM push payloads are sent as `data`, not `notification`**, deliberately, to avoid
  duplicate notifications on web — see `BACKEND_COMPLETE.md` before "fixing" this.
- **SMS is implemented but disabled by default** (`SMS_ENABLED=false`) and only wired
  up for the AI crisis-alert path; appointment reminders are not built yet despite
  having a planned event name.
- **`front-end-test-files/`** contains a manual FCM testing harness with a personal
  dev Firebase project's public config baked in — it's flagged for deletion before any
  production deploy, don't treat it as a real client integration example.

## Where to find more

| Topic | Source |
|---|---|
| Full endpoint reference for auth/user/community/messaging/notification | `README.md` |
| Live interactive API docs per service | `http://localhost:<port>/docs` (Swagger UI), aggregated at `:3010` in the production bundle |
| Known security limitations, deferred features, and "why is this weird" notes | `BACKEND_COMPLETE.md` |
| Railway deployment, one step at a time | `DP.md` |
| Event/exchange constants and types | `packages/events/src` |
| Kong routing rules | `infrastructure/kong/kong.yml` (local), `infrastructure/kong/kong.railway.yml` (prod) |
| Git branching + code ownership | `README.md`'s "Git workflow" section |
 