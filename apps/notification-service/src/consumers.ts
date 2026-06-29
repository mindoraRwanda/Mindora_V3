import { EXCHANGES } from '@mindora/events';
import type {
  AppointmentBookedEvent,
  AppointmentConfirmedEvent,
  AppointmentCancelledEvent,
  MessageReceivedEvent,
  CommunityReplyEvent,
} from '@mindora/events';
import { sendPushNotification } from './fcm.js';
import { sendEmailToUser } from './email.js';
import {
  appointmentBookedTemplate,
  appointmentConfirmedTemplate,
  appointmentCancelledTemplate,
} from './emailTemplates.js';
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

  // TODO[names]: replace these placeholders with real lookups once the User Service
  // exposes names on GET /api/v1/users/:id/preferences (or a dedicated profile endpoint).
  // patientName  → await getUserName(event.patientId)
  // therapistName → await getUserName(event.therapistId)
  const patientName = 'Patient';
  const therapistName = '[name pending]';

  if ('cancelledBy' in event) {
    const recipientId = event.cancelledBy === 'THERAPIST' ? event.patientId : event.therapistId;
    const body = event.reason ? `Reason: ${event.reason}` : 'Your appointment has been cancelled.';
    await sendPushNotification(recipientId, 'Appointment Cancelled', body);
    // NOTE: AppointmentCancelledEvent has no scheduledAt — passing occurredAt (cancellation time) instead.
    await sendEmailToUser(
      recipientId,
      'Your appointment has been cancelled',
      appointmentCancelledTemplate(patientName, therapistName, event.occurredAt, event.reason)
    );
  } else if ('confirmedAt' in event) {
    await sendPushNotification(event.patientId, 'Appointment Confirmed', 'Your appointment has been confirmed.');
    // NOTE: AppointmentConfirmedEvent has no scheduledAt — passing confirmedAt as the timestamp.
    await sendEmailToUser(
      event.patientId,
      'Your appointment has been confirmed',
      appointmentConfirmedTemplate(patientName, therapistName, event.confirmedAt)
    );
  } else {
    const booked = event as AppointmentBookedEvent;
    const typeLabel = booked.type === 'EMERGENCY' ? 'Emergency' : booked.type === 'FOLLOW_UP' ? 'Follow-up' : 'Initial';
    await sendPushNotification(booked.patientId, 'Appointment Booked', `${typeLabel} appointment scheduled.`);
    await sendEmailToUser(
      booked.patientId,
      'Your appointment has been booked',
      appointmentBookedTemplate(patientName, therapistName, booked.scheduledAt)
    );
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

  // Mood events — log only, no push notification.
  // TODO[email/mood-concern]: email notification is BLOCKED — two prerequisites are unresolved:
  //   1. No 'mood.concern' event type exists. MoodLoggedEvent fires on every mood entry; a
  //      concern threshold (e.g. rolling avg score < 4) needs to be defined and published as a
  //      distinct event upstream before this handler can conditionally trigger an email.
  //   2. The User Service has no patient→therapist assignment endpoint. therapistId only appears
  //      inside appointment event payloads; there is no standalone lookup for the assigned therapist.
  //   Flag both items to Theodora before wiring moodConcernTemplate here.
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
