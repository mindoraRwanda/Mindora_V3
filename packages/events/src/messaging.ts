import type { BaseEvent } from './base.js';

export interface MessageReceivedEvent extends BaseEvent {
  messageId: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  /** ISO 8601 — present only after the message has been read */
  readAt?: string;
}
