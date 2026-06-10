import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

vi.hoisted(() => {
  process.env.JWT_SECRET = 'mindora-dev-jwt-secret-change-in-production';
  process.env.JWT_ISSUER = 'mindora-auth';
  process.env.NODE_ENV = 'test';
});

const mockPatientFindUnique = vi.fn();
const mockPatientUpdate = vi.fn();
const mockTherapistFindUnique = vi.fn();
const mockTherapistUpdate = vi.fn();
const mockTherapistFindMany = vi.fn();
const mockTherapistCount = vi.fn();
const mockIsBlacklisted = vi.fn();

vi.mock('@mindora/database', () => ({
  prisma: {
    patientProfile: {
      findUnique: (...args: unknown[]) => mockPatientFindUnique(...args),
      update: (...args: unknown[]) => mockPatientUpdate(...args),
    },
    therapistProfile: {
      findUnique: (...args: unknown[]) => mockTherapistFindUnique(...args),
      update: (...args: unknown[]) => mockTherapistUpdate(...args),
      findMany: (...args: unknown[]) => mockTherapistFindMany(...args),
      count: (...args: unknown[]) => mockTherapistCount(...args),
    },
  },
  Prisma: {},
}));

vi.mock('@mindora/auth-middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mindora/auth-middleware')>();
  return {
    ...actual,
    isTokenBlacklisted: (...args: unknown[]) => mockIsBlacklisted(...args),
  };
});

import { createApp } from '../app.js';

function patientToken() {
  return jwt.sign(
    {
      sub: 'patient-1',
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

describe('GET /me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('returns patient profile', async () => {
    const profile = {
      id: 'profile-1',
      userId: 'patient-1',
      userName: 'Patient One',
      bio: 'Hello',
      timezone: 'Africa/Kigali',
      languagePreference: 'en',
      notificationPreferences: { email: true },
    };
    mockPatientFindUnique.mockResolvedValue(profile);

    const app = createApp();
    const response = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ role: 'PATIENT', profile });
  });

  it('rejects missing auth with 401', async () => {
    const app = createApp();
    const response = await request(app).get('/me');

    expect(response.status).toBe(401);
  });
});

describe('PUT /me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('updates patient profile', async () => {
    const updated = {
      id: 'profile-1',
      userId: 'patient-1',
      userName: 'Updated Name',
      bio: 'New bio',
      timezone: 'UTC',
      languagePreference: 'fr',
      notificationPreferences: { email: false },
    };
    mockPatientUpdate.mockResolvedValue(updated);

    const app = createApp();
    const response = await request(app)
      .put('/me')
      .set('Authorization', `Bearer ${patientToken()}`)
      .send({
        userName: 'Updated Name',
        bio: 'New bio',
        timezone: 'UTC',
        languagePreference: 'fr',
        notificationPreferences: { email: false },
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ role: 'PATIENT', profile: updated });
  });
});

describe('GET /therapists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
    mockTherapistFindMany.mockResolvedValue([
      { id: 't1', userName: 'Dr. A', isAcceptingPatients: true },
    ]);
    mockTherapistCount.mockResolvedValue(1);
  });

  it('returns paginated therapists', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/therapists?page=1&limit=10')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      therapists: [{ id: 't1', userName: 'Dr. A', isAcceptingPatients: true }],
      total: 1,
      page: 1,
      limit: 10,
    });
  });
});
