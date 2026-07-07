import { randomUUID } from 'node:crypto';
import type { IsoDateTimeString } from '../common.js';
import { MOOD_ROUTING_KEYS } from './constants.js';
import type { MoodConcernEvent, MoodStreakEvent } from './types.js';

function baseMetadata() {
  return {
    eventId: randomUUID(),
    occurredAt: new Date().toISOString() as IsoDateTimeString,
    schemaVersion: 1 as const,
  };
}

export function createMoodConcernEvent(input: {
  userId: string;
  avgMoodScore: number;
  recentScores: number[];
}): MoodConcernEvent {
  return {
    ...baseMetadata(),
    eventType: MOOD_ROUTING_KEYS.CONCERN,
    ...input,
  };
}

export function createMoodStreakEvent(input: {
  userId: string;
  streak: number;
  milestone: 7 | 14 | 30;
  lastCheckedIn: IsoDateTimeString;
}): MoodStreakEvent {
  return {
    ...baseMetadata(),
    eventType: MOOD_ROUTING_KEYS.STREAK,
    ...input,
  };
}
