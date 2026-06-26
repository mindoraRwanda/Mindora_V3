export type {
  EventMetadata,
  IsoDateTimeString,
  UuidString,
  WithMetadata,
} from './common.js';

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
