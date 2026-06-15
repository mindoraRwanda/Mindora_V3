import { Server as HttpServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { createClient } from 'redis'
import { createAdapter } from '@socket.io/redis-adapter'
import mongoose from 'mongoose'
import { Conversation, Message } from './models'
import { isMongoConnected } from './database'

export let io: SocketIOServer

export const initializeSocket = async (httpServer: HttpServer, skipRedis = false): Promise<SocketIOServer> => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // tighten this in production
      methods: ['GET', 'POST']
    }
  })

  if (!skipRedis) {
    // Create two Redis clients — Socket.io adapter requires a pub and a sub client
    const pubClient = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379'
    })
    const subClient = pubClient.duplicate()

    // Connect both before attaching the adapter
    await Promise.all([pubClient.connect(), subClient.connect()])

    io.adapter(createAdapter(pubClient, subClient))
  }

  console.log('✓ Socket.io initialised with Redis adapter')
  
  // DIAGNOSTIC: Log model registration details
  console.log('\n=== MODEL REGISTRATION DETAILS ===')
  console.log(`Mongoose connection state: ${mongoose.connection.readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`)
  console.log(`Mongoose DB name: ${mongoose.connection.db?.databaseName || 'NOT CONNECTED'}`)
  console.log(`Conversation model name: ${Conversation.modelName}`)
  console.log(`Conversation collection name: ${Conversation.collection.name}`)
  console.log(`Conversation collection db: ${Conversation.collection.db?.databaseName || 'N/A'}`)
  console.log(`Message model name: ${Message.modelName}`)
  console.log(`Message collection name: ${Message.collection.name}`)
  console.log(`====================================\n`)

  // Log every connection and disconnection for now
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)

    // Event 0: create_conversation
    // Client emits this to create a new conversation without making an HTTP call.
    // Useful when the page is opened via file:// where fetch() is blocked by CORS.
    socket.on('create_conversation', async (data: { participants: [string, string] }) => {
      try {
        if (!isMongoConnected()) {
          socket.emit('error', { message: 'Database temporarily unavailable. Please try again.' })
          return
        }

        const participants = data?.participants
        if (!Array.isArray(participants) || participants.length !== 2 ||
            !participants.every((p) => typeof p === 'string' && p.trim().length > 0)) {
          socket.emit('error', { message: 'participants must be an array of exactly 2 non-empty user ID strings' })
          return
        }

        const conversation = await Conversation.create({ participants })
        console.log(`✓ Conversation created via socket: ${conversation._id}`)
        socket.emit('conversation_created', {
          _id: conversation._id.toString(),
          participants: conversation.participants
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`✗ create_conversation error for socket ${socket.id}:`, errorMsg)
        socket.emit('error', { message: 'Failed to create conversation' })
      }
    })

    // Event 1: join_conversation
    // Client emits this when they open a chat window
    socket.on('join_conversation', async (data: { conversationId: string }) => {
      const { conversationId } = data

      try {
        // DIAGNOSTIC: Log connection state and database info
        const dbName = mongoose.connection.db?.databaseName ?? 'NOT CONNECTED'
        console.log(`\n=== JOIN_CONVERSATION DEBUG ===`)
        console.log(`Socket ID: ${socket.id}`)
        console.log(`Conversation ID: ${conversationId}`)
        console.log(`Mongoose connection state: ${mongoose.connection.readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`)
        console.log(`mongoose.connection.db.databaseName: ${dbName}`)
        console.log(`Conversation model name: ${Conversation.modelName}`)
        console.log(`Conversation collection name: ${Conversation.collection.name}`)
        console.log(`Conversation model source: ./models (single mongoose.connection)`)
        console.log(`================================\n`)

        // Check if MongoDB connection is active before querying
        if (!isMongoConnected()) {
          console.warn(`\u26a0 join_conversation: MongoDB not connected for socket ${socket.id}`)
          socket.emit('error', { message: 'Database temporarily unavailable. Please try again.' })
          return
        }

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
          console.warn(`\u26a0 join_conversation: Invalid ObjectId format: ${conversationId}`)
          socket.emit('error', { message: 'Invalid conversation ID' })
          return
        }

        // Query with detailed logging
        console.log(`[${socket.id}] Querying Conversation.findById(${conversationId})...`)
        const conversation = await Conversation.findById(conversationId)
        
        console.log(`[${socket.id}] Query result:`, conversation ? `Found document` : 'NULL - document not found')
        if (conversation) {
          console.log(`[${socket.id}] Document details:`, {
            _id: conversation._id.toString(),
            participants: conversation.participants,
            hasLastMessage: !!conversation.lastMessage
          })
        }

        if (!conversation) {
          console.warn(
            `[${socket.id}] DIAGNOSTIC: Conversation ${conversationId} not found in ` +
              `${dbName}.${Conversation.collection.name}. Listing available IDs...`
          )
          const allConversations = await Conversation.find({}).select('_id participants').limit(10)
          console.log(`[${socket.id}] ${allConversations.length} conversation(s) in collection:`)
          allConversations.forEach((doc, idx) => {
            console.log(`  [${idx}] ${doc._id.toString()} - participants: ${doc.participants.join(', ')}`)
          })
          if (allConversations.length > 0) {
            console.warn(
              `[${socket.id}] Requested ID "${conversationId}" does not match any _id above. ` +
                'Compass may show a similar-looking ObjectId — compare every character.'
            )
          }

          socket.emit('error', { message: 'Conversation not found' })
          return
        }

        // Join the room named after the conversationId
        socket.join(conversationId)
        console.log(`\u2713 Socket ${socket.id} joined conversation ${conversationId}`)

        // Confirm to the client that they joined
        socket.emit('joined_conversation', { conversationId })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        const errorStack = error instanceof Error ? error.stack : ''
        console.error(`\u2717 join_conversation error for socket ${socket.id}:`, errorMsg)
        console.error(`Stack:`, errorStack)
        
        if (errorMsg.includes('buffering timed out') || errorMsg.includes('ECONNREFUSED')) {
          socket.emit('error', { message: 'Database connection error. Service recovering...' })
        } else {
          socket.emit('error', { message: 'Failed to join conversation' })
        }
      }
    })

    // Event 2: send_message
    // Client emits this when they type and send a message
    socket.on('send_message', async (data: {
      conversationId: string
      content: string
      senderId: string
    }) => {
      const { conversationId, content, senderId } = data

      try {
        // Check if MongoDB connection is active before querying
        if (!isMongoConnected()) {
          console.warn(`\u26a0 send_message: MongoDB not connected for socket ${socket.id}`)
          socket.emit('error', { message: 'Database temporarily unavailable. Please try again.' })
          return
        }

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
          socket.emit('error', { message: 'Invalid conversation ID' })
          return
        }

        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message content cannot be empty' })
          return
        }

        const conversation = await Conversation.findById(conversationId)
        if (!conversation) {
          console.warn(
            `[${socket.id}] send_message: conversation ${conversationId} not found in ` +
              `${mongoose.connection.db?.databaseName ?? 'NOT CONNECTED'}.${Conversation.collection.name}`
          )
          socket.emit('error', { message: 'Conversation not found' })
          return
        }

        // Save message to MongoDB
        console.log(`[${socket.id}] Creating message for conversation ${conversationId}...`)
        const message = await Message.create({
          conversationId,
          senderId,
          content: content.trim()
        })
        console.log(`[${socket.id}] Message created with ID: ${message._id}`)

        // Update the lastMessage field on the conversation
        console.log(`[${socket.id}] Updating conversation ${conversationId} lastMessage...`)
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: {
            content: content.trim(),
            senderId,
            sentAt: message.createdAt
          }
        })

        // Broadcast to everyone in the room including the sender
        const messagePayload = {
          _id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          createdAt: message.createdAt
        }

        io.to(conversationId).emit('new_message', messagePayload)

        console.log(`\u2713 Message saved and broadcast to conversation ${conversationId}`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`\u2717 send_message error for socket ${socket.id}:`, errorMsg)
        
        if (errorMsg.includes('buffering timed out') || errorMsg.includes('ECONNREFUSED')) {
          socket.emit('error', { message: 'Database connection error. Service recovering...' })
        } else {
          socket.emit('error', { message: 'Failed to send message' })
        }
      }
    })
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id} — reason: ${reason}`)
    })
  })

  return io
}