import { Resend } from 'resend';
import { logNotification } from './notificationLogger.js';

let resend: Resend | null = null;

// Railway production uses RESEND_FROM_EMAIL. Keep the legacy alias for
// compatibility, but never use Resend's shared onboarding sender in production.
const FROM =
  process.env.RESEND_FROM_EMAIL ??
  process.env.RESEND_FROM_ADDRESS ??
  (process.env.NODE_ENV === 'production'
    ? ''
    : 'Mindora <onboarding@resend.dev>');

export function initResend(): void {
  const apiKey = process.env.RESEND_EMAIL_API_KEY;
  if (!apiKey) {
    console.warn(
      '[email] RESEND_EMAIL_API_KEY not set — email notifications disabled'
    );
    return;
  }

  if (!FROM) {
    console.error(
      '[email] RESEND_FROM_EMAIL is not set — email notifications disabled'
    );
    return;
  }

  resend = new Resend(apiKey);
  console.log('✓ Resend email client initialized');
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
  if (!resend) {
    console.warn('[email] Resend not initialized — skipping email');
    return false;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: htmlBody,
  });

  if (error) {
    console.error('[email] Resend delivery failed:', error.message);
    throw new Error(error.message);
  }

  console.log('[email] Email accepted by Resend');
  return true;
}

export interface CrisisAlertEmailInput {
  eventId: string;
  userId: string;
  sessionId: string | null;
  crisisLevel: number;
  occurredAt: string;
  messageExcerpt?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Sends the minimum crisis-event context to an explicit clinical escalation
// list. The message excerpt is withheld unless the clinical owner enables it.
export async function sendCrisisAlertEmail(
  event: CrisisAlertEmailInput
): Promise<{ attempted: number; sent: number; failed: number }> {
  const recipients = (process.env.CRISIS_ALERT_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    console.error('[crisis-alert] CRISIS_ALERT_EMAILS is not configured');
    return { attempted: 0, sent: 0, failed: 0 };
  }

  const includeExcerpt = process.env.CRISIS_ALERT_INCLUDE_MESSAGE === 'true';
  const excerpt =
    includeExcerpt && event.messageExcerpt
      ? escapeHtml(event.messageExcerpt.slice(0, 1500))
      : 'Message excerpt withheld; review the authorized clinical record.';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
      <h1 style="color: #991b1b;">Mindora crisis escalation</h1>
      <p>A high-priority safety event requires prompt review by the clinical team.</p>
      <dl>
        <dt><strong>Crisis level</strong></dt><dd>${event.crisisLevel}</dd>
        <dt><strong>User ID</strong></dt><dd>${escapeHtml(event.userId)}</dd>
        <dt><strong>Session ID</strong></dt><dd>${escapeHtml(event.sessionId ?? 'Not provided')}</dd>
        <dt><strong>Occurred at</strong></dt><dd>${escapeHtml(event.occurredAt)}</dd>
        <dt><strong>Event ID</strong></dt><dd>${escapeHtml(event.eventId)}</dd>
      </dl>
      <h2>Message excerpt</h2>
      <blockquote style="white-space: pre-wrap; border-left: 3px solid #991b1b; padding-left: 12px;">${excerpt}</blockquote>
      <p>Follow the approved MINDORA crisis-response protocol. This alert is not a diagnosis.</p>
    </div>
  `;

  const results = await Promise.allSettled(
    recipients.map((to) =>
      sendEmail(
        to,
        `[Mindora] Crisis escalation — level ${event.crisisLevel}`,
        html
      )
    )
  );
  const sent = results.filter(
    (result) => result.status === 'fulfilled' && result.value
  ).length;
  const failed = results.length - sent;

  console.log(
    `[crisis-alert] email attempts=${results.length}, accepted=${sent}, ` +
      `failed=${failed}`
  );

  return { attempted: results.length, sent, failed };
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
