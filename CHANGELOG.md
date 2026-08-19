# Changelog

Notable backend changes, newest first. This is a working log for the team, not
a public release changelog — entries describe what changed and why.

## 2026-08-17 — 2026-08-19

### Fixed — Every request to four services 404'd at the gateway

`infrastructure/kong/kong.yml`. A Kong route with `strip_path: true` removes
the `/api/v1/<name>` prefix before proxying, which is correct only for services
that mount their routers at the root. Four services expect the full path
instead, and every one of their routes returned `404 Cannot GET /...` through
the gateway while their health checks stayed green and their test suites
stayed passing:

- **`community-api`** and **`ai-api`** — found earlier, `strip_path: false`.
- **`messaging-api`** — `app.use('/api/v1/messaging/conversations', ...)`.
  Symptom: the chat UI could not open a conversation at all.
- **`notification-api`** — the subtle one. It mounts at the root
  (`app.use(notificationsRouter)`) but bakes the full path into the route,
  `notificationsRouter.get('/api/v1/notifications/logs')`. **An audit that reads
  only `app.use()` mounts misses this shape**, which is how it survived a sweep
  that caught the other three.

No service code changed; the mismatch is entirely in the gateway config.

### Added — `npm run smoke:gateway`

`scripts/smoke-gateway.mjs`. Every service's suite drives Express through
supertest, so nothing in `npm run test` crosses Kong — which is why the routing
bug above shipped four times and was found each time by a person clicking
through the UI.

Requests one real route per service through the gateway and passes on
200/401/403: the question is whether the request reached the right service, not
whether the caller is authorized. Fails on Express's `Cannot GET /x`, Kong's
`no Route matched`, and 502/503. Mints its own token, so it needs no seeded
credentials, and is strictly read-only. Exits non-zero for CI; `GATEWAY_URL=`
targets a deployed gateway.

Not wired into `turbo run test` on purpose — it needs a live stack and would
break CI. Verified by reintroducing the `notification-api` bug and confirming
the check failed with the specific cause before restoring it.

### Fixed — The mood streak never expired

`apps/mood-tracking-service/src/lib/streak.ts`. `calculateStreak` counted the
consecutive run ending at the user's most recent entry without checking when
that entry was, so it reported the length of the last unbroken run the user
*ever* had. Someone who checked in twice in March still saw "2 days" months
later, and a single old entry read as a live 1-day streak.

A run now counts only while it is still live: last check-in today (counting) or
yesterday (still savable). Anything older reports `0`, with `lastCheckedIn`
still returned so the date can be shown after a lapse. The existing test used
fixed dates and passed either way; it now injects a clock.

**Behaviour change on the write path:** backfilling only old days no longer
fires a `mood.streak` milestone event, because the run it belongs to is not
live. Earning a "7-day streak" notification by backdating a week was never
intended.

### Added — `GET /streak` accepts `?timezone=`

Streaks are counted in calendar days, so they need the user's zone for the same
reason `/today` does — plus whether a streak is live depends on what "today"
and "yesterday" are for that user. Reuses the IANA-validated field from
`moodTodayQuerySchema` and groups days via the existing `local-day.ts` helpers,
which are now exported.

Defaults to UTC, so existing clients keep working — but **on the UTC default a
Kigali user's streak is wrong for the first three hours of each local day**, so
frontends should send `Intl.DateTimeFormat().resolvedOptions().timeZone`. The
two call sites with no user zone to hand (the write-path milestone check, and
the clinician-facing patient summary) stay UTC deliberately, documented at each.

### Added — `AUDIO` session type for appointments

The booking UI offered an "Audio call" option that no request could ever
satisfy: `AUDIO` existed in neither the Zod enum, the Prisma schemas, nor the
Postgres enum, so every audio booking returned `400 Validation failed`.

Added across all seven definitions — `packages/validation`,
`packages/events` (`APPOINTMENT_SESSION_TYPES`), both `schema.prisma` files,
`docs/appointment-service.yaml`, and migration
`20260818000000_add_audio_session_type` (`ALTER TYPE ... ADD VALUE`, purely
additive). The `sessionTypeLabel` switch in notification-service needed a case
too, or an audio booking would have told the patient "Appointment appointment
scheduled."

**Still mismatched:** the UI offers only Video and Audio, while the backend
supports `VIDEO`, `AUDIO`, `IN_PERSON`, `CHAT`. The latter two have no way to
be selected.

### Added — Structured request logging in auth-service

`src/lib/logger.ts` and `src/middleware/request-log.ts`. One line per event as
`timestamp LEVEL [tag] message key=value`, no logging dependency — every
service here logs with plain `console.*` and this keeps that consistent.

- **Request ids.** Every request gets one, echoed as `X-Request-Id` and
  returned in 500 bodies, so `grep req=3f9c21a8` follows a request through the
  route logic, the HTTP summary, and any stack trace.
- **`POST /refresh` now says *why* it rejected.** One opaque 401 covered five
  causes — no cookie, token unknown, revoked, already rotated, expired — which
  demand completely different fixes. The diagnosis runs only on the failing
  path, so the happy path costs nothing.
- **Session config printed at boot**, plus a warning when the refresh cookie is
  `SameSite=Lax`: a browser on another origin will not send it to
  `POST /refresh`, so sessions die when the 15-minute access token does no
  matter what `refreshTokenDays` says.
- **`uncaughtException` / `unhandledRejection` handlers.** A crash mid-request
  previously produced nothing but Node's default stack, and appeared at the
  frontend only as a gateway 502.
- Secrets and PII stay out: refresh tokens are logged as an 8-char hash prefix,
  emails redacted to `p***@example.com`, and login failures record which half
  failed **only** server-side — the response stays a generic `Invalid
  credentials` so it is not an account-enumeration oracle.

`LOG_LEVEL=debug` adds the per-request `/health` lines that are suppressed by
default so Kong's polling does not bury everything else.

### Fixed — `.env` was read after config had already been frozen

`auth`, `mood-tracking`, `appointment` and `user` services each called
`dotenv.config()` in the body of `index.ts`, below `import { config } from
'./config.js'`. ES module imports are hoisted and fully evaluated first, so
`config.ts` read `process.env` **before any `.env` file was loaded** and froze
the fallbacks.

Each now has a dependency-free `src/env.ts` imported on the first line — the
pattern `admin`, `ai-integration` and `notification` already used.

**Latent, with no effect on current behaviour**: the only key involved is
`JWT_SECRET`, and this repo's `.env` sets it to the same value as the dev
fallback, so nothing observable changed. It would have bitten the moment anyone
set a real secret — a non-production environment would silently keep signing
with the secret published in this repo, which is exactly what
`resolveJwtSecret` exists to prevent.

**`messaging` and `community` were deliberately left alone.** Their
`import 'dotenv/config'` runs first, so they do not have this bug — but they
load only their own `.env`, never the root one. Adding root there would change
which database they use (`MONGO_URI` differs between root and
`apps/messaging-service/.env`, and community has no `.env` at all). Worth
deciding separately; until then, a rotated root `JWT_SECRET` would break those
two while the rest picked it up.

### Added — Durable crisis alerting and admin acknowledgement

Summarised here for the record; both were authored outside this pass, and
`docs/ai-safety-handoff.md` is the authority on the safety picture.

- **`ai-integration-service`** — new `crisis_alerts` table (migration
  `20260817000000`). A crisis detection is now written locally *before* the
  user is answered and treated as the source of truth, with the RabbitMQ
  publish treated as delivery of that row and retried by a sweeper. Previously
  the fire-and-forget publish was the only record, so a broker outage meant a
  disclosure of an active suicide plan left no trace anywhere.
- **`admin-service`** — `acknowledged_at` / `acknowledged_by` on `system_alerts`
  (migration `20260817000100`), kept deliberately separate from `/resolve`:
  resolving says the situation was dealt with, acknowledging says a human has
  eyes on it. The unacknowledged view is a triage queue and sorts oldest-first.

**The platform remains testers-only** until the detection and response gaps in
`docs/ai-safety-handoff.md` are resolved. That document, not this entry, is the
launch gate.

### Fixed — CRLF line endings broke the Kong container

New `.gitattributes` pins `*.sh`, `Dockerfile` and `docker-entrypoint*` to LF.
A CRLF shebang makes the kernel look for an interpreter literally named
`/bin/sh\r`, which surfaces as `exec /kong-entrypoint.sh: no such file or
directory` for a file that is plainly there. This broke the gateway on a
Windows dev machine and would have broken any deployment built from a Windows
checkout. Most of the working tree's "modified" files are this normalisation
rather than content changes.

### Documentation

- **`.env.example` was missing 15 variables that the code reads**, including
  `NODE_ENV` (which decides whether cross-domain sessions work at all),
  `RESEND_EMAIL_API_KEY`, the Firebase credential pair, `COMMUNITY_ENCRYPTION_KEY`,
  `CORS_ALLOWED_ORIGINS`, `JWT_ISSUER` and `LOG_LEVEL`. All now documented with
  what breaks when they are unset. Audited by diffing every `process.env.X` and
  Prisma `env("X")` read against the file.
- **`MONGO_URI` was documented under the wrong name.** The file listed only
  `MONGODB_URI`, which nothing but
  `apps/messaging-service/scripts/backfill-encrypt.ts` reads — both community
  and messaging read `MONGO_URI`. Anyone following `.env.example` left both
  services on their localhost fallback. Both names are now documented, with the
  mismatch called out; **the backfill script should be corrected to read
  `MONGO_URI`** so a data backfill cannot target a different database than the
  service it is backfilling.
- **README** gained a documentation index (there was no pointer to
  `DEPLOYMENT.md`, `CHANGELOG.md` or the AI docs from anywhere), the
  `smoke:gateway` script, and a Testing subsection explaining the gateway gap.

## 2026-08-12

### Security — Socket.io layer was completely unauthenticated (messaging-service)

**Breaking change to the socket contract.** Until now the socket layer had no
authentication whatsoever. It trusted whatever `userId` / `senderId` a client
put in each event payload, and never checked room membership — so any client
that could reach port 3006 could join any conversation, read its history, send
messages as any user, and forge read receipts. Only the REST layer was
protected. In an app where message bodies are otherwise encrypted at rest,
this was the weakest link.

- **Handshake auth** (`io.use`): connections now require a valid access token
  (`io(url, { auth: { token } })`), verified with the same secret/issuer as the
  REST layer, and rejected if the token has been blacklisted by logout.
- **All handlers derive the acting user from the token.** `senderId` and
  `userId` in event payloads are ignored. `send_message` with a spoofed
  `senderId` now records the authenticated user.
- **Participant authorization** on `join_conversation`, `send_message`,
  `mark_read` and `mark_conversation_read` via a shared `loadOwnConversation`
  helper. Invalid id / missing conversation / not-a-participant all return the
  same `Conversation not found`, so callers can't probe which ids exist.
- **`mark_read` is now scoped** to `{ _id, conversationId, senderId: { $ne: caller } }`
  — previously a mismatched id pair could reach a message in a different
  conversation, and you could mark your own messages read.

**Frontend impact:** clients must pass the token in the handshake, and can drop
`userId`/`senderId` from payloads.

### Added — WhatsApp-style delivery/read ticks

- **`Message.deliveredAt`** (new field). Gives the three states: sent
  (`deliveredAt: null` → one tick), delivered (→ two ticks), read (`readAt` →
  blue). Neither field is ever cleared once set, so **ticks only move
  forwards** — unlike a presence-derived approximation, which would drop from
  two ticks back to one when the recipient went offline without reading.
- Delivery is recorded when the recipient's socket is already in the room at
  send time (via adapter-aware `fetchSockets()`, so it stays correct across
  server instances), or when they next join the conversation. Broadcast as
  **`messages_delivered`**.
- Reading implies delivery: `deliveredAt` is backfilled on read, but only when
  it was never set, so the timestamp keeps meaning "first arrived".

### Added — `mark_conversation_read` (bulk)

Opening a chat with N unread messages previously meant emitting N separate
`mark_read` events, each doing its own `findOneAndUpdate` plus a counter
decrement. The new event does the whole conversation in two writes and one
`conversation_read` broadcast, and resets `unreadCount` to 0 rather than
decrementing N times.

### Fixed — typing indicator could stick forever

`typing_start` set a Redis key with a 5 s TTL, but **key expiry emits nothing**
— so if the sender's tab died mid-compose the recipient never received
`user_stopped_typing` and the indicator stayed up indefinitely. Added a
server-side timer per (conversation, user) that emits the stop event when the
TTL lapses, plus explicit cleanup on `disconnect` that both emits the stop and
clears pending timers (which also fixes a per-conversation timer leak).

### Fixed — mood endpoints returned an opaque 500 for a non-UUID token subject

`mood_entries.user_id` is a `uuid` column and `/summary` casts it explicitly
(`${userId}::uuid`), so a token whose `sub` wasn't a UUID made Postgres throw
deep inside the query. That surfaced as `500 Internal server error` — looking
like a server fault when it was really a malformed credential. `verifyJwt` in
mood-tracking-service now rejects such tokens with a `401` that names the
problem. **SERVICE tokens are exempt** — they carry a service name as the
subject (`sub: "community-service"`) and the SERVICE-only routes never query by
user id. The `/report/:userId` path parameter is guarded for the same reason.

### Fixed — 500 responses used the wrong JSON key in two services

The global error middleware added during the async-crash audit returned
`{ error: ... }`, but `mood-tracking-service` (28 responses) and
`admin-service` (12) use `{ message: ... }` everywhere else. Clients reading
`.message` saw `undefined` and fell back to "Unknown error", which made a real
500 impossible to diagnose from the frontend. Both now return `{ message }`.
`community-service` and `messaging-service` genuinely use `error` throughout
and were left alone.

**Verification:** `tsc --noEmit` clean; messaging-service 39/39 tests (the 9
socket tests were rewritten for the authenticated handshake, plus 4 new ones
covering token rejection, outsider access, and senderId spoofing);
mood-tracking-service 13/13; plus a 16-check live end-to-end run against the
running services covering handshake rejection, outsider join, the full
sent→delivered→read tick progression, spoof rejection, typing auto-expiry, and
typing cleanup on disconnect.

## 2026-08-07

### Added — Mood check-in: today-status, editing, backdating, dashboard summary

`apps/mood-tracking-service`, filling gaps that made a proper check-in screen
un-buildable.

- **`GET /today`** — answers "has the user already checked in today?" directly,
  returning `{ hasCheckedIn, localDate, timezone, entriesToday, remainingToday,
entry }`. Previously the client had to fetch `/history` and do date maths it
  couldn't do correctly. Takes an optional `?timezone=` IANA name; new
  DST-correct day-boundary helper at `src/lib/local-day.ts`.
- **`POST /log` accepts an optional `recordedAt`** so a user can backfill a
  missed day. Bounded: not in the future (5 min clock-skew tolerance), not more
  than 365 days ago. The 10/day cap still counts writes made _today_ regardless
  of the day recorded for — it's a write-rate limit, so backfilling a batch
  still draws down the same allowance.
- **`PUT /:id` and `DELETE /:id`** — entries were previously immutable. Scoped
  to the caller's own entries; a 404 deliberately doesn't distinguish "no such
  entry" from "someone else's", so entry existence isn't leaked. `PUT` re-runs
  the `mood.concern` safety check, since revising a score downward is the same
  signal as logging it low initially.
- **`GET /summary`** — bucketed aggregates over an arbitrary range and
  granularity (`day`/`week`/`month`) for the dashboard chart. Distinct from
  `/history` (raw paginated rows) and `/insights` (fixed 3-month weekly window,
  Redis-cached). `avgMood` is entry-count-weighted, so it matches a plain
  average over the underlying entries rather than an average of averages.

**Two storage constraints worth knowing, both verified against the live
database rather than assumed:**

1. **`recordedAt` cannot be edited.** `mood_entries` is a TimescaleDB
   hypertable partitioned on `recorded_at`; an `UPDATE` that would move a row
   into another chunk is rejected outright (`new row for relation
"_hyper_1_2_chunk" violates check constraint`). Correcting a date means
   delete + re-log. `updateMoodSchema` therefore has no `recordedAt` field.
2. **`PUT`/`DELETE` use `updateMany`/`deleteMany`, not `update`/`delete`.** The
   composite primary key `[id, recordedAt]` (required by the hypertable
   partitioning) means `id` alone isn't a unique selector Prisma accepts. The
   many-variants take an arbitrary filter, which also lets ownership be
   enforced in the same statement instead of a racy read-then-write.

Verified with `tsc --noEmit`, the existing 13-test suite, and a 24-check
end-to-end run against the real hypertable covering create, backdate,
future-date rejection, today-status, edit, null-clearing, ownership 404s,
summary bucketing, and delete.

## 2026-07-29 — 2026-07-30

### Added — Therapist profile photos

- `TherapistProfile.photoUrl` (nullable string) added to `apps/user-service/prisma/schema.prisma`
  via a new migration. Automatically included in `GET /me` and `GET /therapists`
  responses — no route code changes needed there.
- New public, unauthenticated static route for serving photo files — an
  `<img>` tag can't send a JWT, so this can't sit behind user-service's
  JWT-protected routes:
  - `apps/user-service/src/app.ts` — `express.static` mounted at both `/photos`
    (direct dev access) and `/api/v1/users/photos` (full gateway path).
  - `infrastructure/kong/kong.yml` — new `user-photos` route
    (`/api/v1/users/photos`, `strip_path: false`, no `jwt` plugin), same
    pattern as the existing health-check routes.
  - Photo files live in `apps/user-service/public/therapist-photos/` (not
    committed via a package, just static assets served directly).
- `apps/user-service/src/seed.ts` — 8 of the 30 seeded therapists (the ones
  shown first by the default `isAcceptingPatients: true, createdAt desc`
  listing) now carry a `photoUrl` pointing at the new route. The upsert's
  `update` clause now syncs `photoUrl` on reseed without touching any other
  field, so re-running the seed script is still safe against hand-edited dev
  data.
- Swagger: `TherapistProfile` schema and a new `/photos/{filename}` path added
  to `apps/user-service/src/docs/openapi.ts`.

**Not done / explicitly deferred:** no real upload endpoint exists yet — today's
photos are static files seeded onto disk, not something a therapist can
upload through the app. `PUT /me` doesn't accept `photoUrl` yet either. Both
are natural next steps if self-service photo upload at signup is wanted.

**Operational note:** the source photos were full camera-resolution JPEGs (up
to 5472×6511px, 4.8MB each). Proxying files that large through Kong triggers
nginx's disk-buffering path and is dramatically slower under concurrent
load — enough to look like a hang from the frontend (up to ~8s per image
during testing). All 8 were resized (longest edge capped at 800px, no forced
crop) and re-compressed before being committed; total size dropped from
~15MB to ~290KB. If more photos are added later, resize them first.

### Fixed — Async-crash safety audit (all 9 backend services)

Root cause: Express 4.x does not forward a rejected promise from an
`async (req, res) => {}` route handler to `next()` automatically. An
unhandled rejection there is a process-level crash, not a 500 for the one
bad request — one failing request could take the whole service down for
every user. Found while fixing a specific appointment-service crash (see
below) and then audited across every service.

- **`appointment-service`** — the actual bug: `book-appointment.ts` used
  `tx.$queryRaw` for `pg_advisory_xact_lock(...)`, a function that returns
  `void`. Prisma can't deserialize a `void` result set, so this was a
  100%-reproducible crash on every booking attempt (`P2010`). Fixed by
  switching to `tx.$executeRaw` (correct for a side-effect-only statement).
  Also added the `asyncHandler` wrapper + global error middleware described
  below, since the crash-safety gap was the reason one bad query took the
  whole process down instead of just failing one request.
- **`admin-service`** — had a global error middleware already, but it was
  dead code: nothing ever called `next(err)`, so it never ran. Added
  `asyncHandler`, wrapped all 11 handlers.
- **`ai-integration-service`**, **`auth-service`**, **`community-service`**,
  **`messaging-service`**, **`mood-tracking-service`** — none had either
  piece. Added `middleware/async-handler.ts` + global error middleware to
  each, wrapped every async route handler (auth-service's Passport OAuth
  callback needed a special IIFE + `.catch(next)` wrapper since it doesn't
  fit the standard `(req, res, next)` shape).
- **`user-service`**, **`notification-service`** — already had this pattern
  before this pass; used as the reference implementation for the rest.

**Bonus fix, found via `tsc` while wrapping admin-service, unrelated to the
crash-safety work:** `apps/admin-service/src/routes/admin.routes.ts`'s
`/alerts/:id/resolve` passed `req.params.id` (typed `string | string[]`)
directly to `prisma.system_alerts.findUnique` (expects `string`) with no
cast. Fixed to match the cast pattern already used by the neighboring
`/moderation/decrypt/:postId` route.

Every service verified individually (`tsc --noEmit` + full test suite) and
then together via `turbo run test` — 15/15 tasks passing.

### Fixed — Local dev environment

Not a code change, but worth recording since it'll recur: `npm run dev` was
failing across the board. Two independent causes:

1. Stale `node.exe` processes from earlier manual testing were still bound to
   ports 3001–3007, so every fresh service instance died with `EADDRINUSE`
   immediately on start.
2. The RabbitMQ and Kong containers had been killed (`Exited (137)`, from an
   earlier Docker Desktop restart) and were never brought back up.
   `admin-service` and `notification-service` both hard-`exit(1)` on any
   RabbitMQ connection failure at startup, with no retry — and `tsx watch`
   does not restart a process that has fully exited (only on file changes),
   so once RabbitMQ came back up those two still needed a manual restart.

No retry/backoff exists today for that RabbitMQ startup race — noted as a
possible follow-up, not yet done.
