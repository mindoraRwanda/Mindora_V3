import type { IsoDateTimeString, UuidString, WithMetadata } from '../common.js';
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
