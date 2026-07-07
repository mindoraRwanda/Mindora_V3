export type {
  EventMetadata,
  IsoDateTimeString,
  UuidString,
  WithMetadata,
} from './common.js';

export type { BaseEvent, QueueName, ExchangeName } from './base.js';
export { QUEUES, EXCHANGES } from './base.js';
export type {
  CommunityReportedEvent,
  CommunityReplyEvent,
} from './community.js';
export type { MessageReceivedEvent } from './messaging.js';
export type { AIUsageLoggedEvent } from './ai.js';

export {
  APPOINTMENTS_EXCHANGE,
  APPOINTMENT_ROUTING_KEYS,
  APPOINTMENT_SESSION_TYPES,
  APPOINTMENT_STATUSES,
  createAppointmentBookedEvent,
  createAppointmentCancelledEvent,
  createAppointmentCompletedEvent,
  createAppointmentConfirmedEvent,
  type AppointmentBookedEvent,
  type AppointmentCancelledEvent,
  type AppointmentCompletedEvent,
  type AppointmentConfirmedEvent,
  type AppointmentDomainEvent,
  type AppointmentRoutingKey,
  type AppointmentSessionType,
  type AppointmentSlotPayload,
  type AppointmentStatus,
} from './appointments/index.js';

export {
  MOOD_EXCHANGE,
  MOOD_ROUTING_KEYS,
  MOOD_STREAK_MILESTONES,
  createMoodConcernEvent,
  createMoodStreakEvent,
  type MoodConcernEvent,
  type MoodDomainEvent,
  type MoodRoutingKey,
  type MoodStreakEvent,
} from './mood/index.js';
