import { Resend } from 'resend';
import { logNotification } from './notificationLogger.js';

let resend: Resend | null = null;
let brevoApiKey: string | null = null;
let fromAddress =
  process.env.RESEND_FROM_EMAIL?.trim() || 'Mindora <onboarding@resend.dev>';
let brevoFromEmail = '';
let brevoFromName = 'MINDORA';

function safeErrorCode(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    typeof error.name === 'string'
  )
    return error.name;
  return 'ProviderError';
}

/**
 * Initializes the configured transactional email provider.
 * Brevo is preferred when BREVO_API_KEY is present. Resend remains available
 * as a backwards-compatible fallback for existing deployments.
 */
export function initEmailProvider(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  brevoApiKey = process.env.BREVO_API_KEY?.trim() || null;
  brevoFromEmail = process.env.BREVO_FROM_EMAIL?.trim() || '';
  brevoFromName = process.env.BREVO_FROM_NAME?.trim() || 'MINDORA';

  const resendApiKey = process.env.RESEND_EMAIL_API_KEY?.trim();
  const configuredResendFrom = process.env.RESEND_FROM_EMAIL?.trim();

  if (brevoApiKey) {
    if (!brevoFromEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brevoFromEmail)) {
      throw new Error(
        'BREVO_FROM_EMAIL must be a valid verified sender email address'
      );
    }
    console.log('[email] Brevo transactional email client initialized');
    return;
  }

  if (isProduction && (!resendApiKey || !configuredResendFrom ||
      configuredResendFrom.includes('onboarding@resend.dev'))) {
    throw new Error(
      'Production email requires BREVO_API_KEY and BREVO_FROM_EMAIL, or a verified Resend configuration'
    );
  }

  if (!resendApiKey) {
    console.warn(
      '[email] No transactional email provider configured — email notifications are disabled'
    );
    return;
  }

  fromAddress = configuredResendFrom || fromAddress;
  resend = new Resend(resendApiKey);
  console.log('[email] Resend email client initialized');
}

// Backwards-compatible export for any other module still using the old name.
export const initResend = initEmailProvider;

// Calls the same preferences endpoint for a display name, used to personalize
// appointment emails instead of the generic 'Patient'/'[name pending]' role
// labels. Returns null if the user hasn't set one (or the service call fails)
// — callers fall back to a role-based label in that case.
export async function getUserName(userId: string): Promise<string | null> {
  const base = process.env.USER_SERVICE_URL ?? 'http://localhost:3002';
  const url = `${base}/api/v1/users/${userId}/preferences`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
      },
    });
    if (!res.ok) {
      console.warn(
        `[email] User Service returned ${res.status} for user ${userId} — no userName`
      );
      return null;
    }
    const data = (await res.json()) as { userName?: string };
    return data.userName ?? null;
  } catch (err) {
    console.warn(`[email] User Service unreachable for user ${userId}:`, err);
    return null;
  }
}

// Returns whether an actual provider accepted the send request. This does not
// claim final delivery to the recipient's mailbox.
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<boolean> {
  console.log(
    `[email] sendEmail requested (recipient redacted; subject="${subject}")`
  );

  if (brevoApiKey) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        sender: { name: brevoFromName, email: brevoFromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: htmlBody,
      }),
    });

    if (!response.ok) {
      // Do not log provider response bodies: they may contain personal data.
      console.error('[email] Brevo provider request failed:', response.status);
      throw new Error('EMAIL_PROVIDER_SEND_FAILED');
    }

    console.log(
      '[email] Brevo accepted the email request; final mailbox delivery is not confirmed'
    );
    return true;
  }

  if (!resend) {
    console.warn('[email] No email provider initialized — email send skipped');
    return false;
  }

  const { error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    html: htmlBody,
  });

  if (error) {
    console.error(
      '[email] Resend provider request failed:',
      safeErrorCode(error)
    );
    throw new Error('EMAIL_PROVIDER_SEND_FAILED');
  }

  console.log(
    '[email] Resend accepted the email request; final mailbox delivery is not confirmed'
  );
  return true;
}

// Sends to a pre-fetched email address (resolved by the caller via
// getUserPreferences() — see preferences.ts). Returns silently (after
// logging) if no email is on file, same graceful pattern as sendPushNotification.
export async function sendEmailToUser(
  userId: string,
  subject: string,
  htmlBody: string,
  email: string | null,
  eventType = 'unknown'
): Promise<void> {
  if (!email) {
    console.warn(`[email] No email address for user ${userId} — skipping`);
    await logNotification({
      userId,
      eventType,
      channel: 'email',
      status: 'skipped',
      failureReason: 'No email address on file',
    });
    return;
  }

  try {
    const sent = await sendEmail(email, subject, htmlBody);
    await logNotification({
      userId,
      eventType,
      channel: 'email',
      status: sent ? 'accepted' : 'skipped',
      failureReason: sent ? undefined : 'No email provider initialized',
    });
  } catch (err) {
    const failureCode = safeErrorCode(err);
    await logNotification({
      userId,
      eventType,
      channel: 'email',
      status: 'failed',
      failureReason: failureCode,
    });
    throw err;
  }
}
