import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import supertest from 'supertest'
import mongoose from 'mongoose'
import app from '../app'
import { Conversation } from '../models/Conversation'

const request = supertest(app)

beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/mindora_messaging_conversations_test')
})

beforeEach(async () => {
  await Conversation.deleteMany({})
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

describe('POST /api/v1/messaging/conversations', () => {
  it('creates a conversation with 2 valid participants', async () => {
    const res = await request
      .post('/api/v1/messaging/conversations')
      .send({ participants: ['patient-123', 'therapist-456'] })

    expect(res.status).toBe(201)
    expect(res.body._id).toBeDefined()
    expect(res.body.participants).toEqual(['patient-123', 'therapist-456'])
    expect(res.body.createdAt).toBeDefined()
  })

  it('returns 400 when participants has only 1 entry', async () => {
    const res = await request
      .post('/api/v1/messaging/conversations')
      .send({ participants: ['patient-123'] })

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it('returns 400 when participants has 3 entries', async () => {
    const res = await request
      .post('/api/v1/messaging/conversations')
      .send({ participants: ['user-a', 'user-b', 'user-c'] })

    expect(res.status).toBe(400)
  })

  it('returns 400 when participants is not an array', async () => {
    const res = await request
      .post('/api/v1/messaging/conversations')
      .send({ participants: 'patient-123' })

    expect(res.status).toBe(400)
  })

  it('returns 400 when participants contains empty strings', async () => {
    const res = await request
      .post('/api/v1/messaging/conversations')
      .send({ participants: ['patient-123', ''] })

    expect(res.status).toBe(400)
  })

  it('returns 400 when participants field is missing', async () => {
    const res = await request
      .post('/api/v1/messaging/conversations')
      .send({})

    expect(res.status).toBe(400)
  })
})

describe('GET /api/v1/messaging/conversations/:id', () => {
  it('returns the conversation for a valid existing ID', async () => {
    const conv = await Conversation.create({ participants: ['patient-123', 'therapist-456'] })

    const res = await request.get(`/api/v1/messaging/conversations/${conv._id}`)

    expect(res.status).toBe(200)
    expect(res.body._id).toBe(conv._id.toString())
    expect(res.body.participants).toEqual(['patient-123', 'therapist-456'])
  })

  it('returns 404 for a valid ObjectId that does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request.get(`/api/v1/messaging/conversations/${fakeId}`)

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Conversation not found')
  })

  it('returns 400 for a malformed ID', async () => {
    const res = await request.get('/api/v1/messaging/conversations/not-a-valid-id')

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid conversation ID')
  })
})
