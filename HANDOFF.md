# Handoff — changes made by Kevin (2026-07-30 → 2026-08-02)

This documents what I (Kevin / `IshKevin`, branch `devops-update`) worked on after
picking the project back up, on top of the foundational work already in `main`
(the ~2-week sprint that built out the services, Kong routing, notification
preferences, admin scaffolding, etc.). Each section below maps to real commits —
`git show <hash>` for the full diff of anything that needs a closer look.

The short version: **this work is almost entirely production/deployment
infrastructure and one real bug fix**, not new product features. Nothing here
changes any service's public API behavior except the email-casing fix.

## 1. Production "bundle" deploy — new capability

Previously there was no path to running this in production at all — only
`docker-compose.yml` for local dev existed. I added a way to deploy all 9 services
+ a docs aggregator as one Railway service:

- **`Dockerfile.bundle` + `ecosystem.config.cjs`** (`63ef5e0`, `6aa5e53`) — a
  multi-stage Docker build that compiles every service and runs all 10 as sibling
  `pm2-runtime` processes in one container. Added Prisma schema files for all 7
  Postgres-backed services into the bundle image (`6aa5e53`) — they were missing
  from the initial build, which would have broken `prisma generate` for services
  other than the first one copied in.
- **New service: `apps/docs-gateway`** (`63ef5e0`) — a small Express app
  (`src/index.ts`) that proxies every service's own OpenAPI JSON into one Swagger
  UI page with a service picker. Only meaningful in the bundle deploy, where every
  service is reachable at `127.0.0.1:<port>` inside the same container. Went
  through two follow-up fixes because the dropdown didn't render the picker at all
  on the first attempt (`d55ac98`, `df10dee`) — `swagger-ui`'s `urls` option needs
  `{url, name}` objects, not bare strings, for the dropdown to appear.
- **MongoDB URI handling for the bundle** (`4028f3b`, `31d69da`) —
  `ecosystem.config.cjs` derives per-service `MONGO_URI` (community, messaging)
  from one shared `MONGO_BASE_URL`, appending the right database name and
  `?authSource=admin` (needed because Railway's official MongoDB template
  provisions a root user, not a no-auth instance like local Docker's `mongo:7`).
- **Redis wired up for ai-integration-service** in `docker-compose.yml`
  (`198c300`) — its auth middleware checks Redis for blacklisted tokens on every
  request; without `REDIS_URL` set, every authenticated call to that service would
  500 locally the same way it originally did before this was caught.
- Full step-by-step for actually running this deploy is in `DP.md` (separate doc,
  not part of this diff, but written to match this infrastructure).

## 2. Kong in production (Railway)

Kong previously only had a local-dev config (`infrastructure/kong/kong.yml`,
routing to `host.docker.internal`). Added a second, Railway-specific config:

- **`infrastructure/kong/kong.railway.yml` + `infrastructure/kong/Dockerfile`**
  (`667f4ad`) — same routes/plugins as local Kong, but pointed at Railway's
  private DNS instead of `host.docker.internal`.
- Two correctness fixes after testing against the real Railway environment:
  - `f865ceb` — Dockerfile `COPY` path for `kong.railway.yml` was wrong.
  - `32df577`, `82f2c8e` — the private DNS hostnames didn't match what Railway
    actually assigns. Railway's `railway.internal` naming strips underscores and
    casing entirely from the service name, so a service literally named
    `Mindora_V3` resolves as something other than a naive
    lowercase/hyphenated guess — this took two passes to get right. (This
    exact gotcha is called out in `DP.md` step 8 so it isn't rediscovered.)

## 3. AI Integration Service — external chatbot integration (new feature)

Before this, `ai-integration-service` had scaffolding and a crisis pre-filter but
nothing that actually talked to an AI backend. I built the integration
(`bd515b9`):

- **`src/chatbotClient.ts`** (new, 260 lines) — client for a separate, external
  "Therapy Chatbot" service with its own signup/login/JWT. On a patient's first
  message, lazily provisions a chatbot account (synthetic email
  `<mindoraUserId>@mindora-patients.internal` + random password) and one
  long-lived conversation, tracked in a new `ChatbotAccount` table. The chatbot's
  JWT has no refresh endpoint, so expiry is decoded locally from the token and
  renewal means logging back in with the stored password; a 401 triggers exactly
  one retry-after-relogin.
- **`src/lib/crypto.ts`** (new) — AES-256-GCM helpers used to encrypt the stored
  chatbot password and the audit copy of each chat message before it's persisted.
- **Prisma migration** adding `ChatbotAccount` alongside the existing
  `AiInteraction` table (db `mindora_ai`).
- Wired into `POST /api/v1/ai/chat` in `src/routes/ai.routes.ts`, and documented
  in `src/docs/openapi.ts`.
- **Heads up:** conversation/message history lives entirely on the external
  chatbot's side — `AiInteraction` is Mindora's own encrypted audit trail only,
  not a queryable transcript store. `GET`/`DELETE /api/v1/ai/history` are still
  `501 Not implemented` stubs; I didn't touch those.

## 4. Auth bug fix — case-sensitive email login (`4e54baf`, `0cf7cb2`)

Real bug, not infra: `packages/validation/src/auth.ts`'s email schemas did no
normalization, and Postgres text equality is case-sensitive, so a user who
registered as `Jane@Example.com` and later typed `jane@example.com` at login
would get a false "invalid credentials." Fixed in two parts:

- **`packages/validation/src/auth.ts`** — `register`/`login`/`forgot-password`
  schemas now trim + lowercase the email before validation, so all new signups
  and lookups are normalized going forward.
- **`apps/auth-service/scripts/backfill-lowercase-emails.ts`** (new) — one-time
  script to lowercase every existing `users.email` row so accounts created
  *before* this fix still work. It's safe by construction: it aborts with zero
  writes if lowercasing would collide two existing rows onto the same email
  (needs manual resolution first), and only then applies updates. **This has not
  been run against any real database yet** — run
  `npm run backfill:lowercase-emails --workspace=@mindora/auth-service` once
  before/during the next deploy, ideally after checking for collisions.
- Added a regression test in `apps/auth-service/src/routes/auth.routes.test.ts`.

## 5. API docs — production URLs + a missing spec

- **`90dec39`** — every service's OpenAPI doc now advertises its production Kong
  URL alongside `localhost`, so Swagger UI's "Try it out" works against the
  deployed environment, not just local dev.
- Added a full **`apps/admin-service/docs/admin-service.yaml`** (699 lines) —
  admin-service had no OpenAPI spec at all before this; it's now documented like
  the other services and shows up correctly in docs-gateway's dropdown.

## 6. Repo hygiene (`cfcf2b7`)

Untracked ~1,300 files that were committed before `.gitignore` caught them:
`node_modules` (1,100 files), every service's generated Prisma client
(`src/generated/`, ~283MB combined — regenerated by CI/build anyway, shouldn't
have been committed), the `bin/act` dev-tool binary (21MB), and — worth flagging
specifically — **a leaked `patient-cookies.txt` file containing a real refresh
token cookie from local testing.** It's untracked and gitignored going forward,
but since it was previously committed, it's still recoverable from git history
until/unless that history is rewritten — I did **not** rewrite history as part of
this, so if that cookie could ever have been a real credential, treat the old
commits as still exposing it and rotate/invalidate accordingly.

## 7. Small fixes / cleanup

- **`31901d0`** — CI's Postgres port env vars were pointing at `5433`, but
  `docker-compose.yml` maps Postgres to host port `5434` (the Windows Docker
  Desktop workaround documented in `README.md`'s Known Issues) — CI was passing
  by accident, not because the port was right. Also added `--omit=optional` to
  the `npm audit` gate: `firebase-admin`'s optional `@google-cloud/storage`
  dependency (never actually used — notification-service only calls
  `admin.messaging()`) pulls in old transitive deps with no non-breaking fix
  available upstream; excluding optional deps from the audit gate (same
  treatment already given to dev deps) unblocks CI without hiding real
  production-dependency CVEs.
- **`38499eb`** — simplified `apps/auth-service/src/index.ts`'s startup function,
  no behavior change.
- **`31d69da`**, **`4028f3b`** — see MongoDB URI section above.