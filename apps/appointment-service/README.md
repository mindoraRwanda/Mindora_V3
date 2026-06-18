# Appointment Service

Therapist scheduling, booking with double-booking prevention, and appointment lifecycle management.

## Port

**3003** (direct) · **8000** via Kong (`/api/v1/appointments/*`)

## API documentation

Full OpenAPI 3 spec: [`docs/appointment-service.yaml`](../../docs/appointment-service.yaml)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/availability/:therapistId` | JWT | Available slots (excludes PENDING/CONFIRMED blocks) |
| POST | `/` | JWT (patient) | Book appointment — row lock, 409 on conflict |
| GET | `/mine` | JWT (patient) | Paginated patient appointments (`?status=`) |
| GET | `/schedule` | JWT (therapist) | Therapist schedule (`?date=`) |
| PUT | `/:id/confirm` | JWT (therapist) | PENDING → CONFIRMED |
| PUT | `/:id/cancel` | JWT | Cancel with `{ cancellationReason }` |
| PUT | `/:id/complete` | JWT (therapist) | Mark COMPLETED |
| POST | `/:id/rate` | JWT (patient) | Rate 1–5 after COMPLETED (422 otherwise) |

> **Note:** Endpoints are being implemented in Sprint 3. The OpenAPI spec is the contract; implement routes to match.

## RabbitMQ events

Publish typed events from `@mindora/events` via `src/lib/publish-appointment-event.ts`:

| Event | Routing key | Exchange |
|-------|-------------|----------|
| Booked | `appointment.booked` | `mindora.appointments` |
| Confirmed | `appointment.confirmed` | `mindora.appointments` |
| Cancelled | `appointment.cancelled` | `mindora.appointments` |
| Completed | `appointment.completed` | `mindora.appointments` |

```typescript
import { createAppointmentBookedEvent } from '@mindora/events';
import { publishAppointmentEvent } from './lib/publish-appointment-event.js';

await publishAppointmentEvent(
  createAppointmentBookedEvent({ /* ... */ })
);
```

## Development

```bash
npm run dev -w @mindora/appointment-service
```

Requires Postgres, Redis (JWT blacklist), and RabbitMQ (`docker compose up -d`).

## Swagger UI (planned)

When all routes are implemented, serve Swagger UI at `/docs` using `docs/appointment-service.yaml`.
