import { subscribeToExchange } from '@mindora/queue';
import { EXCHANGES } from '@mindora/events';
import type {
  AppointmentBookedEvent,
  AppointmentCancelledEvent,
  MessageReceivedEvent,
  MoodLoggedEvent,
  AIUsageLoggedEvent,
  CommunityReportedEvent,
} from '@mindora/events';

const NOTIFICATION_QUEUES = {
  APPOINTMENTS: 'notification.appointments',
  MESSAGES: 'notification.messages',
  MOOD: 'notification.mood',
  AI: 'notification.ai',
  COMMUNITY: 'notification.community',
} as const;

export const SUBSCRIBED_EXCHANGES = Object.values(EXCHANGES);

export async function startConsumers(): Promise<void> {
  await subscribeToExchange(
    EXCHANGES.APPOINTMENTS,
    NOTIFICATION_QUEUES.APPOINTMENTS,
    (payload) => {
      const event = payload as AppointmentBookedEvent | AppointmentCancelledEvent;
      console.log(`[${EXCHANGES.APPOINTMENTS}] received:`, JSON.stringify(event));
    }
  );

  await subscribeToExchange(
    EXCHANGES.MESSAGES,
    NOTIFICATION_QUEUES.MESSAGES,
    (payload) => {
      const event = payload as MessageReceivedEvent;
      console.log(`[${EXCHANGES.MESSAGES}] received:`, JSON.stringify(event));
    }
  );

  await subscribeToExchange(
    EXCHANGES.MOOD,
    NOTIFICATION_QUEUES.MOOD,
    (payload) => {
      const event = payload as MoodLoggedEvent;
      console.log(`[${EXCHANGES.MOOD}] received:`, JSON.stringify(event));
    }
  );

  await subscribeToExchange(
    EXCHANGES.AI,
    NOTIFICATION_QUEUES.AI,
    (payload) => {
      const event = payload as AIUsageLoggedEvent;
      console.log(`[${EXCHANGES.AI}] received:`, JSON.stringify(event));
    }
  );

  await subscribeToExchange(
    EXCHANGES.COMMUNITY,
    NOTIFICATION_QUEUES.COMMUNITY,
    (payload) => {
      const event = payload as CommunityReportedEvent;
      console.log(`[${EXCHANGES.COMMUNITY}] received:`, JSON.stringify(event));
    }
  );
}
