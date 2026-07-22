const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 32px 24px;
  color: #1a202c;
`;

const DIVIDER = `<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />`;
const FOOTER = `<p style="color: #718096; font-size: 0.8rem; margin: 0;">Mindora Mental Health Platform</p>`;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return iso;
  }
}

export function appointmentBookedTemplate(
  patientName: string,
  therapistName: string,
  scheduledAt: string
): string {
  return `
    <div style="${BASE_STYLES}">
      <h1 style="color: #2b6cb0; margin-bottom: 8px;">Appointment Booked</h1>
      <p style="margin-top: 0; color: #4a5568;">Hi ${patientName},</p>
      <p>Your appointment with <strong>Your therapist, ${therapistName}</strong> has been booked and is pending confirmation.</p>
      <table style="background: #ebf8ff; border-radius: 8px; padding: 16px 20px; width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; color: #4a5568; font-size: 0.875rem; white-space: nowrap; width: 140px;">Date &amp; Time</td>
          <td style="padding: 4px 0; font-weight: 600;">${formatDate(scheduledAt)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #4a5568; font-size: 0.875rem;">Therapist</td>
          <td style="padding: 4px 0; font-weight: 600;">Your therapist, ${therapistName}</td>
        </tr>
      </table>
      <p style="color: #4a5568; font-size: 0.9rem;">You will receive a confirmation email once your therapist accepts the appointment.</p>
      ${DIVIDER}
      ${FOOTER}
    </div>
  `;
}

export function appointmentConfirmedTemplate(
  patientName: string,
  therapistName: string,
  scheduledAt: string
): string {
  return `
    <div style="${BASE_STYLES}">
      <h1 style="color: #276749; margin-bottom: 8px;">Appointment Confirmed ✓</h1>
      <p style="margin-top: 0; color: #4a5568;">Hi ${patientName},</p>
      <p>Great news! Your appointment with <strong>Your therapist, ${therapistName}</strong> has been confirmed.</p>
      <table style="background: #f0fff4; border-radius: 8px; padding: 16px 20px; width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; color: #4a5568; font-size: 0.875rem; white-space: nowrap; width: 140px;">Confirmed On</td>
          <td style="padding: 4px 0; font-weight: 600;">${formatDate(scheduledAt)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #4a5568; font-size: 0.875rem;">Therapist</td>
          <td style="padding: 4px 0; font-weight: 600;">Your therapist, ${therapistName}</td>
        </tr>
      </table>
      <p style="color: #4a5568; font-size: 0.9rem;">Please make sure you are available at the scheduled time. If anything changes, reach out through the app.</p>
      ${DIVIDER}
      ${FOOTER}
    </div>
  `;
}

export function appointmentCancelledTemplate(
  patientName: string,
  therapistName: string,
  scheduledAt: string,
  reason?: string
): string {
  const reasonRow = reason
    ? `<tr>
        <td style="padding: 4px 0; color: #4a5568; font-size: 0.875rem; white-space: nowrap; width: 140px;">Reason</td>
        <td style="padding: 4px 0;">${reason}</td>
      </tr>`
    : '';
  const dateRow = scheduledAt
    ? `<tr>
        <td style="padding: 4px 0; color: #4a5568; font-size: 0.875rem; white-space: nowrap; width: 140px;">Cancelled On</td>
        <td style="padding: 4px 0; font-weight: 600;">${formatDate(scheduledAt)}</td>
      </tr>`
    : '';
  return `
    <div style="${BASE_STYLES}">
      <h1 style="color: #c53030; margin-bottom: 8px;">Appointment Cancelled</h1>
      <p style="margin-top: 0; color: #4a5568;">Hi ${patientName},</p>
      <p>Your appointment with <strong>Your therapist, ${therapistName}</strong> has been cancelled.</p>
      <table style="background: #fff5f5; border-radius: 8px; padding: 16px 20px; width: 100%; border-collapse: collapse;">
        ${dateRow}
        ${reasonRow}
      </table>
      <p style="color: #4a5568; font-size: 0.9rem;">You can book a new appointment through the app at any time.</p>
      ${DIVIDER}
      ${FOOTER}
    </div>
  `;
}

// TODO[email/mood-concern] — BLOCKED: two prerequisites are unresolved.
//   1. No 'mood.concern' event type exists. MoodLoggedEvent fires on every mood entry.
//      A concern threshold (e.g. rolling average < 4) needs to be defined and emitted
//      as a distinct event upstream before this template is triggered in production.
//   2. The User Service has no patient→therapist assignment endpoint.
//      The therapistId is only present inside appointment event payloads; there is no
//      standalone "get assigned therapist for patient" query.
//   Flag both to Theodora before wiring the mood concern email in consumers.ts.
export function moodConcernTemplate(
  patientName: string,
  therapistName: string,
  avgMoodScore: number
): string {
  const scoreColour = avgMoodScore <= 3 ? '#c53030' : '#d69e2e';
  return `
    <div style="${BASE_STYLES}">
      <h1 style="color: ${scoreColour}; margin-bottom: 8px;">Patient Mood Alert</h1>
      <p style="margin-top: 0; color: #4a5568;">Hi ${therapistName},</p>
      <p>Your patient <strong>${patientName}</strong> has been logging consistently low mood scores that may need your attention.</p>
      <table style="background: #fffaf0; border-radius: 8px; padding: 16px 20px; width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; color: #4a5568; font-size: 0.875rem; white-space: nowrap; width: 180px;">Patient</td>
          <td style="padding: 4px 0; font-weight: 600;">${patientName}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #4a5568; font-size: 0.875rem;">Average Mood Score</td>
          <td style="padding: 4px 0; font-weight: 700; color: ${scoreColour};">${avgMoodScore.toFixed(1)} / 10</td>
        </tr>
      </table>
      <p style="color: #4a5568; font-size: 0.9rem;">Consider reaching out to ${patientName} or scheduling a follow-up session.</p>
      ${DIVIDER}
      ${FOOTER}
    </div>
  `;
}
