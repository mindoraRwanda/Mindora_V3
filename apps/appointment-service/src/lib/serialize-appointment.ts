import type { Appointment } from '@mindora/database';

export function serializeAppointment(appointment: Appointment) {
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    therapistId: appointment.therapistId,
    slotStart: appointment.slotStart.toISOString(),
    slotEnd: appointment.slotEnd.toISOString(),
    sessionType: appointment.sessionType,
    status: appointment.status,
    cancellationReason: appointment.cancellationReason,
    rating: appointment.rating,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  };
}

export type SerializedAppointment = ReturnType<typeof serializeAppointment>;
