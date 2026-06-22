import type { BaseEvent } from './base.js';

export interface AppointmentBookedEvent extends BaseEvent {
  appointmentId: string;
  patientId: string;
  therapistId: string;
  /** ISO 8601 */
  scheduledAt: string;
  type: 'INITIAL' | 'FOLLOW_UP' | 'EMERGENCY';
}

export interface AppointmentCancelledEvent extends BaseEvent {
  appointmentId: string;
  patientId: string;
  therapistId: string;
  cancelledBy: 'PATIENT' | 'THERAPIST';
  reason?: string;
}
