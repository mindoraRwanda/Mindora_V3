# Appointment Service

Therapist scheduling, booking with double-booking prevention, and appointment lifecycle management.

## Prerequisites

- **Node.js 24+** (see root `.nvmrc`)

## Port

**3003** (direct) · **8000** via Kong (`/api/v1/appointments/*`)

## API documentation

- **OpenAPI spec:** [`docs/appointment-service.yaml`](../../docs/appointment-service.yaml)
- **Swagger UI:** `http://localhost:3003/docs`
- **Frontend codegen:** `http://localhost:3003/openapi.json` or `/openapi.yaml` (CORS enabled)

| Method | Path                         | Auth            | Description                                         |
| ------ | ---------------------------- | --------------- | --------------------------------------------------- |
| GET    | `/health`                    | No              | Health check                                        |
| GET    | `/availability/:therapistId` | JWT             | Available slots (excludes PENDING/CONFIRMED blocks) |
| POST   | `/`                          | JWT (patient)   | Book appointment — row lock, 409 on conflict        |
| GET    | `/mine`                      | JWT (patient)   | Paginated patient appointments (`?status=`)         |
| GET    | `/schedule`                  | JWT (therapist) | Therapist schedule (`?date=`)                       |
| PUT    | `/:id/confirm`               | JWT (therapist) | PENDING → CONFIRMED                                 |
| PUT    | `/:id/cancel`                | JWT             | Cancel with `{ cancellationReason }`                |
| PUT    | `/:id/complete`              | JWT (therapist) | Mark COMPLETED                                      |
| POST   | `/:id/rate`                  | JWT (patient)   | Rate 1–5 after COMPLETED (422 otherwise)            |

## RabbitMQ events

Publish typed events from `@mindora/events` via `src/lib/publish-appointment-event.ts`:

| Event     | Routing key             | Exchange               |
| --------- | ----------------------- | ---------------------- |
| Booked    | `appointment.booked`    | `mindora.appointments` |
| Confirmed | `appointment.confirmed` | `mindora.appointments` |
| Cancelled | `appointment.cancelled` | `mindora.appointments` |
| Completed | `appointment.completed` | `mindora.appointments` |

## Development

```bash
# Apply migration (once)
npm run db:migrate

# Seed auth users, profiles, then appointments
npm run db:seed
npm run db:seed:profiles
npm run db:seed:appointments

# Start service
npm run dev -w @mindora/appointment-service
```

Requires Postgres, Redis (JWT blacklist), and RabbitMQ (`docker compose up -d`).

## Docker

Build from the **repository root** (Node.js 24 Alpine):

```bash
docker build -f apps/appointment-service/Dockerfile -t mindora/appointment-service .
docker run --rm -p 3003:3003 --env-file .env mindora/appointment-service
```

## Seed data

Creates 3 appointments between `patient@test.mindora.local` and `therapist@test.mindora.local`:

- **PENDING** — tomorrow 10:00 UTC
- **CONFIRMED** — day after tomorrow 11:00 UTC
- **COMPLETED** — 7 days ago 14:00 UTC (rated 5)

## Tests

```bash
npm run test -w @mindora/appointment-service
```

Covers booking success, double-booking 409, confirm, cancel (patient/therapist), and rating (success + 422).
