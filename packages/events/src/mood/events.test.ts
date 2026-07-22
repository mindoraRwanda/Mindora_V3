import { describe, expect, it } from 'vitest';
import {
  createMoodConcernEvent,
  createMoodStreakEvent,
  MOOD_EXCHANGE,
  MOOD_ROUTING_KEYS,
} from '../mood/index.js';

describe('@mindora/events mood', () => {
  it('defines exchange and routing keys', () => {
    expect(MOOD_EXCHANGE).toBe('mindora.mood');
    expect(MOOD_ROUTING_KEYS.CONCERN).toBe('mood.concern');
    expect(MOOD_ROUTING_KEYS.STREAK).toBe('mood.streak');
  });

  it('builds MoodConcernEvent', () => {
    const event = createMoodConcernEvent({
      userId: '11111111-1111-4111-8111-111111111111',
      avgMoodScore: 2.4,
      recentScores: [2, 3, 2, 1, 3],
    });
    expect(event.eventType).toBe('mood.concern');
    expect(event.schemaVersion).toBe(1);
  });

  it('builds MoodStreakEvent', () => {
    const event = createMoodStreakEvent({
      userId: '11111111-1111-4111-8111-111111111111',
      streak: 7,
      milestone: 7,
      lastCheckedIn: '2026-06-10T00:00:00.000Z',
    });
    expect(event.eventType).toBe('mood.streak');
    expect(event.milestone).toBe(7);
  });
});
