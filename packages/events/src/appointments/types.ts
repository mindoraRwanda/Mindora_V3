import type { IsoDateTimeString, UuidString, WithMetadata } from '../common.js';
import type { APPOINTMENT_ROUTING_KEYS } from './constants.js';

export const APPOINTMENT_SESSION_TYPES = ['VIDEO', 'IN_PERSON', 'CHAT'] as const;
export type AppointmentSessionType = (typeof APPOINTMENT_SESSION_TYPES)[number];

export const APPOINTMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Core appointment fields shared across event payloads. */
export interface AppointmentSlotPayload {
  appointmentId: UuidString;
  patientId: UuidString;
  therapistId: UuidString;
  slotStart: IsoDateTimeString;
  slotEnd: IsoDateTimeString;
  sessionType: AppointmentSessionType;
}

/** Published after POST /appointments succeeds (routing key: appointment.booked). */
export type AppointmentBookedEvent = WithMetadata<
  AppointmentSlotPayload & {
    eventType: typeof APPOINTMENT_ROUTING_KEYS.BOOKED;
    status: 'PENDING';
  }
>;

/** Published after therapist PUT /appointments/:id/confirm (routing key: appointment.confirmed). */
export type AppointmentConfirmedEvent = WithMetadata<
  AppointmentSlotPayload & {
    eventType: typeof APPOINTMENT_ROUTING_KEYS.CONFIRMED;
    status: 'CONFIRMED';
    confirmedByUserId: UuidString;
  }
>;

/** Published after PUT /appointments/:id/cancel (routing key: appointment.cancelled). */
export type AppointmentCancelledEvent = WithMetadata<
  AppointmentSlotPayload & {
    eventType: typeof APPOINTMENT_ROUTING_KEYS.CANCELLED;
    status: 'CANCELLED';
    cancelledByUserId: UuidString;
    cancellationReason: string;
  }
>;

/** Published after therapist PUT /appointments/:id/complete (routing key: appointment.completed). */
export type AppointmentCompletedEvent = WithMetadata<
  AppointmentSlotPayload & {
    eventType: typeof APPOINTMENT_ROUTING_KEYS.COMPLETED;
    status: 'COMPLETED';
    completedByUserId: UuidString;
  }
>;

export type AppointmentDomainEvent =
  | AppointmentBookedEvent
  | AppointmentConfirmedEvent
  | AppointmentCancelledEvent
  | AppointmentCompletedEvent;
