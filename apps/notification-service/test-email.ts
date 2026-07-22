// Standalone manual test — sends one email per template to verify Resend delivery.
// Run from the notification-service directory:
//   npx tsx test-email.ts
import './src/env.js';
import { initResend, sendEmail } from './src/email.js';
import {
  appointmentBookedTemplate,
  appointmentConfirmedTemplate,
  appointmentCancelledTemplate,
  moodConcernTemplate,
} from './src/emailTemplates.js';

const TO = 'g.njunge@alustudent.com';

initResend();

await sendEmail(
  TO,
  '[Test] Appointment Booked',
  appointmentBookedTemplate(
    'Jane Doe',
    'Dr. Sarah Smith',
    '2026-07-15T10:00:00Z'
  )
);
console.log('✓ Sent: appointmentBookedTemplate');

await sendEmail(
  TO,
  '[Test] Appointment Confirmed',
  appointmentConfirmedTemplate(
    'Jane Doe',
    'Dr. Sarah Smith',
    '2026-07-15T10:00:00Z'
  )
);
console.log('✓ Sent: appointmentConfirmedTemplate');

await sendEmail(
  TO,
  '[Test] Appointment Cancelled',
  appointmentCancelledTemplate(
    'Jane Doe',
    'Dr. Sarah Smith',
    '2026-07-14T09:00:00Z',
    'Emergency scheduling conflict'
  )
);
console.log('✓ Sent: appointmentCancelledTemplate');

await sendEmail(
  TO,
  '[Test] Mood Concern Alert',
  moodConcernTemplate('Jane Doe', 'Dr. Sarah Smith', 3.2)
);
console.log('✓ Sent: moodConcernTemplate');

console.log(`\nAll 4 test emails sent → check inbox at ${TO}`);
