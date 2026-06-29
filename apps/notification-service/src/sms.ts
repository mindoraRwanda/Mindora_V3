import { createRequire } from 'node:module';
import { FatalNotificationError } from './errors.js';

const require = createRequire(import.meta.url);

interface SMSMessageData {
  Message: string;
  Recipients: {
    statusCode: number;
    number: string;
    // AT returns the code name as a string ("Sent", "Queued", "InvalidPhoneNumber", etc.)
    // — NOT "fulfilled"/"failed". Use statusCode for all outcome decisions.
    status: string;
    cost: string;
    messageId: string;
  }[];
}

// AT statusCodes 100–102 all represent successful delivery or acceptance.
// 100 Processed, 101 Sent, 102 Queued
const AT_SUCCESS_CODES = new Set([100, 101, 102]);

// Africa's Talking status codes that will never succeed on retry.
// 402 InvalidSenderId      — account-level sender ID misconfiguration; every send fails until admin fixes it
// 403 InvalidPhoneNumber   — number format is permanently malformed
// 404 UnsupportedNumberType — number type (landline, data-only SIM) cannot receive SMS
// 406 UserInBlacklist      — recipient opted out (DND/GDPR); must not attempt re-send
const FATAL_AT_CODES = new Set([402, 403, 404, 406]);

const FATAL_AT_CODE_LABELS: Record<number, string> = {
  402: 'InvalidSenderId',
  403: 'InvalidPhoneNumber',
  404: 'UnsupportedNumberType',
  406: 'UserInBlacklist',
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const makeAfricasTalking = require('africastalking') as (opts: {
  apiKey: string;
  username: string;
}) => {
  SMS: {
    send(opts: {
      to: string[];
      message: string;
      from?: string;
    }): Promise<{ SMSMessageData: SMSMessageData }>;
  };
};

let smsClient: ReturnType<typeof makeAfricasTalking>['SMS'] | null = null;

export function initSms(): void {
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME;
  if (!apiKey || !username) {
    console.warn('[sms] AT_API_KEY or AT_USERNAME not set — SMS notifications disabled');
    return;
  }
  smsClient = makeAfricasTalking({ apiKey, username }).SMS;
  console.log('✓ Africa\'s Talking SMS client initialized');
}

async function getUserPhone(userId: string): Promise<string | null> {
  const base = process.env.USER_SERVICE_URL ?? 'http://localhost:3002';
  try {
    const res = await fetch(`${base}/api/v1/users/${userId}/preferences`);
    if (!res.ok) {
      console.warn(`[sms] User Service returned ${res.status} for user ${userId} — no phone number`);
      return null;
    }
    const data = (await res.json()) as { phoneNumber?: string };
    return data.phoneNumber ?? null;
  } catch (err) {
    console.warn(`[sms] User Service unreachable for user ${userId}:`, err);
    return null;
  }
}

/**
 * Sends an SMS to the user identified by `to`.
 * Looks up the user's phone number via the User Service preference endpoint.
 * Throws `FatalNotificationError` for permanently undeliverable numbers (invalid format,
 * blacklisted, unsupported type). Throws a plain `Error` for transient failures
 * (balance, routing, gateway) so retry.ts can schedule backoff retries.
 *
 * @param to   - User ID whose phone number is resolved from the User Service.
 * @param body - SMS message body (160 chars per segment; AT auto-splits multi-part messages).
 */
export async function sendSms(to: string, body: string): Promise<void> {
  console.log(`[sms] sendSms → user=${to}`);

  if (!smsClient) {
    console.warn(`[sms] SMS client not initialized — skipping SMS to user ${to}`);
    return;
  }

  const phone = await getUserPhone(to);
  if (!phone) {
    console.warn(`[sms] No phone number for user ${to} — skipping SMS`);
    return;
  }

  const result = await smsClient.send({ to: [phone], message: body });
  const recipient = result.SMSMessageData.Recipients[0];

  if (!recipient || AT_SUCCESS_CODES.has(recipient.statusCode)) {
    console.log(`[sms] SMS delivered → user=${to} phone=${phone} status=${recipient?.status ?? 'unknown'}`);
    return;
  }

  const { statusCode } = recipient;

  if (FATAL_AT_CODES.has(statusCode)) {
    const label = FATAL_AT_CODE_LABELS[statusCode] ?? `code ${statusCode}`;
    console.error(
      `[sms] Fatal AT error (${label}) for user ${to} — number ${phone} is permanently unreachable, routing straight to DLQ`
    );
    throw new FatalNotificationError(`AT ${label} for user ${to}`, String(statusCode), to);
  }

  // Transient: balance low (405), risk hold (401), routing failure (407), gateway errors (500/501/502)
  throw new Error(`SMS delivery failed (AT status ${statusCode}) for user ${to} — will retry`);
}
