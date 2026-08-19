import { z } from 'zod';

const appointmentStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
]);

// Keep in sync with SessionType in both Prisma schemas,
// APPOINTMENT_SESSION_TYPES in @mindora/events, and the enum in
// docs/appointment-service.yaml — a value missing from any one of them is
// rejected somewhere in the chain rather than at a single obvious place.
const sessionTypeSchema = z.enum(['VIDEO', 'AUDIO', 'IN_PERSON', 'CHAT']);

export const availabilityQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const bookAppointmentSchema = z
  .object({
    therapistId: z.string().uuid(),
    slotStart: z.coerce.date(),
    slotEnd: z.coerce.date(),
    sessionType: sessionTypeSchema,
  })
  .refine((data) => data.slotEnd > data.slotStart, {
    message: 'slotEnd must be after slotStart',
    path: ['slotEnd'],
  });

export const appointmentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: appointmentStatusSchema.optional(),
});

export const therapistScheduleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
    .optional(),
});

export const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().min(1).max(500),
});

export const rateAppointmentSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
});

export type AvailabilityQueryDto = z.infer<typeof availabilityQuerySchema>;
export type BookAppointmentDto = z.infer<typeof bookAppointmentSchema>;
export type AppointmentListQueryDto = z.infer<
  typeof appointmentListQuerySchema
>;
export type TherapistScheduleQueryDto = z.infer<
  typeof therapistScheduleQuerySchema
>;
export type CancelAppointmentDto = z.infer<typeof cancelAppointmentSchema>;
export type RateAppointmentDto = z.infer<typeof rateAppointmentSchema>;
