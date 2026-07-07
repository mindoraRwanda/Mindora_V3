import swaggerJsdoc from 'swagger-jsdoc';

const socketEventsMarkdown = `
## Real-time Communication (Socket.io)

Connect to \`ws://localhost:3006\` using the Socket.io client library.
Message content is **encrypted at rest** (AES-256-GCM) and decrypted before being returned by the REST API.

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| \`register_presence\` | \`{ userId: string }\` | Register online status. Sets a 90 s Redis TTL. Call immediately after connect. |
| \`heartbeat\` | _none_ | Refresh presence TTL. Emit every 30 s to stay marked online. |
| \`logout_presence\` | _none_ | Delete presence key immediately (e.g. on tab \`beforeunload\`). |
| \`create_conversation\` | \`{ participants: [userId, userId] }\` | Create or retrieve an existing conversation without an HTTP round-trip. |
| \`join_conversation\` | \`{ conversationId: string }\` | Join a Socket.io room and receive the last 50 messages as \`message_history\`. |
| \`send_message\` | \`{ conversationId: string, content: string, senderId: string }\` | Persist a message and broadcast to all room members. |
| \`mark_read\` | \`{ conversationId: string, messageId: string }\` | Mark a message as read; notifies the sender's socket via \`message_read\`. |
| \`typing_start\` | \`{ conversationId: string, userId: string }\` | Broadcast typing indicator. Auto-expires from Redis after 5 s. |
| \`typing_stop\` | \`{ conversationId: string, userId: string }\` | Clear the typing indicator immediately. |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| \`conversation_created\` | \`{ _id: string, participants: string[] }\` | Response to \`create_conversation\`. |
| \`joined_conversation\` | \`{ conversationId: string }\` | Confirms room join after \`join_conversation\`. |
| \`message_history\` | \`{ conversationId: string, messages: Message[] }\` | Sent immediately after \`join_conversation\` with the last 50 messages. |
| \`new_message\` | \`{ _id, conversationId, senderId, content, createdAt }\` | Broadcast to all room members when a message is saved. |
| \`message_read\` | \`{ conversationId: string, messageId: string }\` | Emitted to the room (excluding sender's socket) on \`mark_read\`. |
| \`user_typing\` | \`{ conversationId: string, userId: string }\` | Broadcast to the room on \`typing_start\`. |
| \`user_stopped_typing\` | \`{ conversationId: string, userId: string }\` | Broadcast to the room on \`typing_stop\`. |
| \`error\` | \`{ message: string }\` | Emitted to the originating socket for any validation or server-side error. |
`;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mindora Messaging Service',
      version: '1.0.0',
      description:
        'REST API for the Mindora Messaging Service. Handles 1-to-1 conversations, ' +
        'cursor-paginated message history, and user presence.\n\n' +
        socketEventsMarkdown,
    },
    servers: [
      { url: 'http://localhost:3006', description: 'Local development' },
      { url: 'http://localhost:8000', description: 'Via Kong Gateway' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT access token. Obtain one from POST /api/v1/auth/login',
        },
      },
      schemas: {
        Conversation: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            participants: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
              maxItems: 2,
              example: ['patient-123', 'therapist-456'],
            },
            lastMessage: {
              nullable: true,
              type: 'object',
              properties: {
                content: { type: 'string', example: 'See you Thursday!' },
                senderId: { type: 'string', example: 'therapist-456' },
                sentAt: { type: 'string', format: 'date-time' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ConversationSummary: {
          type: 'object',
          description:
            'Compact conversation view returned by the list endpoint.',
          properties: {
            conversationId: {
              type: 'string',
              example: '64f1a2b3c4d5e6f7a8b9c0d1',
            },
            participantId: {
              type: 'string',
              nullable: true,
              description:
                'The other participant — null if conversation has only one member.',
              example: 'therapist-456',
            },
            lastMessage: {
              type: 'string',
              nullable: true,
              example: 'See you Thursday!',
            },
            lastMessageAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            unreadCount: { type: 'integer', example: 3 },
          },
        },
        Message: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d3' },
            conversationId: {
              type: 'string',
              example: '64f1a2b3c4d5e6f7a8b9c0d1',
            },
            senderId: { type: 'string', example: 'patient-123' },
            content: {
              type: 'string',
              description: 'Decrypted message text.',
              example: 'Hello, looking forward to our session.',
            },
            readAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        PresenceStatus: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'therapist-456' },
            online: { type: 'boolean', example: true },
          },
        },
        PaginatedConversations: {
          type: 'object',
          properties: {
            conversations: {
              type: 'array',
              items: { $ref: '#/components/schemas/ConversationSummary' },
            },
            total: { type: 'integer', example: 12 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
          },
        },
        PaginatedMessages: {
          type: 'object',
          properties: {
            messages: {
              type: 'array',
              items: { $ref: '#/components/schemas/Message' },
              description: 'Messages sorted newest-first.',
            },
            nextCursor: {
              type: 'string',
              nullable: true,
              description:
                'Pass as the `cursor` query parameter in the next request to page backward through history. Null when no more pages exist.',
              example: '64f1a2b3c4d5e6f7a8b9c0d2',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Conversation not found' },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            service: { type: 'string', example: 'messaging-service' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
