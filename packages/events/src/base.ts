export interface BaseEvent {
  /** UUID v4 — unique per event emission */
  eventId: string;
  /** ISO 8601 timestamp of when the event occurred */
  occurredAt: string;
}

export const QUEUES = {
  COMMUNITY_REPORTED: 'community.reported',
  MESSAGE_RECEIVED: 'messaging.message.received',
  AI_USAGE_LOGGED: 'ai.usage.logged',
} as const;

export const EXCHANGES = {
  APPOINTMENTS: 'mindora.appointments',
  MESSAGES: 'mindora.messages',
  MOOD: 'mindora.mood',
  AI: 'mindora.ai',
  COMMUNITY: 'mindora.community',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
export type ExchangeName = (typeof EXCHANGES)[keyof typeof EXCHANGES];
