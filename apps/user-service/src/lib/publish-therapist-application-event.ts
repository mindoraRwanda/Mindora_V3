import {
  THERAPIST_APPLICATION_EXCHANGE,
  type TherapistApplicationDomainEvent,
} from '@mindora/events';
import { publishToExchange } from '@mindora/queue';
import { config } from '../config.js';

export async function publishTherapistApplicationEvent(
  event: TherapistApplicationDomainEvent
): Promise<void> {
  await publishToExchange(
    THERAPIST_APPLICATION_EXCHANGE,
    event.eventType,
    event,
    config.rabbitUrl
  );
}
