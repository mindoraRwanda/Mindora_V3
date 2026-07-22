import { z } from 'zod';
import { baseEventSchema, type BaseEvent } from './base.js';

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

export const aiUsageLoggedEventSchema = baseEventSchema.extend({
  userId: z.string().uuid(),
  feature: z.string(),
  model: z.string(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  durationMs: z.number(),
});

/**
 * Published by ai-integration-service (routes/ai.routes.ts publishCrisisEvent)
 * directly onto the mindora.ai fanout exchange as a hand-rolled object, not
 * via a shared builder — this type/schema formalizes that existing wire
 * shape rather than changing what's published. `timestamp` duplicates
 * `occurredAt`; kept for backward compatibility with what's already on the
 * wire rather than dropped.
 */
export interface AICrisisEvent {
  eventId: string;
  occurredAt: string;
  userId: string;
  sessionId: string | null;
  crisisLevel: number;
  timestamp: string;
}

export const aiCrisisEventSchema = z.object({
  eventId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  userId: z.string().uuid(),
  sessionId: z.string().nullable(),
  crisisLevel: z.number(),
  timestamp: z.string().datetime(),
});
