import { z } from 'zod';
import { baseEventSchema, type BaseEvent } from './base.js';

export interface MessageReceivedEvent extends BaseEvent {
  messageId: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  /** ISO 8601 — present only after the message has been read */
  readAt?: string;
}

export const messageReceivedEventSchema = baseEventSchema.extend({
  messageId: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  recipientId: z.string(),
  content: z.string(),
  readAt: z.string().datetime().optional(),
});
