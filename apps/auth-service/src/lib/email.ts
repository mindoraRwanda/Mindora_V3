import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_ADDRESS ?? 'Mindora <onboarding@resend.dev>';

let resend: Resend | null = null;

export function initResend(): void {
  const apiKey = process.env.RESEND_EMAIL_API_KEY;
  if (!apiKey) {
    console.warn(
      '[auth/email] RESEND_EMAIL_API_KEY not set — password reset emails disabled'
    );
    return;
  }
  resend = new Resend(apiKey);
  console.log('✓ Auth-service Resend client initialized');
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  if (!resend) {
    console.warn(
      `[auth/email] Resend not initialized — logging reset URL instead`
    );
    console.log(`[password-reset] Reset URL for ${to}: ${resetUrl}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your Mindora password',
    html: passwordResetTemplate(resetUrl),
  });

  if (error) {
    throw new Error(`Resend delivery failed: ${error.message}`);
  }

  console.log(`[auth/email] Password reset email sent to ${to}`);
}

function passwordResetTemplate(resetUrl: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1a202c;">
      <h1 style="color: #6b46c1; margin-bottom: 8px;">Reset your password</h1>
      <p style="color: #4a5568;">Hi there,</p>
      <p style="color: #4a5568;">We received a request to reset the password on your Mindora account. Click the button below to choose a new password:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #6b46c1; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Reset my password
        </a>
      </div>
      <p style="color: #718096; font-size: 0.9rem;">This link expires in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email — your password won't change.</p>
      <p style="color: #718096; font-size: 0.85rem;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color: #6b46c1; font-size: 0.85rem; word-break: break-all;">${resetUrl}</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #718096; font-size: 0.8rem; margin: 0;">Mindora Mental Health Platform</p>
    </div>
  `;
}
