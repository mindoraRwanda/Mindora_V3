import { Router, Request, Response } from 'express'
import { CreateGroupDto, CreatePostDto } from '@mindora/validation'
import { authenticate, AuthenticatedRequest } from '@mindora/auth-service'
import { CommunityGroup, Post } from '../models'
import mongoose from 'mongoose'
import { encryptUserId } from '../utils/encryption'

const router = Router()

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