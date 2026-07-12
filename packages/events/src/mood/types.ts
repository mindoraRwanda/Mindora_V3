import { z } from 'zod';
import {
  eventMetadataSchema,
  type IsoDateTimeString,
  type UuidString,
  type WithMetadata,
} from '../common.js';
import type { MOOD_ROUTING_KEYS } from './constants.js';

/** Published when patient has 3+ low scores (<=3) in last 5 entries. */
export type MoodConcernEvent = WithMetadata<{
  eventType: typeof MOOD_ROUTING_KEYS.CONCERN;
  userId: UuidString;
  avgMoodScore: number;
  recentScores: number[];
}>;

/** Published when daily check-in streak hits 7, 14, or 30 days. */
export type MoodStreakEvent = WithMetadata<{
  eventType: typeof MOOD_ROUTING_KEYS.STREAK;
  userId: UuidString;
  streak: number;
  milestone: 7 | 14 | 30;
  lastCheckedIn: IsoDateTimeString;
}>;

export type MoodDomainEvent = MoodConcernEvent | MoodStreakEvent;

export const moodConcernEventSchema = eventMetadataSchema.extend({
  eventType: z.literal('mood.concern'),
  userId: z.string().uuid(),
  avgMoodScore: z.number(),
  recentScores: z.array(z.number()),
});

export const moodStreakEventSchema = eventMetadataSchema.extend({
  eventType: z.literal('mood.streak'),
  userId: z.string().uuid(),
  streak: z.number(),
  milestone: z.union([z.literal(7), z.literal(14), z.literal(30)]),
  lastCheckedIn: z.string().datetime(),
});

/** Matches any event published to the mindora.mood exchange. */
export const moodDomainEventSchema = z.union([
  moodConcernEventSchema,
  moodStreakEventSchema,
]);
