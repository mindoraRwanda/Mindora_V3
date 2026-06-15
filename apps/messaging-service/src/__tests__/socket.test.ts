import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import mongoose from 'mongoose'
import http from 'http'
import { io as ioClient, Socket } from 'socket.io-client'
import { Conversation } from '../models/Conversation'
import { initializeSocket } from '../socket'

// vi.mock is hoisted by vitest before all imports, so socket.ts's
// import of isMongoConnected from ./database gets the mock version.
vi.mock('../database', () => ({
  isMongoConnected: () => true,
  connectDatabase: () => Promise.resolve()
}))

const TEST_PORT = 3099
const TEST_DB = 'mongodb://localhost:27017/mindora_messaging_socket_test'

let server: http.Server

function connectClient(): Promise<Socket> {
  return new Promise((resolve) => {
    const socket = ioClient(`http://localhost:${TEST_PORT}`, { forceNew: true })
    socket.once('connect', () => resolve(socket))
  })
}

function nextEvent(socket: Socket, event: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for "${event}"`)), 3000)
    socket.once(event, (data) => { clearTimeout(timer); resolve(data) })
  })
}

beforeAll(async () => {
  await mongoose.connect(TEST_DB)
  server = http.createServer()
  await initializeSocket(server, true) // skipRedis — use in-memory adapter
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve))
})

beforeEach(async () => {
  await Conversation.deleteMany({})
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

describe('create_conversation', () => {
  it('creates a conversation and emits conversation_created', async () => {
    const client = await connectClient()

    client.emit('create_conversation', { participants: ['user-a', 'user-b'] })
    const data = await nextEvent(client, 'conversation_created') as { _id: string; participants: string[] }

    expect(data._id).toBeDefined()
    expect(data.participants).toEqual(['user-a', 'user-b'])

    const saved = await Conversation.findById(data._id)
    expect(saved).not.toBeNull()

    client.disconnect()
  })

  it('emits error when participants array has fewer than 2 entries', async () => {
    const client = await connectClient()

    client.emit('create_conversation', { participants: ['only-one'] })
    const err = await nextEvent(client, 'error') as { message: string }

    expect(err.message).toMatch(/participants/)
    client.disconnect()
  })

  it('emits error when participants is missing', async () => {
    const client = await connectClient()

    client.emit('create_conversation', {})
    const err = await nextEvent(client, 'error') as { message: string }

    expect(err.message).toBeDefined()
    client.disconnect()
  })
})

describe('join_conversation', () => {
  it('emits joined_conversation when the conversation exists', async () => {
    const conv = await Conversation.create({ participants: ['user-a', 'user-b'] })
    const client = await connectClient()

    client.emit('join_conversation', { conversationId: conv._id.toString() })
    const data = await nextEvent(client, 'joined_conversation') as { conversationId: string }

    expect(data.conversationId).toBe(conv._id.toString())
    client.disconnect()
  })

  it('emits error with "Conversation not found" for a valid but non-existent ID', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    const client = await connectClient()

    client.emit('join_conversation', { conversationId: fakeId })
    const err = await nextEvent(client, 'error') as { message: string }

    expect(err.message).toBe('Conversation not found')
    client.disconnect()
  })

  it('emits error with "Invalid conversation ID" for a malformed ID', async () => {
    const client = await connectClient()

    client.emit('join_conversation', { conversationId: 'not-an-objectid' })
    const err = await nextEvent(client, 'error') as { message: string }

    expect(err.message).toBe('Invalid conversation ID')
    client.disconnect()
  })
})

describe('send_message', () => {
  it('broadcasts new_message to all sockets in the room', async () => {
    const conv = await Conversation.create({ participants: ['user-a', 'user-b'] })
    const convId = conv._id.toString()

    const sender = await connectClient()
    const receiver = await connectClient()

    sender.emit('join_conversation', { conversationId: convId })
    await nextEvent(sender, 'joined_conversation')

    receiver.emit('join_conversation', { conversationId: convId })
    await nextEvent(receiver, 'joined_conversation')

    const receivedPromise = nextEvent(receiver, 'new_message')
    sender.emit('send_message', {
      conversationId: convId,
      senderId: 'user-a',
      content: 'Hello from test'
    })

    const msg = await receivedPromise as Record<string, unknown>
    expect(msg.content).toBe('Hello from test')
    expect(msg.senderId).toBe('user-a')
    expect(msg.conversationId).toBe(convId)
    expect(msg._id).toBeDefined()

    sender.disconnect()
    receiver.disconnect()
  })

  it('emits error when content is empty', async () => {
    const conv = await Conversation.create({ participants: ['user-a', 'user-b'] })
    const client = await connectClient()

    client.emit('join_conversation', { conversationId: conv._id.toString() })
    await nextEvent(client, 'joined_conversation')

    client.emit('send_message', { conversationId: conv._id.toString(), senderId: 'user-a', content: '   ' })
    const err = await nextEvent(client, 'error') as { message: string }

    expect(err.message).toBe('Message content cannot be empty')
    client.disconnect()
  })

  it('emits error when the conversation does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    const client = await connectClient()

    client.emit('send_message', { conversationId: fakeId, senderId: 'user-a', content: 'Hello' })
    const err = await nextEvent(client, 'error') as { message: string }

    expect(err.message).toBe('Conversation not found')
    client.disconnect()
  })
})
