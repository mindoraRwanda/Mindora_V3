import { randomBytes } from 'node:crypto';
import { prisma } from './database.js';
import { decrypt, encrypt } from './lib/crypto.js';

// Client for the external Therapy Chatbot API (separate service, own
// signup/login + conversation model — see docs at
// <THERAPY_CHATBOT_BASE_URL>/docs). Each Mindora patient gets one lazily
// provisioned chatbot account + one long-lived conversation, tracked in the
// chatbot_accounts table; message history itself lives on the chatbot's
// side, not ours (this service's own AiInteraction rows are our audit copy).

export class ChatbotApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ChatbotApiError';
  }
}

interface ChatbotSession {
  accessToken: string;
  conversationId: string;
}

interface ChatbotMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
}

function baseUrl(): string {
  const url = process.env.THERAPY_CHATBOT_BASE_URL;
  if (!url) {
    throw new Error(
      'Missing required environment variable: THERAPY_CHATBOT_BASE_URL'
    );
  }
  return url.replace(/\/+$/, '');
}

// The chatbot issues a JWT access token but exposes no refresh endpoint —
// re-authenticating with the stored password is the only way to renew one.
// Decoding exp locally avoids a second round-trip just to learn expiry.
function decodeTokenExpiry(accessToken: string): Date {
  const payload = accessToken.split('.')[1];
  if (!payload) {
    throw new ChatbotApiError('Chatbot access token was not a valid JWT');
  }
  const padded = payload.padEnd(
    payload.length + ((4 - (payload.length % 4)) % 4),
    '='
  );
  const decoded = JSON.parse(
    Buffer.from(padded, 'base64url').toString('utf8')
  ) as { exp: number };
  return new Date(decoded.exp * 1000);
}

async function chatbotFetch(
  path: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new ChatbotApiError(
      `Therapy chatbot request to ${path} failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  if (!response.ok) {
    throw new ChatbotApiError(
      `Therapy chatbot returned ${response.status} for ${path}`,
      response.status
    );
  }
  return response;
}

async function signup(
  email: string,
  password: string
): Promise<{ accessToken: string; userId: string }> {
  const res = await chatbotFetch(
    '/auth/signup',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: email.split('@')[0],
        email,
        password,
      }),
    },
    15_000
  );
  const body = (await res.json()) as { access_token: string; user_id: string };
  return { accessToken: body.access_token, userId: body.user_id };
}

async function login(
  email: string,
  password: string
): Promise<{ accessToken: string }> {
  const res = await chatbotFetch(
    '/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    },
    15_000
  );
  const body = (await res.json()) as { access_token: string };
  return { accessToken: body.access_token };
}

async function createConversation(accessToken: string): Promise<string> {
  const res = await chatbotFetch(
    '/auth/conversations',
    { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } },
    15_000
  );
  const body = (await res.json()) as { id: string };
  return body.id;
}

async function provisionAccount(mindoraUserId: string) {
  const email = `${mindoraUserId}@mindora-patients.internal`;
  const password = randomBytes(24).toString('hex');

  const { accessToken } = await signup(email, password);
  const conversationId = await createConversation(accessToken);

  return prisma.chatbotAccount.create({
    data: {
      mindora_user_id: mindoraUserId,
      chatbot_user_id: mindoraUserId,
      chatbot_email: email,
      chatbot_password: encrypt(password),
      access_token: accessToken,
      token_expires_at: decodeTokenExpiry(accessToken),
      conversation_id: conversationId,
    },
  });
}

// 60s buffer so a token doesn't expire mid-request.
const EXPIRY_BUFFER_MS = 60_000;

async function refreshSession(
  account: NonNullable<
    Awaited<ReturnType<typeof prisma.chatbotAccount.findUnique>>
  >
): Promise<ChatbotSession> {
  const password = decrypt(account.chatbot_password);
  const { accessToken } = await login(account.chatbot_email, password);

  let conversationId = account.conversation_id;
  if (!conversationId) {
    conversationId = await createConversation(accessToken);
  }

  await prisma.chatbotAccount.update({
    where: { id: account.id },
    data: {
      access_token: accessToken,
      token_expires_at: decodeTokenExpiry(accessToken),
      conversation_id: conversationId,
    },
  });

  return { accessToken, conversationId };
}

async function getOrCreateSession(
  mindoraUserId: string
): Promise<ChatbotSession> {
  const existing = await prisma.chatbotAccount.findUnique({
    where: { mindora_user_id: mindoraUserId },
  });

  if (!existing) {
    const created = await provisionAccount(mindoraUserId);
    return {
      accessToken: created.access_token!,
      conversationId: created.conversation_id!,
    };
  }

  const tokenIsFresh =
    existing.access_token &&
    existing.conversation_id &&
    existing.token_expires_at &&
    existing.token_expires_at.getTime() - EXPIRY_BUFFER_MS > Date.now();

  if (tokenIsFresh) {
    return {
      accessToken: existing.access_token!,
      conversationId: existing.conversation_id!,
    };
  }

  return refreshSession(existing);
}

async function sendMessage(
  session: ChatbotSession,
  content: string
): Promise<ChatbotMessage> {
  const res = await chatbotFetch(
    '/auth/messages',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: session.conversationId,
        content,
      }),
    },
    // Observed latency for this LLM-backed pipeline is ~20-25s.
    45_000
  );
  return (await res.json()) as ChatbotMessage;
}

// Entry point used by the /chat route. Provisions/refreshes the patient's
// chatbot session as needed, then sends the message — retrying once with a
// forced re-login if the cached token was rejected (clock skew, revoked
// session, etc.) rather than only trusting our own expiry bookkeeping.
export async function chatWithBot(
  mindoraUserId: string,
  content: string
): Promise<ChatbotMessage> {
  const session = await getOrCreateSession(mindoraUserId);
  try {
    return await sendMessage(session, content);
  } catch (err) {
    if (err instanceof ChatbotApiError && err.status === 401) {
      const account = await prisma.chatbotAccount.findUnique({
        where: { mindora_user_id: mindoraUserId },
      });
      if (account) {
        const refreshed = await refreshSession(account);
        return sendMessage(refreshed, content);
      }
    }
    throw err;
  }
}
