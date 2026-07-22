import {
  createAppointmentBookedEvent,
  type AppointmentSessionType,
} from '@mindora/events';
import { prisma, Prisma } from '@mindora/database';
import type { BookAppointmentDto } from '@mindora/validation';
import { publishAppointmentEvent } from './publish-appointment-event.js';
import { config } from '../config.js';

function overlaps(
  slotStart: Date,
  slotEnd: Date,
  otherStart: Date,
  otherEnd: Date
): boolean {
  return slotStart < otherEnd && slotEnd > otherStart;
}

export class SlotConflictError extends Error {
  constructor() {
    super('Slot already booked');
    this.name = 'SlotConflictError';
  }
}

export async function bookAppointmentWithLock(
  patientId: string,
  input: BookAppointmentDto
) {
  const appointment = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT user_id
      FROM therapist_profiles
      WHERE user_id = ${input.therapistId}::uuid
      FOR UPDATE
    `;

    const conflicts = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM appointments
      WHERE therapist_id = ${input.therapistId}::uuid
        AND status IN ('PENDING', 'CONFIRMED')
        AND slot_start < ${input.slotEnd}
        AND slot_end > ${input.slotStart}
      FOR UPDATE
    `;

    if (conflicts.length > 0) {
      throw new SlotConflictError();
    }

    return tx.appointment.create({
      data: {
        patientId,
        therapistId: input.therapistId,
        slotStart: input.slotStart,
        slotEnd: input.slotEnd,
        sessionType: input.sessionType,
        status: 'PENDING',
      },
    });
  });

  await publishAppointmentEvent(
    createAppointmentBookedEvent({
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      therapistId: appointment.therapistId,
      slotStart: appointment.slotStart.toISOString(),
      slotEnd: appointment.slotEnd.toISOString(),
      sessionType: appointment.sessionType as AppointmentSessionType,
    }),
    config.rabbitUrl
  );

  return appointment;
}

export function isSlotConflictError(error: unknown): boolean {
  return error instanceof SlotConflictError;
}

export function isPrismaNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}

export { overlaps };
