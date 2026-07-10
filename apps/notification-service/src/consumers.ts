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
    await sendPushNotification(
      recipientId,
      'Appointment Cancelled',
      body,
      event.eventType
    );
    await sendEmailToUser(
      recipientId,
      'Your appointment has been cancelled',
      appointmentCancelledTemplate(
        patientName,
        therapistName,
        cancelled.slotStart,
        reason
      ),
      event.eventType
    );
    return;
  }

  if (event.eventType === 'appointment.confirmed') {
    const confirmed = event as AppointmentConfirmedEvent;
    await sendPushNotification(
      confirmed.patientId,
      'Appointment Confirmed',
      'Your appointment has been confirmed.',
      event.eventType
    );
    await sendEmailToUser(
      confirmed.patientId,
      'Your appointment has been confirmed',
      appointmentConfirmedTemplate(
        patientName,
        therapistName,
        confirmed.slotStart
      ),
      event.eventType
    );
    return;
  }

  if (event.eventType === 'appointment.booked') {
    const booked = event as AppointmentBookedEvent;
    const typeLabel = sessionTypeLabel(booked.sessionType);
    await sendPushNotification(
      booked.patientId,
      'Appointment Booked',
      `${typeLabel} appointment scheduled.`,
      event.eventType
    );
    await sendEmailToUser(
      booked.patientId,
      'Your appointment has been booked',
      appointmentBookedTemplate(patientName, therapistName, booked.slotStart),
      event.eventType
    );
  }
}

async function handleMessage(payload: unknown): Promise<void> {
  const event = payload as MessageReceivedEvent;
  const preview =
    event.content.length > 80
      ? `${event.content.slice(0, 77)}…`
      : event.content;
  await sendPushNotification(
    event.recipientId,
    'New Message',
    preview,
    'message.received'
  );
}

async function handleCommunity(payload: unknown): Promise<void> {
  // Only reply events trigger a push; reported events are admin-facing
  if (!('replyId' in (payload as object))) return;
  const event = payload as CommunityReplyEvent;
  await sendPushNotification(
    event.postAuthorId,
    'New Reply',
    event.excerpt,
    'community.reply'
  );
}

async function handleAi(payload: unknown): Promise<void> {
  console.log(`[${EXCHANGES.AI}] received:`, JSON.stringify(payload));

  if ('crisisLevel' in (payload as object)) {
    const crisis = payload as { userId: string; crisisLevel: number };
    // sendSms() itself checks SMS_ENABLED and logs a 'skipped' entry when
    // disabled — always call it so every attempt gets logged consistently.
    await sendSms(
      crisis.userId,
      `Mindora crisis alert: your recent session flagged a concern (level ${crisis.crisisLevel}). A counsellor will reach out shortly.`,
      'ai.crisis'
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
