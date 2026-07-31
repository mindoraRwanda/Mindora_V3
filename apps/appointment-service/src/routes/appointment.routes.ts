import {
  createAppointmentCancelledEvent,
  createAppointmentCompletedEvent,
  createAppointmentConfirmedEvent,
  type AppointmentSessionType,
} from '@mindora/events';
import { prisma } from '../lib/prisma.js';
import { Prisma } from '../generated/prisma/index.js';
import {
  appointmentListQuerySchema,
  availabilityQuerySchema,
  bookAppointmentSchema,
  cancelAppointmentSchema,
  rateAppointmentSchema,
  therapistScheduleQuerySchema,
} from '@mindora/validation';
import { Router } from 'express';
import {
  defaultAvailabilityRange,
  filterAvailableSlots,
  generateCandidateSlots,
} from '../lib/availability.js';
import {
  bookAppointmentWithLock,
  isSlotConflictError,
} from '../lib/book-appointment.js';
import { publishAppointmentEvent } from '../lib/publish-appointment-event.js';
import { serializeAppointment } from '../lib/serialize-appointment.js';
import { config } from '../config.js';
import {
  verifyJwt,
  type AuthenticatedRequest,
} from '../middleware/authenticate.js';
import { authenticatedRouteLimiter } from '../middleware/rate-limit.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const appointmentRouter = Router();

function routeParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

// Appointment Service has no local view of therapist_profiles (mindora_user)
// or users (mindora_auth) — verifying a therapistId belongs to an actual
// THERAPIST goes through Kong to Auth Service's internal endpoint instead of
// a direct database join.
async function isTherapist(userId: string): Promise<boolean> {
  const base = process.env.KONG_URL ?? 'http://localhost:8000';
  try {
    // encodeURIComponent — userId is a caller-supplied route param and must
    // not be able to reshape the request path sent to another service.
    const res = await fetch(
      `${base}/internal/auth/users/${encodeURIComponent(userId)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
        },
      }
    );
    if (!res.ok) return false;
    const authUser = (await res.json()) as { role: string };
    return authUser.role === 'THERAPIST';
  } catch {
    return false;
  }
}

appointmentRouter.get(
  '/availability/:therapistId',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const therapistId = routeParam(req.params.therapistId);

    const parsed = availabilityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    if (!(await isTherapist(therapistId))) {
      res.status(404).json({ message: 'Therapist not found' });
      return;
    }

    const defaults = defaultAvailabilityRange();
    const from = parsed.data.from ?? defaults.from;
    const to = parsed.data.to ?? defaults.to;

    if (to <= from) {
      res.status(400).json({ message: 'Invalid availability range' });
      return;
    }

    const blocked = await prisma.appointment.findMany({
      where: {
        therapistId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        slotStart: { lt: to },
        slotEnd: { gt: from },
      },
      select: { slotStart: true, slotEnd: true },
    });

    const candidates = generateCandidateSlots(from, to);
    const available = filterAvailableSlots(candidates, blocked);

    res.status(200).json({
      therapistId,
      slots: available.map((slot) => ({
        slotStart: slot.slotStart.toISOString(),
        slotEnd: slot.slotEnd.toISOString(),
      })),
    });
  })
);

appointmentRouter.post(
  '/',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (authReq.user.role !== 'PATIENT') {
      res.status(403).json({ message: 'Only patients can book appointments' });
      return;
    }

    const parsed = bookAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    if (!(await isTherapist(parsed.data.therapistId))) {
      res.status(404).json({ message: 'Therapist not found' });
      return;
    }

    try {
      const appointment = await bookAppointmentWithLock(
        authReq.user.userId,
        parsed.data
      );
      res.status(201).json(serializeAppointment(appointment));
    } catch (error) {
      if (isSlotConflictError(error)) {
        res.status(409).json({ message: 'Slot already booked' });
        return;
      }
      throw error;
    }
  })
);

appointmentRouter.get(
  '/mine',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (authReq.user.role !== 'PATIENT') {
      res.status(403).json({ message: 'Requires PATIENT role' });
      return;
    }

    const parsed = appointmentListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { page, limit, status } = parsed.data;
    const skip = (page - 1) * limit;
    const where: Prisma.AppointmentWhereInput = {
      patientId: authReq.user.userId,
      ...(status ? { status } : {}),
    };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { slotStart: 'desc' },
      }),
      prisma.appointment.count({ where }),
    ]);

    res.status(200).json({
      appointments: appointments.map(serializeAppointment),
      total,
      page,
      limit,
    });
  })
);

appointmentRouter.get(
  '/schedule',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (authReq.user.role !== 'THERAPIST') {
      res.status(403).json({ message: 'Requires THERAPIST role' });
      return;
    }

    const parsed = therapistScheduleQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { page, limit, date } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {
      therapistId: authReq.user.userId,
    };

    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(`${date}T23:59:59.999Z`);
      where.slotStart = { gte: dayStart, lte: dayEnd };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { slotStart: 'asc' },
      }),
      prisma.appointment.count({ where }),
    ]);

    res.status(200).json({
      appointments: appointments.map(serializeAppointment),
      total,
      page,
      limit,
    });
  })
);

appointmentRouter.put(
  '/:id/confirm',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (authReq.user.role !== 'THERAPIST') {
      res.status(403).json({ message: 'Requires THERAPIST role' });
      return;
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: routeParam(req.params.id) },
    });
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    if (appointment.therapistId !== authReq.user.userId) {
      res.status(403).json({ message: 'Not assigned to this appointment' });
      return;
    }

    if (appointment.status !== 'PENDING') {
      res
        .status(409)
        .json({ message: 'Appointment is not pending confirmation' });
      return;
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CONFIRMED' },
    });

    await publishAppointmentEvent(
      createAppointmentConfirmedEvent({
        appointmentId: updated.id,
        patientId: updated.patientId,
        therapistId: updated.therapistId,
        slotStart: updated.slotStart.toISOString(),
        slotEnd: updated.slotEnd.toISOString(),
        sessionType: updated.sessionType as AppointmentSessionType,
        confirmedByUserId: authReq.user.userId,
      }),
      config.rabbitUrl
    );

    res.status(200).json(serializeAppointment(updated));
  })
);

appointmentRouter.put(
  '/:id/cancel',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const parsed = cancelAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: routeParam(req.params.id) },
    });
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    const isPatientOwner =
      authReq.user.role === 'PATIENT' &&
      appointment.patientId === authReq.user.userId;
    const isAssignedTherapist =
      authReq.user.role === 'THERAPIST' &&
      appointment.therapistId === authReq.user.userId;

    if (!isPatientOwner && !isAssignedTherapist) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (
      appointment.status === 'CANCELLED' ||
      appointment.status === 'COMPLETED'
    ) {
      res.status(409).json({ message: 'Appointment cannot be cancelled' });
      return;
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'CANCELLED',
        cancellationReason: parsed.data.cancellationReason,
      },
    });

    await publishAppointmentEvent(
      createAppointmentCancelledEvent({
        appointmentId: updated.id,
        patientId: updated.patientId,
        therapistId: updated.therapistId,
        slotStart: updated.slotStart.toISOString(),
        slotEnd: updated.slotEnd.toISOString(),
        sessionType: updated.sessionType as AppointmentSessionType,
        cancelledByUserId: authReq.user.userId,
        cancellationReason: parsed.data.cancellationReason,
      }),
      config.rabbitUrl
    );

    res.status(200).json(serializeAppointment(updated));
  })
);

appointmentRouter.put(
  '/:id/complete',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (authReq.user.role !== 'THERAPIST') {
      res.status(403).json({ message: 'Requires THERAPIST role' });
      return;
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: routeParam(req.params.id) },
    });
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    if (appointment.therapistId !== authReq.user.userId) {
      res.status(403).json({ message: 'Not assigned to this appointment' });
      return;
    }

    if (appointment.status !== 'CONFIRMED') {
      res.status(409).json({ message: 'Appointment must be confirmed first' });
      return;
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'COMPLETED' },
    });

    await publishAppointmentEvent(
      createAppointmentCompletedEvent({
        appointmentId: updated.id,
        patientId: updated.patientId,
        therapistId: updated.therapistId,
        slotStart: updated.slotStart.toISOString(),
        slotEnd: updated.slotEnd.toISOString(),
        sessionType: updated.sessionType as AppointmentSessionType,
        completedByUserId: authReq.user.userId,
      }),
      config.rabbitUrl
    );

    res.status(200).json(serializeAppointment(updated));
  })
);

appointmentRouter.post(
  '/:id/rate',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (authReq.user.role !== 'PATIENT') {
      res.status(403).json({ message: 'Requires PATIENT role' });
      return;
    }

    const parsed = rateAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: routeParam(req.params.id) },
    });
    if (!appointment) {
      res.status(404).json({ message: 'Appointment not found' });
      return;
    }

    if (appointment.patientId !== authReq.user.userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (appointment.status !== 'COMPLETED') {
      res.status(422).json({
        message: 'Appointment must be completed before rating',
      });
      return;
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { rating: parsed.data.rating },
    });

    res.status(200).json(serializeAppointment(updated));
  })
);

// INTERNAL SERVICE ENDPOINT — same SERVICE-role convention as Auth/User
// Service's /internal/* routes. Backs Admin Service's platform analytics.
appointmentRouter.get(
  '/internal/appointments/analytics',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.role !== 'SERVICE') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const [totalAppointments, completedAppointments] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
    ]);

    res.status(200).json({ totalAppointments, completedAppointments });
  })
);
