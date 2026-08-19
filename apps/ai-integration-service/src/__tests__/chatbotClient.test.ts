import { beforeEach, describe, expect, it, vi } from 'vitest';

// Must be set before the module under test reads them.
vi.hoisted(() => {
  process.env.NODE_ENV = 'test';
  process.env.THERAPY_CHATBOT_BASE_URL = 'https://chatbot.test';
  process.env.AI_INTERACTION_ENCRYPTION_KEY =
    'test-key-for-chatbot-client-32b!';
  process.env.AI_DATABASE_URL = 'postgresql://test:test@localhost:5432/test_ai';
});

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock('../database.js', () => ({
  prisma: {
    chatbotAccount: {
      findUnique: (...a: unknown[]) => mockFindUnique(...a),
      create: (...a: unknown[]) => mockCreate(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
    },
  },
  connectDatabase: vi.fn().mockResolvedValue(undefined),
}));

const { chatWithBot, ChatbotApiError, deleteChatbotConversation } =
  await import('../chatbotClient.js');
const { encrypt } = await import('../lib/crypto.js');

/** A JWT-shaped token whose payload carries the given expiry. */
function tokenExpiring(inSeconds: number): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + inSeconds })
  ).toString('base64url');
  return `header.${payload}.sig`;
}

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/** A stored account row with a live, correctly-encrypted token. */
function freshAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: 'row-1',
    mindora_user_id: 'user-1',
    chatbot_user_id: 'chatbot-user-1',
    chatbot_email: 'user-1@mindora-patients.internal',
    chatbot_password: encrypt('stored-password'),
    access_token: encrypt(tokenExpiring(3600)),
    token_expires_at: new Date(Date.now() + 3600_000),
    conversation_id: 'conv-1',
    ...overrides,
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

describe('provisioning', () => {
  it('stores the chatbot-side user id, not the Mindora one', async () => {
    mockFindUnique.mockResolvedValue(null);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: tokenExpiring(3600),
          user_id: 'chatbot-side-uuid',
        })
      )
      .mockResolvedValueOnce(jsonResponse({ id: 'conv-new' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'm1', content: 'hi' }));
    mockCreate.mockImplementation(
      ({ data }: { data: Record<string, string> }) =>
        Promise.resolve({ ...data, id: 'row-1' })
    );

    await chatWithBot('mindora-uuid', 'hello');

    const stored = mockCreate.mock.calls[0][0].data;
    expect(stored.chatbot_user_id).toBe('chatbot-side-uuid');
    expect(stored.chatbot_user_id).not.toBe('mindora-uuid');
  });

  it('encrypts both the password and the access token at rest', async () => {
    mockFindUnique.mockResolvedValue(null);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: tokenExpiring(3600), user_id: 'c1' })
      )
      .mockResolvedValueOnce(jsonResponse({ id: 'conv-new' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'm1', content: 'hi' }));
    mockCreate.mockImplementation(
      ({ data }: { data: Record<string, string> }) =>
        Promise.resolve({ ...data, id: 'row-1' })
    );

    await chatWithBot('mindora-uuid', 'hello');

    const stored = mockCreate.mock.calls[0][0].data;
    // iv:tag:ciphertext — never the raw value.
    expect(stored.access_token).toMatch(/^[^:]+:[^:]+:[^:]+$/);
    expect(stored.access_token).not.toContain('header.');
    expect(stored.chatbot_password).not.toBe('stored-password');
  });
});

describe('session reuse and refresh', () => {
  it('reuses a live cached token without re-authenticating', async () => {
    mockFindUnique.mockResolvedValue(freshAccount());
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'm1', content: 'hi' }));

    await chatWithBot('user-1', 'hello');

    // Exactly one call: the message. No login round-trip.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/auth/messages');
  });

  it('re-authenticates when the stored token is near expiry', async () => {
    mockFindUnique.mockResolvedValue(
      freshAccount({ token_expires_at: new Date(Date.now() + 5_000) })
    );
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: tokenExpiring(3600) })
      )
      .mockResolvedValueOnce(jsonResponse({ id: 'm1', content: 'hi' }));

    await chatWithBot('user-1', 'hello');

    expect(fetchMock.mock.calls[0][0]).toContain('/auth/login');
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('re-authenticates when the stored token cannot be decrypted', async () => {
    // Simulates a row written before the token was encrypted, or a key change.
    mockFindUnique.mockResolvedValue(
      freshAccount({ access_token: 'not-encrypted-at-all' })
    );
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: tokenExpiring(3600) })
      )
      .mockResolvedValueOnce(jsonResponse({ id: 'm1', content: 'hi' }));

    const result = await chatWithBot('user-1', 'hello');

    expect(result.content).toBe('hi');
    expect(fetchMock.mock.calls[0][0]).toContain('/auth/login');
  });
});

describe('error mapping', () => {
  it('surfaces 429 with the Retry-After window', async () => {
    mockFindUnique.mockResolvedValue(freshAccount());
    fetchMock.mockResolvedValueOnce(
      new Response('rate limited', {
        status: 429,
        headers: { 'Retry-After': '42' },
      })
    );

    const err = await chatWithBot('user-1', 'hello').catch((e) => e);

    expect(err).toBeInstanceOf(ChatbotApiError);
    expect(err.status).toBe(429);
    expect(err.retryAfterSeconds).toBe(42);
  });

  it('falls back to 60s when Retry-After is a date rather than seconds', async () => {
    mockFindUnique.mockResolvedValue(freshAccount());
    fetchMock.mockResolvedValueOnce(
      new Response('rate limited', {
        status: 429,
        headers: { 'Retry-After': 'Wed, 21 Oct 2026 07:28:00 GMT' },
      })
    );

    const err = await chatWithBot('user-1', 'hello').catch((e) => e);

    expect(err.retryAfterSeconds).toBe(60);
  });

  it('reports a network failure without a status, so it is not retried as auth', async () => {
    mockFindUnique.mockResolvedValue(freshAccount());
    fetchMock.mockRejectedValueOnce(new Error('socket hang up'));

    const err = await chatWithBot('user-1', 'hello').catch((e) => e);

    expect(err).toBeInstanceOf(ChatbotApiError);
    // Undefined status is what keeps a dropped connection from triggering the
    // 401 re-send path, which is why that path cannot duplicate a message.
    expect(err.status).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('401 retry', () => {
  it('re-logs in once and resends, then succeeds', async () => {
    mockFindUnique.mockResolvedValue(freshAccount());
    fetchMock
      .mockResolvedValueOnce(new Response('nope', { status: 401 })) // message
      .mockResolvedValueOnce(
        jsonResponse({ access_token: tokenExpiring(3600) })
      ) // login
      .mockResolvedValueOnce(jsonResponse({ id: 'm2', content: 'recovered' })); // resend

    const result = await chatWithBot('user-1', 'hello');

    expect(result.content).toBe('recovered');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry more than once', async () => {
    mockFindUnique.mockResolvedValue(freshAccount());
    fetchMock
      .mockResolvedValueOnce(new Response('nope', { status: 401 }))
      .mockResolvedValueOnce(
        jsonResponse({ access_token: tokenExpiring(3600) })
      )
      .mockResolvedValueOnce(new Response('nope again', { status: 401 }));

    const err = await chatWithBot('user-1', 'hello').catch((e) => e);

    expect(err.status).toBe(401);
    // 3 calls, not an unbounded loop.
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe('deleteChatbotConversation', () => {
  it('deletes remotely and clears the stored conversation id', async () => {
    mockFindUnique.mockResolvedValue(freshAccount());
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: tokenExpiring(3600) })
      )
      .mockResolvedValueOnce(jsonResponse({ message: 'deleted' }));

    const deleted = await deleteChatbotConversation('user-1');

    expect(deleted).toBe(true);
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          String(url).includes('/auth/conversations/conv-1') &&
          (init as RequestInit)?.method === 'DELETE'
      )
    ).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { conversation_id: null } })
    );
  });

  it('still clears the local pointer when the remote delete fails', async () => {
    mockFindUnique.mockResolvedValue(freshAccount());
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: tokenExpiring(3600) })
      )
      .mockResolvedValueOnce(new Response('boom', { status: 500 }));

    const deleted = await deleteChatbotConversation('user-1');

    // Reported as not deleted so the caller can escalate, but we stop handing
    // out a conversation the user asked us to forget.
    expect(deleted).toBe(false);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { conversation_id: null } })
    );
  });

  it('is a no-op when the user has no chatbot account', async () => {
    mockFindUnique.mockResolvedValue(null);

    const deleted = await deleteChatbotConversation('unknown-user');

    expect(deleted).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
