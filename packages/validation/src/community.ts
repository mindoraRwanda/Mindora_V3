import { z } from 'zod'

export const CreateGroupDto = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  category: z.enum([
    'ANXIETY',
    'DEPRESSION',
    'GRIEF',
    'RELATIONSHIPS',
    'STRESS',
    'ADDICTION',
    'GENERAL'
  ]),
  isAnonymous: z.boolean().default(false)
})

export type CreateGroupInput = z.infer<typeof CreateGroupDto>

export const CreatePostDto = z.object({
  content: z.string().min(1, 'Content cannot be empty').max(2000),
  isAnonymous: z.boolean().default(false)
})

export type CreatePostInput = z.infer<typeof CreatePostDto>