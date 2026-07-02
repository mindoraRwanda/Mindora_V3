# Mindora V3

Mental health platform monorepo — Turborepo + npm workspaces, 9 microservices, 7 shared packages, and local infrastructure via Docker Compose.

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | **24** (see `.nvmrc`) |
| npm | **10+** |
| Docker Desktop | any recent version |
| Git | any recent version |

```bash
node -v    # v24.x
npm -v
docker -v
```

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/mindoraRwanda/Mindora_V3.git
cd Mindora_V3
npm install
```

### 2. Environment

```bash
cp .env.example .env   # Linux/macOS
copy .env.example .env # Windows
```

Key variables (defaults work for local Docker):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `RABBITMQ_URL` | RabbitMQ AMQP connection string |
| `JWT_SECRET` | HS256 signing key — must match Kong config |
| `APP_BASE_URL` | Auth service base URL (password reset links) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret (optional) |
| `RESEND_EMAIL_API_KEY` | Resend API key for email notifications |
| `AT_API_KEY` | Africa's Talking API key for SMS |
| `AT_USERNAME` | Africa's Talking username |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | FCM service account JSON (inline or file path) |
| `USER_SERVICE_URL` | Used by notification-service to fetch user preferences |

### 3. Start infrastructure

```bash
docker compose up -d
```

| Container | Port(s) | Purpose |
|-----------|---------|---------|
| PostgreSQL | 5432 | Auth, User profiles (Prisma) |
| MongoDB | 27017 | Community, Messaging (Mongoose) |
| Redis | 6379 | JWT blacklist, presence, typing indicators |
| RabbitMQ | 5672, 15672 (UI) | Event bus between services |
| Kong proxy | 8000 | API gateway |
| Kong admin | 8001 | Kong configuration API |

### 4. Database setup

```bash
# Run Prisma migrations (PostgreSQL — auth + user profiles)
npm run db:migrate

# Seed development users
npm run db:seed
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

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/register` | — | Register with email, password, and role (`PATIENT`/`THERAPIST`/`ADMIN`) |
| `POST` | `/login` | — | Authenticate; returns access token in body and refresh token as `HttpOnly` cookie |
| `POST` | `/logout` | JWT | Blacklist access token; revoke refresh token |
| `POST` | `/refresh` | Cookie | Rotate refresh token; return new access token |
| `POST` | `/forgot-password` | — | Send password reset link (always 200) |
| `POST` | `/reset-password` | — | Consume reset token and set new password |
| `GET` | `/me` | JWT | Return the authenticated user's identity |
| `GET` | `/oauth/google` | — | Initiate Google OAuth flow |
| `GET` | `/oauth/google/callback` | — | Google OAuth callback; issues session on success |
| `GET` | `/health` | — | Health check |

**Token behaviour:**
- Access token: short-lived JWT signed with `JWT_SECRET`, verified by `@mindora/auth-middleware`
- Refresh token: stored hashed in PostgreSQL, supports token rotation (old token is marked `revoked` and linked to the replacement via `replacedByTokenId`)
- Logout blacklists the access token JTI in Redis for the remainder of its TTL

---

### user-service · Port 3002

Manages patient and therapist profiles stored in **PostgreSQL** via Prisma.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/me` | JWT | Return the authenticated user's profile (patient or therapist) |
| `PUT` | `/me` | JWT | Update own profile (bio, timezone, language, notification preferences) |
| `GET` | `/therapists` | JWT | Paginated, filterable list of therapists accepting patients |
| `GET` | `/health` | — | Health check |

**Therapist query params:** `page`, `limit`, `specialisation` (partial match), `language` (exact match).

---

### community-service · Port 3005

Groups, posts, comments, reactions, and content moderation. Uses **MongoDB** (Mongoose).
User IDs are encrypted at rest with AES-256-GCM for anonymity in anonymous groups.
Publishes `CommunityReportedEvent` and `CommunityReplyEvent` to RabbitMQ.

**API docs:** `http://localhost:3005/docs`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `POST` | `/api/v1/community/groups` | JWT | ADMIN | Create a community group |
| `GET` | `/api/v1/community/groups` | JWT | any | List all groups |
| `GET` | `/api/v1/community/groups/:id` | JWT | any | Get a group by ID |
| `POST` | `/api/v1/community/groups/:id/posts` | JWT | any | Create a post in a group |
| `GET` | `/api/v1/community/groups/:id/posts` | JWT | any | List posts in a group |
| `POST` | `/api/v1/community/posts/:id/comments` | JWT | any | Add a comment to a post |
| `GET` | `/api/v1/community/posts/:id/comments` | JWT | any | List comments on a post |
| `POST` | `/api/v1/community/posts/:id/reactions` | JWT | any | React to a post |
| `POST` | `/api/v1/community/posts/:id/report` | JWT | any | Report a post |
| `POST` | `/api/v1/community/comments/:id/report` | JWT | any | Report a comment |
| `GET` | `/api/v1/community/health` | — | — | Health check |

**Data models (MongoDB):** `CommunityGroup`, `Post`, `Comment`, `Report`

---

### messaging-service · Port 3006

1-to-1 chat with real-time delivery via Socket.io. Uses **MongoDB** (Mongoose) for
persistence and **Redis** for presence tracking and typing indicators. Message content
is encrypted at rest with AES-256-GCM.

**API docs:** `http://localhost:3006/docs`

#### REST endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/messaging/conversations` | JWT | Find existing or create a new 1-to-1 conversation. Returns 200 if exists, 201 if new. |
| `GET` | `/api/v1/messaging/conversations` | JWT | Paginated list of user's conversations with unread counts. Query: `page`, `limit`. |
| `GET` | `/api/v1/messaging/conversations/:id` | JWT | Cursor-paginated message history (newest-first, decrypted). Query: `limit`, `cursor`. |
| `GET` | `/api/v1/messaging/presence/:userId` | JWT | Check if a user is currently online. |
| `GET` | `/api/v1/messaging/health` | — | Health check |

#### Socket.io events

Connect to `ws://localhost:3006`. After connecting, emit `register_presence` to appear online.

**Client → Server**

| Event | Payload | Description |
|-------|---------|-------------|
| `register_presence` | `{ userId }` | Mark user online (90 s Redis TTL). |
| `heartbeat` | — | Refresh presence TTL every 30 s. |
| `logout_presence` | — | Remove presence key immediately on tab close. |
| `create_conversation` | `{ participants: [id, id] }` | Create/retrieve a conversation without HTTP. |
| `join_conversation` | `{ conversationId }` | Join room; receives `message_history` (last 50 messages). |
| `send_message` | `{ conversationId, content, senderId }` | Persist and broadcast a message. |
| `mark_read` | `{ conversationId, messageId }` | Mark message read; notifies sender. |
| `typing_start` | `{ conversationId, userId }` | Broadcast typing indicator (5 s auto-expiry). |
| `typing_stop` | `{ conversationId, userId }` | Clear typing indicator. |

**Server → Client**

| Event | Payload | Description |
|-------|---------|-------------|
| `conversation_created` | `{ _id, participants }` | Response to `create_conversation`. |
| `joined_conversation` | `{ conversationId }` | Confirms room join. |
| `message_history` | `{ conversationId, messages[] }` | Last 50 messages on join. |
| `new_message` | `{ _id, conversationId, senderId, content, createdAt }` | Broadcast to all room members. |
| `message_read` | `{ conversationId, messageId }` | Sent to the room (excluding original sender) on read. |
| `user_typing` | `{ conversationId, userId }` | Broadcast on `typing_start`. |
| `user_stopped_typing` | `{ conversationId, userId }` | Broadcast on `typing_stop`. |
| `error` | `{ message }` | Emitted for any validation or server error. |

**Data models (MongoDB):** `Conversation` (participants[2], lastMessage), `Message` (conversationId, senderId, content, readAt)

---

### notification-service · Port 3008

Pure **RabbitMQ consumer** — no public HTTP API beyond health checks. Subscribes to
domain events and dispatches notifications through three channels.

**API docs (event reference):** `http://localhost:3008/docs`

| Exchange | Queue | Event | Action |
|----------|-------|-------|--------|
| `mindora.appointments` | `notification.appointments` | `AppointmentBookedEvent` | Push + email to patient |
| `mindora.appointments` | `notification.appointments` | `AppointmentConfirmedEvent` | Push + email to patient |
| `mindora.appointments` | `notification.appointments` | `AppointmentCancelledEvent` | Push + email to affected party |
| `mindora.messages` | `notification.messages` | `MessageReceivedEvent` | Push preview to recipient |
| `mindora.community` | `notification.community` | `CommunityReplyEvent` | Push to post author |
| `mindora.mood` | `notification.mood` | `MoodLoggedEvent` | Logged only _(notification pending — see TODOs)_ |
| `mindora.ai` | `notification.ai` | AI crisis event | SMS crisis alert to patient |

**Notification channels:**

| Channel | Provider | Required env var |
|---------|----------|-----------------|
| Push notification | Firebase Cloud Messaging | `FIREBASE_SERVICE_ACCOUNT_JSON` |
| Email | Resend | `RESEND_EMAIL_API_KEY` |
| SMS | Africa's Talking | `AT_API_KEY`, `AT_USERNAME` |

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
import { createVerifyJwt, requireRole, authenticate } from '@mindora/auth-middleware';
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

### `@mindora/database`

Prisma client + generated types for PostgreSQL.

```ts
import { prisma, Prisma } from '@mindora/database';
import type { User, PatientProfile, TherapistProfile, RefreshToken, UserRole } from '@mindora/database';
```

**Schema models:** `User` (with `googleId` for OAuth), `RefreshToken` (with `replacedByTokenId` for rotation),
`PatientProfile`, `TherapistProfile`

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
  registerSchema, loginSchema,
  forgotPasswordSchema, resetPasswordSchema,
  updateProfileSchema, therapistListQuerySchema,
  CreateGroupDto, CreatePostDto, CreateCommentDto,
} from '@mindora/validation';
```

---

## API documentation (Swagger UI)

| Service | URL |
|---------|-----|
| community-service | `http://localhost:3005/docs` |
| messaging-service | `http://localhost:3006/docs` |
| notification-service | `http://localhost:3008/docs` |

Raw OpenAPI JSON available at `/docs.json` on each service (e.g. `http://localhost:3006/docs.json`).

---

## CI/CD

**Workflow:** `.github/workflows/ci.yml` — runs on push/PR to `main`.

**Steps:** checkout → Node 24 setup → `npm ci` → Prisma generate → lint → test

**Service containers in CI:**

| Container | Image |
|-----------|-------|
| MongoDB | `mongo:7` (port 27017) |
| Redis | `redis:7-alpine` (port 6379) |

> PostgreSQL is not spun up in CI — services that require it (auth, user) mock the database layer in their test suites.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all services in watch mode (concurrency 10) |
| `npm run dev:auth` | Start auth-service only |
| `npm run dev:community` | Start community-service + auth-service |
| `npm run dev:messaging` | Start messaging-service + auth-service |
| `npm run build` | Build all packages and apps |
| `npm run lint` | ESLint across all workspaces |
| `npm run test` | Vitest across all workspaces |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the PostgreSQL database |
| `npm run db:seed:community` | Seed community-service MongoDB data |
| `npm run db:generate` | Regenerate Prisma client after schema changes |

---

## Testing

Tests use **Vitest** and run via Turborepo (`npm run test`).

| Service | Strategy | Coverage |
|---------|----------|----------|
| auth-service | Unit — mocked DB + Redis | register, login, logout (blacklist), refresh (token rotation), forgot/reset password, expired token rejection |
| user-service | Unit — mocked DB + Redis | GET /me (patient + therapist), PUT /me, GET /therapists (pagination) |
| community-service | Integration — real MongoDB | groups CRUD, posts, comments, reactions, reports, anonymous authorship |
| messaging-service (conversations) | Integration — real MongoDB + Redis | create/find conversation, list, cursor-paginated history, 403/404/400 guards |
| messaging-service (socket) | Integration — real MongoDB | join room, send message, mark read, typing events, error handling |
| messaging-service (models) | Integration — real MongoDB | Conversation + Message schema validation |
| notification-service | Unit — mocked providers | FCM delivery, SMS AT status codes, retry/DLQ routing, consumer dispatch |
| `@mindora/validation` | Unit | all Zod schema shapes |

> Auth and user service tests mock ioredis using `vi.fn().mockImplementation(class { ... })` — the Vitest 4.x constructor-mock pattern.

---

## Known TODOs

| Area | Blocker |
|------|---------|
| Mood concern email (`moodConcernTemplate`) | No `mood.concern` event type exists — `MoodLoggedEvent` fires on every entry. A concern threshold (e.g. rolling avg < 4) must be defined and published as a distinct event upstream. Also requires a patient→therapist assignment endpoint on User Service. |
| Appointment reminder SMS | No `EXCHANGES.APPOINTMENT_REMINDER` or `AppointmentReminderEvent` in `@mindora/events`. Requires a reminder scheduler/cron job upstream. |
| User Service preferences endpoint | `GET /api/v1/users/:userId/preferences` referenced by notification-service currently returns only `{ fcmToken }`. `email` and `phoneNumber` fields are needed for email/SMS delivery. |

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
