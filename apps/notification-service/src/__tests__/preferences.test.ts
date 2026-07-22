import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getUserPreferences, isChannelEnabled } from '../preferences.js';

describe('getUserPreferences', () => {
  beforeEach(() => {
    delete process.env.USER_SERVICE_URL;
    delete process.env.INTERNAL_SERVICE_TOKEN;
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the preferences endpoint with the service token and returns the parsed data', async () => {
    process.env.USER_SERVICE_URL = 'http://user-service:8000';
    process.env.INTERNAL_SERVICE_TOKEN = 'test-service-token';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          fcmToken: 'token-abc',
          email: 'user@example.com',
          phoneNumber: '+250700000000',
          notificationPreferences: { push: false, email: true, sms: true },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getUserPreferences('user-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://user-service:8000/api/v1/users/user-1/preferences',
      { headers: { Authorization: 'Bearer test-service-token' } }
    );
    expect(result).toEqual({
      fcmToken: 'token-abc',
      email: 'user@example.com',
      phoneNumber: '+250700000000',
      notificationPreferences: { push: false, email: true, sms: true },
    });
  });

  it('uses http://localhost:8000 as the default USER_SERVICE_URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          fcmToken: null,
          email: null,
          phoneNumber: null,
          notificationPreferences: { push: true, email: true, sms: true },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await getUserPreferences('user-2');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/users/user-2/preferences',
      expect.anything()
    );
  });

  it('defaults notificationPreferences to all-enabled when the field is missing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          fcmToken: 'tok',
          email: 'e@x.com',
          phoneNumber: null,
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getUserPreferences('user-3');

    expect(result.notificationPreferences).toEqual({
      push: true,
      email: true,
      sms: true,
    });
  });

  it('returns all-enabled defaults and null fields when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 })
    );

    const result = await getUserPreferences('user-4');

    expect(result).toEqual({
      fcmToken: null,
      email: null,
      phoneNumber: null,
      notificationPreferences: { push: true, email: true, sms: true },
    });
  });

  it('returns all-enabled defaults and null fields when the service is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    );

    const result = await getUserPreferences('user-5');

    expect(result).toEqual({
      fcmToken: null,
      email: null,
      phoneNumber: null,
      notificationPreferences: { push: true, email: true, sms: true },
    });
  });
});

describe('isChannelEnabled', () => {
  it('returns the stored value for a given channel', () => {
    const prefs = { push: false, email: true, sms: false };
    expect(isChannelEnabled(prefs, 'push')).toBe(false);
    expect(isChannelEnabled(prefs, 'email')).toBe(true);
    expect(isChannelEnabled(prefs, 'sms')).toBe(false);
  });

  it('defaults to enabled (true) for a missing/malformed key', () => {
    const malformed = {} as unknown as {
      push: boolean;
      email: boolean;
      sms: boolean;
    };
    expect(isChannelEnabled(malformed, 'push')).toBe(true);
  });
});
