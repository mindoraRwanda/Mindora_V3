import { Resend } from 'resend';
import { logNotification } from './notificationLogger.js';

let resend: Resend | null = null;

// Resend sandbox sender — replace once a custom sending domain is verified.
const FROM = 'Mindora <onboarding@resend.dev>';

export function initResend(): void {
  const apiKey = process.env.RESEND_EMAIL_API_KEY;
  if (!apiKey) {
    console.warn(
      '[email] RESEND_EMAIL_API_KEY not set — email notifications disabled'
    );
    return;
  }
  resend = new Resend(apiKey);
  console.log('✓ Resend email client initialized');
}

// Calls the User Service preferences endpoint and reads the email field.
// Returns null when the service is unreachable or the field is absent.

async function getUserEmail(userId: string): Promise<string | null> {
  const base = process.env.USER_SERVICE_URL ?? 'http://localhost:3002';
  const url = `${base}/api/v1/users/${userId}/preferences`;
  console.log(
    `[email][DEBUG] getUserEmail → userId="${userId}" (${userId.length} chars) url="${url}"`
  );
  try {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
    },
  });
    if (!res.ok) {
      console.warn(
        `[email] User Service returned ${res.status} for user ${userId} — no email address`
      );
      return null;
    }
    const data = (await res.json()) as { email?: string };
    return data.email ?? null;
  } catch (err) {
    console.warn(`[email] User Service unreachable for user ${userId}:`, err);
    return null;
  }
}

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

// Returns whether an actual send attempt was made — false for the
// 'Resend not initialized' skip case, true once we've reached Resend
// (throws on a real delivery failure rather than returning false for that).
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<boolean> {
  console.log(`[email] sendEmail → to=${to} subject="${subject}"`);

  if (!resend) {
    console.warn(`[email] Resend not initialized — skipping email to ${to}`);
    return false;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: htmlBody,
  });

  if (error) {
    console.error(`[email] Resend delivery failed for ${to}:`, error);
    throw new Error(error.message);
  }

  console.log(`[email] Email delivered → to=${to} subject="${subject}"`);
  return true;
}

// Fetches the user's email from the User Service, then sends.
// Returns silently if no email is on file — same graceful pattern as sendPushNotification.
export async function sendEmailToUser(
  userId: string,
  subject: string,
  htmlBody: string,
  eventType = 'unknown'
): Promise<void> {
  const email = await getUserEmail(userId);
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
      status: sent ? 'delivered' : 'skipped',
      failureReason: sent ? undefined : 'Resend client not initialized',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logNotification({
      userId,
      eventType,
      channel: 'email',
      status: 'failed',
      failureReason: message,
    });
    throw err;
  }
}
