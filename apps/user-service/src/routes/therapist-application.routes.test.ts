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
      status: 'ready' as const,
      connect: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(0),
      set: vi.fn().mockResolvedValue('OK'),
      get: vi.fn().mockResolvedValue(null),
      del: vi.fn().mockResolvedValue(1),
      on: vi.fn(),
    };
  });
  return { default: Redis, Redis };
});

const mockAppFindFirst = vi.fn();
const mockAppFindUnique = vi.fn();
const mockAppCreate = vi.fn();
const mockAppUpdate = vi.fn();
const mockAppFindMany = vi.fn();
const mockAppCount = vi.fn();
const mockDocCreate = vi.fn();
const mockDocFindUnique = vi.fn();
const mockNoteCreate = vi.fn();
const mockTherapistProfileUpdate = vi.fn();
const mockIsBlacklisted = vi.fn();

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    therapistApplication: {
      findFirst: (...args: unknown[]) => mockAppFindFirst(...args),
      findUnique: (...args: unknown[]) => mockAppFindUnique(...args),
      create: (...args: unknown[]) => mockAppCreate(...args),
      update: (...args: unknown[]) => mockAppUpdate(...args),
      findMany: (...args: unknown[]) => mockAppFindMany(...args),
      count: (...args: unknown[]) => mockAppCount(...args),
    },
    therapistDocument: {
      create: (...args: unknown[]) => mockDocCreate(...args),
      findUnique: (...args: unknown[]) => mockDocFindUnique(...args),
    },
    therapistApplicationNote: {
      create: (...args: unknown[]) => mockNoteCreate(...args),
    },
    therapistProfile: {
      update: (...args: unknown[]) => mockTherapistProfileUpdate(...args),
    },
  },
}));

vi.mock('../lib/object-storage.js', () => ({
  buildDocumentStorageKey: vi.fn(
    (applicationId: string, fileName: string) =>
      `therapist-applications/${applicationId}/mock-${fileName}`
  ),
  uploadDocument: vi.fn().mockResolvedValue(undefined),
  getDocumentDownloadUrl: vi
    .fn()
    .mockResolvedValue('https://storage.example.com/presigned-url'),
}));

const mockPublishEvent = vi.fn().mockResolvedValue(undefined);
vi.mock('../lib/publish-therapist-application-event.js', () => ({
  publishTherapistApplicationEvent: (...args: unknown[]) =>
    mockPublishEvent(...args),
}));

const mockUpsertProfile = vi.fn().mockResolvedValue(undefined);
vi.mock('../lib/profile-provisioning.js', () => ({
  upsertTherapistProfileFromApplication: (...args: unknown[]) =>
    mockUpsertProfile(...args),
}));

vi.mock('@mindora/auth-middleware', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@mindora/auth-middleware')>();
  return {
    ...actual,
    isTokenBlacklisted: (...args: unknown[]) => mockIsBlacklisted(...args),
  };
});

import { createApp } from '../app.js';

function patientToken(userId = 'patient-1') {
  return jwt.sign(
    { sub: userId, email: 'patient@example.com', role: 'PATIENT' },
    process.env.JWT_SECRET!,
    { expiresIn: '15m', issuer: process.env.JWT_ISSUER, jwtid: randomUUID() }
  );
}

function serviceToken() {
  return jwt.sign(
    { sub: 'admin-service', email: 'service@mindora.internal', role: 'SERVICE' },
    process.env.JWT_SECRET!,
    { expiresIn: '15m', issuer: process.env.JWT_ISSUER, jwtid: randomUUID() }
  );
}

const baseApplication = {
  id: 'app-1',
  userId: 'patient-1',
  status: 'DRAFT',
  fullName: '',
  phoneNumber: '',
  contactEmail: '',
  professionalBio: '',
  qualifications: [],
  certifications: [],
  licenseNumber: '',
  licenseIssuingBody: '',
  licenseExpiryDate: null,
  professionalRegistrationNumber: null,
  specialisations: [],
  yearsOfExperience: 0,
  languages: [],
  availabilitySummary: null,
  location: '',
  timezone: 'Africa/Kigali',
  submittedAt: null,
  reviewedAt: null,
  reviewedBy: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const completeApplication = {
  ...baseApplication,
  status: 'DRAFT',
  fullName: 'Alice Uwase',
  phoneNumber: '+250788123456',
  contactEmail: 'alice@example.com',
  professionalBio: 'Experienced counsellor.',
  qualifications: ['MSc Clinical Psychology'],
  licenseNumber: 'RW-PSY-001',
  licenseIssuingBody: 'RAHPC',
  specialisations: ['Anxiety'],
  yearsOfExperience: 5,
  languages: ['English'],
  location: 'Kigali',
};

describe('POST /therapist-applications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('creates a new DRAFT when none exists', async () => {
    mockAppFindFirst.mockResolvedValue(null);
    mockAppCreate.mockResolvedValue(baseApplication);

    const app = createApp();
    const response = await request(app)
      .post('/therapist-applications')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ application: baseApplication });
  });

  it('resumes an existing DRAFT instead of creating a duplicate', async () => {
    mockAppFindFirst.mockResolvedValue(baseApplication);

    const app = createApp();
    const response = await request(app)
      .post('/therapist-applications')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(200);
    expect(mockAppCreate).not.toHaveBeenCalled();
  });

  it('409s when an application is already SUBMITTED', async () => {
    mockAppFindFirst.mockResolvedValue({
      ...baseApplication,
      status: 'SUBMITTED',
    });

    const app = createApp();
    const response = await request(app)
      .post('/therapist-applications')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(409);
  });

  it('rejects unauthenticated requests', async () => {
    const app = createApp();
    const response = await request(app).post('/therapist-applications');
    expect(response.status).toBe(401);
  });
});

describe('PUT /therapist-applications/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('404s for an application belonging to a different user', async () => {
    mockAppFindUnique.mockResolvedValue({
      ...baseApplication,
      userId: 'someone-else',
    });

    const app = createApp();
    const response = await request(app)
      .put('/therapist-applications/app-1')
      .set('Authorization', `Bearer ${patientToken()}`)
      .send({ fullName: 'New Name' });

    expect(response.status).toBe(404);
  });

  it('409s when the application is not in an editable status', async () => {
    mockAppFindUnique.mockResolvedValue({
      ...baseApplication,
      status: 'SUBMITTED',
    });

    const app = createApp();
    const response = await request(app)
      .put('/therapist-applications/app-1')
      .set('Authorization', `Bearer ${patientToken()}`)
      .send({ fullName: 'New Name' });

    expect(response.status).toBe(409);
    expect(mockAppUpdate).not.toHaveBeenCalled();
  });

  it('updates a DRAFT application owned by the caller', async () => {
    mockAppFindUnique.mockResolvedValue(baseApplication);
    mockAppUpdate.mockResolvedValue({ ...baseApplication, fullName: 'Alice' });

    const app = createApp();
    const response = await request(app)
      .put('/therapist-applications/app-1')
      .set('Authorization', `Bearer ${patientToken()}`)
      .send({ fullName: 'Alice' });

    expect(response.status).toBe(200);
    expect(response.body.application.fullName).toBe('Alice');
  });
});

describe('POST /therapist-applications/:id/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('400s with field errors when the stored record is incomplete', async () => {
    mockAppFindUnique.mockResolvedValue(baseApplication);

    const app = createApp();
    const response = await request(app)
      .post('/therapist-applications/app-1/submit')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
    expect(mockAppUpdate).not.toHaveBeenCalled();
  });

  it('transitions to SUBMITTED and publishes an event when the record is complete', async () => {
    mockAppFindUnique.mockResolvedValue(completeApplication);
    mockAppUpdate.mockResolvedValue({
      ...completeApplication,
      status: 'SUBMITTED',
      submittedAt: '2026-01-02T00:00:00.000Z',
    });

    const app = createApp();
    const response = await request(app)
      .post('/therapist-applications/app-1/submit')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.application.status).toBe('SUBMITTED');
    expect(mockPublishEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'therapist_application.submitted' })
    );
  });

  it('409s when status is not DRAFT or MORE_INFORMATION_REQUIRED', async () => {
    mockAppFindUnique.mockResolvedValue({
      ...completeApplication,
      status: 'APPROVED',
    });

    const app = createApp();
    const response = await request(app)
      .post('/therapist-applications/app-1/submit')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(409);
  });
});

describe('internal therapist-application routes — SERVICE role required', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('rejects a PATIENT-role token on the internal list endpoint', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/internal/users/therapist-applications')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(403);
  });

  it('rejects a PATIENT-role token on the status-transition endpoint', async () => {
    const app = createApp();
    const response = await request(app)
      .patch('/internal/users/therapist-applications/app-1/status')
      .set('Authorization', `Bearer ${patientToken()}`)
      .send({ status: 'APPROVED', reviewedBy: randomUUID() });

    expect(response.status).toBe(403);
    expect(mockAppUpdate).not.toHaveBeenCalled();
  });

  it('lists applications for a SERVICE-role caller', async () => {
    mockAppFindMany.mockResolvedValue([completeApplication]);
    mockAppCount.mockResolvedValue(1);

    const app = createApp();
    const response = await request(app)
      .get('/internal/users/therapist-applications')
      .set('Authorization', `Bearer ${serviceToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
  });
});

describe('PATCH /internal/users/therapist-applications/:id/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('rejects an illegal transition (DRAFT -> APPROVED)', async () => {
    mockAppFindUnique.mockResolvedValue({
      ...completeApplication,
      status: 'DRAFT',
    });

    const app = createApp();
    const response = await request(app)
      .patch('/internal/users/therapist-applications/app-1/status')
      .set('Authorization', `Bearer ${serviceToken()}`)
      .send({ status: 'APPROVED', reviewedBy: randomUUID() });

    expect(response.status).toBe(409);
    expect(mockAppUpdate).not.toHaveBeenCalled();
  });

  it('requires a reason to reject', async () => {
    const app = createApp();
    const response = await request(app)
      .patch('/internal/users/therapist-applications/app-1/status')
      .set('Authorization', `Bearer ${serviceToken()}`)
      .send({ status: 'REJECTED', reviewedBy: randomUUID() });

    expect(response.status).toBe(400);
  });

  it('approves a SUBMITTED application, upserts the profile, and publishes an event', async () => {
    mockAppFindUnique.mockResolvedValue({
      ...completeApplication,
      status: 'SUBMITTED',
    });
    mockAppUpdate.mockResolvedValue({
      ...completeApplication,
      status: 'APPROVED',
    });

    const app = createApp();
    const response = await request(app)
      .patch('/internal/users/therapist-applications/app-1/status')
      .set('Authorization', `Bearer ${serviceToken()}`)
      .send({ status: 'APPROVED', reviewedBy: randomUUID() });

    expect(response.status).toBe(200);
    expect(response.body.application.status).toBe('APPROVED');
    expect(mockUpsertProfile).toHaveBeenCalledWith(
      completeApplication.userId,
      completeApplication.id,
      expect.objectContaining({ fullName: completeApplication.fullName })
    );
    expect(mockPublishEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'therapist_application.approved' })
    );
  });
});

describe('PATCH /internal/users/:userId/therapist-suspension', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('flips isSuspended and publishes a suspended event', async () => {
    mockTherapistProfileUpdate.mockResolvedValue({
      userId: 'therapist-1',
      isSuspended: true,
    });

    const app = createApp();
    const response = await request(app)
      .patch('/internal/users/therapist-1/therapist-suspension')
      .set('Authorization', `Bearer ${serviceToken()}`)
      .send({ isSuspended: true });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: 'therapist-1', isSuspended: true });
    expect(mockPublishEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'therapist_application.suspended' })
    );
  });

  it('404s when no TherapistProfile exists for the user', async () => {
    const { Prisma } = await import('../generated/prisma/index.js');
    mockTherapistProfileUpdate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: 'test',
      })
    );

    const app = createApp();
    const response = await request(app)
      .patch('/internal/users/nonexistent/therapist-suspension')
      .set('Authorization', `Bearer ${serviceToken()}`)
      .send({ isSuspended: true });

    expect(response.status).toBe(404);
  });
});
