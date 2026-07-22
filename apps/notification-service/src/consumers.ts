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

  // TODO[names]: replace these placeholders with real lookups once the User Service
  // exposes names on GET /api/v1/users/:id/preferences (or a dedicated profile endpoint).
  const patientName = 'Patient';
  const therapistName = '[name pending]';

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
    await sendPushNotification(recipientId, 'Appointment Cancelled', body);
    await sendEmailToUser(
      recipientId,
      'Your appointment has been cancelled',
      appointmentCancelledTemplate(
        patientName,
        therapistName,
        cancelled.slotStart,
        reason
      )
    );
    return;
  }

  if (event.eventType === 'appointment.confirmed') {
    const confirmed = event as AppointmentConfirmedEvent;
    await sendPushNotification(
      confirmed.patientId,
      'Appointment Confirmed',
      'Your appointment has been confirmed.'
    );
    await sendEmailToUser(
      confirmed.patientId,
      'Your appointment has been confirmed',
      appointmentConfirmedTemplate(
        patientName,
        therapistName,
        confirmed.slotStart
      )
    );
    return;
  }

  if (event.eventType === 'appointment.booked') {
    const booked = event as AppointmentBookedEvent;
    const typeLabel = sessionTypeLabel(booked.sessionType);
    await sendPushNotification(
      booked.patientId,
      'Appointment Booked',
      `${typeLabel} appointment scheduled.`
    );
    await sendEmailToUser(
      booked.patientId,
      'Your appointment has been booked',
      appointmentBookedTemplate(patientName, therapistName, booked.slotStart)
    );
  }
}

async function handleMessage(payload: unknown): Promise<void> {
  const event = payload as MessageReceivedEvent;
  const preview =
    event.content.length > 80
      ? `${event.content.slice(0, 77)}…`
      : event.content;
  await sendPushNotification(event.recipientId, 'New Message', preview);
}

async function handleCommunity(payload: unknown): Promise<void> {
  // Only reply events trigger a push; reported events are admin-facing
  if (!('replyId' in (payload as object))) return;
  const event = payload as CommunityReplyEvent;
  await sendPushNotification(event.postAuthorId, 'New Reply', event.excerpt);
}

async function handleAi(payload: unknown): Promise<void> {
  console.log(`[${EXCHANGES.AI}] received:`, JSON.stringify(payload));

  if ('crisisLevel' in (payload as object)) {
    const crisis = payload as { userId: string; crisisLevel: number };
    await sendSms(
      crisis.userId,
      `Mindora crisis alert: your recent session flagged a concern (level ${crisis.crisisLevel}). A counsellor will reach out shortly.`
    );
  }
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

  await subscribeWithRetry(
    EXCHANGES.MOOD,
    NOTIFICATION_QUEUES.MOOD,
    async (payload) => {
      console.log(`[${EXCHANGES.MOOD}] received:`, JSON.stringify(payload));
    }
  );

  await subscribeWithRetry(EXCHANGES.AI, NOTIFICATION_QUEUES.AI, handleAi);
}
