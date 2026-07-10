import { initializeApp, cert, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { readFileSync } from 'node:fs';
import { basename, resolve, relative } from 'node:path';
import { FatalNotificationError } from './errors.js';
import { logNotification } from './notificationLogger.js';

export { FatalNotificationError };

let app: App | null = null;

// FCM error codes that will never succeed on retry — stale or invalid device token.
// Throwing this tells retry.ts to skip retry cycles and go straight to DLQ.
const FATAL_FCM_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

function readServiceAccountFile(filePath: string): string {
  if (filePath.includes('..') || filePath.includes('\0')) {
    throw new Error('Invalid Firebase service account path');
  }

  const resolved = resolve(filePath);
  const secretsRoot = resolve(
    process.env.FIREBASE_SECRETS_DIR ?? '/etc/secrets'
  );
  const relativePath = relative(secretsRoot, resolved);

  if (
    relativePath.startsWith('..') ||
    relativePath.includes('..') ||
    !basename(resolved).endsWith('.json')
  ) {
    throw new Error('Invalid Firebase service account path');
  }

  return readFileSync(resolved, 'utf8');
}

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
    : readServiceAccountFile(serviceAccountJson);

  app = initializeApp({
    credential: cert(JSON.parse(raw) as object),
  });
  console.log('✓ Firebase Admin SDK initialized');
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  fcmToken: string | null,
  eventType = 'unknown'
): Promise<void> {
  console.log(`[fcm] sendPushNotification → user=${userId} title="${title}"`);

  if (!app) {
    console.warn(
      `[fcm] Firebase not initialized — skipping push to user ${userId}`
    );
    await logNotification({
      userId,
      eventType,
      channel: 'push',
      status: 'skipped',
      failureReason: 'Firebase not initialized',
    });
    return;
  }

  if (!fcmToken) {
    console.warn(`[fcm] No FCM token for user ${userId} — skipping push`);
    await logNotification({
      userId,
      eventType,
      channel: 'push',
      status: 'skipped',
      failureReason: 'No FCM token on file',
    });
    return;
  }

  try {
    // Sent as a 'data' message, not 'notification' — a notification payload
    // makes the browser auto-display it while backgrounded, on top of (and
    // duplicating) the notification our own service worker shows in
    // onBackgroundMessage. 'data' gives the SW/client full and sole control.
    await getMessaging(app).send({ token: fcmToken, data: { title, body } });
    console.log(`[fcm] Push delivered → user=${userId} title="${title}"`);
    await logNotification({
      userId,
      eventType,
      channel: 'push',
      status: 'delivered',
    });
  } catch (err: unknown) {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code: unknown }).code)
        : undefined;
    const message = err instanceof Error ? err.message : String(err);

    if (code && FATAL_FCM_CODES.has(code)) {
      console.error(
        `[fcm] Fatal FCM error (${code}) for user ${userId} — token is stale/invalid, routing straight to DLQ`
      );
      await logNotification({
        userId,
        eventType,
        channel: 'push',
        status: 'failed',
        failureReason: `Fatal FCM error (${code}): ${message}`,
      });
      throw new FatalNotificationError(
        `FCM ${code} for user ${userId}`,
        code,
        userId
      );
    }

    await logNotification({
      userId,
      eventType,
      channel: 'push',
      status: 'failed',
      failureReason: message,
    });
    throw err; // transient — let retry.ts handle backoff
  }
}
