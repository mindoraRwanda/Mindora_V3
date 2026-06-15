import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import mongoose from 'mongoose'
import { Conversation } from '../models/Conversation'
import { Message } from '../models/Message'

beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/mindora_messaging_models_test')
})

beforeEach(async () => {
  await Conversation.deleteMany({})
  await Message.deleteMany({})
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

describe('Conversation model', () => {
  it('creates a conversation with 2 participants', async () => {
    const conv = await Conversation.create({ participants: ['user-a', 'user-b'] })
    expect(conv._id).toBeDefined()
    expect(conv.participants).toEqual(['user-a', 'user-b'])
    expect(conv.createdAt).toBeDefined()
    expect(conv.updatedAt).toBeDefined()
    expect(conv.lastMessage?.content).toBeUndefined()
  })

  it('rejects a conversation with only 1 participant', async () => {
    await expect(
      Conversation.create({ participants: ['user-a'] })
    ).rejects.toThrow()
  })

  it('rejects a conversation with 3 participants', async () => {
    await expect(
      Conversation.create({ participants: ['user-a', 'user-b', 'user-c'] })
    ).rejects.toThrow()
  })

  it('rejects a conversation with no participants', async () => {
    await expect(
      Conversation.create({ participants: [] })
    ).rejects.toThrow()
  })

  it('rejects a conversation with missing participants field', async () => {
    await expect(
      Conversation.create({})
    ).rejects.toThrow()
  })

  it('stores and retrieves lastMessage', async () => {
    const conv = await Conversation.create({ participants: ['user-a', 'user-b'] })
    const sentAt = new Date()
    await Conversation.findByIdAndUpdate(conv._id, {
      lastMessage: { content: 'Hi there', senderId: 'user-a', sentAt }
    })
    const updated = await Conversation.findById(conv._id)
    expect(updated!.lastMessage!.content).toBe('Hi there')
    expect(updated!.lastMessage!.senderId).toBe('user-a')
  })
})

describe('Message model', () => {
  it('creates a message linked to a conversation', async () => {
    const conv = await Conversation.create({ participants: ['user-a', 'user-b'] })
    const msg = await Message.create({
      conversationId: conv._id,
      senderId: 'user-a',
      content: 'Hello!'
    })
    expect(msg._id).toBeDefined()
    expect(msg.conversationId.toString()).toBe(conv._id.toString())
    expect(msg.senderId).toBe('user-a')
    expect(msg.content).toBe('Hello!')
    expect(msg.readAt).toBeNull()
    expect(msg.createdAt).toBeDefined()
  })

  it('trims whitespace from content', async () => {
    const conv = await Conversation.create({ participants: ['user-a', 'user-b'] })
    const msg = await Message.create({
      conversationId: conv._id,
      senderId: 'user-a',
      content: '  trimmed  '
    })
    expect(msg.content).toBe('trimmed')
  })

  it('rejects a message with missing conversationId', async () => {
    await expect(
      Message.create({ senderId: 'user-a', content: 'No conv' })
    ).rejects.toThrow()
  })

  it('rejects a message with missing senderId', async () => {
    const conv = await Conversation.create({ participants: ['user-a', 'user-b'] })
    await expect(
      Message.create({ conversationId: conv._id, content: 'No sender' })
    ).rejects.toThrow()
  })

  it('rejects a message with missing content', async () => {
    const conv = await Conversation.create({ participants: ['user-a', 'user-b'] })
    await expect(
      Message.create({ conversationId: conv._id, senderId: 'user-a' })
    ).rejects.toThrow()
  })

  it('rejects a message with invalid conversationId format', async () => {
    await expect(
      Message.create({ conversationId: 'not-an-objectid', senderId: 'user-a', content: 'Hi' })
    ).rejects.toThrow()
  })
})
