export {
  eventMetadataSchema,
  type EventMetadata,
  type IsoDateTimeString,
  type UuidString,
  type WithMetadata,
} from './common.js';

export type { BaseEvent, QueueName, ExchangeName } from './base.js';
export { QUEUES, EXCHANGES, baseEventSchema } from './base.js';
export {
  communityDomainEventSchema,
  communityReportedEventSchema,
  communityReplyEventSchema,
  type CommunityReportedEvent,
  type CommunityReplyEvent,
} from './community.js';
export {
  messageReceivedEventSchema,
  type MessageReceivedEvent,
} from './messaging.js';
export {
  aiCrisisEventSchema,
  aiUsageLoggedEventSchema,
  type AICrisisEvent,
  type AIUsageLoggedEvent,
} from './ai.js';

export {
  APPOINTMENTS_EXCHANGE,
  APPOINTMENT_ROUTING_KEYS,
  APPOINTMENT_SESSION_TYPES,
  APPOINTMENT_STATUSES,
  appointmentBookedEventSchema,
  appointmentCancelledEventSchema,
  appointmentCompletedEventSchema,
  appointmentConfirmedEventSchema,
  appointmentDomainEventSchema,
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
  moodConcernEventSchema,
  moodDomainEventSchema,
  moodStreakEventSchema,
  type MoodConcernEvent,
  type MoodDomainEvent,
  type MoodRoutingKey,
  type MoodStreakEvent,
} from './mood/index.js';
