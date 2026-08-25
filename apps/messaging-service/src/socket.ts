import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import mongoose from 'mongoose';
import { Conversation, Message } from './models/index.js';
import { isMongoConnected } from './database.js';
import { getRedisClient } from './utils/redis.js';
import { decryptContent, encryptContent } from './utils/encryption.js';
import { recordAndPublishMessageEvent } from './lib/pending-message-events.js';
import { resolveUserName } from './lib/resolve-username.js';
import { corsOriginCallback } from './lib/cors-origin.js';
import {
  isTokenBlacklisted,
  resolveJwtSecret,
  verifyAccessToken,
} from '@mindora/auth-middleware';

export let io: SocketIOServer;

/** How long a typing indicator survives without a refresh, in seconds. */
const TYPING_TTL_SECONDS = 5;

export const initializeSocket = async (
  httpServer: HttpServer,
  skipRedis = false
): Promise<SocketIOServer> => {
  // Resolved once, eagerly, so a missing/insecure JWT_SECRET fails fast here
  // at startup (index.ts's start() exits the process on a thrown error)
  // instead of on the first socket handshake, which would otherwise leave
  // the service looking "up" while every connection attempt is rejected.
  const jwtSecret = resolveJwtSecret();

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOriginCallback,
      methods: ['GET', 'POST'],
    },
  });

  if (!skipRedis) {
    // Create two Redis clients — Socket.io adapter requires a pub and a sub client
    const pubClient = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    });
    const subClient = pubClient.duplicate();

    // Connect both before attaching the adapter
    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
  }

  console.log('✓ Socket.io initialised with Redis adapter');

  // ---------------------------------------------------------------------
  // Handshake authentication.
  //
  // Until this existed the socket layer trusted whatever userId a client put
  // in each event payload, so any connected client could read or write any
  // conversation. Every handler below now derives the acting user from this
  // verified token via socket.data.userId and ignores client-supplied ids.
  //
  // Client connects with:  io(url, { auth: { token: accessToken } })
  // ---------------------------------------------------------------------
  io.use((socket, next) => {
    const raw =
      (socket.handshake.auth?.token as string | undefined) ??
      socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!raw) {
      next(new Error('Unauthorized: missing access token'));
      return;
    }

    void (async () => {
      try {
        const payload = verifyAccessToken(
          raw,
          jwtSecret,
          process.env.JWT_ISSUER
        );

        // A token revoked by logout must not keep an open socket alive.
        if (
          payload.jti &&
          (await isTokenBlacklisted(
            process.env.REDIS_URL ?? 'redis://localhost:6379',
            payload.jti
          ))
        ) {
          next(new Error('Unauthorized: token revoked'));
          return;
        }

        socket.data.userId = payload.userId;
        socket.data.role = payload.role;
        next();
      } catch {
        next(new Error('Unauthorized: invalid access token'));
      }
    })();
  });

  // DIAGNOSTIC: Log model registration details
  console.log('\n=== MODEL REGISTRATION DETAILS ===');
  console.log(
    `Mongoose connection state: ${mongoose.connection.readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`
  );
  console.log(
    `Mongoose DB name: ${mongoose.connection.db?.databaseName || 'NOT CONNECTED'}`
  );
  console.log(`Conversation model name: ${Conversation.modelName}`);
  console.log(`Conversation collection name: ${Conversation.collection.name}`);
  console.log(
    `Conversation collection db: ${Conversation.collection.db?.databaseName || 'N/A'}`
  );
  console.log(`Message model name: ${Message.modelName}`);
  console.log(`Message collection name: ${Message.collection.name}`);
  console.log(`====================================\n`);

  // Log every connection and disconnection for now
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Authenticated user for this connection, set by the io.use() handshake
    // above. Never read a user id out of an event payload.
    const authUserId = socket.data.userId as string;

    /**
     * Loads a conversation only if the authenticated user is a participant.
     * Emits an error and returns null otherwise.
     *
     * "Invalid id", "doesn't exist" and "not yours" deliberately produce the
     * same message so a caller can't probe which conversation ids exist.
     */
    async function loadOwnConversation(conversationId: string) {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        socket.emit('error', { message: 'Conversation not found' });
        return null;
      }
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(authUserId)) {
        socket.emit('error', { message: 'Conversation not found' });
        return null;
      }
      return conversation;
    }

    // Server-side typing expiry. The Redis key expires after
    // TYPING_TTL_SECONDS, but key expiry emits nothing — so if a sender's tab
    // dies mid-compose the recipient never hears user_stopped_typing and the
    // indicator stays up forever. These timers guarantee the stop event fires
    // even when the client never sends one.
    const typingTimers = new Map<string, NodeJS.Timeout>();

    function clearTypingTimer(conversationId: string): void {
      const key = `${conversationId}:${authUserId}`;
      const existing = typingTimers.get(key);
      if (existing) {
        clearTimeout(existing);
        typingTimers.delete(key);
      }
    }

    function scheduleTypingExpiry(conversationId: string): void {
      clearTypingTimer(conversationId);
      const key = `${conversationId}:${authUserId}`;
      typingTimers.set(
        key,
        setTimeout(() => {
          typingTimers.delete(key);
          socket.to(conversationId).emit('user_stopped_typing', {
            conversationId,
            userId: authUserId,
          });
        }, TYPING_TTL_SECONDS * 1000)
      );
    }

    /**
     * Marks every message the *other* participant sent as delivered, and
     * tells the room so the sender's ticks can advance. Called when a user
     * joins a conversation (they're now receiving), and on send when the
     * recipient is already in the room.
     *
     * deliveredAt is only ever set once — ticks must not move backwards.
     */
    async function markDelivered(
      conversationId: string,
      recipientId: string
    ): Promise<void> {
      const now = new Date();
      const undelivered = await Message.find({
        conversationId,
        senderId: { $ne: recipientId },
        deliveredAt: null,
      })
        .select('_id')
        .lean();

      if (undelivered.length === 0) return;

      await Message.updateMany(
        { _id: { $in: undelivered.map((m) => m._id) } },
        { $set: { deliveredAt: now } }
      );

      io.to(conversationId).emit('messages_delivered', {
        conversationId,
        messageIds: undelivered.map((m) => String(m._id)),
        deliveredAt: now.toISOString(),
        deliveredTo: recipientId,
      });
    }

    // Event 0: create_conversation
    // Client emits this to create a new conversation without making an HTTP call.
    // Useful when the page is opened via file:// where fetch() is blocked by CORS.
    socket.on(
      'create_conversation',
      async (data: { participants: [string, string] }) => {
        try {
          if (!isMongoConnected()) {
            socket.emit('error', {
              message: 'Database temporarily unavailable. Please try again.',
            });
            return;
          }

          const participants = data?.participants;
          if (
            !Array.isArray(participants) ||
            participants.length !== 2 ||
            !participants.every(
              (p) => typeof p === 'string' && p.trim().length > 0
            )
          ) {
            socket.emit('error', {
              message:
                'participants must be an array of exactly 2 non-empty user ID strings',
            });
            return;
          }

          // You can only open a conversation you're part of — otherwise a
          // client could create conversations between two other users.
          if (!participants.includes(authUserId)) {
            socket.emit('error', {
              message: 'You must be a participant in the conversation',
            });
            return;
          }

          const existing = await Conversation.findOne({
            participants: { $all: participants, $size: 2 },
          });

          if (existing) {
            console.log(
              `✓ Returning existing conversation via socket: ${existing._id}`
            );
            socket.emit('conversation_created', {
              _id: existing._id.toString(),
              participants: existing.participants,
            });
            return;
          }

          const conversation = await Conversation.create({ participants });
          console.log(`✓ Conversation created via socket: ${conversation._id}`);
          socket.emit('conversation_created', {
            _id: conversation._id.toString(),
            participants: conversation.participants,
          });
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          console.error(
            `✗ create_conversation error for socket ${socket.id}:`,
            errorMsg
          );
          socket.emit('error', { message: 'Failed to create conversation' });
        }
      }
    );

    // Event 1: join_conversation
    // Client emits this when they open a chat window
    socket.on('join_conversation', async (data: { conversationId: string }) => {
      const { conversationId } = data;

      try {
        // DIAGNOSTIC: Log connection state and database info
        const dbName = mongoose.connection.db?.databaseName ?? 'NOT CONNECTED';
        console.log(`\n=== JOIN_CONVERSATION DEBUG ===`);
        console.log(`Socket ID: ${socket.id}`);
        console.log(`Conversation ID: ${conversationId}`);
        console.log(
          `Mongoose connection state: ${mongoose.connection.readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`
        );
        console.log(`mongoose.connection.db.databaseName: ${dbName}`);
        console.log(`Conversation model name: ${Conversation.modelName}`);
        console.log(
          `Conversation collection name: ${Conversation.collection.name}`
        );
        console.log(
          `Conversation model source: ./models (single mongoose.connection)`
        );
        console.log(`================================\n`);

        // Check if MongoDB connection is active before querying
        if (!isMongoConnected()) {
          console.warn(
            `\u26a0 join_conversation: MongoDB not connected for socket ${socket.id}`
          );
          socket.emit('error', {
            message: 'Database temporarily unavailable. Please try again.',
          });
          return;
        }

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
          console.warn(
            `\u26a0 join_conversation: Invalid ObjectId format: ${conversationId}`
          );
          socket.emit('error', { message: 'Invalid conversation ID' });
          return;
        }

        // Query with detailed logging
        console.log(
          `[${socket.id}] Querying Conversation.findById(${conversationId})...`
        );
        const conversation = await Conversation.findById(conversationId);

        console.log(
          `[${socket.id}] Query result:`,
          conversation ? `Found document` : 'NULL - document not found'
        );
        if (conversation) {
          console.log(`[${socket.id}] Document details:`, {
            _id: conversation._id.toString(),
            participants: conversation.participants,
            hasLastMessage: !!conversation.lastMessage,
          });
        }

        if (!conversation) {
          console.warn(
            `[${socket.id}] DIAGNOSTIC: Conversation ${conversationId} not found in ` +
              `${dbName}.${Conversation.collection.name}. Listing available IDs...`
          );
          const allConversations = await Conversation.find({})
            .select('_id participants')
            .limit(10);
          console.log(
            `[${socket.id}] ${allConversations.length} conversation(s) in collection:`
          );
          allConversations.forEach((doc, idx) => {
            console.log(
              `  [${idx}] ${doc._id.toString()} - participants: ${doc.participants.join(', ')}`
            );
          });
          if (allConversations.length > 0) {
            console.warn(
              `[${socket.id}] Requested ID "${conversationId}" does not match any _id above. ` +
                'Compass may show a similar-looking ObjectId — compare every character.'
            );
          }

          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Authorization: the conversation exists, but it must also be one of
        // the caller's own. Same message as "not found" so a caller can't
        // probe which conversation ids exist.
        if (!conversation.participants.includes(authUserId)) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Join the room named after the conversationId
        socket.join(conversationId);
        console.log(
          `\u2713 Socket ${socket.id} joined conversation ${conversationId}`
        );

        // Confirm to the client that they joined, including the other
        // participant's real display name \u2014 this is what a chat header
        // should show instead of a hardcoded/placeholder name. Resolved via
        // User Service (through Kong), not stored locally, so it's always
        // current even if the user changes their name later.
        const currentUserId = socket.data.userId as string | undefined;
        const otherParticipantId = conversation.participants.find(
          (p) => p !== currentUserId
        );
        const otherParticipantName = otherParticipantId
          ? await resolveUserName(otherParticipantId)
          : null;

        socket.emit('joined_conversation', {
          conversationId,
          participant: otherParticipantId
            ? { userId: otherParticipantId, userName: otherParticipantName }
            : null,
        });

        // Send recent history so the client sees any messages missed while offline
        const recentMessages = await Message.find({ conversationId })
          .sort({ createdAt: 1 })
          .limit(50)
          .lean();

        socket.emit('message_history', {
          conversationId,
          messages: recentMessages.map((m) => ({
            _id: String(m._id),
            senderId: m.senderId,
            content: decryptContent(m.content),
            createdAt: m.createdAt,
            deliveredAt: m.deliveredAt ?? null,
            readAt: m.readAt ?? null,
          })),
        });

        // The caller is now receiving this conversation, so anything the other
        // participant sent has reached them — advance the sender's ticks from
        // one to two. Deliberately after message_history so the joiner already
        // has the messages the broadcast refers to.
        await markDelivered(conversationId, authUserId);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';
        console.error(
          `\u2717 join_conversation error for socket ${socket.id}:`,
          errorMsg
        );
        console.error(`Stack:`, errorStack);

        if (
          errorMsg.includes('buffering timed out') ||
          errorMsg.includes('ECONNREFUSED')
        ) {
          socket.emit('error', {
            message: 'Database connection error. Service recovering...',
          });
        } else {
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      }
    });

    // Event 2: send_message
    // Client emits this when they type and send a message
    socket.on(
      'send_message',
      async (data: { conversationId: string; content: string }) => {
        const { conversationId, content } = data;
        // senderId comes from the verified handshake token, never the payload
        // — previously a client could send messages as any user.
        const senderId = authUserId;

        try {
          // Check if MongoDB connection is active before querying
          if (!isMongoConnected()) {
            console.warn(
              `\u26a0 send_message: MongoDB not connected for socket ${socket.id}`
            );
            socket.emit('error', {
              message: 'Database temporarily unavailable. Please try again.',
            });
            return;
          }

          if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            socket.emit('error', { message: 'Invalid conversation ID' });
            return;
          }

          if (!content || content.trim().length === 0) {
            socket.emit('error', {
              message: 'Message content cannot be empty',
            });
            return;
          }

          // Authorization: must exist AND the sender must be a participant,
          // otherwise anyone could post into anyone else's conversation.
          const conversation = await loadOwnConversation(conversationId);
          if (!conversation) return;

          // Save message to MongoDB
          console.log(
            `[${socket.id}] Creating message for conversation ${conversationId}...`
          );
          // Encrypted at rest (AES-256-GCM). Every read path must call
          // decryptContent — see message_history below and the REST history
          // route. Note decryptContent passes non-ciphertext through
          // unchanged, so rows written before encryption was wired up still
          // render correctly during the backfill window.
          const message = await Message.create({
            conversationId,
            senderId,
            content: encryptContent(content.trim()),
          });
          console.log(`[${socket.id}] Message created with ID: ${message._id}`);

          // Update the lastMessage field and bump the unread counter for
          // whoever hasn't read it yet (single counter for the conversation,
          // not per-participant \u2014 matches the schema as specified).
          console.log(
            `[${socket.id}] Updating conversation ${conversationId} lastMessage...`
          );
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: {
              // Encrypted too — this preview is a verbatim copy of the
              // message body, so storing it in clear would defeat encrypting
              // the message itself. Decrypted by GET /conversations.
              content: encryptContent(content.trim()),
              senderId,
              sentAt: message.createdAt,
            },
            $inc: { unreadCount: 1 },
          });

          // Broadcast to everyone in the room including the sender
          const messagePayload = {
            _id: message._id.toString(),
            conversationId: message.conversationId,
            senderId: message.senderId,
            // message.content is now ciphertext — broadcast the plaintext the
            // caller sent rather than re-decrypting it.
            content: content.trim(),
            createdAt: message.createdAt,
            deliveredAt: null as string | null,
            readAt: null as string | null,
          };

          io.to(conversationId).emit('new_message', messagePayload);

          console.log(
            `\u2713 Message saved and broadcast to conversation ${conversationId}`
          );

          const recipientId = conversation.participants.find(
            (p) => p !== senderId
          );

          // If the recipient already has this conversation open, the message
          // has reached them the moment we emitted above \u2014 mark it delivered
          // now so the sender's second tick appears without waiting for a
          // rejoin. fetchSockets() is adapter-aware, so this stays correct
          // when the recipient is connected to a different server instance.
          if (recipientId) {
            try {
              const roomSockets = await io.in(conversationId).fetchSockets();
              const recipientPresent = roomSockets.some(
                (s) => s.data.userId === recipientId
              );
              if (recipientPresent) {
                await markDelivered(conversationId, recipientId);
              }
            } catch (err) {
              // Delivery ticks are best-effort \u2014 never fail a sent message
              // because the delivery bookkeeping had a problem.
              console.error(
                `[${socket.id}] delivery check failed for ${message._id}:`,
                err
              );
            }
          }

          // Not awaited: a RabbitMQ outage must never block real-time
          // delivery, which has already happened via the emit above. Unlike
          // a bare fire-and-forget publish, this durably records the event
          // first (see lib/pending-message-events.ts), so a broker blip at
          // this exact moment no longer drops it silently — the sweeper
          // retries it.
          recordAndPublishMessageEvent({
            messageId: message._id.toString(),
            conversationId,
            senderId,
            recipientId: recipientId ?? null,
            // Plaintext, not message.content (now ciphertext) — notification
            // service renders this straight into the push preview and has no
            // access to the encryption key.
            content: content.trim(),
          }).catch((err) => {
            console.error(
              `[${socket.id}] Failed to record message.received event:`,
              err
            );
          });
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          console.error(
            `\u2717 send_message error for socket ${socket.id}:`,
            errorMsg
          );

          if (
            errorMsg.includes('buffering timed out') ||
            errorMsg.includes('ECONNREFUSED')
          ) {
            socket.emit('error', {
              message: 'Database connection error. Service recovering...',
            });
          } else {
            socket.emit('error', { message: 'Failed to send message' });
          }
        }
      }
    );
    // Event 3: mark_read
    // Client emits when they view a received message. Server sets readAt,
    // decrements the conversation's unread counter (floored at 0 — mark_read
    // firing more than once for the same message must not go negative), and
    // notifies the room.
    socket.on(
      'mark_read',
      async (data: { conversationId: string; messageId: string }) => {
        const { conversationId, messageId } = data;
        const userId = authUserId;
        if (!mongoose.Types.ObjectId.isValid(messageId)) return;
        try {
          // Authorization: caller must be a participant. Without this anyone
          // could mark anyone's messages read and forge message_read events.
          const conversation = await loadOwnConversation(conversationId);
          if (!conversation) return;

          const readAt = new Date();
          // Scoped to conversationId and to messages the caller did NOT send:
          // you can't mark your own message read, and you can't reach a
          // message that belongs to a different conversation by passing a
          // mismatched pair of ids.
          const updated = await Message.findOneAndUpdate(
            { _id: messageId, conversationId, senderId: { $ne: userId } },
            { $set: { readAt } },
            { new: false }
          );
          if (!updated) return;

          // Reading implies delivery — a message can't be read without having
          // arrived. Backfill only when it was never set, so the timestamp
          // still reflects first delivery rather than the read.
          if (!updated.deliveredAt) {
            await Message.updateOne(
              { _id: messageId, deliveredAt: null },
              { $set: { deliveredAt: readAt } }
            );
          }

          // Already-read messages must not decrement unreadCount a second time.
          if (!updated.readAt) {
            await Conversation.updateOne(
              { _id: conversationId, unreadCount: { $gt: 0 } },
              { $inc: { unreadCount: -1 } }
            );
          }

          socket.to(conversationId).emit('message_read', {
            conversationId,
            messageId,
            readAt: readAt.toISOString(),
            readBy: userId ?? null,
          });
        } catch (err) {
          console.error('mark_read error:', err);
        }
      }
    );

    // Event 3b: mark_conversation_read
    // Opening a chat with N unread messages previously meant emitting N
    // separate mark_read events, each doing its own findOneAndUpdate plus a
    // counter decrement. This does the whole conversation in two writes and
    // one broadcast.
    socket.on(
      'mark_conversation_read',
      async (data: { conversationId: string }) => {
        const { conversationId } = data;
        try {
          const conversation = await loadOwnConversation(conversationId);
          if (!conversation) return;

          const readAt = new Date();
          // Only the other participant's messages — you never "read" your own.
          const filter = {
            conversationId,
            senderId: { $ne: authUserId },
            readAt: null,
          };

          const unread = await Message.find(filter).select('_id').lean();
          if (unread.length === 0) {
            socket.emit('conversation_read', {
              conversationId,
              messageIds: [],
              readAt: readAt.toISOString(),
              readBy: authUserId,
            });
            return;
          }

          const ids = unread.map((m) => m._id);
          await Message.updateMany(
            { _id: { $in: ids } },
            // Reading implies delivery; deliveredAt is only filled where it
            // was never set, so it keeps meaning "first arrived".
            { $set: { readAt } }
          );
          await Message.updateMany(
            { _id: { $in: ids }, deliveredAt: null },
            { $set: { deliveredAt: readAt } }
          );

          // Reset rather than decrement-by-N: the counter is a single value
          // for the conversation, and every unread message from the other
          // participant has just been read.
          await Conversation.updateOne(
            { _id: conversationId },
            { $set: { unreadCount: 0 } }
          );

          const payload = {
            conversationId,
            messageIds: ids.map(String),
            readAt: readAt.toISOString(),
            readBy: authUserId,
          };
          // To the whole room: the sender needs it to turn their ticks blue,
          // and the reader needs it to clear their own unread badge.
          io.to(conversationId).emit('conversation_read', payload);
        } catch (err) {
          console.error('mark_conversation_read error:', err);
          socket.emit('error', {
            message: 'Failed to mark conversation as read',
          });
        }
      }
    );

    // Event 4: typing_start
    // Client emits while composing. Broadcasts to the room and arms a
    // server-side expiry so the indicator clears even if the client never
    // sends typing_stop (closed tab, dropped connection, crash).
    socket.on('typing_start', async (data: { conversationId: string }) => {
      const { conversationId } = data;
      const userId = authUserId;
      if (!conversationId) return;
      try {
        await getRedisClient().set(
          `typing:${conversationId}:${userId}`,
          '1',
          'EX',
          TYPING_TTL_SECONDS
        );
        socket
          .to(conversationId)
          .emit('user_typing', { conversationId, userId });
        // Redis key expiry fires no event of its own — this timer is what
        // actually guarantees the recipient hears about the stop.
        scheduleTypingExpiry(conversationId);
      } catch (err) {
        console.error('typing_start error:', err);
      }
    });

    // Event 5: typing_stop
    // Client emits when done composing. Server deletes the key and broadcasts to room.
    socket.on('typing_stop', async (data: { conversationId: string }) => {
      const { conversationId } = data;
      const userId = authUserId;
      if (!conversationId) return;
      try {
        clearTypingTimer(conversationId);
        await getRedisClient().del(`typing:${conversationId}:${userId}`);
        socket
          .to(conversationId)
          .emit('user_stopped_typing', { conversationId, userId });
      } catch (err) {
        console.error('typing_stop error:', err);
      }
    });

    // Presence value shape: JSON { online: boolean, lastSeen: ISO string }.
    // lastSeen is written on every register/heartbeat while online, and again
    // (with online:false) on disconnect/logout — GET /presence/:userId reads
    // it back to answer "when were they last seen" even after they go offline.
    async function writePresence(
      userId: string,
      online: boolean,
      ttlSeconds: number
    ): Promise<{ online: boolean; lastSeen: string }> {
      const value = { online, lastSeen: new Date().toISOString() };
      await getRedisClient().set(
        `presence:${userId}`,
        JSON.stringify(value),
        'EX',
        ttlSeconds
      );
      return value;
    }

    // Presence is otherwise pull-only (GET /presence/:userId) — a frontend
    // that doesn't poll would just show whatever it last saw, forever. This
    // pushes changes to everyone who has the user's conversations open, so
    // "is the other person online" stays correct without polling.
    async function broadcastPresenceChange(
      userId: string,
      online: boolean,
      lastSeen: string
    ): Promise<void> {
      try {
        const conversations = await Conversation.find({
          participants: userId,
        }).select('_id');
        for (const conversation of conversations) {
          io.to(conversation._id.toString()).emit('presence_changed', {
            userId,
            online,
            lastSeen,
          });
        }
      } catch (err) {
        console.error('broadcastPresenceChange error:', err);
      }
    }

    // Event 6: register_presence
    // Client emits immediately after connect to be marked online. Identity
    // comes from the handshake token, so no payload is required.
    socket.on('register_presence', async () => {
      // userId now comes from the verified handshake token — the payload is
      // ignored. Clients may still send { userId } harmlessly.
      const userId = authUserId;
      if (!userId) return;
      try {
        const { lastSeen } = await writePresence(userId, true, 60);
        console.log(`✓ Presence registered for ${userId}`);
        await broadcastPresenceChange(userId, true, lastSeen);
      } catch (err) {
        console.error('register_presence error:', err);
      }
    });

    // Event 7: heartbeat
    // Client emits every 30 s to refresh the 60 s presence TTL before it expires.
    // Not rebroadcast — the user was already known online, nothing changed.
    socket.on('heartbeat', async () => {
      const userId = socket.data.userId as string | undefined;
      if (!userId) return;
      try {
        await writePresence(userId, true, 60);
      } catch (err) {
        console.error('heartbeat error:', err);
      }
    });

    // Event 8: logout_presence
    // Client emits this in beforeunload for an immediate offline signal
    // instead of waiting on the disconnect handler / TTL expiry.
    socket.on('logout_presence', async () => {
      const userId = socket.data.userId as string | undefined;
      if (!userId) return;
      try {
        const { lastSeen } = await writePresence(userId, false, 300);
        console.log(`✓ Presence set offline for ${userId} (tab closed)`);
        await broadcastPresenceChange(userId, false, lastSeen);
      } catch (err) {
        console.error('logout_presence error:', err);
      }
    });

    socket.on('disconnect', async (reason) => {
      console.log(`Client disconnected: ${socket.id} — reason: ${reason}`);

      // Tell every room this socket was typing in that it has stopped, then
      // drop the timers. Without this a tab that closes mid-compose leaves the
      // other side's typing indicator up until its own timer happens to fire,
      // and leaks a pending timeout per conversation.
      for (const [key, timer] of typingTimers) {
        clearTimeout(timer);
        const conversationId = key.slice(0, key.lastIndexOf(':'));
        socket.to(conversationId).emit('user_stopped_typing', {
          conversationId,
          userId: authUserId,
        });
      }
      typingTimers.clear();

      const userId = socket.data.userId as string | undefined;
      if (!userId) return;
      try {
        // Mark offline with a 5-minute TTL so lastSeen stays queryable briefly
        // after disconnect, then the key expires naturally (lastSeen: null).
        const { lastSeen } = await writePresence(userId, false, 300);
        await broadcastPresenceChange(userId, false, lastSeen);
      } catch (err) {
        console.error('disconnect presence-update error:', err);
      }
    });
  });

  return io;
};
