import { Router, Response } from 'express'
import mongoose from 'mongoose'
import { authenticate, type AuthenticatedRequest } from '@mindora/auth-middleware'
import { Conversation, Message } from '../models/index.js'
import { decryptContent } from '../utils/encryption.js'

const router = Router()

const DEFAULT_PAGE_SIZE = 20

/**
 * @swagger
 * /api/v1/messaging/conversations:
 *   post:
 *     summary: Start or retrieve a conversation
 *     description: >
 *       Finds an existing 1-to-1 conversation between the authenticated user and
 *       `participantId`. Returns 200 if one already exists, or creates and returns
 *       a new one with 201. You cannot start a conversation with yourself.
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [participantId]
 *             properties:
 *               participantId:
 *                 type: string
 *                 description: User ID of the other participant.
 *                 example: therapist-456
 *     responses:
 *       201:
 *         description: New conversation created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       200:
 *         description: Existing conversation returned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Missing participantId, empty string, or self-conversation attempt.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing:
 *                 value: { error: 'participantId is required' }
 *               self:
 *                 value: { error: 'Cannot start a conversation with yourself' }
 *       401:
 *         description: Missing or invalid JWT.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/v1/messaging/conversations:
 *   get:
 *     summary: List conversations for the authenticated user
 *     description: >
 *       Returns a paginated list of the authenticated user's conversations, sorted by
 *       most recently updated. Each item includes the unread message count and a
 *       preview of the last message.
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number (1-based).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of conversations per page.
 *     responses:
 *       200:
 *         description: Paginated list of conversation summaries.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedConversations'
 *       401:
 *         description: Missing or invalid JWT.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/v1/messaging/conversations/{id}:
 *   get:
 *     summary: Get paginated chat history for a conversation
 *     description: >
 *       Returns cursor-paginated messages for a conversation, newest-first.
 *       The requesting user must be a participant. Message content is decrypted
 *       before being returned. Pass `nextCursor` from the previous response as
 *       `cursor` to page backward through history.
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the conversation.
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of messages to return per page.
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: >
 *           MongoDB ObjectId of the oldest message in the previous page.
 *           Omit for the first page (most recent messages).
 *         example: 64f1a2b3c4d5e6f7a8b9c0d2
 *     responses:
 *       200:
 *         description: Paginated messages with a cursor for the next page.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedMessages'
 *       400:
 *         description: Malformed conversation ID or cursor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               badId:
 *                 value: { error: 'Invalid conversation ID' }
 *               badCursor:
 *                 value: { error: 'Invalid cursor' }
 *       401:
 *         description: Missing or invalid JWT.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Authenticated user is not a participant in this conversation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               value: { error: 'Forbidden' }
 *       404:
 *         description: Conversation not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               value: { error: 'Conversation not found' }
 */
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
