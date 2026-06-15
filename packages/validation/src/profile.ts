import { z } from 'zod';

export const notificationPreferencesSchema = z.record(z.boolean()).default({});

export const updateProfileSchema = z.object({
  userName: z.string().min(1).max(64).optional(),
  bio: z.string().max(2000).optional(),
  timezone: z.string().min(1).max(64).optional(),
  languagePreference: z.string().min(2).max(10).optional(),
  notificationPreferences: notificationPreferencesSchema.optional(),
});

export const therapistListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  specialisation: z.string().optional(),
  language: z.string().optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type TherapistListQueryDto = z.infer<typeof therapistListQuerySchema>;
