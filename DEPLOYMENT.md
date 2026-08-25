# Deployment guide

For whoever is deploying this. Written to be followed by someone who has not
worked on the codebase.

Read the [Blockers](#blockers-do-not-launch-to-real-users-yet) section first.
There are two things that must be resolved before real users touch this
platform, and neither is a deployment task.

---

## 1. What you are deploying

Six deployable units. The nine backend services are **not** nine deployments:
they run as sibling processes inside one container.

| Unit               | Built from                          | Notes                                                                                                 |
| ------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Backend bundle** | `Dockerfile.bundle`                 | All 9 services + docs aggregator, run by `pm2-runtime` via `ecosystem.config.cjs`. Ports 3001-3010.   |
| **Kong gateway**   | `infrastructure/kong/Dockerfile`    | The only unit exposed to the public internet.                                                         |
| **PostgreSQL**     | `timescale/timescaledb:latest-pg16` | Must be the TimescaleDB image, not stock Postgres. See [4.3](#43-timescaledb-hypertable-manual-step). |
| **MongoDB**        | `mongo:7`                           | Community + messaging services.                                                                       |
| **Redis**          | `redis:7-alpine`                    | JWT blacklist, presence, typing, caches.                                                              |
| **RabbitMQ**       | `rabbitmq:3-management-alpine`      | Event bus between services.                                                                           |

Only Kong should have a public hostname. The bundle listens on private
networking only; all public traffic goes through Kong.

### Port map

| Port | Service                                 |
| ---- | --------------------------------------- |
| 3001 | auth-service                            |
| 3002 | user-service                            |
| 3003 | appointment-service                     |
| 3004 | mood-tracking-service                   |
| 3005 | community-service                       |
| 3006 | messaging-service                       |
| 3007 | ai-integration-service                  |
| 3008 | notification-service                    |
| 3009 | admin-service                           |
| 3010 | docs-gateway                            |
| 8000 | Kong proxy (public)                     |
| 8001 | Kong admin (**do not expose publicly**) |

---

## 2. CI/CD status

**There is no working deploy pipeline.** `.github/workflows/deploy.yml` is
entirely placeholder steps that echo "not configured yet". Every step below is
manual until someone builds that out.

`.github/workflows/ci.yml` does work and runs lint, tests, format check, and an
`npm audit` gate on pull requests.

---

## 3. Environment variables

Copy `.env.example` as the starting list. Below are the ones that need real
values, grouped by how badly they fail.

### 3.1 Will refuse to start without these

These now fail fast rather than starting insecurely.

| Variable              | Set on              | Notes                                                                                                                              |
| --------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `JWT_SECRET`          | bundle **and** Kong | Must be **identical** in both. Kong validates what the services sign. Mismatch means every authenticated request 401s.             |
| `KONG_UPSTREAM_HOST`  | Kong                | Private DNS of the bundle service. On Railway typically `<service>.railway.internal`. Check the bundle's `RAILWAY_PRIVATE_DOMAIN`. |
| `KONG_CORS_ORIGINS`   | Kong                | Comma-separated allowlist, e.g. `https://app.mindora.rw`. `*` is **rejected** by the entrypoint.                                   |
| `NODE_ENV=production` | bundle              | Drives cookie `Secure` + `SameSite=None`. Without it, auth silently breaks cross-domain.                                           |

> **`JWT_ISSUER` is a second, undocumented half of the pair above.** Every
> service defaults it to `mindora-auth` if unset, and `infrastructure/kong/kong.yml`
> hardcodes the same string as its JWT consumer's key. If you ever set
> `JWT_ISSUER` on the bundle to something else without also updating that
> line in `kong.yml`, every authenticated request 401s — a symptom
> identical to a `JWT_SECRET` mismatch. Simplest fix: don't set `JWT_ISSUER`
> at all unless you're also editing `kong.yml` in the same change.

### 3.2 Will start but be insecure or broken

| Variable                        | Notes                                                                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AI_INTERACTION_ENCRYPTION_KEY` | Encrypts AI chat messages and stored chatbot passwords. Falls back to a **dev key published in this repo** if unset.                                                                                    |
| `MOOD_JOURNAL_ENCRYPTION_KEY`   | Encrypts journal notes. Same problem.                                                                                                                                                                   |
| `MESSAGE_ENCRYPTION_KEY`        | Encrypts chat messages. Same problem.                                                                                                                                                                   |
| `INTERNAL_SERVICE_TOKEN`        | Empty in `.env.example`. Generate with `npm run generate:service-token --workspace=@mindora/auth-service`. Without it, service-to-service calls fail (author names show as "Unknown", analytics break). |
| `OAUTH_SUCCESS_REDIRECT_URL`    | Where Google OAuth lands users. Must be a **real frontend URL**, e.g. `https://app.mindora.rw/oauth/success`.                                                                                           |
| `APP_BASE_URL`                  | Used in password reset emails.                                                                                                                                                                          |

Generate the encryption keys as independent random strings. Do not reuse
`JWT_SECRET`. Losing a key makes the data it encrypted unreadable, so store
them somewhere durable before first use.

### 3.3 Connection strings

Seven separate Postgres databases on one instance:

```
AUTH_DATABASE_URL=postgresql://USER:PASS@HOST:PORT/mindora_auth
USER_DATABASE_URL=postgresql://USER:PASS@HOST:PORT/mindora_user
APPOINTMENT_DATABASE_URL=postgresql://USER:PASS@HOST:PORT/mindora_appointment
MOOD_DATABASE_URL=postgresql://USER:PASS@HOST:PORT/mindora_mood
ADMIN_DATABASE_URL=postgresql://USER:PASS@HOST:PORT/mindora_admin
AI_DATABASE_URL=postgresql://USER:PASS@HOST:PORT/mindora_ai
NOTIFICATION_DATABASE_URL=postgresql://USER:PASS@HOST:PORT/mindora_notifications
```

Plus:

```
MONGO_BASE_URL=mongodb://<mongo-host>:27017     # no database name
REDIS_URL=redis://<redis-host>:6379
RABBITMQ_URL=amqp://USER:PASS@<rabbit-host>:5672
KONG_URL=http://<kong-host>:8000
USER_SERVICE_URL=http://localhost:3002          # same container, leave as-is
```

> **`MONGO_BASE_URL`, not `MONGO_URI`.** Community and messaging both read
> `MONGO_URI` but need _different_ database names on the same instance. A
> single container-level `MONGO_URI` would only satisfy one of them.
> `ecosystem.config.cjs` derives each service's URI from `MONGO_BASE_URL`.
> Set the base URL with no database name on the end.

> `DATABASE_URL` in `.env.example` points at a `mindora` database that **no
> service uses**. It belongs to an orphaned package. Ignore it.

> `.env.example` shows port `5432`; local `docker-compose.yml` maps `5434`.
> Neither is necessarily right for your environment, use whatever your
> managed Postgres exposes.

### 3.4 Third-party credentials

| Variable                                      | Needed for          | Status                                                                                                                                                                                          |
| --------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `THERAPY_CHATBOT_BASE_URL`                    | AI companion chat   | External FastAPI service, already deployed on Railway.                                                                                                                                          |
| `RESEND_EMAIL_API_KEY`                        | Email notifications | **Needs a verified sending domain** before production. Currently a personal/sandbox key.                                                                                                        |
| `RESEND_FROM_EMAIL`                           | Email notifications | **Set this too, not just the API key.** Unset falls back to Resend's own shared sandbox address (`onboarding@resend.dev`) — a real API key alone does not change who mail appears to come from. |
| `FIREBASE_SERVICE_ACCOUNT_JSON`               | Push notifications  | **Currently a personal developer's Firebase project.** Must move to a company-owned account.                                                                                                    |
| `AT_API_KEY` / `AT_USERNAME` / `AT_SENDER_ID` | SMS                 | Africa's Talking. Needs a registered sender ID for Rwanda. `SMS_ENABLED=false` by default, leave it off unless that is done.                                                                    |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`   | Google sign-in      | Optional. If unset, the OAuth endpoints return 503 rather than breaking. Set `GOOGLE_CALLBACK_URL` to the deployed callback.                                                                    |

---

## 4. Database setup

**None of this is automated.** The image runs `prisma generate` at build time,
never `prisma migrate deploy`. Do these steps by hand before first boot.

### 4.1 Create the seven databases

Nothing creates these in a managed environment. The local
`infrastructure/postgres/init-databases.sh` only runs against a fresh Docker
volume.

```sql
CREATE DATABASE mindora_auth;
CREATE DATABASE mindora_user;
CREATE DATABASE mindora_appointment;
CREATE DATABASE mindora_mood;
CREATE DATABASE mindora_admin;
CREATE DATABASE mindora_ai;
CREATE DATABASE mindora_notifications;
```

### 4.2 Run migrations, per service

Seven services have migrations. Run each with that service's own database URL:

```bash
cd apps/auth-service            && npx prisma migrate deploy   # 2 migrations
cd apps/user-service            && npx prisma migrate deploy   # 3
cd apps/appointment-service     && npx prisma migrate deploy   # 1
cd apps/mood-tracking-service   && npx prisma migrate deploy   # 1
cd apps/admin-service           && npx prisma migrate deploy   # 1
cd apps/ai-integration-service  && npx prisma migrate deploy   # 3
cd apps/notification-service    && npx prisma migrate deploy   # 1
```

Community and messaging use MongoDB and need no migrations.

### 4.3 TimescaleDB hypertable (manual step)

**This is not in any migration.** After running the mood migration, connect to
`mindora_mood` and run:

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
SELECT create_hypertable('mood_entries', 'recorded_at');
```

Skipping this leaves `mood_entries` as a plain table. Queries still work, so
**you will not get an error**, but you lose partitioning and the mood
insights/summary endpoints degrade badly as data grows.

Verify:

```sql
SELECT hypertable_name FROM timescaledb_information.hypertables;
-- expect: mood_entries
```

### 4.4 Seeding

Optional, for demo data — **do not run this against the real production
database** unless you deliberately want 30 fictional therapist accounts
(fixed UUIDs, `*.mindora.local` emails, non-login dummy password) and their
matching profiles + generic stock headshot photos live in it. Nothing runs
this automatically; it's entirely manual, but worth being explicit about
before someone runs it out of habit against the wrong `*_DATABASE_URL`.

**`npm run db:seed` at the repo root does not work** —
it targets the orphaned package. Use:

```bash
npm run seed -w @mindora/auth-service   # 30 therapist auth accounts
npm run db:seed:profiles                # matching therapist profiles + photos
```

These two are paired by fixed UUIDs and must both run. Note the login accounts
referenced in some older docs (`patient@test.mindora.local` and similar) **do
not exist**; no seed script creates them.

---

## 5. Deploy order

1. Provision Postgres, MongoDB, Redis, RabbitMQ.
2. Create the seven databases ([4.1](#41-create-the-seven-databases)).
3. Run migrations ([4.2](#42-run-migrations-per-service)) and the hypertable step ([4.3](#43-timescaledb-hypertable-manual-step)).
4. Generate `INTERNAL_SERVICE_TOKEN` and the encryption keys. Store them.
5. Deploy the **bundle**, with all env vars from section 3.
6. Deploy **Kong**, with `KONG_UPSTREAM_HOST` pointing at the bundle's private hostname.
7. Point the frontend at Kong's public URL, and add that frontend origin to `KONG_CORS_ORIGINS`.

### Expect a noisy first boot

Six services (`admin`, `ai-integration`, `auth`, `community`, `messaging`,
`notification`) exit immediately if RabbitMQ or their database is not reachable
yet. There is no startup retry. Under pm2 they restart until dependencies come
up, so this self-heals, but the first minute of logs will show crashes. That is
expected, not a failed deploy. RabbitMQ in particular can take around a minute
to become ready.

---

## 6. Verifying the deploy

```bash
# Through Kong, no auth required
curl https://<kong-host>/api/v1/auth/health
curl https://<kong-host>/api/v1/users/health
curl https://<kong-host>/api/v1/appointments/health
curl https://<kong-host>/api/v1/mood/health
curl https://<kong-host>/api/v1/community/health
curl https://<kong-host>/api/v1/messaging/health
curl https://<kong-host>/api/v1/ai/health
curl https://<kong-host>/api/v1/notifications/health
curl https://<kong-host>/api/v1/admin/health
```

All should return `{"status":"ok",...}`. A 502 means Kong reached but the
upstream is down, check `KONG_UPSTREAM_HOST`. A 404 means the Kong route
config did not load. A 503 with `{"status":"error",...}` means Kong reached
the service and the service is running, but _that service's own database_
is unreachable — check its `*_DATABASE_URL` / `MONGO_URI`, not Kong.

Then confirm CORS is right, using your real frontend origin:

```bash
curl -i -X OPTIONS https://<kong-host>/api/v1/auth/login \
  -H "Origin: https://app.mindora.rw" \
  -H "Access-Control-Request-Method: POST"
```

Expect `Access-Control-Allow-Origin: https://app.mindora.rw` and
`Access-Control-Allow-Credentials: true`. If the origin comes back as something
else, it is not in `KONG_CORS_ORIGINS`, and the frontend will be blocked.

Finally, register and log in a real account end to end. Confirm the
`refreshToken` cookie is set with `Secure` and `SameSite=None`, and that a page
reload keeps the user signed in. If reload logs them out, `NODE_ENV` is not
`production` on the bundle.

---

## 7. Things that will bite you

**Kong config is rendered at container start.** `kong.yml` is a template with
`${JWT_SECRET}`, `${KONG_UPSTREAM_HOST}` and `${KONG_CORS_ORIGINS}` in it,
substituted by `infrastructure/kong/docker-entrypoint.sh`. If any is missing
the container refuses to start with a `FATAL:` line saying which. That is
deliberate. There is no longer a separate `kong.railway.yml`; if you find a
reference to one, it is stale.

**Kong's admin API on 8001 must not be public.** It allows reconfiguring the
gateway.

**Health checks now fail loudly, not just "not 200."** Every service's
`/health` used to return an unconditional `{"status":"ok"}` — it could never
distinguish "actually fine" from "up but the database died." Every Prisma-
and MongoDB-backed service now checks that connection on each health request
and returns `503 {"status":"error",...}` if it's unreachable (Prisma is
timeout-guarded at 3s so a hung database fails the probe fast instead of
hanging it). `admin-service` and `docs-gateway` are the exceptions —
deliberately unconditional 200, since neither has a database to check. If a
deploy suddenly shows services as unhealthy that used to pass, check that
service's own database connectivity first — it's very likely telling the
truth now, not regressing.

**Kong now caps request bodies at 10MB.** No route accepts file uploads —
every body is JSON — so this should never be hit in normal use. If a future
feature adds uploads, that route will need its own larger
`request-size-limiting` override, not a bump to the global default.

**Socket.io does not go through Kong.** The messaging websocket connects
directly to port 3006. There is no `/socket.io/` route on the gateway. The
frontend therefore needs a separate socket URL, and port 3006 needs to be
reachable by browsers. Confirm this with the frontend developer before launch;
it may need its own public hostname.

**Chat messages were historically stored unencrypted.** Encryption is now
wired up, but rows created before that are plaintext. Decryption passes
plaintext through unchanged, so **nothing will appear broken either way** —
you have to go looking. If you are migrating an existing database, run the
backfill against it after deploying:

```bash
MESSAGE_ENCRYPTION_KEY=<prod key> MONGO_URI=<prod messaging uri> \
  npm run backfill:encrypt -w @mindora/messaging-service
```

It is idempotent and skips rows that are already ciphertext, so re-running is
safe. A fresh database needs nothing.

**The frontend lives in a different repository.** It is not built or deployed
by anything here.

---

## Blockers: do not launch to real users yet

Two items are outstanding and neither is a deployment task. Both are with the
clinical lead.

**1. The AI chat safety filter does not stop at the right threshold.** Messages
containing explicit suicidal ideation (for example "I want to kill myself") are
flagged internally and then **still sent to the AI**, which replies
conversationally. Only an explicit stated plan blocks the conversation and
shows crisis resources. Nobody is alerted in the meantime. The correct
behaviour is a clinical decision and has not been made yet.

**2. The crisis keyword list has never been clinically reviewed**, is exact
phrase matching only, and is **English only**. Users are expected to write in
Kinyarwanda, French, and Swahili, and crisis disclosure in those languages is
currently not detected at all.

**Update (2026-08-25): the RabbitMQ reliability gap previously noted here is
fixed.** Crisis alerts (`apps/ai-integration-service/src/lib/crisis-alerts.ts`),
mood-concern/streak events, and messaging's `message.received` event are all
now written to their own service's database _before_ publishing, with a
30-second sweeper retrying anything RabbitMQ didn't accept — a broker outage
at the moment of detection no longer loses the record silently. That was pure
reliability plumbing and didn't require a clinical decision, so it shipped
independently.

What's still genuinely blocked on the clinical lead is unchanged: **who
should be notified when a crisis alert can't be delivered after 10 delivery
attempts, and how fast.** Right now an exhausted alert only
logs `console.error` — visible in the container logs, not paged to anyone.
That policy (an on-call rotation? SMS to a duty clinician? something else)
needs the same clinical answer as items 1 and 2 above before it's worth
building.
