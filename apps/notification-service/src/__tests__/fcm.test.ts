import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// vi.hoisted ensures these are available before vi.mock() factory calls
const mocks = vi.hoisted(() => {
  const mockSend = vi.fn();
  const mockInitializeApp = vi.fn();
  const mockCert = vi.fn((x: unknown) => x);
  const mockGetMessaging = vi.fn(() => ({ send: mockSend }));
  const mockReadFileSync = vi.fn();
  return {
    mockSend,
    mockInitializeApp,
    mockCert,
    mockGetMessaging,
    mockReadFileSync,
  };
});

vi.mock('firebase-admin/app', () => ({
  initializeApp: mocks.mockInitializeApp,
  cert: mocks.mockCert,
}));

vi.mock('firebase-admin/messaging', () => ({
  getMessaging: mocks.mockGetMessaging,
}));

vi.mock('node:fs', () => ({
  readFileSync: mocks.mockReadFileSync,
}));

describe('FatalNotificationError', () => {
  it('constructs with correct name, message, providerCode, and userId', async () => {
    const { FatalNotificationError } = await import('../fcm.js');
    const err = new FatalNotificationError(
      'Token is invalid',
      'messaging/invalid-registration-token',
      'user-abc'
    );
    expect(err.name).toBe('FatalNotificationError');
    expect(err.message).toBe('Token is invalid');
    expect(err.providerCode).toBe('messaging/invalid-registration-token');
    expect(err.userId).toBe('user-abc');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('initFirebase', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  });

  it('warns and does not call initializeApp when env var is missing', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { initFirebase } = await import('../fcm.js');
    initFirebase();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('FIREBASE_SERVICE_ACCOUNT_JSON not set')
    );
    expect(mocks.mockInitializeApp).not.toHaveBeenCalled();
  });

  it('initializes using inline JSON when value starts with {', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON =
      '{"type":"service_account","project_id":"test-proj"}';
    mocks.mockInitializeApp.mockReturnValue({ name: 'mock-app' });
    const { initFirebase } = await import('../fcm.js');
    initFirebase();
    expect(mocks.mockCert).toHaveBeenCalledWith({
      type: 'service_account',
      project_id: 'test-proj',
    });
    expect(mocks.mockInitializeApp).toHaveBeenCalledOnce();
    expect(mocks.mockReadFileSync).not.toHaveBeenCalled();
  });

  it('reads credentials from file path when value does not start with {', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON =
      '/etc/secrets/service-account.json';
    mocks.mockReadFileSync.mockReturnValue(
      '{"type":"service_account","from":"file"}'
    );
    mocks.mockInitializeApp.mockReturnValue({ name: 'mock-app' });
    const { initFirebase } = await import('../fcm.js');
    initFirebase();
    expect(mocks.mockReadFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/service-account\.json$/),
      'utf8'
    );
    expect(mocks.mockCert).toHaveBeenCalledWith({
      type: 'service_account',
      from: 'file',
    });
    expect(mocks.mockInitializeApp).toHaveBeenCalledOnce();
  });
});

describe('sendPushNotification', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    delete process.env.USER_SERVICE_URL;
    vi.unstubAllGlobals();
    mocks.mockGetMessaging.mockReturnValue({ send: mocks.mockSend });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('warns and returns early when Firebase is not initialized', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { sendPushNotification } = await import('../fcm.js');
    // app is null — initFirebase was never called in this fresh module
    await sendPushNotification('user-1', 'Title', 'Body', 'device-token');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Firebase not initialized')
    );
    expect(mocks.mockSend).not.toHaveBeenCalled();
  });

  it('warns and skips when fcmToken is null', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '{"type":"service_account"}';
    mocks.mockInitializeApp.mockReturnValue({ name: 'app' });
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { initFirebase, sendPushNotification } = await import('../fcm.js');
    initFirebase();
    await sendPushNotification('user-99', 'Title', 'Body', null);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No FCM token')
    );
    expect(mocks.mockSend).not.toHaveBeenCalled();
  });

  it('sends push with the given token and data payload — no internal fetch', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '{"type":"service_account"}';
    mocks.mockInitializeApp.mockReturnValue({ name: 'app' });
    mocks.mockSend.mockResolvedValue('msg-id-abc');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { initFirebase, sendPushNotification } = await import('../fcm.js');
    initFirebase();
    await sendPushNotification('user-1', 'Hello', 'World', 'device-token-xyz');
    expect(mocks.mockSend).toHaveBeenCalledWith({
      token: 'device-token-xyz',
      data: { title: 'Hello', body: 'World' },
    });
    // sendPushNotification no longer resolves its own token — that's
    // preferences.ts's job now, called once by the consumer beforehand.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws FatalNotificationError for messaging/invalid-registration-token', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '{"type":"service_account"}';
    mocks.mockInitializeApp.mockReturnValue({ name: 'app' });
    mocks.mockSend.mockRejectedValue({
      code: 'messaging/invalid-registration-token',
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { initFirebase, sendPushNotification, FatalNotificationError } =
      await import('../fcm.js');
    initFirebase();
    await expect(
      sendPushNotification('user-1', 'T', 'B', 'stale-token')
    ).rejects.toBeInstanceOf(FatalNotificationError);
  });

  it('throws FatalNotificationError for messaging/registration-token-not-registered', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '{"type":"service_account"}';
    mocks.mockInitializeApp.mockReturnValue({ name: 'app' });
    mocks.mockSend.mockRejectedValue({
      code: 'messaging/registration-token-not-registered',
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { initFirebase, sendPushNotification, FatalNotificationError } =
      await import('../fcm.js');
    initFirebase();
    await expect(
      sendPushNotification('user-1', 'T', 'B', 'unregistered-token')
    ).rejects.toBeInstanceOf(FatalNotificationError);
  });

  it('FatalNotificationError carries fcmCode and userId from the error', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '{"type":"service_account"}';
    mocks.mockInitializeApp.mockReturnValue({ name: 'app' });
    mocks.mockSend.mockRejectedValue({
      code: 'messaging/registration-token-not-registered',
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { initFirebase, sendPushNotification, FatalNotificationError } =
      await import('../fcm.js');
    initFirebase();
    try {
      await sendPushNotification('user-99', 'T', 'B', 'old-token');
      expect.fail('should have thrown FatalNotificationError');
    } catch (err) {
      expect(err).toBeInstanceOf(FatalNotificationError);
      expect(
        (err as InstanceType<typeof FatalNotificationError>).providerCode
      ).toBe('messaging/registration-token-not-registered');
      expect((err as InstanceType<typeof FatalNotificationError>).userId).toBe(
        'user-99'
      );
    }
  });

  it('re-throws transient FCM errors without wrapping', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '{"type":"service_account"}';
    mocks.mockInitializeApp.mockReturnValue({ name: 'app' });
    const transientError = new Error('Network timeout');
    mocks.mockSend.mockRejectedValue(transientError);
    const { initFirebase, sendPushNotification } = await import('../fcm.js');
    initFirebase();
    await expect(
      sendPushNotification('user-1', 'T', 'B', 'valid-token')
    ).rejects.toBe(transientError);
  });
});
