# @mindora/events

Shared TypeScript definitions for RabbitMQ domain event payloads across Mindora microservices.

## Appointment events (Sprint 3)

| Routing key | Type | When published |
|-------------|------|----------------|
| `appointment.booked` | `AppointmentBookedEvent` | Patient books a slot (POST `/appointments`) |
| `appointment.confirmed` | `AppointmentConfirmedEvent` | Therapist confirms PENDING appointment |
| `appointment.cancelled` | `AppointmentCancelledEvent` | Patient or therapist cancels |
| `appointment.completed` | `AppointmentCompletedEvent` | Therapist marks session complete |

**Exchange:** `mindora.appointments` (topic, durable)

## Usage in appointment-service

```typescript
import { createAppointmentBookedEvent } from '@mindora/events';
import { publishAppointmentEvent } from './lib/publish-appointment-event.js';

const event = createAppointmentBookedEvent({
  appointmentId: appointment.id,
  patientId: appointment.patientId,
  therapistId: appointment.therapistId,
  slotStart: appointment.slotStart.toISOString(),
  slotEnd: appointment.slotEnd.toISOString(),
  sessionType: appointment.sessionType,
});

await publishAppointmentEvent(event);
```

## Other domains

Messaging, mood, and notification event types will be added by their owning services in later sprints. Appointment publishers must import from this package — do not duplicate payload shapes locally.
