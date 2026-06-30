import express from 'express'
import conversationsRouter from './routes/conversations.routes.js'
import { authenticate } from '@mindora/auth-middleware'
import type { AuthenticatedRequest } from '@mindora/auth-middleware'

import { getRedisClient } from './utils/redis.js'

const SERVICE_NAME = 'messaging-service'
const GATEWAY_HEALTH_PATH = '/api/v1/messaging/health'
const app = express()

app.use(express.json())

const healthResponse = () => ({ status: 'ok', service: SERVICE_NAME })

app.get('/health', (_req, res) => {
  res.status(200).json(healthResponse())
})

app.get(GATEWAY_HEALTH_PATH, (_req, res) => {
  res.status(200).json(healthResponse())
})

app.use('/api/v1/messaging/conversations', conversationsRouter)

// GET /api/v1/messaging/presence/:userId — check if a user is currently online
app.get('/api/v1/messaging/presence/:userId', authenticate, async (req: AuthenticatedRequest, res) => {
  const { userId } = req.params
  try {
    const exists = await getRedisClient().exists(`presence:${userId}`)
    res.json({ userId, online: exists === 1 })
  } catch {
    res.status(500).json({ error: 'Failed to check presence' })
  }
})

export default app
