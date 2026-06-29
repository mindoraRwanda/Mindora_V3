import { Resend } from 'resend';

let resend: Resend | null = null;

// Resend sandbox sender — replace once a custom sending domain is verified.
const FROM = 'Mindora <onboarding@resend.dev>';

export function initResend(): void {
  const apiKey = process.env.RESEND_EMAIL_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_EMAIL_API_KEY not set — email notifications disabled');
    return;
  }
  resend = new Resend(apiKey);
  console.log('✓ Resend email client initialized');
}

// Calls the User Service preferences endpoint and reads the email field.
// Returns null when the service is unreachable or the field is absent.
// NOTE: the preferences endpoint currently returns only { fcmToken }.
// This will resolve to null until the User Service exposes { email } as well.
async function getUserEmail(userId: string): Promise<string | null> {
  const base = process.env.USER_SERVICE_URL ?? 'http://localhost:3002';
  const url = `${base}/api/v1/users/${userId}/preferences`;
  console.log(`[email][DEBUG] getUserEmail → userId="${userId}" (${userId.length} chars) url="${url}"`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[email] User Service returned ${res.status} for user ${userId} — no email address`);
      return null;
    }
    const data = (await res.json()) as { email?: string };
    return data.email ?? null;
  } catch (err) {
    console.warn(`[email] User Service unreachable for user ${userId}:`, err);
    return null;
  }
}

export async function sendEmail(to: string, subject: string, htmlBody: string): Promise<void> {
  console.log(`[email] sendEmail → to=${to} subject="${subject}"`);

  if (!resend) {
    console.warn(`[email] Resend not initialized — skipping email to ${to}`);
    return;
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
}

// Fetches the user's email from the User Service, then sends.
// Returns silently if no email is on file — same graceful pattern as sendPushNotification.
export async function sendEmailToUser(
  userId: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  const email = await getUserEmail(userId);
  if (!email) {
    console.warn(`[email] No email address for user ${userId} — skipping`);
    return;
  }
  await sendEmail(email, subject, htmlBody);
}
