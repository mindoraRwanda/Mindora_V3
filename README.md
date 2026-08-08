# Mindora V3

Mental health platform monorepo — Turborepo + npm workspaces, 9 microservices, 7 shared packages, and local infrastructure via Docker Compose.

## Prerequisites

| Tool           | Version               |
| -------------- | --------------------- |
| Node.js        | **24** (see `.nvmrc`) |
| npm            | **10+**               |
| Docker Desktop | any recent version    |
| Git            | any recent version    |

```bash
node -v    # v24.x
node -v    # v24.x
npm -v
docker -v
```

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/mindoraRwanda/Mindora_V3.git
cd Mindora_V3
nvm use          # reads .nvmrc → Node 24
npm install
```

### 2. Environment

```bash
cp .env.example .env   # Linux/macOS
copy .env.example .env # Windows
```

Key variables (defaults work for local Docker):

| Variable                        | Description                                            |
| ------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`                  | PostgreSQL connection string                           |
| `MONGODB_URI`                   | MongoDB connection string                              |
| `REDIS_URL`                     | Redis connection string                                |
| `RABBITMQ_URL`                  | RabbitMQ AMQP connection string                        |
| `JWT_SECRET`                    | HS256 signing key — must match Kong config             |
| `APP_BASE_URL`                  | Auth service base URL (password reset links)           |
| `GOOGLE_CLIENT_ID`              | Google OAuth client ID (optional)                      |
| `GOOGLE_CLIENT_SECRET`          | Google OAuth secret (optional)                         |
| `RESEND_EMAIL_API_KEY`          | Resend API key for email notifications                 |
| `AT_API_KEY`                    | Africa's Talking API key for SMS                       |
| `AT_USERNAME`                   | Africa's Talking username                              |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | FCM service account JSON (inline or file path)         |
| `USER_SERVICE_URL`              | Used by notification-service to fetch user preferences |

### 3. Start infrastructure

```bash
docker compose up -d
```

| Container  | Port(s)          | Purpose                                    |
| ---------- | ---------------- | ------------------------------------------ |
| PostgreSQL | 5432             | Auth, User profiles (Prisma)               |
| MongoDB    | 27017            | Community, Messaging (Mongoose)            |
| Redis      | 6379             | JWT blacklist, presence, typing indicators |
| RabbitMQ   | 5672, 15672 (UI) | Event bus between services                 |
| Kong proxy | 8000             | API gateway                                |
| Kong admin | 8001             | Kong configuration API                     |

> **⚠️ Windows / Docker Desktop — PostgreSQL auth note**
> `docker-compose.yml` sets `POSTGRES_HOST_AUTH_METHOD: trust` on the PostgreSQL service.
> This is required on Windows because Docker Desktop routes host TCP connections through
> the bridge gateway (`172.18.0.1`) rather than the loopback address (`127.0.0.1`), which
> bypasses PostgreSQL's loopback trust rule and causes password auth to fail.
> **Remove this variable and use scram-sha-256 with secrets-managed credentials in any non-local environment.**

### 4. Database setup

> **⚠️ `npm run db:migrate` / `npm run db:seed` are dead ends.** Both map to
> the `@mindora/database` workspace (`packages/database`), which no service
> has imported since the DB-per-service split — it migrates and seeds the
> orphaned `mindora` database, not the `mindora_auth` / `mindora_user` / etc.
> databases the running services actually read from. Following this section
> literally gives you zero usable accounts in the real system. See
> [Known Issues](#known-issues--workarounds) for the current state and
> per-service migrate/seed commands below.

Each PostgreSQL-backed service owns its own Prisma schema and migrates
independently:

```bash
# Per service, from the service directory
cd apps/<service> && npx prisma migrate dev

# Or seed via the root shortcuts that exist:
npm run db:seed:profiles       # user-service — 30 therapist profiles
npm run db:seed:appointments   # appointment-service — sample bookings
npm run db:seed:mood           # mood-tracking-service
npm run db:seed:community      # community-service (MongoDB)

# No root shortcut for auth-service yet — run directly:
npm run seed -w @mindora/auth-service   # seeds the 30 therapist AUTH accounts only,
                                         # NOT the patient@test.mindora.local-style
                                         # login accounts referenced elsewhere in
                                         # this repo's docs — those don't currently
                                         # exist anywhere. See Known Issues.
```

### 5. Run all services

```bash
npm run dev
```

Or target individual services:

```bash
npm run dev:auth        # auth-service only
npm run dev:community   # community-service + auth-service
npm run dev:messaging   # messaging-service + auth-service
npm run dev -w @mindora/notification-service
```

### 6. Verify

```bash
# Direct health check
curl http://localhost:3001/health

# Via Kong gateway
curl http://localhost:8000/api/v1/auth/health
```

## Project structure

```
Mindora_V3/
├── apps/
│   ├── auth-service/          # Port 3001 — JWT auth, Google OAuth, token rotation
│   ├── user-service/          # Port 3002 — patient/therapist profiles
│   ├── appointment-service/   # Port 3003
│   ├── mood-tracking-service/ # Port 3004
│   ├── community-service/     # Port 3005 — groups, posts, comments, moderation
│   ├── messaging-service/     # Port 3006 — 1-to-1 chat, Socket.io, presence
│   ├── ai-integration-service/# Port 3007
│   ├── notification-service/  # Port 3008 — RabbitMQ consumer, push/email/SMS
│   └── admin-service/         # Port 3009
├── packages/
│   ├── auth-middleware/       # @mindora/auth-middleware — JWT verify, blacklist, requireRole
│   ├── database/              # @mindora/database — Prisma client + schema
│   ├── events/                # @mindora/events — shared event types + exchange names
│   ├── queue/                 # @mindora/queue — RabbitMQ publish/subscribe helpers
│   ├── validation/            # @mindora/validation — Zod DTOs
│   ├── shared-types/          # @mindora/shared-types
│   └── http-client/           # @mindora/http-client
├── infrastructure/kong/       # Kong declarative config
├── .github/workflows/
│   ├── ci.yml                 # Lint + test (MongoDB + Redis service containers)
│   └── deploy.yml
└── docker-compose.yml
```

## Services

### auth-service · Port 3001

Handles registration, login, token refresh, logout, password reset, and Google OAuth.
Uses **PostgreSQL** (Prisma) for user storage and **Redis** for JWT blacklisting and
password reset tokens.

| Method | Path                     | Auth   | Description                                                                       |
| ------ | ------------------------ | ------ | --------------------------------------------------------------------------------- |
| `POST` | `/register`              | —      | Register with email, password, and role (`PATIENT`/`THERAPIST`/`ADMIN`)           |
| `POST` | `/login`                 | —      | Authenticate; returns access token in body and refresh token as `HttpOnly` cookie |
| `POST` | `/logout`                | JWT    | Blacklist access token; revoke refresh token                                      |
| `POST` | `/refresh`               | Cookie | Rotate refresh token; return new access token                                     |
| `POST` | `/forgot-password`       | —      | Send password reset link (always 200)                                             |
| `POST` | `/reset-password`        | —      | Consume reset token and set new password                                          |
| `GET`  | `/me`                    | JWT    | Return the authenticated user's identity                                          |
| `GET`  | `/oauth/google`          | —      | Initiate Google OAuth flow                                                        |
| `GET`  | `/oauth/google/callback` | —      | Google OAuth callback; issues session on success                                  |
| `GET`  | `/health`                | —      | Health check                                                                      |

**Token behaviour:**

- Access token: short-lived JWT signed with `JWT_SECRET`, verified by `@mindora/auth-middleware`
- Refresh token: stored hashed in PostgreSQL, supports token rotation (old token is marked `revoked` and linked to the replacement via `replacedByTokenId`)
- Logout blacklists the access token JTI in Redis for the remainder of its TTL

---

### user-service · Port 3002

Manages patient and therapist profiles stored in **PostgreSQL** via Prisma.

**API docs:** `http://localhost:3002/docs`

| Method | Path                           | Auth | Description                                                      |
| ------ | ------------------------------ | ---- | ---------------------------------------------------------------- |
| `GET`  | `/me`                          | JWT  | Return the authenticated user's profile (patient or therapist)   |
| `PUT`  | `/me`                          | JWT  | Update own profile (bio, timezone, language)                     |
| `PUT`  | `/me/fcm-token`                | JWT  | Register/update the FCM push token                               |
| `PUT`  | `/me/notification-preferences` | JWT  | Partial update of push/email/sms preferences                     |
| `GET`  | `/{userId}/preferences`        | JWT  | Contact info + notification prefs (self, or SERVICE-role caller) |
| `GET`  | `/therapists`                  | JWT  | Paginated, filterable list of therapists accepting patients      |
| `GET`  | `/photos/*`                    | —    | Public — serves therapist profile photos (static files)          |
| `GET`  | `/health`                      | —    | Health check                                                     |

**Therapist query params:** `page`, `limit`, `specialisation` (partial match), `language` (exact match).

**`TherapistProfile.photoUrl`** (nullable string) — set by the seed script for
the first 8 therapists shown by default; not yet settable via `PUT /me` (no
upload endpoint exists yet, this is seed-only for now). Served from
`apps/user-service/public/therapist-photos/` via the public `/photos` route
above — deliberately outside JWT auth since an `<img>` tag can't send one.

---

### community-service · Port 3005

Groups, posts, comments, reactions, and content moderation. Uses **MongoDB** (Mongoose).
User IDs are encrypted at rest with AES-256-GCM for anonymity in anonymous groups.
Publishes `CommunityReportedEvent` and `CommunityReplyEvent` to RabbitMQ.

**API docs:** `http://localhost:3005/docs`

| Method | Path                                    | Auth | Role  | Description              |
| ------ | --------------------------------------- | ---- | ----- | ------------------------ |
| `POST` | `/api/v1/community/groups`              | JWT  | ADMIN | Create a community group |
| `GET`  | `/api/v1/community/groups`              | JWT  | any   | List all groups          |
| `GET`  | `/api/v1/community/groups/:id`          | JWT  | any   | Get a group by ID        |
| `POST` | `/api/v1/community/groups/:id/posts`    | JWT  | any   | Create a post in a group |
| `GET`  | `/api/v1/community/groups/:id/posts`    | JWT  | any   | List posts in a group    |
| `POST` | `/api/v1/community/posts/:id/comments`  | JWT  | any   | Add a comment to a post  |
| `GET`  | `/api/v1/community/posts/:id/comments`  | JWT  | any   | List comments on a post  |
| `POST` | `/api/v1/community/posts/:id/reactions` | JWT  | any   | React to a post          |
| `POST` | `/api/v1/community/posts/:id/report`    | JWT  | any   | Report a post            |
| `POST` | `/api/v1/community/comments/:id/report` | JWT  | any   | Report a comment         |
| `GET`  | `/api/v1/community/health`              | —    | —     | Health check             |

**Data models (MongoDB):** `CommunityGroup`, `Post`, `Comment`, `Report`

---

### messaging-service · Port 3006

1-to-1 chat with real-time delivery via Socket.io. Uses **MongoDB** (Mongoose) for
persistence and **Redis** for presence tracking and typing indicators. Message content
is encrypted at rest with AES-256-GCM.

**API docs:** `http://localhost:3006/docs`

#### REST endpoints

| Method | Path                                  | Auth | Description                                                                           |
| ------ | ------------------------------------- | ---- | ------------------------------------------------------------------------------------- |
| `POST` | `/api/v1/messaging/conversations`     | JWT  | Find existing or create a new 1-to-1 conversation. Returns 200 if exists, 201 if new. |
| `GET`  | `/api/v1/messaging/conversations`     | JWT  | Paginated list of user's conversations with unread counts. Query: `page`, `limit`.    |
| `GET`  | `/api/v1/messaging/conversations/:id` | JWT  | Cursor-paginated message history (newest-first, decrypted). Query: `limit`, `cursor`. |
| `GET`  | `/api/v1/messaging/presence/:userId`  | JWT  | Check if a user is currently online.                                                  |
| `GET`  | `/api/v1/messaging/health`            | —    | Health check                                                                          |

#### Socket.io events

Connect to `ws://localhost:3006`. After connecting, emit `register_presence` to appear online.

**Client → Server**

| Event                 | Payload                                 | Description                                               |
| --------------------- | --------------------------------------- | --------------------------------------------------------- |
| `register_presence`   | `{ userId }`                            | Mark user online (90 s Redis TTL).                        |
| `heartbeat`           | —                                       | Refresh presence TTL every 30 s.                          |
| `logout_presence`     | —                                       | Remove presence key immediately on tab close.             |
| `create_conversation` | `{ participants: [id, id] }`            | Create/retrieve a conversation without HTTP.              |
| `join_conversation`   | `{ conversationId }`                    | Join room; receives `message_history` (last 50 messages). |
| `send_message`        | `{ conversationId, content, senderId }` | Persist and broadcast a message.                          |
| `mark_read`           | `{ conversationId, messageId }`         | Mark message read; notifies sender.                       |
| `typing_start`        | `{ conversationId, userId }`            | Broadcast typing indicator (5 s auto-expiry).             |
| `typing_stop`         | `{ conversationId, userId }`            | Clear typing indicator.                                   |

**Server → Client**

| Event                  | Payload                                                 | Description                                           |
| ---------------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| `conversation_created` | `{ _id, participants }`                                 | Response to `create_conversation`.                    |
| `joined_conversation`  | `{ conversationId }`                                    | Confirms room join.                                   |
| `message_history`      | `{ conversationId, messages[] }`                        | Last 50 messages on join.                             |
| `new_message`          | `{ _id, conversationId, senderId, content, createdAt }` | Broadcast to all room members.                        |
| `message_read`         | `{ conversationId, messageId }`                         | Sent to the room (excluding original sender) on read. |
| `user_typing`          | `{ conversationId, userId }`                            | Broadcast on `typing_start`.                          |
| `user_stopped_typing`  | `{ conversationId, userId }`                            | Broadcast on `typing_stop`.                           |
| `error`                | `{ message }`                                           | Emitted for any validation or server error.           |

**Data models (MongoDB):** `Conversation` (participants[2], lastMessage), `Message` (conversationId, senderId, content, readAt)

---

### notification-service · Port 3008

Pure **RabbitMQ consumer** — no public HTTP API beyond health checks. Subscribes to
domain events and dispatches notifications through three channels.

**API docs (event reference):** `http://localhost:3008/docs`

| Exchange               | Queue                       | Event                       | Action                                           |
| ---------------------- | --------------------------- | --------------------------- | ------------------------------------------------ |
| `mindora.appointments` | `notification.appointments` | `AppointmentBookedEvent`    | Push + email to patient                          |
| `mindora.appointments` | `notification.appointments` | `AppointmentConfirmedEvent` | Push + email to patient                          |
| `mindora.appointments` | `notification.appointments` | `AppointmentCancelledEvent` | Push + email to affected party                   |
| `mindora.messages`     | `notification.messages`     | `MessageReceivedEvent`      | Push preview to recipient                        |
| `mindora.community`    | `notification.community`    | `CommunityReplyEvent`       | Push to post author                              |
| `mindora.mood`         | `notification.mood`         | `MoodLoggedEvent`           | Logged only _(notification pending — see TODOs)_ |
| `mindora.ai`           | `notification.ai`           | AI crisis event             | SMS crisis alert to patient                      |

**Notification channels:**

| Channel           | Provider                 | Required env var                |
| ----------------- | ------------------------ | ------------------------------- |
| Push notification | Firebase Cloud Messaging | `FIREBASE_SERVICE_ACCOUNT_JSON` |
| Email             | Resend                   | `RESEND_EMAIL_API_KEY`          |
| SMS               | Africa's Talking         | `AT_API_KEY`, `AT_USERNAME`     |

Each channel is optional — if its env var is absent at startup, that channel is silently disabled.
User contact details (email, phone, FCM token) are fetched on demand from the User Service
at `GET /api/v1/users/:userId/preferences`.

**Retry & DLQ:** Transient delivery failures (network, rate limits) are retried with exponential
backoff via `mindora.notifications.retry`. Fatal failures (invalid FCM token: `messaging/registration-token-not-registered`,
blacklisted phone number AT code `406`, invalid sender ID AT code `402`) skip retries and route
directly to `mindora.notifications.dlq`.

---

## Shared packages

### `@mindora/auth-middleware`

JWT verification middleware for Express services. Modular — services configure their own instance.

```ts
import {
  createVerifyJwt,
  requireRole,
  authenticate,
} from '@mindora/auth-middleware';
import type { AuthenticatedRequest } from '@mindora/auth-middleware';

// Option A — configure once per service
const verifyJwt = createVerifyJwt({
  jwtSecret: process.env.JWT_SECRET!,
  jwtIssuer: 'mindora-auth',
  redisUrl: process.env.REDIS_URL,
});

// Option B — convenience middleware (reads env vars at first call)
import { authenticate } from '@mindora/auth-middleware';

// Role guard
router.delete('/groups/:id', authenticate, requireRole('ADMIN'), handler);
```

Exports: `createVerifyJwt`, `authenticate`, `requireRole`, `verifyAccessToken`,
`blacklistToken`, `isTokenBlacklisted`, `getRedisClient`, `blacklistKey`, `passwordResetKey`

---

### `@mindora/database` — orphaned, not imported by any service

Leftover from before the DB-per-service split. `grep`-confirmed: no `apps/*/package.json`
depends on it anymore. Each PostgreSQL-backed service now owns its own Prisma
schema (`apps/<service>/prisma/schema.prisma`) with no cross-service relations.
The package still exists on disk with its own schema/migrations pointing at a
`mindora` database that no running service reads from — the root `db:generate`
/ `db:migrate` / `db:seed` scripts still point here, which is why they're
flagged above. Safe to ignore; candidate for deletion.

---

### `@mindora/events`

Shared TypeScript event interfaces and RabbitMQ exchange/queue constants.

```ts
import { EXCHANGES, QUEUES } from '@mindora/events';
import type {
  AppointmentBookedEvent,
  AppointmentConfirmedEvent,
  AppointmentCancelledEvent,
  MessageReceivedEvent,
  CommunityReplyEvent,
  CommunityReportedEvent,
} from '@mindora/events';
```

---

### `@mindora/queue`

RabbitMQ publish/subscribe helpers wrapping `amqplib`.

```ts
import { connect, publish, subscribe } from '@mindora/queue';

await connect(); // connects using RABBITMQ_URL
await publish(EXCHANGES.APPOINTMENTS, appointmentBookedEvent);
await subscribe(EXCHANGES.MESSAGES, 'notification.messages', handler);
```

---

### `@mindora/validation`

Zod schemas and inferred DTO types used across services.

```ts
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  therapistListQuerySchema,
  CreateGroupDto,
  CreatePostDto,
  CreateCommentDto,
} from '@mindora/validation';
```

---

## Error handling — async-crash safety

Express 4.x does **not** forward a rejected promise from an
`async (req, res) => {}` route handler to `next()` automatically. Left
unhandled, that's an `unhandledRejection` that crashes the whole Node
process — not a 500 for the one bad request, every in-flight request on that
service goes down with it. Every service in this monorepo now guards against
this with the same two-piece pattern, duplicated per service (not a shared
package — each service has its own copy):

```ts
// src/middleware/async-handler.ts
export function asyncHandler(handler) {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
```

```ts
// app.ts — wrap every async route, then register a catch-all last
router.get('/foo', asyncHandler(async (req, res) => { ... }));

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
```

A handler that isn't wrapped in `asyncHandler` — or a global error middleware
that exists but that nothing ever calls `next(err)` into — is silently dead:
it looks like crash protection but does nothing. When adding a new async
route handler to any service, wrap it.

---

## API documentation (Swagger UI)

Every service exposes interactive Swagger UI at `/docs` — this table was
previously missing 6 of the 9:

| Service                | URL                          |
| ---------------------- | ---------------------------- |
| auth-service           | `http://localhost:3001/docs` |
| user-service           | `http://localhost:3002/docs` |
| appointment-service    | `http://localhost:3003/docs` |
| mood-tracking-service  | `http://localhost:3004/docs` |
| community-service      | `http://localhost:3005/docs` |
| messaging-service      | `http://localhost:3006/docs` |
| ai-integration-service | `http://localhost:3007/docs` |
| notification-service   | `http://localhost:3008/docs` |
| admin-service          | `http://localhost:3009/docs` |

Raw OpenAPI JSON/YAML is available on each service too, though the path
varies by how the spec is generated:

- Most services: `/docs.json` (JSDoc `@swagger` comments → `swagger-jsdoc`)
- `appointment-service`, `mood-tracking-service`: `/openapi.json` and
  `/openapi.yaml`, generated from a static file at `docs/<service>.yaml`
  (CORS-enabled, meant for frontend codegen)

---

## CI/CD

**Workflow:** `.github/workflows/ci.yml` — runs on push/PR to `main`.

**Steps:** checkout → Node 24 setup → `npm ci` → Prisma generate → lint → test

**Service containers in CI:**

| Container | Image                        |
| --------- | ---------------------------- |
| MongoDB   | `mongo:7` (port 27017)       |
| Redis     | `redis:7-alpine` (port 6379) |

> PostgreSQL is not spun up in CI — services that require it (auth, user) mock the database layer in their test suites.

---

## Scripts

| Command                        | Description                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                  | Start all services in watch mode (concurrency 10)                                                                                                                      |
| `npm run dev:auth`             | Start auth-service only                                                                                                                                                |
| `npm run dev:community`        | Start community-service + auth-service                                                                                                                                 |
| `npm run dev:messaging`        | Start messaging-service + auth-service                                                                                                                                 |
| `npm run build`                | Build all packages and apps                                                                                                                                            |
| `npm run lint`                 | ESLint across all workspaces                                                                                                                                           |
| `npm run test`                 | Vitest across all workspaces                                                                                                                                           |
| `npm run db:migrate`           | **Orphaned** — migrates the unused `@mindora/database` package, not any real service DB. Use `cd apps/<service> && npx prisma migrate dev` instead (see Known Issues). |
| `npm run db:seed`              | **Orphaned** — same issue, seeds the unused `mindora` database                                                                                                         |
| `npm run db:seed:profiles`     | Seed user-service — 30 therapist profiles                                                                                                                              |
| `npm run db:seed:appointments` | Seed appointment-service — sample bookings                                                                                                                             |
| `npm run db:seed:mood`         | Seed mood-tracking-service                                                                                                                                             |
| `npm run db:seed:community`    | Seed community-service MongoDB data                                                                                                                                    |
| `npm run db:generate`          | Regenerate Prisma client for `@mindora/database` — **not** the per-service clients, run `npx prisma generate` inside each service for those                            |

---

## Testing

Tests use **Vitest** and run via Turborepo (`npm run test`).

| Service                           | Strategy                           | Coverage                                                                                                      |
| --------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| auth-service                      | Unit — mocked DB + Redis           | register, login, logout (blacklist), refresh (token rotation), forgot/reset password, expired token rejection |
| user-service                      | Unit — mocked DB + Redis           | GET /me (patient + therapist), PUT /me, GET /therapists (pagination)                                          |
| community-service                 | Integration — real MongoDB         | groups CRUD, posts, comments, reactions, reports, anonymous authorship                                        |
| messaging-service (conversations) | Integration — real MongoDB + Redis | create/find conversation, list, cursor-paginated history, 403/404/400 guards                                  |
| messaging-service (socket)        | Integration — real MongoDB         | join room, send message, mark read, typing events, error handling                                             |
| messaging-service (models)        | Integration — real MongoDB         | Conversation + Message schema validation                                                                      |
| notification-service              | Unit — mocked providers            | FCM delivery, SMS AT status codes, retry/DLQ routing, consumer dispatch                                       |
| `@mindora/validation`             | Unit                               | all Zod schema shapes                                                                                         |

> Auth and user service tests mock ioredis using `vi.fn().mockImplementation(class { ... })` — the Vitest 4.x constructor-mock pattern.

---

## Known Issues & Workarounds

### Prisma CLI cannot connect to Docker PostgreSQL on Windows (P1000)

**Symptom:** `npm run db:migrate` (or any `prisma migrate dev` / `prisma db push` command) exits with:

```
Error: P1000: Authentication failed against database server at `localhost`
```

or hangs indefinitely with no PostgreSQL log entries.

**Root cause:** The Prisma migrate engine and query engine ship as pre-compiled Rust binaries. On Windows with Docker Desktop, the Docker bridge driver routes host-to-container TCP connections through the bridge gateway (`172.18.0.1`) rather than loopback (`127.0.0.1`). The Rust binary is unable to establish any TCP connection to the container via this path — even with `POSTGRES_HOST_AUTH_METHOD: trust` applied, no connection attempt appears in PostgreSQL's `log_connections` output. This is a Windows-specific Docker Desktop networking issue with the Rust binary; it does not affect the JavaScript driver (`pg` npm package) or any other Node.js PostgreSQL client.

**Workaround — apply migrations directly via `docker exec`:**

Instead of `npm run db:migrate`, copy the SQL file into the container and run it with `psql`:

```bash
# For packages/database migrations (mindora DB)
docker cp packages/database/prisma/migrations/<timestamp>_<name>/migration.sql mindora_v3-postgres-1:/tmp/migration.sql
docker exec mindora_v3-postgres-1 psql -U mindora -d mindora -f /tmp/migration.sql

# For ai-integration-service migrations (mindora_ai DB)
docker cp apps/ai-integration-service/prisma/migrations/<timestamp>_<name>/migration.sql mindora_v3-postgres-1:/tmp/migration.sql
docker exec mindora_v3-postgres-1 psql -U mindora -d mindora_ai -f /tmp/migration.sql
```

After applying the SQL, record the migration in Prisma's tracking table so `prisma migrate status` stays accurate:

```bash
docker exec mindora_v3-postgres-1 psql -U mindora -d mindora -c "
INSERT INTO \"_prisma_migrations\" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (gen_random_uuid()::text, 'baseline', now(), '<migration_name>', NULL, NULL, now(), 1)
ON CONFLICT DO NOTHING;"
```

Replace `<migration_name>` with the directory name (e.g. `20260703000000_init`). Use `-d mindora_ai` for AI service migrations.

**Generating the Prisma client still works** — only the CLI migrate/push commands are broken:

```bash
npm run db:generate   # fine — runs prisma generate (no network)
```

**This issue does not affect production** — CI runs on Linux and production deployments use Linux containers where Prisma's Rust binary connects normally.

> **Update (2026-07-29):** `cd apps/user-service && npx prisma migrate dev` ran
> and applied cleanly in this environment (Windows, Docker Desktop) with no
> P1000 error. Not sure yet whether the underlying networking issue was fixed
> by a Docker Desktop/Prisma update since this was written, or whether it's
> config-dependent — flagging rather than deleting the workaround above.
> Worth re-verifying next time someone hits this before assuming it's still
> broken.

---

### Root `db:seed` doesn't produce any usable login accounts

Every service README's "seed" instructions that say `npm run db:seed`
(root-level) are pointing at the orphaned `@mindora/database` package (see
[Shared packages](#mindoradatabase--orphaned-not-imported-by-any-service)) —
confirmed by direct query, **the `patient@test.mindora.local` /
`therapist@test.mindora.local` / `admin@test.mindora.local` accounts
documented in multiple READMEs do not currently exist in either the orphaned
`mindora` database or the real `mindora_auth` database that auth-service
actually reads from.** `apps/auth-service/src/seed.ts` only creates the 30
fixed-UUID `THERAPIST` accounts with a non-login dummy password (they exist
solely so `appointment-service`'s cross-service therapist check resolves) —
it does not create any of the 4 named test-login accounts referenced
elsewhere. As of this writing there is no working seed path to get those 4
accounts into `mindora_auth`. Needs a real fix (a new seed script targeting
`AUTH_DATABASE_URL`), not just a doc update — flagged here so it isn't lost.

### Local dev: `npm run dev` fails across the board after a while

Two independent, recurring causes, not a single bug:

1. **Stale processes on 3001–3007/3009.** If a service was ever started
   outside of `npm run dev` (manual `tsx watch`, a killed-then-orphaned
   process, etc.), it keeps holding its port and every future `npm run dev`
   fails that service with `EADDRINUSE` immediately. Find and kill it:
   ```bash
   netstat -ano | findstr :3001   # note the PID in the last column
   taskkill /PID <pid> /F
   ```
2. **RabbitMQ/Kong containers not running, or RabbitMQ still booting.**
   `admin-service` and `notification-service` both `process.exit(1)` on any
   RabbitMQ connection failure at startup — no retry. If RabbitMQ was just
   started (`docker start mindora-rabbitmq`), it takes on the order of a
   minute to become healthy; if either service tried to connect before that,
   it will have already exited and `tsx watch` will **not** restart it (only
   file changes trigger a restart). Once RabbitMQ reports healthy
   (`docker inspect mindora-rabbitmq --format '{{.State.Health.Status}}'`),
   restart just those two:
   ```bash
   npx turbo run dev --filter=@mindora/admin-service --filter=@mindora/notification-service
   ```

---

## Known TODOs

| Area                                       | Blocker                                                                                                                                                                                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mood concern email (`moodConcernTemplate`) | No `mood.concern` event type exists — `MoodLoggedEvent` fires on every entry. A concern threshold (e.g. rolling avg < 4) must be defined and published as a distinct event upstream. Also requires a patient→therapist assignment endpoint on User Service. |
| Appointment reminder SMS                   | No `EXCHANGES.APPOINTMENT_REMINDER` or `AppointmentReminderEvent` in `@mindora/events`. Requires a reminder scheduler/cron job upstream.                                                                                                                    |
| User Service preferences endpoint          | `GET /api/v1/users/:userId/preferences` referenced by notification-service currently returns only `{ fcmToken }`. `email` and `phoneNumber` fields are needed for email/SMS delivery.                                                                       |

---

## Git workflow

```bash
git checkout main && git pull
git checkout -b yourname/feature-name
# develop, commit
git push -u origin HEAD
# open PR to main — CI must pass before merge
```

**Branch naming:** `yourname/feature-name` or `service-name/feature-name` (e.g. `community-service/infrastructure`).

**Ownership:**

- Theodora — `auth-service`, `user-service`, `packages/database`, `packages/auth-middleware`
- Karimi — `community-service`, `messaging-service`, `notification-service`, `packages/queue`, `packages/events`, `docker-compose.yml`, Kong config

---

## License

ISC
