import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => {
  process.env.NODE_ENV = 'test';
  process.env.RESEND_EMAIL_API_KEY = 're_test_password_reset';
  process.env.RESEND_FROM_EMAIL = 'Mindora <no-reply@mindora.rw>';

  return {
    sendMock: vi.fn().mockResolvedValue({ error: null }),
  };
});

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: sendMock,
    },
  })),
}));

import { initResend, sendPasswordResetEmail } from './email.js';

describe('password reset email delivery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMock.mockResolvedValue({ error: null });
    initResend();
  });

  it('uses the Railway RESEND_FROM_EMAIL setting', async () => {
    const resetUrl =
      'https://app.mindora.rw/reset-password?token=one-time-token';

    await sendPasswordResetEmail('patient@example.com', resetUrl);

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Mindora <no-reply@mindora.rw>',
        to: 'patient@example.com',
        subject: 'Reset your Mindora password',
        html: expect.stringContaining(resetUrl),
      })
    );
  });

  it('surfaces Resend delivery errors instead of silently treating them as success', async () => {
    sendMock.mockResolvedValueOnce({
      error: { message: 'domain is not verified' },
    });

    const delivery = sendPasswordResetEmail(
      'patient@example.com',
      'https://app.mindora.rw/reset-password?token=one-time-token'
    );

    await expect(delivery).rejects.toThrow(
      'Resend delivery failed: domain is not verified'
    );
  });
});
