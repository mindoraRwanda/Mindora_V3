import { describe, expect, it } from 'vitest';
import {
  APPOINTMENTS_EXCHANGE,
  APPOINTMENT_ROUTING_KEYS,
  createAppointmentBookedEvent,
  createAppointmentCancelledEvent,
} from './index.js';

describe('@mindora/events appointments', () => {
  it('defines exchange and routing keys per sprint design', () => {
    expect(APPOINTMENTS_EXCHANGE).toBe('mindora.appointments');
    expect(APPOINTMENT_ROUTING_KEYS.BOOKED).toBe('appointment.booked');
    expect(APPOINTMENT_ROUTING_KEYS.CONFIRMED).toBe('appointment.confirmed');
    expect(APPOINTMENT_ROUTING_KEYS.CANCELLED).toBe('appointment.cancelled');
    expect(APPOINTMENT_ROUTING_KEYS.COMPLETED).toBe('appointment.completed');
  });

  it('builds AppointmentBookedEvent with metadata', () => {
    const event = createAppointmentBookedEvent({
      appointmentId: 'appt-1',
      patientId: 'patient-1',
      therapistId: 'therapist-1',
      slotStart: '2026-06-20T10:00:00.000Z',
      slotEnd: '2026-06-20T11:00:00.000Z',
      sessionType: 'VIDEO',
    });

    expect(event.eventType).toBe('appointment.booked');
    expect(event.status).toBe('PENDING');
    expect(event.schemaVersion).toBe(1);
    expect(event.eventId).toBeTypeOf('string');
    expect(event.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('builds AppointmentCancelledEvent with reason', () => {
    const event = createAppointmentCancelledEvent({
      appointmentId: 'appt-2',
      patientId: 'patient-1',
      therapistId: 'therapist-1',
      slotStart: '2026-06-21T14:00:00.000Z',
      slotEnd: '2026-06-21T15:00:00.000Z',
      sessionType: 'CHAT',
      cancelledByUserId: 'patient-1',
      cancellationReason: 'Schedule conflict',
    });

    expect(event.eventType).toBe('appointment.cancelled');
    expect(event.cancellationReason).toBe('Schedule conflict');
  });
});
