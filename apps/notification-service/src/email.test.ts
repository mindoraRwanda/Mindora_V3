import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => {
  process.env.NODE_ENV = 'test';
  process.env.RESEND_EMAIL_API_KEY = 're_test_crisis_alert';
  process.env.RESEND_FROM_EMAIL = 'Mindora <no-reply@mindora.rw>';

  return {
    sendMock: vi.fn().mockResolvedValue({ error: null }),
  };
});

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { initResend, sendCrisisAlertEmail } from './email.js';

describe('clinical crisis email alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMock.mockResolvedValue({ error: null });
    process.env.CRISIS_ALERT_EMAILS =
      'clinical-team@mindora.rw, on-call@mindora.rw';
    delete process.env.CRISIS_ALERT_INCLUDE_MESSAGE;
    initResend();
  });

  it('sends alert metadata to every configured clinical recipient', async () => {
    const result = await sendCrisisAlertEmail({
      eventId: '11111111-1111-4111-8111-111111111111',
      userId: '22222222-2222-4222-8222-222222222222',
      sessionId: 'session-123',
      crisisLevel: 5,
      occurredAt: '2026-11-25T12:00:00.000Z',
      messageExcerpt: 'I might hurt myself tonight',
    });

    expect(result).toEqual({ attempted: 2, sent: 2, failed: 0 });
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'clinical-team@mindora.rw',
        subject: '[Mindora] Crisis escalation — level 5',
        html: expect.stringContaining('session-123'),
      })
    );
    expect(sendMock.mock.calls[0]?.[0].html).not.toContain(
      'I might hurt myself tonight'
    );
  });

  it('includes only an escaped bounded excerpt after explicit clinical approval', async () => {
    process.env.CRISIS_ALERT_INCLUDE_MESSAGE = 'true';

    const result = await sendCrisisAlertEmail({
      eventId: '11111111-1111-4111-8111-111111111111',
      userId: '22222222-2222-4222-8222-222222222222',
      sessionId: null,
      crisisLevel: 5,
      occurredAt: '2026-11-25T12:00:00.000Z',
      messageExcerpt: '<script>alert("x")</script>',
    });

    expect(result.sent).toBe(2);
    expect(sendMock.mock.calls[0]?.[0].html).toContain(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
    expect(sendMock.mock.calls[0]?.[0].html).not.toContain('<script>');
  });

  it('does not send when the clinical recipient list is empty', async () => {
    process.env.CRISIS_ALERT_EMAILS = '';

    const result = await sendCrisisAlertEmail({
      eventId: '11111111-1111-4111-8111-111111111111',
      userId: '22222222-2222-4222-8222-222222222222',
      sessionId: null,
      crisisLevel: 5,
      occurredAt: '2026-11-25T12:00:00.000Z',
    });

    expect(result).toEqual({ attempted: 0, sent: 0, failed: 0 });
    expect(sendMock).not.toHaveBeenCalled();
  });
});
