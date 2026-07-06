import { initializeApp, cert, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { readFileSync } from 'node:fs';
import { FatalNotificationError } from './errors.js';

export { FatalNotificationError };

let app: App | null = null;

// FCM error codes that will never succeed on retry — stale or invalid device token.
// Throwing this tells retry.ts to skip retry cycles and go straight to DLQ.
const FATAL_FCM_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

export function initFirebase(): void {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.warn(
      '[fcm] FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled'
    );
    return;
  }
  // Value may be inline JSON (starts with '{') or a path to a .json file.
  const raw = serviceAccountJson.trimStart().startsWith('{')
    ? serviceAccountJson
    : readFileSync(serviceAccountJson, 'utf8');

  app = initializeApp({
    credential: cert(JSON.parse(raw) as object),
  });
  console.log('✓ Firebase Admin SDK initialized');
}

async function getFcmToken(userId: string): Promise<string | null> {
  const base = process.env.USER_SERVICE_URL ?? 'http://localhost:3002';
  try {
    const res = await fetch(`${base}/api/v1/users/${userId}/preferences`);
    if (!res.ok) {
      console.warn(
        `[fcm] User Service returned ${res.status} for user ${userId} — no FCM token`
      );
      return null;
    }
    const data = (await res.json()) as { fcmToken?: string };
    return data.fcmToken ?? null;
  } catch (err) {
    console.warn(`[fcm] User Service unreachable for user ${userId}:`, err);
    return null;
  }
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string
): Promise<void> {
  console.log(`[fcm] sendPushNotification → user=${userId} title="${title}"`);

  if (!app) {
    console.warn(
      `[fcm] Firebase not initialized — skipping push to user ${userId}`
    );
    return;
  }

  const token = await getFcmToken(userId);
  if (!token) {
    console.warn(`[fcm] No FCM token for user ${userId} — skipping push`);
    return;
  }

  try {
    await getMessaging(app).send({ token, notification: { title, body } });
    console.log(`[fcm] Push delivered → user=${userId} title="${title}"`);
  } catch (err: unknown) {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code: unknown }).code)
        : undefined;

    if (code && FATAL_FCM_CODES.has(code)) {
      console.error(
        `[fcm] Fatal FCM error (${code}) for user ${userId} — token is stale/invalid, routing straight to DLQ`
      );
      throw new FatalNotificationError(
        `FCM ${code} for user ${userId}`,
        code,
        userId
      );
    }
    throw err; // transient — let retry.ts handle backoff
  }
}
