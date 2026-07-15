import { z } from 'zod';

export const updateProfileSchema = z.object({
  userName: z.string().min(1).max(64).optional(),
  bio: z.string().max(2000).optional(),
  timezone: z.string().min(1).max(64).optional(),
  languagePreference: z.string().min(2).max(10).optional(),
});

export const therapistListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  specialisation: z.string().optional(),
  language: z.string().optional(),
});

export const updateFcmTokenSchema = z.object({
  fcmToken: z.string().min(1, 'fcmToken is required'),
});

export const updateNotificationPreferencesSchema = z.object({
  push: z.boolean().optional(),
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type TherapistListQueryDto = z.infer<typeof therapistListQuerySchema>;
export type UpdateFcmTokenDto = z.infer<typeof updateFcmTokenSchema>;
export type UpdateNotificationPreferencesDto = z.infer<
  typeof updateNotificationPreferencesSchema
>;
