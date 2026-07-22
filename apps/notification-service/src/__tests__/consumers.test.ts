import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EXCHANGES } from '@mindora/events';

const mocks = vi.hoisted(() => ({
  sendPushNotification: vi.fn(),
  subscribeWithRetry: vi.fn(),
}));

vi.mock('../fcm.js', () => ({
  sendPushNotification: mocks.sendPushNotification,
}));

vi.mock('../retry.js', () => ({
  subscribeWithRetry: mocks.subscribeWithRetry,
}));

import { startConsumers, SUBSCRIBED_EXCHANGES } from '../consumers.js';

type Handler = (payload: unknown) => Promise<void>;

function capturedHandler(exchange: string): Handler {
  const call = mocks.subscribeWithRetry.mock.calls.find(
    ([ex]) => ex === exchange
  );
  if (!call) throw new Error(`No handler captured for exchange: ${exchange}`);
  return call[2] as Handler;
}

describe('startConsumers — registration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.subscribeWithRetry.mockResolvedValue(undefined);
    await startConsumers();
  });

  it('subscribes to exactly 5 exchanges', () => {
    expect(mocks.subscribeWithRetry).toHaveBeenCalledTimes(5);
  });

  it('SUBSCRIBED_EXCHANGES contains all exchange names', () => {
    for (const exchange of Object.values(EXCHANGES)) {
      expect(SUBSCRIBED_EXCHANGES).toContain(exchange);
    }
  });

  it('registers each exchange with a dedicated queue name', () => {
    const registeredExchanges = mocks.subscribeWithRetry.mock.calls.map(
      ([ex]) => ex as string
    );
    expect(registeredExchanges).toContain(EXCHANGES.APPOINTMENTS);
    expect(registeredExchanges).toContain(EXCHANGES.MESSAGES);
    expect(registeredExchanges).toContain(EXCHANGES.COMMUNITY);
    expect(registeredExchanges).toContain(EXCHANGES.MOOD);
    expect(registeredExchanges).toContain(EXCHANGES.AI);
  });
});

describe('appointment handler', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.subscribeWithRetry.mockResolvedValue(undefined);
    await startConsumers();
  });

  it('notifies patient for a VIDEO appointment booked', async () => {
    await capturedHandler(EXCHANGES.APPOINTMENTS)({
      eventId: 'e1',
      occurredAt: '2024-01-01T00:00:00Z',
      schemaVersion: 1,
      eventType: 'appointment.booked',
      status: 'PENDING',
      appointmentId: 'appt-1',
      patientId: 'patient-1',
      therapistId: 'therapist-1',
      slotStart: '2024-02-01T10:00:00Z',
      slotEnd: '2024-02-01T11:00:00Z',
      sessionType: 'VIDEO',
    });
    expect(mocks.sendPushNotification).toHaveBeenCalledWith(
      'patient-1',
      'Appointment Booked',
      'Video appointment scheduled.'
    );
  });

  it('notifies patient for an IN_PERSON appointment booked', async () => {
    await capturedHandler(EXCHANGES.APPOINTMENTS)({
      eventId: 'e2',
      occurredAt: '2024-01-01T00:00:00Z',
      schemaVersion: 1,
      eventType: 'appointment.booked',
      status: 'PENDING',
      appointmentId: 'appt-2',
      patientId: 'patient-2',
      therapistId: 'therapist-2',
      slotStart: '2024-02-02T10:00:00Z',
      slotEnd: '2024-02-02T11:00:00Z',
      sessionType: 'IN_PERSON',
    });
    expect(mocks.sendPushNotification).toHaveBeenCalledWith(
      'patient-2',
      'Appointment Booked',
      'In-person appointment scheduled.'
    );
  });

  it('notifies patient for a CHAT appointment booked', async () => {
    await capturedHandler(EXCHANGES.APPOINTMENTS)({
      eventId: 'e3',
      occurredAt: '2024-01-01T00:00:00Z',
      schemaVersion: 1,
      eventType: 'appointment.booked',
      status: 'PENDING',
      appointmentId: 'appt-3',
      patientId: 'patient-3',
      therapistId: 'therapist-3',
      slotStart: '2024-02-03T10:00:00Z',
      slotEnd: '2024-02-03T11:00:00Z',
      sessionType: 'CHAT',
    });
    expect(mocks.sendPushNotification).toHaveBeenCalledWith(
      'patient-3',
      'Appointment Booked',
      'Chat appointment scheduled.'
    );
  });

  it('notifies patient when appointment is confirmed', async () => {
    await capturedHandler(EXCHANGES.APPOINTMENTS)({
      eventId: 'e4',
      occurredAt: '2024-01-01T00:00:00Z',
      schemaVersion: 1,
      eventType: 'appointment.confirmed',
      status: 'CONFIRMED',
      appointmentId: 'appt-4',
      patientId: 'patient-4',
      therapistId: 'therapist-4',
      slotStart: '2024-01-05T09:00:00Z',
      slotEnd: '2024-01-05T10:00:00Z',
      sessionType: 'VIDEO',
      confirmedByUserId: 'therapist-4',
    });
    expect(mocks.sendPushNotification).toHaveBeenCalledWith(
      'patient-4',
      'Appointment Confirmed',
      'Your appointment has been confirmed.'
    );
  });

  it('notifies patient when therapist cancels and includes reason', async () => {
    await capturedHandler(EXCHANGES.APPOINTMENTS)({
      eventId: 'e5',
      occurredAt: '2024-01-01T00:00:00Z',
      schemaVersion: 1,
      eventType: 'appointment.cancelled',
      status: 'CANCELLED',
      appointmentId: 'appt-5',
      patientId: 'patient-5',
      therapistId: 'therapist-5',
      slotStart: '2024-02-05T10:00:00Z',
      slotEnd: '2024-02-05T11:00:00Z',
      sessionType: 'VIDEO',
      cancelledByUserId: 'therapist-5',
      cancellationReason: 'Family emergency',
    });
    expect(mocks.sendPushNotification).toHaveBeenCalledWith(
      'patient-5',
      'Appointment Cancelled',
      'Reason: Family emergency'
    );
  });

  it('notifies therapist when patient cancels', async () => {
    await capturedHandler(EXCHANGES.APPOINTMENTS)({
      eventId: 'e6',
      occurredAt: '2024-01-01T00:00:00Z',
      schemaVersion: 1,
      eventType: 'appointment.cancelled',
      status: 'CANCELLED',
      appointmentId: 'appt-6',
      patientId: 'patient-6',
      therapistId: 'therapist-6',
      slotStart: '2024-02-06T10:00:00Z',
      slotEnd: '2024-02-06T11:00:00Z',
      sessionType: 'VIDEO',
      cancelledByUserId: 'patient-6',
      cancellationReason: 'Schedule conflict',
    });
    expect(mocks.sendPushNotification).toHaveBeenCalledWith(
      'therapist-6',
      'Appointment Cancelled',
      'Reason: Schedule conflict'
    );
  });

  it('uses default body text when cancellation has no reason', async () => {
    await capturedHandler(EXCHANGES.APPOINTMENTS)({
      eventId: 'e7',
      occurredAt: '2024-01-01T00:00:00Z',
      schemaVersion: 1,
      eventType: 'appointment.cancelled',
      status: 'CANCELLED',
      appointmentId: 'appt-7',
      patientId: 'patient-7',
      therapistId: 'therapist-7',
      slotStart: '2024-02-07T10:00:00Z',
      slotEnd: '2024-02-07T11:00:00Z',
      sessionType: 'VIDEO',
      cancelledByUserId: 'therapist-7',
      cancellationReason: '',
    });
    expect(mocks.sendPushNotification).toHaveBeenCalledWith(
      'patient-7',
      'Appointment Cancelled',
      'Your appointment has been cancelled.'
    );
  });
});

describe('message handler', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.subscribeWithRetry.mockResolvedValue(undefined);
    await startConsumers();
  });

  it('sends full content as preview when under 80 characters', async () => {
    const shortContent = 'Hey, how are you doing today?';
    await capturedHandler(EXCHANGES.MESSAGES)({
      eventId: 'e1',
      occurredAt: '2024-01-01T00:00:00Z',
      messageId: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'sender-1',
      recipientId: 'recipient-1',
      content: shortContent,
    });
    expect(mocks.sendPushNotification).toHaveBeenCalledWith(
      'recipient-1',
      'New Message',
      shortContent
    );
  });

  it('sends content exactly 80 characters without truncation', async () => {
    const exactContent = 'B'.repeat(80);
    await capturedHandler(EXCHANGES.MESSAGES)({
      eventId: 'e2',
      occurredAt: '2024-01-01T00:00:00Z',
      messageId: 'msg-2',
      conversationId: 'conv-2',
      senderId: 'sender-2',
      recipientId: 'recipient-2',
      content: exactContent,
    });
    expect(mocks.sendPushNotification).toHaveBeenCalledWith(
      'recipient-2',
      'New Message',
      exactContent
    );
  });

  it('truncates content over 80 characters to 77 chars + ellipsis', async () => {
    const longContent = 'A'.repeat(90);
    await capturedHandler(EXCHANGES.MESSAGES)({
      eventId: 'e3',
      occurredAt: '2024-01-01T00:00:00Z',
      messageId: 'msg-3',
      conversationId: 'conv-3',
      senderId: 'sender-3',
      recipientId: 'recipient-3',
      content: longContent,
    });
    expect(mocks.sendPushNotification).toHaveBeenCalledWith(
      'recipient-3',
      'New Message',
      `${'A'.repeat(77)}…`
    );
  });

  it('notifies the recipient, not the sender', async () => {
    await capturedHandler(EXCHANGES.MESSAGES)({
      eventId: 'e4',
      occurredAt: '2024-01-01T00:00:00Z',
      messageId: 'msg-4',
      conversationId: 'conv-4',
      senderId: 'alice',
      recipientId: 'bob',
      content: 'Hello Bob!',
    });
    expect(mocks.sendPushNotification).toHaveBeenCalledWith(
      'bob',
      'New Message',
      'Hello Bob!'
    );
    expect(mocks.sendPushNotification).not.toHaveBeenCalledWith(
      'alice',
      expect.anything(),
      expect.anything()
    );
  });
});

describe('community handler', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.subscribeWithRetry.mockResolvedValue(undefined);
    await startConsumers();
  });

  it('notifies the post author when a reply is posted', async () => {
    await capturedHandler(EXCHANGES.COMMUNITY)({
      eventId: 'e1',
      occurredAt: '2024-01-01T00:00:00Z',
      replyId: 'reply-1',
      postId: 'post-1',
      postAuthorId: 'post-author-1',
      replyAuthorId: 'commenter-1',
      excerpt: 'Great insight, I totally agree!',
    });
    expect(mocks.sendPushNotification).toHaveBeenCalledWith(
      'post-author-1',
      'New Reply',
      'Great insight, I totally agree!'
    );
  });

  it('does not send push for community report events (no replyId)', async () => {
    await capturedHandler(EXCHANGES.COMMUNITY)({
      eventId: 'e2',
      occurredAt: '2024-01-01T00:00:00Z',
      reportId: 'report-1',
      contentId: 'post-1',
      contentType: 'POST',
      reportedBy: 'user-1',
      reason: 'Spam',
      status: 'PENDING',
    });
    expect(mocks.sendPushNotification).not.toHaveBeenCalled();
  });
});

describe('mood and AI handlers', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.subscribeWithRetry.mockResolvedValue(undefined);
    await startConsumers();
  });

  it('does not send push for mood events — log only', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await capturedHandler(EXCHANGES.MOOD)({
      eventId: 'e1',
      occurredAt: '2024-01-01T00:00:00Z',
      userId: 'user-1',
      mood: 'HAPPY',
      score: 8,
    });
    expect(mocks.sendPushNotification).not.toHaveBeenCalled();
  });

  it('does not send push for AI events — log only', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await capturedHandler(EXCHANGES.AI)({
      eventId: 'e1',
      occurredAt: '2024-01-01T00:00:00Z',
      userId: 'user-1',
      tokensUsed: 150,
    });
    expect(mocks.sendPushNotification).not.toHaveBeenCalled();
  });
});
