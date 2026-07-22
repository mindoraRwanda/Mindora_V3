/** Topic exchange for all appointment domain events (Sprint 3 design). */
export const APPOINTMENTS_EXCHANGE = 'mindora.appointments';

export const APPOINTMENT_ROUTING_KEYS = {
  BOOKED: 'appointment.booked',
  CONFIRMED: 'appointment.confirmed',
  CANCELLED: 'appointment.cancelled',
  COMPLETED: 'appointment.completed',
} as const;

export type AppointmentRoutingKey =
  (typeof APPOINTMENT_ROUTING_KEYS)[keyof typeof APPOINTMENT_ROUTING_KEYS];
