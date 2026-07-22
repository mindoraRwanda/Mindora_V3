import type { BaseEvent } from './base.js';

export interface AIUsageLoggedEvent extends BaseEvent {
  userId: string;
  /** Platform feature that triggered the AI call (e.g. "mood-summary", "chat-assist") */
  feature: string;
  /** Model identifier (e.g. "claude-sonnet-4-6") */
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}
