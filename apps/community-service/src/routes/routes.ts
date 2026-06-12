import { Router, Request, Response } from 'express'
import { CreateGroupDto } from '@mindora/validation'
import { authenticate } from '@mindora/auth-service'
import { CommunityGroup } from '../models'

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

export default router