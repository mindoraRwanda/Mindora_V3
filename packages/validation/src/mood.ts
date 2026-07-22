import { z } from 'zod';

export const logMoodSchema = z.object({
  moodScore: z.coerce.number().int().min(1).max(10),
  emotions: z.array(z.string().min(1).max(64)).max(20).default([]),
  sleepHours: z.coerce.number().min(0).max(24).optional(),
  stressLevel: z.coerce.number().int().min(1).max(10).optional(),
  energyLevel: z.coerce.number().int().min(1).max(10).optional(),
  journalNote: z.string().max(5000).optional(),
  triggers: z.array(z.string().min(1).max(128)).max(20).default([]),
});

export const moodHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type LogMoodDto = z.infer<typeof logMoodSchema>;
export type MoodHistoryQueryDto = z.infer<typeof moodHistoryQuerySchema>;
