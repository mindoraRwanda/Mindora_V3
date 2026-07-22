export {
  APPOINTMENTS_EXCHANGE,
  APPOINTMENT_ROUTING_KEYS,
  type AppointmentRoutingKey,
} from './constants.js';
export {
  createAppointmentBookedEvent,
  createAppointmentCancelledEvent,
  createAppointmentCompletedEvent,
  createAppointmentConfirmedEvent,
} from './builders.js';
export {
  APPOINTMENT_SESSION_TYPES,
  APPOINTMENT_STATUSES,
  type AppointmentBookedEvent,
  type AppointmentCancelledEvent,
  type AppointmentCompletedEvent,
  type AppointmentConfirmedEvent,
  type AppointmentDomainEvent,
  type AppointmentSessionType,
  type AppointmentStatus,
  type AppointmentSlotPayload,
} from './types.js';
