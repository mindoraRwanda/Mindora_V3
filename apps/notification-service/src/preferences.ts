export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
}

export interface UserPreferences {
  fcmToken: string | null;
  email: string | null;
  phoneNumber: string | null;
  notificationPreferences: NotificationPreferences;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  push: true,
  email: true,
  sms: true,
};

// Single call replacing the three separate per-channel fetches
// (getFcmToken/getUserEmail/getUserPhone) that fcm.ts/email.ts/sms.ts used to
// each make independently against the same preferences endpoint.
// Default is 'http://localhost:8000' (Kong) — USER_SERVICE_URL should always
// be set explicitly, this is only a last-resort fallback.
export async function getUserPreferences(
  userId: string
): Promise<UserPreferences> {
  const base = process.env.USER_SERVICE_URL ?? 'http://localhost:8000';
  try {
    const res = await fetch(`${base}/api/v1/users/${userId}/preferences`, {
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
      },
    });
    if (!res.ok) {
      console.warn(
        `[preferences] User Service returned ${res.status} for user ${userId} — using defaults`
      );
      return {
        fcmToken: null,
        email: null,
        phoneNumber: null,
        notificationPreferences: DEFAULT_PREFERENCES,
      };
    }
    const data = (await res.json()) as UserPreferences;
    return {
      ...data,
      notificationPreferences:
        data.notificationPreferences ?? DEFAULT_PREFERENCES,
    };
  } catch (err) {
    console.warn(
      `[preferences] User Service unreachable for user ${userId}:`,
      err
    );
    return {
      fcmToken: null,
      email: null,
      phoneNumber: null,
      notificationPreferences: DEFAULT_PREFERENCES,
    };
  }
}

// Preference data crosses an HTTP/JSON boundary, so the '?? true' fallback is
// a real runtime guard (opt-out model: an absent/malformed key means
// enabled), not just defensive noise against the TS type.
export function isChannelEnabled(
  preferences: NotificationPreferences,
  channel: 'push' | 'email' | 'sms'
): boolean {
  return preferences[channel] ?? true;
}
