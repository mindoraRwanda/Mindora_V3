# Mood Tracking Service

Patient mood logging with TimescaleDB analytics, Redis caching, and RabbitMQ concern/streak events.

## Prerequisites

- **Node.js 24+**
- **TimescaleDB** (via `timescale/timescaledb` Postgres image in `docker-compose.yml`)
- Redis, RabbitMQ, auth-service for JWTs

## Port

**3004** (direct) · **8000** via Kong (`/api/v1/mood/*`)

## API documentation

- **OpenAPI:** [`docs/mood-service.yaml`](../../docs/mood-service.yaml)
- **Swagger UI:** `http://localhost:3004/docs`
- **Frontend codegen:** `http://localhost:3004/openapi.json` or `/openapi.yaml` (CORS enabled)

| Method | Path              | Auth            | Description                                    |
| ------ | ----------------- | --------------- | ---------------------------------------------- |
| GET    | `/health`         | No              | Health check                                   |
| POST   | `/log`            | JWT (patient)   | Log mood — 10/day limit, encrypted journal     |
| GET    | `/history`        | JWT (patient)   | Paginated history (`?startDate=`, `?endDate=`) |
| GET    | `/insights`       | JWT (patient)   | Weekly `time_bucket` trends (Redis cached 1h)  |
| GET    | `/report/:userId` | JWT (therapist) | Patient summary (no journal notes)             |
| GET    | `/streak`         | JWT (patient)   | Consecutive check-in streak                    |

## RabbitMQ events

| Event            | Routing key    | Exchange       |
| ---------------- | -------------- | -------------- |
| Concern          | `mood.concern` | `mindora.mood` |
| Streak milestone | `mood.streak`  | `mindora.mood` |

## Development

```bash
docker compose up -d postgres redis rabbitmq
npm run db:migrate
npm run db:seed
npm run db:seed:mood
npm run dev -w @mindora/mood-tracking-service
```

## Environment

| Variable                      | Purpose                           |
| ----------------------------- | --------------------------------- |
| `MOOD_JOURNAL_ENCRYPTION_KEY` | AES-256-GCM key for journal notes |
| `DATABASE_URL`                | PostgreSQL + TimescaleDB          |
| `REDIS_URL`                   | Rate limit + insights cache       |
| `RABBITMQ_URL`                | Event publishing                  |

## Tests

```bash
npm run test -w @mindora/mood-tracking-service
```
