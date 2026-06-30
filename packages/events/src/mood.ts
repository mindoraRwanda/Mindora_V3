import type { BaseEvent } from './base.js';

export interface MoodLoggedEvent extends BaseEvent {
  moodId: string;
  userId: string;
  /** 1 – 10 */
  score: number;
  note?: string;
}
