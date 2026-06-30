import { Router, Response } from 'express'
import mongoose from 'mongoose'
import { authenticate, type AuthenticatedRequest } from '@mindora/auth-middleware'
import { Conversation, Message } from '../models/index.js'
import { decryptContent } from '../utils/encryption.js'

const router = Router()

const DEFAULT_PAGE_SIZE = 20

// POST / — find existing conversation or create a new one
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { participantId } = req.body as { participantId?: unknown }
  if (!participantId || typeof participantId !== 'string' || participantId.trim().length === 0) {
    res.status(400).json({ error: 'participantId is required' })
    return
  }

  if (participantId === userId) {
    res.status(400).json({ error: 'Cannot start a conversation with yourself' })
    return
  }

  try {
    const existing = await Conversation.findOne({
      participants: { $all: [userId, participantId], $size: 2 }
    })

    if (existing) {
      res.status(200).json(existing)
      return
    }

    const conversation = await Conversation.create({ participants: [userId, participantId] })
    res.status(201).json(conversation)
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({ error: error.message })
      return
    }
    console.error('Create conversation error:', error)
    res.status(500).json({ error: 'Failed to create conversation' })
  }
})

// GET / — list all conversations for the authenticated user
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || DEFAULT_PAGE_SIZE))
  const skip = (page - 1) * limit

  try {
    const [conversations, total] = await Promise.all([
      Conversation.find({ participants: userId })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments({ participants: userId })
    ])

    const conversationIds = conversations.map((c) => c._id)

    const unreadCounts = await Message.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      {
        $match: {
          conversationId: { $in: conversationIds },
          senderId: { $ne: userId },
          readAt: null
        }
      },
      { $group: { _id: '$conversationId', count: { $sum: 1 } } }
    ])

    const unreadMap = new Map(unreadCounts.map((u) => [u._id.toString(), u.count]))

    const result = conversations.map((c) => ({
      conversationId: c._id,
      participantId: c.participants.find((p) => p !== userId) ?? null,
      lastMessage: c.lastMessage?.content ?? null,
      lastMessageAt: c.lastMessage?.sentAt ?? null,
      unreadCount: unreadMap.get(c._id.toString()) ?? 0
    }))

    res.json({ conversations: result, total, page, limit })
  } catch (error) {
    console.error('List conversations error:', error)
    res.status(500).json({ error: 'Failed to fetch conversations' })
  }
})

// GET /:id — cursor-based paginated chat history (decrypts content before returning)
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { id } = req.params
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    res.status(400).json({ error: 'Invalid conversation ID' })
    return
  }

  try {
    const conversation = await Conversation.findById(id)
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' })
      return
    }

    if (!conversation.participants.includes(userId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || DEFAULT_PAGE_SIZE))
    const cursor = req.query.cursor as string | undefined

    const filter: mongoose.FilterQuery<typeof Message> = { conversationId: id }
    if (cursor) {
      if (!mongoose.Types.ObjectId.isValid(cursor)) {
        res.status(400).json({ error: 'Invalid cursor' })
        return
      }
      filter._id = { $lt: new mongoose.Types.ObjectId(cursor) }
    }

    // Fetch one extra to determine if there are more pages
    const raw = await Message.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean()

    const hasMore = raw.length > limit
    if (hasMore) raw.pop()

    const messages = raw.map((m) => ({ ...m, content: decryptContent(m.content) }))
    const nextCursor = hasMore ? raw[raw.length - 1]._id.toString() : null

    res.json({ messages, nextCursor })
  } catch (error) {
    console.error('Fetch chat history error:', error)
    res.status(500).json({ error: 'Failed to fetch chat history' })
  }
})

export default router
