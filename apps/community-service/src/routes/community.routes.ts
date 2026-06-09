import { Router, Request, Response } from 'express'
import { CreateGroupDto, CreatePostDto } from '@mindora/validation'
import { authenticate, AuthenticatedRequest } from '@mindora/auth-middleware'
import { CommunityGroup, Post } from '../models'
import mongoose from 'mongoose'
import { encryptUserId } from '../utils/encryption'

const router = Router()

/**
 * @swagger
 * /api/v1/community/groups:
 *   post:
 *     summary: Create a new community group
 *     tags: [Community Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, category]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: Anxiety Support Circle
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 example: A safe space for people managing anxiety in their daily lives
 *               category:
 *                 type: string
 *                 enum: [ANXIETY, DEPRESSION, GRIEF, RELATIONSHIPS, STRESS, ADDICTION, GENERAL]
 *               isAnonymous:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommunityGroup'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized — missing or invalid token
 */
router.post('/groups', authenticate, async (req: Request, res: Response) => {
  const result = CreateGroupDto.safeParse(req.body)

  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.errors
    })
  }

  const { name, description, category, isAnonymous } = result.data

  try {
    const group = await CommunityGroup.create({
      name,
      description,
      category,
      isAnonymous,
      memberCount: 0
    })

    return res.status(201).json(group)
  } catch (error: unknown) {
      const mongoError = error as { code?: number; message?: string }
      if (mongoError.code === 11000) {
        return res.status(409).json({ error: 'A group with this name already exists' })
      }
      console.error('Create group error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
})


/**
 * @swagger
 * /api/v1/community/groups:
 *   get:
 *     summary: List all community groups
 *     tags: [Community Groups]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page (max 50)
 *     responses:
 *       200:
 *         description: Paginated list of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groups:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CommunityGroup'
 *                 total:
 *                   type: number
 *                 page:
 *                   type: number
 *                 limit:
 *                   type: number
 */
router.get('/groups', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10))
  const skip = (page - 1) * limit

  try {
    const [groups, total] = await Promise.all([
      CommunityGroup.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CommunityGroup.countDocuments()
    ])

    return res.status(200).json({
      groups,
      total,
      page,
      limit
    })
  } catch (error) {
    console.error('List groups error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})


/**
 * @swagger
 * /api/v1/community/groups/{id}/posts:
 *   post:
 *     summary: Create a post in a community group
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The community group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 example: I have been finding breathing exercises really helpful.
 *               isAnonymous:
 *                 type: boolean
 *                 default: false
 *                 description: If true, author identity is encrypted and hidden from response
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation failed or invalid group ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Community group not found
 */
router.post('/groups/:id/posts', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ error: 'Invalid group ID' })
  }

  const group = await CommunityGroup.findById(id)
  if (!group) {
    return res.status(404).json({ error: 'Community group not found' })
  }

  const result = CreatePostDto.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.errors
    })
  }

  const { content, isAnonymous } = result.data
  const userId = req.user?.userId

  if (!userId) {
    return res.status(401).json({ error: 'User ID not found in token' })
  }

  const encryptedAuthorId = encryptUserId(userId)

  try {
    const newPost = await Post.create({
      communityId: group._id,
      encryptedAuthorId,
      content,
      isAnonymous
    })

    const responsePost = {
      _id: newPost._id,
      communityId: newPost.communityId,
      content: newPost.content,
      isAnonymous: newPost.isAnonymous,
      reactions: newPost.reactions,
      commentCount: newPost.commentCount,
      createdAt: newPost.createdAt,
      author: isAnonymous ? null : { userId }
    }

    return res.status(201).json(responsePost)
  } catch (error) {
    console.error('Create post error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})


export default router