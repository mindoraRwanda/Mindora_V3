import { EXCHANGES } from '@mindora/events';
import type {
  AppointmentBookedEvent,
  AppointmentConfirmedEvent,
  AppointmentCancelledEvent,
  MessageReceivedEvent,
  CommunityReplyEvent,
} from '@mindora/events';
import { sendPushNotification } from './fcm.js';
import { getUserName, sendEmailToUser } from './email.js';
import { sendSms } from './sms.js';
import { logNotification } from './notificationLogger.js';
import {
  getUserPreferences,
  isChannelEnabled,
  type UserPreferences,
} from './preferences.js';
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

// Checks the user's channel preference before sending; logs 'skipped' with a
// preference-specific reason and never calls the send function if disabled.
async function sendPushIfEnabled(
  userId: string,
  title: string,
  body: string,
  eventType: string,
  prefs: UserPreferences
): Promise<void> {
  if (!isChannelEnabled(prefs.notificationPreferences, 'push')) {
    await logNotification({
      userId,
      eventType,
      channel: 'push',
      status: 'skipped',
      failureReason: 'Push notifications disabled by user',
    });
    return;
  }
  await sendPushNotification(userId, title, body, prefs.fcmToken, eventType);
}

async function sendEmailIfEnabled(
  userId: string,
  subject: string,
  htmlBody: string,
  eventType: string,
  prefs: UserPreferences
): Promise<void> {
  if (!isChannelEnabled(prefs.notificationPreferences, 'email')) {
    await logNotification({
      userId,
      eventType,
      channel: 'email',
      status: 'skipped',
      failureReason: 'Email notifications disabled by user',
    });
    return;
  }
  await sendEmailToUser(userId, subject, htmlBody, prefs.email, eventType);
}

async function sendSmsIfEnabled(
  userId: string,
  body: string,
  eventType: string,
  prefs: UserPreferences
): Promise<void> {
  if (!isChannelEnabled(prefs.notificationPreferences, 'sms')) {
    await logNotification({
      userId,
      eventType,
      channel: 'sms',
      status: 'skipped',
      failureReason: 'SMS notifications disabled by user',
    });
    return;
  }
  // sendSms() itself also checks SMS_ENABLED and logs its own 'skipped' entry
  // when that feature flag is off — this gate is specifically the user's
  // per-channel preference, checked before sendSms's own flag check runs.
  await sendSms(userId, body, prefs.phoneNumber, eventType);
}

function sessionTypeLabel(
  sessionType: AppointmentBookedEvent['sessionType']
): string {
  switch (sessionType) {
    case 'VIDEO':
      return 'Video';
    case 'IN_PERSON':
      return 'In-person';
    case 'CHAT':
      return 'Chat';
    default:
      return 'Appointment';
  }
}

async function handleAppointment(payload: unknown): Promise<void> {
  const event = payload as
    | AppointmentBookedEvent
    | AppointmentConfirmedEvent
    | AppointmentCancelledEvent;

  const [patientName, therapistName] = await Promise.all([
    getUserName(event.patientId),
    getUserName(event.therapistId),
  ]).then(([patient, therapist]) => [
    patient ?? 'Patient',
    therapist ?? 'your therapist',
  ]);

  if (event.eventType === 'appointment.cancelled') {
    const cancelled = event as AppointmentCancelledEvent;
    const recipientId =
      cancelled.cancelledByUserId === cancelled.therapistId
        ? cancelled.patientId
        : cancelled.therapistId;
    const reason = cancelled.cancellationReason;
    const body = reason
      ? `Reason: ${reason}`
      : 'Your appointment has been cancelled.';
    const prefs = await getUserPreferences(recipientId);
    await sendPushIfEnabled(
      recipientId,
      'Appointment Cancelled',
      body,
      event.eventType,
      prefs
    );
    await sendEmailIfEnabled(
      recipientId,
      'Your appointment has been cancelled',
      appointmentCancelledTemplate(
        patientName,
        therapistName,
        cancelled.slotStart,
        reason
      ),
      event.eventType,
      prefs
    );
    return;
  }

  if (event.eventType === 'appointment.confirmed') {
    const confirmed = event as AppointmentConfirmedEvent;
    const prefs = await getUserPreferences(confirmed.patientId);
    await sendPushIfEnabled(
      confirmed.patientId,
      'Appointment Confirmed',
      'Your appointment has been confirmed.',
      event.eventType,
      prefs
    );
    await sendEmailIfEnabled(
      confirmed.patientId,
      'Your appointment has been confirmed',
      appointmentConfirmedTemplate(
        patientName,
        therapistName,
        confirmed.slotStart
      ),
      event.eventType,
      prefs
    );
    return;
  }

  if (event.eventType === 'appointment.booked') {
    const booked = event as AppointmentBookedEvent;
    const typeLabel = sessionTypeLabel(booked.sessionType);
    const prefs = await getUserPreferences(booked.patientId);
    await sendPushIfEnabled(
      booked.patientId,
      'Appointment Booked',
      `${typeLabel} appointment scheduled.`,
      event.eventType,
      prefs
    );
    await sendEmailIfEnabled(
      booked.patientId,
      'Your appointment has been booked',
      appointmentBookedTemplate(patientName, therapistName, booked.slotStart),
      event.eventType,
      prefs
    );
  }
}

async function handleMessage(payload: unknown): Promise<void> {
  const event = payload as MessageReceivedEvent;
  const preview =
    event.content.length > 80
      ? `${event.content.slice(0, 77)}…`
      : event.content;
  const prefs = await getUserPreferences(event.recipientId);
  await sendPushIfEnabled(
    event.recipientId,
    'New Message',
    preview,
    'message.received',
    prefs
  );
}

async function handleCommunity(payload: unknown): Promise<void> {
  // Only reply events trigger a push; reported events are admin-facing
  if (!('replyId' in (payload as object))) return;
  const event = payload as CommunityReplyEvent;
  const prefs = await getUserPreferences(event.postAuthorId);
  await sendPushIfEnabled(
    event.postAuthorId,
    'New Reply',
    event.excerpt,
    'community.reply',
    prefs
  );
}

async function handleAi(payload: unknown): Promise<void> {
  console.log(`[${EXCHANGES.AI}] received:`, JSON.stringify(payload));

  if ('crisisLevel' in (payload as object)) {
    const crisis = payload as { userId: string; crisisLevel: number };
    const prefs = await getUserPreferences(crisis.userId);
    await sendSmsIfEnabled(
      crisis.userId,
      `Mindora crisis alert: your recent session flagged a concern (level ${crisis.crisisLevel}). A counsellor will reach out shortly.`,
      'ai.crisis',
      prefs
    );
  }
}

export async function startConsumers(): Promise<void> {
  // 'topic' here because appointment-service/mood-tracking-service publish
  // via publishToExchange, which declares these two exchanges as 'topic'.
  // Left as default 'fanout' for MESSAGES/COMMUNITY/AI — messaging-service
  // doesn't publish to mindora.messages yet, and ai-integration-service
  // already declares mindora.ai as 'fanout' itself (see ai.routes.ts).
  await subscribeWithRetry(
    EXCHANGES.APPOINTMENTS,
    NOTIFICATION_QUEUES.APPOINTMENTS,
    handleAppointment,
    'topic'
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

  await subscribeWithRetry(
    EXCHANGES.MOOD,
    NOTIFICATION_QUEUES.MOOD,
    async (payload) => {
      console.log(`[${EXCHANGES.MOOD}] received:`, JSON.stringify(payload));
    },
    'topic'
  );

  await subscribeWithRetry(EXCHANGES.AI, NOTIFICATION_QUEUES.AI, handleAi);
}
