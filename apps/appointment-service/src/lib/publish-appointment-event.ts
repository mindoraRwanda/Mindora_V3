import {
  APPOINTMENTS_EXCHANGE,
  type AppointmentDomainEvent,
} from '@mindora/events';
import { publishToExchange } from '@mindora/queue';

/**
 * Publish a typed appointment domain event to the mindora.appointments topic exchange.
 * Routing key equals event.eventType (e.g. appointment.booked).
 */
export async function publishAppointmentEvent(
  event: AppointmentDomainEvent,
  rabbitUrl?: string
): Promise<void> {
  await publishToExchange(
    APPOINTMENTS_EXCHANGE,
    event.eventType,
    event,
    rabbitUrl
  );
}
