import { Resend } from 'resend';

// Railway production configuration uses RESEND_FROM_EMAIL. Keep the older
// RESEND_FROM_ADDRESS name as a backwards-compatible alias for existing
// deployments. Never fall back to Resend's shared onboarding sender in
// production: Resend only permits test recipients with that sender.
const FROM =
  process.env.RESEND_FROM_EMAIL ??
  process.env.RESEND_FROM_ADDRESS ??
  (process.env.NODE_ENV === 'production'
    ? ''
    : 'Mindora <onboarding@resend.dev>');

let resend: Resend | null = null;

export function initResend(): void {
  const apiKey = process.env.RESEND_EMAIL_API_KEY;
  if (!apiKey) {
    console.warn(
      '[auth/email] RESEND_EMAIL_API_KEY not set — password reset emails disabled'
    );
    return;
  }

  if (!FROM) {
    console.error(
      '[auth/email] RESEND_FROM_EMAIL is not set — password reset emails disabled'
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
    // Never log resetUrl: it contains a live, single-use credential.
    throw new Error(
      '[auth/email] Resend is not initialized; check the API key and verified sender configuration'
    );
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

  console.log('[auth/email] Password reset email accepted by Resend');
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
