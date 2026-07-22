import { MOOD_EXCHANGE, type MoodDomainEvent } from '@mindora/events';
import { publishToExchange } from '@mindora/queue';
import { config } from '../config.js';

export async function publishMoodEvent(
  event: MoodDomainEvent,
  rabbitUrl?: string
): Promise<void> {
  await publishToExchange(
    MOOD_EXCHANGE,
    event.eventType,
    event,
    rabbitUrl ?? config.rabbitUrl
  );
}
