import { EXCHANGES } from '@mindora/events';
import type {
  AppointmentBookedEvent,
  AppointmentConfirmedEvent,
  AppointmentCancelledEvent,
  MessageReceivedEvent,
  CommunityReplyEvent,
} from '@mindora/events';
import { sendPushNotification } from './fcm.js';
import { subscribeWithRetry } from './retry.js';

const NOTIFICATION_QUEUES = {
  APPOINTMENTS: 'notification.appointments',
  MESSAGES: 'notification.messages',
  MOOD: 'notification.mood',
  AI: 'notification.ai',
  COMMUNITY: 'notification.community',
} as const;

export const SUBSCRIBED_EXCHANGES = Object.values(EXCHANGES);

async function handleAppointment(payload: unknown): Promise<void> {
  const event = payload as AppointmentBookedEvent | AppointmentConfirmedEvent | AppointmentCancelledEvent;

  if ('cancelledBy' in event) {
    const recipientId = event.cancelledBy === 'THERAPIST' ? event.patientId : event.therapistId;
    const body = event.reason ? `Reason: ${event.reason}` : 'Your appointment has been cancelled.';
    await sendPushNotification(recipientId, 'Appointment Cancelled', body);
  } else if ('confirmedAt' in event) {
    await sendPushNotification(event.patientId, 'Appointment Confirmed', 'Your appointment has been confirmed.');
  } else {
    const booked = event as AppointmentBookedEvent;
    const typeLabel = booked.type === 'EMERGENCY' ? 'Emergency' : booked.type === 'FOLLOW_UP' ? 'Follow-up' : 'Initial';
    await sendPushNotification(booked.patientId, 'Appointment Booked', `${typeLabel} appointment scheduled.`);
  }
}

async function handleMessage(payload: unknown): Promise<void> {
  const event = payload as MessageReceivedEvent;
  const preview = event.content.length > 80 ? `${event.content.slice(0, 77)}…` : event.content;
  await sendPushNotification(event.recipientId, 'New Message', preview);
}

async function handleCommunity(payload: unknown): Promise<void> {
  // Only reply events trigger a push; reported events are admin-facing
  if (!('replyId' in (payload as object))) return;
  const event = payload as CommunityReplyEvent;
  await sendPushNotification(event.postAuthorId, 'New Reply', event.excerpt);
}

export async function startConsumers(): Promise<void> {
  await subscribeWithRetry(
    EXCHANGES.APPOINTMENTS,
    NOTIFICATION_QUEUES.APPOINTMENTS,
    handleAppointment
  );

  await subscribeWithRetry(
    EXCHANGES.MESSAGES,
    NOTIFICATION_QUEUES.MESSAGES,
    handleMessage
  );

  await subscribeWithRetry(
    EXCHANGES.COMMUNITY,
    NOTIFICATION_QUEUES.COMMUNITY,
    handleCommunity
  );

  // Mood and AI events — log only, no push notification
  await subscribeWithRetry(
    EXCHANGES.MOOD,
    NOTIFICATION_QUEUES.MOOD,
    async (payload) => {
      console.log(`[${EXCHANGES.MOOD}] received:`, JSON.stringify(payload));
    }
  );

  await subscribeWithRetry(
    EXCHANGES.AI,
    NOTIFICATION_QUEUES.AI,
    async (payload) => {
      console.log(`[${EXCHANGES.AI}] received:`, JSON.stringify(payload));
    }
  );
}
