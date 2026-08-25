import {
  EXCHANGES,
  aiCrisisEventSchema,
  appointmentDomainEventSchema,
  communityDomainEventSchema,
  messageReceivedEventSchema,
  moodDomainEventSchema,
} from '@mindora/events';
import type {
  AppointmentBookedEvent,
  AppointmentConfirmedEvent,
  AppointmentCancelledEvent,
} from '@mindora/events';
import { sendPushNotification } from './fcm.js';
import { getUserName, sendEmailToUser } from './email.js';
// sendSms is intentionally not imported here any more — see the note above
// sessionTypeLabel(). Crisis alerts no longer message the patient, and
// clinician delivery will need its own preference-independent path.
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
import { InvalidEventPayloadError } from './errors.js';

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

// NOTE: a sendSmsIfEnabled() helper used to live here, called only by the
// ai.crisis handler to text the patient. It was removed with that call.
//
// Do not resurrect it for clinician alerting: it gated on the RECIPIENT's own
// notification preferences, which is right for a patient reminder and wrong
// for an on-call page — a clinician who muted SMS would silently stop
// receiving crisis alerts. Clinician delivery needs its own path that a user
// preference cannot switch off.

function sessionTypeLabel(
  sessionType: AppointmentBookedEvent['sessionType']
): string {
  switch (sessionType) {
    case 'VIDEO':
      return 'Video';
    case 'AUDIO':
      return 'Audio';
    case 'IN_PERSON':
      return 'In-person';
    case 'CHAT':
      return 'Chat';
    default:
      return 'Appointment';
  }
}

async function handleAppointment(payload: unknown): Promise<void> {
  const parsed = appointmentDomainEventSchema.safeParse(payload);
  if (!parsed.success) {
    throw new InvalidEventPayloadError(
      `Invalid appointment event: ${parsed.error.message}`,
      EXCHANGES.APPOINTMENTS
    );
  }
  const event = parsed.data as
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
  const parsed = messageReceivedEventSchema.safeParse(payload);
  if (!parsed.success) {
    throw new InvalidEventPayloadError(
      `Invalid message event: ${parsed.error.message}`,
      EXCHANGES.MESSAGES
    );
  }
  const event = parsed.data;
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
  const parsed = communityDomainEventSchema.safeParse(payload);
  if (!parsed.success) {
    throw new InvalidEventPayloadError(
      `Invalid community event: ${parsed.error.message}`,
      EXCHANGES.COMMUNITY
    );
  }
  // Only reply events trigger a push; reported events are admin-facing
  if (!('replyId' in parsed.data)) return;
  const event = parsed.data;
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

  const parsed = aiCrisisEventSchema.safeParse(payload);
  if (!parsed.success) {
    throw new InvalidEventPayloadError(
      `Invalid AI event: ${parsed.error.message}`,
      EXCHANGES.AI
    );
  }
  const crisis = parsed.data;

  // This used to SMS the PATIENT saying "a counsellor will reach out shortly"
  // — a promise nothing in the system kept, because no clinician was notified
  // by any path. It also duplicated the safety message the chat route already
  // shows in-app, and was gated behind SMS_ENABLED (default false), so in
  // practice a detected crisis produced no outbound contact at all.
  //
  // Clinician delivery is currently the in-app alert queue in Admin Service,
  // populated by its own consumer of this same event. Nothing is sent to the
  // patient from here.
  //
  // TODO: add push/SMS/email delivery TO THE ON-CALL CLINICIAN once an
  // escalation chain and roster exist (clinical review, Rulinda 2026-08).
  // Both channels are blocked on provisioning, not code: Resend still sends
  // from its shared test domain, and Africa's Talking is on a sandbox
  // username, so neither can reach a real clinician's inbox or handset yet.
  console.warn(
    `[${EXCHANGES.AI}] crisis level ${crisis.crisisLevel} for user ` +
      `${crisis.userId} — routed to the Admin alert queue. No out-of-band ` +
      'clinician notification is configured yet.'
  );
}

async function handleMood(payload: unknown): Promise<void> {
  console.log(`[${EXCHANGES.MOOD}] received:`, JSON.stringify(payload));
  const parsed = moodDomainEventSchema.safeParse(payload);
  if (!parsed.success) {
    throw new InvalidEventPayloadError(
      `Invalid mood event: ${parsed.error.message}`,
      EXCHANGES.MOOD
    );
  }
  // No push/email/SMS wired to mood events yet — validation only, for now.
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
    handleMood,
    'topic'
  );

  await subscribeWithRetry(EXCHANGES.AI, NOTIFICATION_QUEUES.AI, handleAi);
}
