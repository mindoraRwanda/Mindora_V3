import express, { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Conversation } from './models'

const SERVICE_NAME = 'messaging-service';
const GATEWAY_HEALTH_PATH = '/api/v1/messaging/health';
const app = express()

app.use(express.json())

const healthResponse = () => ({
  status: 'ok',
  service: SERVICE_NAME,
});

app.get('/health', (_req, res) => {
  res.status(200).json(healthResponse());
});

app.get(GATEWAY_HEALTH_PATH, (_req, res) => {
  res.status(200).json(healthResponse());
});

app.post('/api/v1/messaging/conversations', async (req: Request, res: Response) => {
  const { participants } = req.body

  if (!Array.isArray(participants) || participants.length !== 2 ||
      !participants.every((p) => typeof p === 'string' && p.trim().length > 0)) {
    res.status(400).json({ error: 'participants must be an array of exactly 2 non-empty user ID strings' })
    return
  }

  try {
    const conversation = await Conversation.create({ participants })
    res.status(201).json(conversation)
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to create conversation' })
  }
})

app.get('/api/v1/messaging/conversations/:id', async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
    res.status(400).json({ error: 'Invalid conversation ID' })
    return
  }

  try {
    const conversation = await Conversation.findById(req.params.id)
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' })
      return
    }
    res.json(conversation)
  } catch {
    res.status(500).json({ error: 'Failed to fetch conversation' })
  }
})

export default app