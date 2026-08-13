import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from 'vitest';
import mongoose from 'mongoose';
import http from 'http';
import { io as ioClient, Socket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { isEncrypted } from '../utils/encryption.js';
import { initializeSocket } from '../socket.js';

// vi.mock is hoisted by vitest before all imports, so socket.ts's
// import of isMongoConnected from ./database gets the mock version.
vi.mock('../database', () => ({
  isMongoConnected: () => true,
  connectDatabase: () => Promise.resolve(),
}));

const TEST_PORT = 3099;
const TEST_DB = 'mongodb://localhost:27017/mindora_messaging_socket_test';

let server: http.Server;

// The socket handshake now requires a valid access token, and every handler
// derives the acting user from it rather than from event payloads — so tests
// must connect *as* a specific user. No jwtid is set deliberately: the
// blacklist lookup only runs when a jti is present, which keeps these tests
// from needing Redis.
function signTestToken(userId: string): string {
  return jwt.sign(
    { sub: userId, email: `${userId}@test.local`, role: 'PATIENT' },
    process.env.JWT_SECRET ?? 'mindora-dev-jwt-secret-change-in-production',
    { expiresIn: '10m', issuer: 'mindora-auth' }
  );
}

function connectClient(userId = 'user-a'): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(`http://localhost:${TEST_PORT}`, {
      forceNew: true,
      auth: { token: signTestToken(userId) },
    });
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}

function nextEvent(socket: Socket, event: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for "${event}"`)),
      10000
    );
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  server = http.createServer();
  await initializeSocket(server, true); // skipRedis — use in-memory adapter
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
});

beforeEach(async () => {
  await Conversation.deleteMany({});
  await Message.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('create_conversation', () => {
  it('creates a conversation and emits conversation_created', async () => {
    const client = await connectClient();

    client.emit('create_conversation', { participants: ['user-a', 'user-b'] });
    const data = (await nextEvent(client, 'conversation_created')) as {
      _id: string;
      participants: string[];
    };

    expect(data._id).toBeDefined();
    expect(data.participants).toEqual(['user-a', 'user-b']);

    const saved = await Conversation.findById(data._id);
    expect(saved).not.toBeNull();

    client.disconnect();
  });

  it('emits error when participants array has fewer than 2 entries', async () => {
    const client = await connectClient();

    client.emit('create_conversation', { participants: ['only-one'] });
    const err = (await nextEvent(client, 'error')) as { message: string };

    expect(err.message).toMatch(/participants/);
    client.disconnect();
  });

  it('emits error when participants is missing', async () => {
    const client = await connectClient();

    client.emit('create_conversation', {});
    const err = (await nextEvent(client, 'error')) as { message: string };

    expect(err.message).toBeDefined();
    client.disconnect();
  });
});

describe('join_conversation', () => {
  it('emits joined_conversation when the conversation exists', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const client = await connectClient();

    client.emit('join_conversation', { conversationId: conv._id.toString() });
    const data = (await nextEvent(client, 'joined_conversation')) as {
      conversationId: string;
    };

    expect(data.conversationId).toBe(conv._id.toString());
    client.disconnect();
  });

  it('emits error with "Conversation not found" for a valid but non-existent ID', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const client = await connectClient();

    client.emit('join_conversation', { conversationId: fakeId });
    const err = (await nextEvent(client, 'error')) as { message: string };

    expect(err.message).toBe('Conversation not found');
    client.disconnect();
  });

  it('emits error with "Invalid conversation ID" for a malformed ID', async () => {
    const client = await connectClient();

    client.emit('join_conversation', { conversationId: 'not-an-objectid' });
    const err = (await nextEvent(client, 'error')) as { message: string };

    expect(err.message).toBe('Invalid conversation ID');
    client.disconnect();
  });
});

describe('send_message', () => {
  it('broadcasts new_message to all sockets in the room', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const convId = conv._id.toString();

    // Each side authenticates as its own participant — the server now takes
    // senderId from the token, so these can't both be the same user.
    const sender = await connectClient('user-a');
    const receiver = await connectClient('user-b');

    sender.emit('join_conversation', { conversationId: convId });
    await nextEvent(sender, 'joined_conversation');

    receiver.emit('join_conversation', { conversationId: convId });
    await nextEvent(receiver, 'joined_conversation');

    const receivedPromise = nextEvent(receiver, 'new_message');
    sender.emit('send_message', {
      conversationId: convId,
      senderId: 'user-a',
      content: 'Hello from test',
    });

    const msg = (await receivedPromise) as Record<string, unknown>;
    expect(msg.content).toBe('Hello from test');
    expect(msg.senderId).toBe('user-a');
    expect(msg.conversationId).toBe(convId);
    expect(msg._id).toBeDefined();

    sender.disconnect();
    receiver.disconnect();
  });

  it('emits error when content is empty', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const client = await connectClient();

    client.emit('join_conversation', { conversationId: conv._id.toString() });
    await nextEvent(client, 'joined_conversation');

    client.emit('send_message', {
      conversationId: conv._id.toString(),
      senderId: 'user-a',
      content: '   ',
    });
    const err = (await nextEvent(client, 'error')) as { message: string };

    expect(err.message).toBe('Message content cannot be empty');
    client.disconnect();
  });

  it('emits error when the conversation does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const client = await connectClient();

    client.emit('send_message', {
      conversationId: fakeId,
      senderId: 'user-a',
      content: 'Hello',
    });
    const err = (await nextEvent(client, 'error')) as { message: string };

    expect(err.message).toBe('Conversation not found');
    client.disconnect();
  });

  it('ignores a spoofed senderId and uses the authenticated user', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const convId = conv._id.toString();
    const client = await connectClient('user-a');

    client.emit('join_conversation', { conversationId: convId });
    await nextEvent(client, 'joined_conversation');

    const received = nextEvent(client, 'new_message');
    client.emit('send_message', {
      conversationId: convId,
      senderId: 'user-b', // spoof attempt — must be ignored
      content: 'who sent this?',
    });

    const msg = (await received) as Record<string, unknown>;
    expect(msg.senderId).toBe('user-a');
    client.disconnect();
  });
});

describe('socket authentication', () => {
  it('rejects a connection with no access token', async () => {
    await expect(
      new Promise((resolve, reject) => {
        const s = ioClient(`http://localhost:${TEST_PORT}`, { forceNew: true });
        s.once('connect', () => resolve('connected'));
        s.once('connect_error', (e) => reject(e));
      })
    ).rejects.toThrow(/Unauthorized/);
  });

  it('rejects a connection with an invalid access token', async () => {
    await expect(
      new Promise((resolve, reject) => {
        const s = ioClient(`http://localhost:${TEST_PORT}`, {
          forceNew: true,
          auth: { token: 'not-a-real-jwt' },
        });
        s.once('connect', () => resolve('connected'));
        s.once('connect_error', (e) => reject(e));
      })
    ).rejects.toThrow(/Unauthorized/);
  });

  it('refuses to join a conversation the user is not part of', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    // Authenticated, but an outsider to this conversation.
    const intruder = await connectClient('user-c');

    intruder.emit('join_conversation', {
      conversationId: conv._id.toString(),
    });
    const err = (await nextEvent(intruder, 'error')) as { message: string };

    // Same message as a genuine miss, so existence isn't leaked.
    expect(err.message).toBe('Conversation not found');
    intruder.disconnect();
  });
});

// Two-client end-to-end covering the whole WhatsApp-style tick lifecycle plus
// encryption at rest — the combination the frontend renders against.
describe('delivery/read lifecycle (two clients)', () => {
  it('advances one tick → two ticks → blue, and stores ciphertext', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const convId = conv._id.toString();

    const sender = await connectClient('user-a');
    sender.emit('join_conversation', { conversationId: convId });
    await nextEvent(sender, 'joined_conversation');

    // --- one tick: recipient is not in the room, so nothing is delivered ---
    const ownEcho = nextEvent(sender, 'new_message');
    sender.emit('send_message', {
      conversationId: convId,
      content: 'are you free on Thursday?',
    });
    const echoed = (await ownEcho) as {
      _id: string;
      content: string;
      deliveredAt: string | null;
      readAt: string | null;
    };

    // The broadcast carries plaintext even though storage is encrypted.
    expect(echoed.content).toBe('are you free on Thursday?');
    expect(echoed.deliveredAt).toBeNull();
    expect(echoed.readAt).toBeNull();

    // ...but what actually landed in Mongo is ciphertext.
    const storedRaw = await Message.findById(echoed._id).lean();
    expect(storedRaw).not.toBeNull();
    expect(storedRaw!.content).not.toBe('are you free on Thursday?');
    expect(isEncrypted(storedRaw!.content)).toBe(true);
    // The denormalised preview is encrypted too — it's a verbatim copy.
    const storedConv = await Conversation.findById(convId).lean();
    expect(isEncrypted(storedConv!.lastMessage!.content)).toBe(true);

    // --- two ticks: recipient joins, delivery fires to the room ---
    const receiver = await connectClient('user-b');
    const deliveredPromise = nextEvent(sender, 'messages_delivered');
    receiver.emit('join_conversation', { conversationId: convId });

    const history = (await nextEvent(receiver, 'message_history')) as {
      messages: Array<{ content: string }>;
    };
    // Recipient reads it back decrypted, proving the round-trip.
    expect(history.messages.at(-1)?.content).toBe('are you free on Thursday?');

    const delivered = (await deliveredPromise) as {
      messageIds: string[];
      deliveredTo: string;
    };
    expect(delivered.messageIds).toContain(echoed._id);
    expect(delivered.deliveredTo).toBe('user-b');

    const afterDelivery = await Message.findById(echoed._id).lean();
    expect(afterDelivery!.deliveredAt).not.toBeNull();
    expect(afterDelivery!.readAt ?? null).toBeNull();

    // --- blue: recipient marks the conversation read in one shot ---
    const readPromise = nextEvent(sender, 'conversation_read');
    receiver.emit('mark_conversation_read', { conversationId: convId });
    const read = (await readPromise) as {
      messageIds: string[];
      readBy: string;
    };

    expect(read.readBy).toBe('user-b');
    expect(read.messageIds).toContain(echoed._id);

    const afterRead = await Message.findById(echoed._id).lean();
    expect(afterRead!.readAt).not.toBeNull();
    // Delivery timestamp must not move when the message is later read.
    expect(afterRead!.deliveredAt?.toISOString()).toBe(
      afterDelivery!.deliveredAt?.toISOString()
    );

    // Unread counter is zeroed rather than decremented per message.
    const convAfter = await Conversation.findById(convId).lean();
    expect(convAfter!.unreadCount ?? 0).toBe(0);

    sender.disconnect();
    receiver.disconnect();
  });

  it('does not let a participant mark their own message read', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const convId = conv._id.toString();

    const sender = await connectClient('user-a');
    sender.emit('join_conversation', { conversationId: convId });
    await nextEvent(sender, 'joined_conversation');

    const echo = nextEvent(sender, 'new_message');
    sender.emit('send_message', { conversationId: convId, content: 'hello' });
    const msg = (await echo) as { _id: string };

    // user-a marking their own message read must be a no-op.
    sender.emit('mark_conversation_read', { conversationId: convId });
    await nextEvent(sender, 'conversation_read');

    const stored = await Message.findById(msg._id).lean();
    expect(stored!.readAt ?? null).toBeNull();

    sender.disconnect();
  });
});
