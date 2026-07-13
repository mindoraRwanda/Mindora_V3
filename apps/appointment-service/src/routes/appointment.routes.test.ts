import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

vi.hoisted(() => {
  process.env.JWT_SECRET = 'mindora-dev-jwt-secret-change-in-production';
  process.env.JWT_ISSUER = 'mindora-auth';
  process.env.NODE_ENV = 'test';
});

vi.mock('ioredis', () => {
  const Redis = vi.fn(function () {
    return {
      status: 'ready',
      connect: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(0),
      set: vi.fn().mockResolvedValue('OK'),
      get: vi.fn().mockResolvedValue(null),
      del: vi.fn().mockResolvedValue(1),
      on: vi.fn(),
    };
  });
  return { default: Redis };
});

const mockAppointmentFindMany = vi.fn();
const mockAppointmentFindUnique = vi.fn();
const mockAppointmentCount = vi.fn();
const mockAppointmentCreate = vi.fn();
const mockAppointmentUpdate = vi.fn();
const mockQueryRaw = vi.fn();
const mockTransaction = vi.fn();
const mockPublishAppointmentEvent = vi.fn();
const mockIsBlacklisted = vi.fn();

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    appointment: {
      findMany: (...args: unknown[]) => mockAppointmentFindMany(...args),
      findUnique: (...args: unknown[]) => mockAppointmentFindUnique(...args),
      count: (...args: unknown[]) => mockAppointmentCount(...args),
      create: (...args: unknown[]) => mockAppointmentCreate(...args),
      update: (...args: unknown[]) => mockAppointmentUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

vi.mock('../middleware/authenticate.js', () => ({
  verifyJwt: (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    try {
      const token = header.slice('Bearer '.length);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
        issuer: process.env.JWT_ISSUER,
      });
      if (typeof decoded === 'string' || !decoded.sub) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      req.user = {
        userId: decoded.sub,
        email: String(decoded.email ?? ''),
        role: String(decoded.role ?? ''),
      };
      next();
    } catch {
      res.status(401).json({ message: 'Unauthorized' });
    }
  },
}));

vi.mock('@mindora/auth-middleware', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@mindora/auth-middleware')>();
  return {
    ...actual,
    isTokenBlacklisted: (...args: unknown[]) => mockIsBlacklisted(...args),
  };
});

vi.mock('../lib/publish-appointment-event.js', () => ({
  publishAppointmentEvent: (...args: unknown[]) =>
    mockPublishAppointmentEvent(...args),
}));

import { createApp } from '../app.js';
import { SlotConflictError } from '../lib/book-appointment.js';

const patientId = '11111111-1111-4111-8111-111111111111';
const therapistId = '22222222-2222-4222-8222-222222222222';
const appointmentId = '33333333-3333-4333-8333-333333333333';

function patientToken() {
  return jwt.sign(
    {
      sub: patientId,
      email: 'patient@example.com',
      role: 'PATIENT',
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '15m',
      issuer: process.env.JWT_ISSUER,
      jwtid: randomUUID(),
    }
  );
}

function therapistToken() {
  return jwt.sign(
    {
      sub: therapistId,
      email: 'therapist@example.com',
      role: 'THERAPIST',
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '15m',
      issuer: process.env.JWT_ISSUER,
      jwtid: randomUUID(),
    }
  );
}

function serviceToken() {
  return jwt.sign(
    {
      sub: 'admin-service',
      email: 'service@mindora.internal',
      role: 'SERVICE',
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '15m',
      issuer: process.env.JWT_ISSUER,
      jwtid: randomUUID(),
    }
  );
}

function sampleAppointment(overrides: Record<string, unknown> = {}) {
  const slotStart = new Date('2026-06-10T10:00:00.000Z');
  const slotEnd = new Date('2026-06-10T11:00:00.000Z');
  return {
    id: appointmentId,
    patientId,
    therapistId,
    slotStart,
    slotEnd,
    sessionType: 'VIDEO',
    status: 'PENDING',
    cancellationReason: null,
    rating: null,
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('POST /', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: therapistId,
        email: 'therapist@example.com',
        role: 'THERAPIST',
      }),
    });
    mockPublishAppointmentEvent.mockResolvedValue(undefined);
  });

  it('books an appointment successfully', async () => {
    const created = sampleAppointment();
    mockTransaction.mockImplementation(async (callback) => {
      const tx = {
        $queryRaw: vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce([]),
        appointment: {
          create: vi.fn().mockResolvedValue(created),
        },
      };
      return callback(tx);
    });

    const app = createApp();
    const response = await request(app)
      .post('/')
      .set('Authorization', `Bearer ${patientToken()}`)
      .send({
        therapistId,
        slotStart: '2026-06-10T10:00:00.000Z',
        slotEnd: '2026-06-10T11:00:00.000Z',
        sessionType: 'VIDEO',
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(appointmentId);
    expect(response.body.status).toBe('PENDING');
    expect(mockPublishAppointmentEvent).toHaveBeenCalledOnce();
  });

  it('returns 409 when slot is already booked', async () => {
    mockTransaction.mockImplementation(async (callback) => {
      const tx = {
        $queryRaw: vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce([{ id: 'existing' }]),
        appointment: {
          create: vi.fn(),
        },
      };
      return callback(tx);
    });

    const app = createApp();
    const response = await request(app)
      .post('/')
      .set('Authorization', `Bearer ${patientToken()}`)
      .send({
        therapistId,
        slotStart: '2026-06-10T10:00:00.000Z',
        slotEnd: '2026-06-10T11:00:00.000Z',
        sessionType: 'VIDEO',
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Slot already booked');
  });
});

describe('PUT /:id/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('confirms a pending appointment as therapist', async () => {
    mockAppointmentFindUnique.mockResolvedValue(sampleAppointment());
    mockAppointmentUpdate.mockResolvedValue(
      sampleAppointment({ status: 'CONFIRMED' })
    );

    const app = createApp();
    const response = await request(app)
      .put(`/${appointmentId}/confirm`)
      .set('Authorization', `Bearer ${therapistToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('CONFIRMED');
    expect(mockPublishAppointmentEvent).toHaveBeenCalledOnce();
  });

  it('rejects non-therapist with 403', async () => {
    const app = createApp();
    const response = await request(app)
      .put(`/${appointmentId}/confirm`)
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(403);
  });
});

describe('PUT /:id/cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('cancels as patient owner', async () => {
    mockAppointmentFindUnique.mockResolvedValue(sampleAppointment());
    mockAppointmentUpdate.mockResolvedValue(
      sampleAppointment({
        status: 'CANCELLED',
        cancellationReason: 'Schedule conflict',
      })
    );

    const app = createApp();
    const response = await request(app)
      .put(`/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${patientToken()}`)
      .send({ cancellationReason: 'Schedule conflict' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('CANCELLED');
    expect(mockPublishAppointmentEvent).toHaveBeenCalledOnce();
  });

  it('cancels as assigned therapist', async () => {
    mockAppointmentFindUnique.mockResolvedValue(sampleAppointment());
    mockAppointmentUpdate.mockResolvedValue(
      sampleAppointment({
        status: 'CANCELLED',
        cancellationReason: 'Therapist unavailable',
      })
    );

    const app = createApp();
    const response = await request(app)
      .put(`/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${therapistToken()}`)
      .send({ cancellationReason: 'Therapist unavailable' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('CANCELLED');
  });
});

describe('POST /:id/rate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('rates a completed appointment', async () => {
    mockAppointmentFindUnique.mockResolvedValue(
      sampleAppointment({ status: 'COMPLETED' })
    );
    mockAppointmentUpdate.mockResolvedValue(
      sampleAppointment({ status: 'COMPLETED', rating: 4 })
    );

    const app = createApp();
    const response = await request(app)
      .post(`/${appointmentId}/rate`)
      .set('Authorization', `Bearer ${patientToken()}`)
      .send({ rating: 4 });

    expect(response.status).toBe(200);
    expect(response.body.rating).toBe(4);
  });

  it('returns 422 when appointment is not completed', async () => {
    mockAppointmentFindUnique.mockResolvedValue(sampleAppointment());

    const app = createApp();
    const response = await request(app)
      .post(`/${appointmentId}/rate`)
      .set('Authorization', `Bearer ${patientToken()}`)
      .send({ rating: 5 });

    expect(response.status).toBe(422);
    expect(response.body.message).toBe(
      'Appointment must be completed before rating'
    );
  });
});

describe('SlotConflictError', () => {
  it('is recognized as a slot conflict', () => {
    expect(new SlotConflictError().name).toBe('SlotConflictError');
  });
});

describe('GET /internal/appointments/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('returns totalAppointments and completedAppointments', async () => {
    mockAppointmentCount.mockResolvedValueOnce(30).mockResolvedValueOnce(18);

    const app = createApp();
    const response = await request(app)
      .get('/internal/appointments/analytics')
      .set('Authorization', `Bearer ${serviceToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ totalAppointments: 30, completedAppointments: 18 });
    expect(mockAppointmentCount).toHaveBeenCalledTimes(2);
    expect(mockAppointmentCount.mock.calls[1]?.[0]).toEqual({
      where: { status: 'COMPLETED' },
    });
  });

  it('rejects a non-SERVICE (PATIENT) token with 403', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/internal/appointments/analytics')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(403);
    expect(mockAppointmentCount).not.toHaveBeenCalled();
  });

  it('rejects a request with no token with 401', async () => {
    const app = createApp();
    const response = await request(app).get('/internal/appointments/analytics');

    expect(response.status).toBe(401);
  });
});
