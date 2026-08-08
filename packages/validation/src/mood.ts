import { z } from 'zod';

// How far back a mood entry may be backdated. Bounded so a typo (or a client
// with a badly wrong clock) can't drop an entry decades into the past, where
// it would silently distort streaks and insight buckets.
const MAX_BACKDATE_DAYS = 365;
// Small tolerance for client/server clock skew — a device a few minutes fast
// shouldn't have its check-in rejected as "in the future".
const FUTURE_SKEW_TOLERANCE_MS = 5 * 60 * 1000;

const backdatedRecordedAt = z.coerce
  .date()
  .refine((d) => d.getTime() <= Date.now() + FUTURE_SKEW_TOLERANCE_MS, {
    message: 'recordedAt cannot be in the future',
  })
  .refine(
    (d) => d.getTime() >= Date.now() - MAX_BACKDATE_DAYS * 24 * 60 * 60 * 1000,
    { message: `recordedAt cannot be more than ${MAX_BACKDATE_DAYS} days ago` }
  );

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const logMoodSchema = z.object({
  moodScore: z.coerce.number().int().min(1).max(10),
  emotions: z.array(z.string().min(1).max(64)).max(20).default([]),
  sleepHours: z.coerce.number().min(0).max(24).optional(),
  stressLevel: z.coerce.number().int().min(1).max(10).optional(),
  energyLevel: z.coerce.number().int().min(1).max(10).optional(),
  journalNote: z.string().max(5000).optional(),
  triggers: z.array(z.string().min(1).max(128)).max(20).default([]),
  // Omit to record "now" (the common case). Supplied to log a mood for a day
  // the user missed.
  recordedAt: backdatedRecordedAt.optional(),
});

// Deliberately has no `recordedAt`: mood_entries is a TimescaleDB hypertable
// partitioned on recorded_at, and Timescale rejects an UPDATE that would move
// a row into a different chunk ("new row for relation _hyper_N_M_chunk
// violates check constraint"). Changing when an entry happened means deleting
// it and logging a new one with the corrected recordedAt.
export const updateMoodSchema = z
  .object({
    moodScore: z.coerce.number().int().min(1).max(10).optional(),
    emotions: z.array(z.string().min(1).max(64)).max(20).optional(),
    sleepHours: z.coerce.number().min(0).max(24).nullable().optional(),
    stressLevel: z.coerce.number().int().min(1).max(10).nullable().optional(),
    energyLevel: z.coerce.number().int().min(1).max(10).nullable().optional(),
    // null clears an existing note; omitted leaves it untouched.
    journalNote: z.string().max(5000).nullable().optional(),
    triggers: z.array(z.string().min(1).max(128)).max(20).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field must be provided',
  });

export const moodHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Backs the dashboard chart: bucketed averages over an arbitrary range,
// rather than /history's raw rows or /insights' fixed 3-month weekly window.
export const moodSummaryQuerySchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    granularity: z.enum(['day', 'week', 'month']).default('day'),
  })
  .refine((q) => !q.startDate || !q.endDate || q.startDate <= q.endDate, {
    message: 'startDate must be on or before endDate',
  });

// "Today" is only meaningful in a specific zone — a Kigali user (UTC+3)
// checking in at 01:00 local is still on the previous UTC day, so defaulting
// to UTC would report the wrong answer for the first three hours of every
// day. Clients should send Intl.DateTimeFormat().resolvedOptions().timeZone.
export const moodTodayQuerySchema = z.object({
  timezone: z
    .string()
    .min(1)
    .max(64)
    .refine(isValidTimeZone, { message: 'Unknown IANA time zone' })
    .default('UTC'),
});

export type LogMoodDto = z.infer<typeof logMoodSchema>;
export type UpdateMoodDto = z.infer<typeof updateMoodSchema>;
export type MoodHistoryQueryDto = z.infer<typeof moodHistoryQuerySchema>;
export type MoodSummaryQueryDto = z.infer<typeof moodSummaryQuerySchema>;
export type MoodTodayQueryDto = z.infer<typeof moodTodayQuerySchema>;
