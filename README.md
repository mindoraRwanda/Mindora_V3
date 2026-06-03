# Mindora V3

Mental health platform monorepo — Turborepo + npm workspaces, 9 microservices, shared packages, and local infrastructure via Docker.

## Prerequisites

- **Node.js 20** (see `.nvmrc`)
- **npm** 10+
- **Docker Desktop** (PostgreSQL, MongoDB, Redis, RabbitMQ, Kong)
- **Git**

```bash
node -v    # v20.x
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
copy .env.example .env
```

Edit `.env` if needed. Default credentials match `docker-compose.yml`.

### 3. Start infrastructure

```bash
docker compose up -d
```

| Service    | Port(s)              |
|------------|----------------------|
| PostgreSQL | 5432                 |
| MongoDB    | 27017                |
| Redis      | 6379                 |
| RabbitMQ   | 5672, 15672 (UI)     |
| Kong proxy | 8000                 |
| Kong admin | 8001                 |

### 4. Database migrations (Auth / Prisma)

```bash
npm run db:migrate
```

### 5. Run all services (health stubs)

```bash
npm run dev
```

Or a single service:

```bash
npm run dev -w @mindora/auth-service
```

### 6. Verify

**Direct (auth):**

```bash
curl http://localhost:3001/health
```

**Via Kong** (start `auth-service` first):

```bash
curl http://localhost:8000/api/v1/auth/health
```

## Project structure

```
Mindora_V3/
├── apps/                    # Microservices (ports 3001–3009)
├── packages/
│   ├── database/            # @mindora/database — Prisma client
│   ├── queue/               # @mindora/queue — RabbitMQ helpers
│   ├── validation/          # @mindora/validation — Zod DTOs
│   └── shared-types/        # @mindora/shared-types
├── infrastructure/kong/     # Kong declarative config
├── docker-compose.yml
├── turbo.json
└── .github/workflows/ci.yml
```

## Services and ports

| Service                 | Port | Kong health path                    |
|-------------------------|------|-------------------------------------|
| auth-service            | 3001 | `/api/v1/auth/health`               |
| user-service            | 3002 | `/api/v1/users/health`              |
| appointment-service     | 3003 | `/api/v1/appointments/health`       |
| mood-tracking-service   | 3004 | `/api/v1/mood/health`               |
| community-service       | 3005 | `/api/v1/community/health`          |
| messaging-service       | 3006 | `/api/v1/messaging/health`          |
| ai-integration-service  | 3007 | `/api/v1/ai/health`                 |
| notification-service    | 3008 | `/api/v1/notifications/health`      |
| admin-service           | 3009 | `/api/v1/admin/health`              |

## Shared packages

```ts
import { prisma } from '@mindora/database';
import { registerSchema, loginSchema } from '@mindora/validation';
import { connect, publish, subscribe } from '@mindora/queue';
import type { UserRole } from '@mindora/shared-types';
```

## Scripts

| Command            | Description                          |
|--------------------|--------------------------------------|
| `npm run dev`      | Start all workspaces in dev mode     |
| `npm run build`    | Build all packages/apps              |
| `npm run lint`     | ESLint via Turborepo                 |
| `npm run test`     | Vitest via Turborepo                 |
| `npm run db:migrate` | Prisma migrate (database package)  |

## Git workflow (two developers)

1. `git checkout main && git pull`
2. `git checkout -b yourname/sprint1-feature`
3. Commit, push, open PR to `main`
4. Wait for CI (lint + test)

**Ownership:** Theodora — `auth-service`, `packages/database`. Karimi — `community-service`, `packages/queue`, `docker-compose.yml`, Kong (already in repo; coordinate on changes).

## License

ISC
