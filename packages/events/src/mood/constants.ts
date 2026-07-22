/** Topic exchange for mood domain events (Sprint 4). */
export const MOOD_EXCHANGE = 'mindora.mood';

export const MOOD_ROUTING_KEYS = {
  CONCERN: 'mood.concern',
  STREAK: 'mood.streak',
} as const;

export type MoodRoutingKey =
  (typeof MOOD_ROUTING_KEYS)[keyof typeof MOOD_ROUTING_KEYS];

export const MOOD_STREAK_MILESTONES = [7, 14, 30] as const;
