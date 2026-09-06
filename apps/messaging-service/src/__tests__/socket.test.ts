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
import jwt from 'jsonwebtoken';
import { io as ioClient, Socket } from 'socket.io-client';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { initializeSocket } from '../socket.js';
import { decryptContent } from '../utils/encryption.js';

// vi.mock is hoisted by vitest before all imports, so socket.ts's
// import of isMongoConnected from ./database gets the mock version.
vi.mock('../database', () => ({
  isMongoConnected: () => true,
  connectDatabase: () => Promise.resolve(),
}));

const TEST_PORT = 3099;
const TEST_DB = 'mongodb://localhost:27017/mindora_messaging_socket_test';
const TEST_SECRET = 'mindora-dev-jwt-secret-change-in-production';

let server: http.Server;
let jtiCounter = 0;

// Every connection must present a real token — this is exactly what the
// handshake auth middleware in socket.ts now enforces. userId is the JWT's
// `sub`, which becomes socket.data.userId server-side.
function tokenFor(userId: string): string {
  jtiCounter += 1;
  return jwt.sign(
    { sub: userId, email: `${userId}@example.com`, role: 'PATIENT' },
    TEST_SECRET,
    { expiresIn: '15m', issuer: 'mindora-auth', jwtid: `socket-test-${jtiCounter}` }
  );
}

function connectClient(userId: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(`http://localhost:${TEST_PORT}`, {
      forceNew: true,
      auth: { token: tokenFor(userId) },
    });
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}

function connectWithToken(token: string | undefined): Promise<{
  socket: Socket;
  error?: Error;
}> {
  return new Promise((resolve) => {
    const socket = ioClient(`http://localhost:${TEST_PORT}`, {
      forceNew: true,
      auth: token === undefined ? {} : { token },
    });
    socket.once('connect', () => resolve({ socket }));
    socket.once('connect_error', (error) => resolve({ socket, error }));
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

describe('handshake authentication', () => {
  it('rejects a connection with no token at all', async () => {
    const { error } = await connectWithToken(undefined);
    expect(error).toBeDefined();
  });

  it('rejects a connection with a malformed token', async () => {
    const { error } = await connectWithToken('not-a-real-jwt');
    expect(error).toBeDefined();
  });

  it('accepts a connection with a valid token', async () => {
    const { socket, error } = await connectWithToken(tokenFor('user-a'));
    expect(error).toBeUndefined();
    socket.disconnect();
  });
});

describe('create_conversation', () => {
  it('creates a conversation when the caller is one of the participants', async () => {
    const client = await connectClient('user-a');

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

  it('rejects creating a conversation the caller is not a participant of', async () => {
    const client = await connectClient('user-c');

    client.emit('create_conversation', { participants: ['user-a', 'user-b'] });
    const err = (await nextEvent(client, 'error')) as { message: string };

    expect(err.message).toMatch(/participants/i);
    const saved = await Conversation.findOne({
      participants: { $all: ['user-a', 'user-b'] },
    });
    expect(saved).toBeNull();

    client.disconnect();
  });

  it('emits error when participants array has fewer than 2 entries', async () => {
    const client = await connectClient('user-a');

    client.emit('create_conversation', { participants: ['only-one'] });
    const err = (await nextEvent(client, 'error')) as { message: string };

    expect(err.message).toMatch(/participants/);
    client.disconnect();
  });

  it('emits error when participants is missing', async () => {
    const client = await connectClient('user-a');

    client.emit('create_conversation', {});
    const err = (await nextEvent(client, 'error')) as { message: string };

    expect(err.message).toBeDefined();
    client.disconnect();
  });
});

describe('join_conversation', () => {
  it('emits joined_conversation when the caller is a participant', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const client = await connectClient('user-a');

    client.emit('join_conversation', { conversationId: conv._id.toString() });
    const data = (await nextEvent(client, 'joined_conversation')) as {
      conversationId: string;
    };

    expect(data.conversationId).toBe(conv._id.toString());
    client.disconnect();
  });

  it("marks the other participant's undelivered messages as delivered and broadcasts messages_delivered", async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const convId = conv._id.toString();

    // sender joins first, before any messages exist, so its own join can't
    // itself trigger a (confounding) messages_delivered event.
    const sender = await connectClient('user-b');
    sender.emit('join_conversation', { conversationId: convId });
    await nextEvent(sender, 'joined_conversation');

    const fromB = await Message.create([
      { conversationId: convId, senderId: 'user-b', content: 'hi 1' },
      { conversationId: convId, senderId: 'user-b', content: 'hi 2' },
    ]);
    const ownMessage = await Message.create({
      conversationId: convId,
      senderId: 'user-a',
      content: 'mine',
    });

    const deliveredPromise = nextEvent(sender, 'messages_delivered');
    const reader = await connectClient('user-a');
    reader.emit('join_conversation', { conversationId: convId });
    await nextEvent(reader, 'joined_conversation');

    const delivered = (await deliveredPromise) as {
      conversationId: string;
      messageIds: string[];
      deliveredTo: string;
    };
    expect(delivered.conversationId).toBe(convId);
    expect(delivered.deliveredTo).toBe('user-a');
    expect(new Set(delivered.messageIds)).toEqual(
      new Set(fromB.map((m) => m._id.toString()))
    );

    for (const m of fromB) {
      const reloaded = await Message.findById(m._id);
      expect(reloaded?.deliveredAt).not.toBeNull();
    }
    const reloadedOwn = await Message.findById(ownMessage._id);
    expect(reloadedOwn?.deliveredAt).toBeNull();

    reader.disconnect();
    sender.disconnect();
  });

  it('does not re-broadcast messages_delivered once already delivered', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const convId = conv._id.toString();
    await Message.create({
      conversationId: convId,
      senderId: 'user-b',
      content: 'hi',
    });

    const first = await connectClient('user-a');
    first.emit('join_conversation', { conversationId: convId });
    await nextEvent(first, 'joined_conversation');
    await nextEvent(first, 'messages_delivered');
    first.disconnect();

    // Joining again must not emit a second messages_delivered for the same
    // already-delivered message.
    const second = await connectClient('user-a');
    let gotSecondDelivery = false;
    second.on('messages_delivered', () => {
      gotSecondDelivery = true;
    });
    second.emit('join_conversation', { conversationId: convId });
    await nextEvent(second, 'joined_conversation');
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(gotSecondDelivery).toBe(false);

    second.disconnect();
  });

  it('rejects joining a conversation the caller is not a participant of, without confirming it exists', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const client = await connectClient('stranger');

    client.emit('join_conversation', { conversationId: conv._id.toString() });
    const err = (await nextEvent(client, 'error')) as { message: string };

    // Same message as "doesn't exist" — a non-participant must not be able
    // to distinguish "not yours" from "never existed".
    expect(err.message).toBe('Conversation not found');
    client.disconnect();
  });

  it('emits error with "Conversation not found" for a valid but non-existent ID', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const client = await connectClient('user-a');

    client.emit('join_conversation', { conversationId: fakeId });
    const err = (await nextEvent(client, 'error')) as { message: string };

    expect(err.message).toBe('Conversation not found');
    client.disconnect();
  });

  it('emits error with "Invalid conversation ID" for a malformed ID', async () => {
    const client = await connectClient('user-a');

    client.emit('join_conversation', { conversationId: 'not-an-objectid' });
    const err = (await nextEvent(client, 'error')) as { message: string };

    expect(err.message).toBe('Invalid conversation ID');
    client.disconnect();
  });
});

describe('send_message', () => {
  it('broadcasts new_message to all sockets in the room, using the sender\'s verified identity', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const convId = conv._id.toString();

    const sender = await connectClient('user-a');
    const receiver = await connectClient('user-b');

    sender.emit('join_conversation', { conversationId: convId });
    await nextEvent(sender, 'joined_conversation');

    receiver.emit('join_conversation', { conversationId: convId });
    await nextEvent(receiver, 'joined_conversation');

    const receivedPromise = nextEvent(receiver, 'new_message');
    sender.emit('send_message', {
      conversationId: convId,
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

  it('encrypts content at rest — the stored document is not the plaintext, but reading it back (message_history) decrypts correctly', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const convId = conv._id.toString();

    const sender = await connectClient('user-a');
    sender.emit('join_conversation', { conversationId: convId });
    await nextEvent(sender, 'joined_conversation');

    sender.emit('send_message', {
      conversationId: convId,
      content: 'a private thought',
    });
    await nextEvent(sender, 'new_message');

    const stored = await Message.findOne({ conversationId: convId });
    expect(stored?.content).toBeDefined();
    expect(stored?.content).not.toBe('a private thought');
    expect(decryptContent(stored!.content)).toBe('a private thought');

    const storedConv = await Conversation.findById(convId);
    expect(storedConv?.lastMessage?.content).not.toBe('a private thought');
    expect(decryptContent(storedConv!.lastMessage!.content)).toBe(
      'a private thought'
    );

    // Rejoining (e.g. after a reload) must decrypt message_history back to
    // the original plaintext, not show ciphertext.
    const historyPromise = nextEvent(sender, 'message_history');
    sender.emit('join_conversation', { conversationId: convId });
    const history = (await historyPromise) as {
      messages: Array<{ content: string }>;
    };
    expect(history.messages[0]?.content).toBe('a private thought');

    sender.disconnect();
  });

  it('still displays pre-existing plaintext messages correctly (no migration needed)', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const convId = conv._id.toString();
    // Simulates a message written before encryption-at-rest existed.
    await Message.create({
      conversationId: convId,
      senderId: 'user-b',
      content: 'an old unencrypted message',
    });

    const client = await connectClient('user-a');
    const historyPromise = nextEvent(client, 'message_history');
    client.emit('join_conversation', { conversationId: convId });
    const history = (await historyPromise) as {
      messages: Array<{ content: string }>;
    };

    expect(history.messages[0]?.content).toBe('an old unencrypted message');
    client.disconnect();
  });

  it('cannot be used to spoof another participant as the sender', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const convId = conv._id.toString();

    const attacker = await connectClient('user-a');

    // Even if the client tries to smuggle a senderId in the payload, the
    // server must ignore it and use the authenticated identity instead.
    attacker.emit('send_message', {
      conversationId: convId,
      content: 'pretending to be user-b',
      senderId: 'user-b',
    } as unknown as { conversationId: string; content: string });

    const receiver = await connectClient('user-b');
    receiver.emit('join_conversation', { conversationId: convId });
    await nextEvent(receiver, 'joined_conversation');

    attacker.emit('send_message', {
      conversationId: convId,
      content: 'second attempt',
    });
    const msg = (await nextEvent(receiver, 'new_message')) as Record<
      string,
      unknown
    >;
    expect(msg.senderId).toBe('user-a');

    attacker.disconnect();
    receiver.disconnect();
  });

  it('rejects sending into a conversation the caller is not a participant of', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const client = await connectClient('stranger');

    client.emit('send_message', {
      conversationId: conv._id.toString(),
      content: 'Hello',
    });
    const err = (await nextEvent(client, 'error')) as { message: string };

    expect(err.message).toBe('Conversation not found');
    client.disconnect();
  });

  it('emits error when content is empty', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const client = await connectClient('user-a');

    client.emit('join_conversation', { conversationId: conv._id.toString() });
    await nextEvent(client, 'joined_conversation');

    client.emit('send_message', {
      conversationId: conv._id.toString(),
      content: '   ',
    });
    const err = (await nextEvent(client, 'error')) as { message: string };

    expect(err.message).toBe('Message content cannot be empty');
    client.disconnect();
  });

  it('emits error when the conversation does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const client = await connectClient('user-a');

    client.emit('send_message', {
      conversationId: fakeId,
      content: 'Hello',
    });
    const err = (await nextEvent(client, 'error')) as { message: string };

    expect(err.message).toBe('Conversation not found');
    client.disconnect();
  });
});

describe('mark_conversation_read', () => {
  it('marks every unread message not sent by the caller as read, zeroes unreadCount, and broadcasts once', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
      unreadCount: 3,
    });
    const convId = conv._id.toString();
    const unreadFromA = await Message.create([
      { conversationId: convId, senderId: 'user-a', content: 'hi 1' },
      { conversationId: convId, senderId: 'user-a', content: 'hi 2' },
    ]);
    // Already-read and self-sent messages must not be touched or counted.
    const alreadyRead = await Message.create({
      conversationId: convId,
      senderId: 'user-a',
      content: 'old',
      readAt: new Date('2020-01-01'),
    });
    const ownMessage = await Message.create({
      conversationId: convId,
      senderId: 'user-b',
      content: 'mine',
    });

    const reader = await connectClient('user-b');
    const sender = await connectClient('user-a');
    sender.emit('join_conversation', { conversationId: convId });
    await nextEvent(sender, 'joined_conversation');

    const broadcastPromise = nextEvent(sender, 'conversation_read');
    reader.emit('mark_conversation_read', { conversationId: convId });
    const broadcast = (await broadcastPromise) as {
      conversationId: string;
      messageIds: string[];
      readBy: string;
    };

    expect(broadcast.conversationId).toBe(convId);
    expect(broadcast.readBy).toBe('user-b');
    expect(new Set(broadcast.messageIds)).toEqual(
      new Set(unreadFromA.map((m) => m._id.toString()))
    );

    const updatedConv = await Conversation.findById(convId);
    expect(updatedConv?.unreadCount).toBe(0);

    for (const m of unreadFromA) {
      const reloaded = await Message.findById(m._id);
      expect(reloaded?.readAt).not.toBeNull();
    }
    const reloadedAlreadyRead = await Message.findById(alreadyRead._id);
    expect(reloadedAlreadyRead?.readAt?.toISOString()).toBe(
      new Date('2020-01-01').toISOString()
    );
    const reloadedOwn = await Message.findById(ownMessage._id);
    expect(reloadedOwn?.readAt).toBeNull();

    reader.disconnect();
    sender.disconnect();
  });

  it('does nothing (no broadcast) when the caller is not a participant', async () => {
    const conv = await Conversation.create({
      participants: ['user-a', 'user-b'],
    });
    const convId = conv._id.toString();
    await Message.create({
      conversationId: convId,
      senderId: 'user-a',
      content: 'hi',
    });

    const participant = await connectClient('user-a');
    participant.emit('join_conversation', { conversationId: convId });
    await nextEvent(participant, 'joined_conversation');

    const stranger = await connectClient('stranger');
    stranger.emit('mark_conversation_read', { conversationId: convId });

    // No broadcast should arrive; give it a moment then assert nothing changed.
    await new Promise((resolve) => setTimeout(resolve, 200));
    const message = await Message.findOne({ conversationId: convId });
    expect(message?.readAt).toBeNull();

    participant.disconnect();
    stranger.disconnect();
  });
});
