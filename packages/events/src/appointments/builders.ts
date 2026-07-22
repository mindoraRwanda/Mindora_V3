import { randomUUID } from 'node:crypto';
import type { IsoDateTimeString } from '../common.js';
import { APPOINTMENT_ROUTING_KEYS } from './constants.js';
import type {
  AppointmentBookedEvent,
  AppointmentCancelledEvent,
  AppointmentCompletedEvent,
  AppointmentConfirmedEvent,
  AppointmentSessionType,
} from './types.js';

function baseMetadata() {
  return {
    eventId: randomUUID(),
    occurredAt: new Date().toISOString() as IsoDateTimeString,
    schemaVersion: 1 as const,
  };
}

export function createAppointmentBookedEvent(input: {
  appointmentId: string;
  patientId: string;
  therapistId: string;
  slotStart: IsoDateTimeString;
  slotEnd: IsoDateTimeString;
  sessionType: AppointmentSessionType;
}): AppointmentBookedEvent {
  return {
    ...baseMetadata(),
    eventType: APPOINTMENT_ROUTING_KEYS.BOOKED,
    status: 'PENDING',
    ...input,
  };
}

export function createAppointmentConfirmedEvent(input: {
  appointmentId: string;
  patientId: string;
  therapistId: string;
  slotStart: IsoDateTimeString;
  slotEnd: IsoDateTimeString;
  sessionType: AppointmentSessionType;
  confirmedByUserId: string;
}): AppointmentConfirmedEvent {
  return {
    ...baseMetadata(),
    eventType: APPOINTMENT_ROUTING_KEYS.CONFIRMED,
    status: 'CONFIRMED',
    ...input,
  };
}

export function createAppointmentCancelledEvent(input: {
  appointmentId: string;
  patientId: string;
  therapistId: string;
  slotStart: IsoDateTimeString;
  slotEnd: IsoDateTimeString;
  sessionType: AppointmentSessionType;
  cancelledByUserId: string;
  cancellationReason: string;
}): AppointmentCancelledEvent {
  return {
    ...baseMetadata(),
    eventType: APPOINTMENT_ROUTING_KEYS.CANCELLED,
    status: 'CANCELLED',
    ...input,
  };
}

export function createAppointmentCompletedEvent(input: {
  appointmentId: string;
  patientId: string;
  therapistId: string;
  slotStart: IsoDateTimeString;
  slotEnd: IsoDateTimeString;
  sessionType: AppointmentSessionType;
  completedByUserId: string;
}): AppointmentCompletedEvent {
  return {
    ...baseMetadata(),
    eventType: APPOINTMENT_ROUTING_KEYS.COMPLETED,
    status: 'COMPLETED',
    ...input,
  };
}
