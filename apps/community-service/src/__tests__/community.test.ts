import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import supertest from 'supertest'
import mongoose from 'mongoose'
import app from '../app'
import { CommunityGroup, Post } from '../models'

const request = supertest(app)

// A real test token signed with the dev secret
// This matches the JWT_SECRET=mindora-dev-jwt-secret-change-in-production in .env
import jwt from 'jsonwebtoken'

const TEST_SECRET = 'mindora-dev-jwt-secret-change-in-production'

const testToken = jwt.sign(
  {
    sub: 'test-user-123',
    email: 'karimi@mindora.com',
    role: 'PATIENT'
  },
  TEST_SECRET,
  {
    expiresIn: '7d',
    issuer: 'mindora',
    jwtid: 'test-jti-001'
  }
)

const authHeader = `Bearer ${testToken}`

// Connect to a separate test database before tests run
beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/mindora_community_test')
})

// Clean the database before each test so tests don't affect each other
beforeEach(async () => {
  await CommunityGroup.deleteMany({})
  await Post.deleteMany({})
})

// Disconnect after all tests finish
afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

// ─── Create Group Tests ────────────────────────────────────────────────────

describe('POST /api/v1/community/groups', () => {
  it('creates a group successfully with valid data', async () => {
    const response = await request
      .post('/api/v1/community/groups')
      .set('Authorization', authHeader)
      .send({
        name: 'Anxiety Support Circle',
        description: 'A safe space for people managing anxiety in their daily lives',
        category: 'ANXIETY',
        isAnonymous: false
      })

    expect(response.status).toBe(201)
    expect(response.body.name).toBe('Anxiety Support Circle')
    expect(response.body.category).toBe('ANXIETY')
    expect(response.body._id).toBeDefined()
    expect(response.body.memberCount).toBe(0)
  })

  it('returns 401 when no auth token is provided', async () => {
    const response = await request
      .post('/api/v1/community/groups')
      .send({
        name: 'Test Group',
        description: 'A test group description that is long enough',
        category: 'STRESS',
        isAnonymous: false
      })

    expect(response.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    const response = await request
      .post('/api/v1/community/groups')
      .set('Authorization', authHeader)
      .send({
        name: 'Missing description and category'
      })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('Validation failed')
  })

  it('returns 400 when name is too short', async () => {
    const response = await request
      .post('/api/v1/community/groups')
      .set('Authorization', authHeader)
      .send({
        name: 'Hi',
        description: 'A valid description that is long enough to pass validation',
        category: 'ANXIETY',
        isAnonymous: false
      })

    expect(response.status).toBe(400)
  })
})

// ─── List Groups Tests ─────────────────────────────────────────────────────

describe('GET /api/v1/community/groups', () => {
  it('returns paginated list of groups', async () => {
    // Seed 3 groups directly into the test database
    await CommunityGroup.insertMany([
      { name: 'Group One', description: 'Description for group one that is long enough', category: 'ANXIETY', isAnonymous: false, memberCount: 0 },
      { name: 'Group Two', description: 'Description for group two that is long enough', category: 'GRIEF', isAnonymous: true, memberCount: 0 },
      { name: 'Group Three', description: 'Description for group three that is long enough', category: 'STRESS', isAnonymous: false, memberCount: 0 }
    ])

    const response = await request.get('/api/v1/community/groups')

    expect(response.status).toBe(200)
    expect(response.body.groups).toHaveLength(3)
    expect(response.body.total).toBe(3)
    expect(response.body.page).toBe(1)
    expect(response.body.limit).toBe(10)
  })

  it('respects page and limit query params', async () => {
    await CommunityGroup.insertMany([
      { name: 'Group One', description: 'Description for group one that is long enough', category: 'ANXIETY', isAnonymous: false, memberCount: 0 },
      { name: 'Group Two', description: 'Description for group two that is long enough', category: 'GRIEF', isAnonymous: false, memberCount: 0 },
      { name: 'Group Three', description: 'Description for group three that is long enough', category: 'STRESS', isAnonymous: false, memberCount: 0 }
    ])

    const response = await request.get('/api/v1/community/groups?page=1&limit=2')

    expect(response.status).toBe(200)
    expect(response.body.groups).toHaveLength(2)
    expect(response.body.total).toBe(3)
    expect(response.body.page).toBe(1)
    expect(response.body.limit).toBe(2)
  })

  it('returns empty array when no groups exist', async () => {
    const response = await request.get('/api/v1/community/groups')

    expect(response.status).toBe(200)
    expect(response.body.groups).toHaveLength(0)
    expect(response.body.total).toBe(0)
  })
})

// ─── Create Post Tests ─────────────────────────────────────────────────────

describe('POST /api/v1/community/groups/:id/posts', () => {
  it('creates an anonymous post and hides author in response', async () => {
    const group = await CommunityGroup.create({
      name: 'Test Group',
      description: 'A test group description that is long enough to pass',
      category: 'ANXIETY',
      isAnonymous: true,
      memberCount: 0
    })

    const response = await request
      .post(`/api/v1/community/groups/${group._id}/posts`)
      .set('Authorization', authHeader)
      .send({
        content: 'I have been struggling and needed somewhere to share this.',
        isAnonymous: true
      })

    expect(response.status).toBe(201)
    expect(response.body.isAnonymous).toBe(true)
    expect(response.body.author).toBeNull()
    // The raw userId must never appear in the response
    expect(JSON.stringify(response.body)).not.toContain('test-user-123')
  })

  it('creates a non-anonymous post and includes author in response', async () => {
    const group = await CommunityGroup.create({
      name: 'Test Group',
      description: 'A test group description that is long enough to pass',
      category: 'STRESS',
      isAnonymous: false,
      memberCount: 0
    })

    const response = await request
      .post(`/api/v1/community/groups/${group._id}/posts`)
      .set('Authorization', authHeader)
      .send({
        content: 'Sharing openly because I am comfortable here.',
        isAnonymous: false
      })

    expect(response.status).toBe(201)
    expect(response.body.isAnonymous).toBe(false)
    expect(response.body.author).not.toBeNull()
    expect(response.body.author.userId).toBe('test-user-123')
  })

  it('returns 404 for a group that does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId()

    const response = await request
      .post(`/api/v1/community/groups/${fakeId}/posts`)
      .set('Authorization', authHeader)
      .send({
        content: 'This should not work.',
        isAnonymous: false
      })

    expect(response.status).toBe(404)
  })

  it('returns 400 for invalid group ID format', async () => {
    const response = await request
      .post('/api/v1/community/groups/not-a-valid-id/posts')
      .set('Authorization', authHeader)
      .send({
        content: 'This should not work either.',
        isAnonymous: false
      })

    expect(response.status).toBe(400)
  })
})