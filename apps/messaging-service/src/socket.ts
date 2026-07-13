import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import mongoose from 'mongoose';
import { Conversation, Message } from './models/index.js';
import { isMongoConnected } from './database.js';
import { getRedisClient } from './utils/redis.js';
import { publishMessageReceivedEvent } from './lib/publish-message-event.js';
import { resolveUserName } from './lib/resolve-username.js';

export let io: SocketIOServer;

export const initializeSocket = async (
  httpServer: HttpServer,
  skipRedis = false
): Promise<SocketIOServer> => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // tighten this in production
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
            content: m.content,
            createdAt: m.createdAt,
            readAt: m.readAt ?? null,
          })),
        });
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
      async (data: {
        conversationId: string;
        content: string;
        senderId: string;
      }) => {
        const { conversationId, content, senderId } = data;

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

          const conversation = await Conversation.findById(conversationId);
          if (!conversation) {
            console.warn(
              `[${socket.id}] send_message: conversation ${conversationId} not found in ` +
                `${mongoose.connection.db?.databaseName ?? 'NOT CONNECTED'}.${Conversation.collection.name}`
            );
            socket.emit('error', { message: 'Conversation not found' });
            return;
          }

          // Save message to MongoDB
          console.log(
            `[${socket.id}] Creating message for conversation ${conversationId}...`
          );
          const message = await Message.create({
            conversationId,
            senderId,
            content: content.trim(),
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
              content: content.trim(),
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
            content: message.content,
            createdAt: message.createdAt,
          };

          io.to(conversationId).emit('new_message', messagePayload);

          console.log(
            `\u2713 Message saved and broadcast to conversation ${conversationId}`
          );

          // Fire-and-forget: a RabbitMQ outage must never block real-time
          // delivery, which has already happened via the emit above.
          const recipientId = conversation.participants.find(
            (p) => p !== senderId
          );
          publishMessageReceivedEvent({
            messageId: message._id.toString(),
            conversationId,
            senderId,
            recipientId: recipientId ?? null,
            content: message.content,
          }).catch((err) => {
            console.error(
              `[${socket.id}] Failed to publish message.received event:`,
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
        const userId = socket.data.userId as string | undefined;
        if (!mongoose.Types.ObjectId.isValid(messageId)) return;
        try {
          const readAt = new Date();
          const updated = await Message.findByIdAndUpdate(
            messageId,
            { $set: { readAt } },
            { new: false }
          );
          if (!updated) return;

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

    // Event 4: typing_start
    // Client emits while composing. Server sets a 5 s Redis TTL and broadcasts to room.
    socket.on(
      'typing_start',
      async (data: { conversationId: string; userId: string }) => {
        const { conversationId, userId } = data;
        if (!conversationId || !userId) return;
        try {
          await getRedisClient().set(
            `typing:${conversationId}:${userId}`,
            '1',
            'EX',
            5
          );
          socket
            .to(conversationId)
            .emit('user_typing', { conversationId, userId });
        } catch (err) {
          console.error('typing_start error:', err);
        }
      }
    );

    // Event 5: typing_stop
    // Client emits when done composing. Server deletes the key and broadcasts to room.
    socket.on(
      'typing_stop',
      async (data: { conversationId: string; userId: string }) => {
        const { conversationId, userId } = data;
        if (!conversationId || !userId) return;
        try {
          await getRedisClient().del(`typing:${conversationId}:${userId}`);
          socket
            .to(conversationId)
            .emit('user_stopped_typing', { conversationId, userId });
        } catch (err) {
          console.error('typing_stop error:', err);
        }
      }
    );

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
    // Client emits immediately after connect with their userId. There is no
    // socket-level JWT handshake yet, so the server only learns which user
    // this connection belongs to once the client tells it — this is the
    // earliest practical point to start tracking presence.
    socket.on('register_presence', async (data: { userId: string }) => {
      const { userId } = data;
      if (!userId) return;
      socket.data.userId = userId;
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
