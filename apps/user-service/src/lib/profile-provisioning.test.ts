import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPatientFindUnique = vi.fn();
const mockPatientCreate = vi.fn();
const mockTherapistFindUnique = vi.fn();
const mockTherapistCreate = vi.fn();
const mockTherapistUpsert = vi.fn();

vi.mock('./prisma.js', () => ({
  prisma: {
    patientProfile: {
      findUnique: (...args: unknown[]) => mockPatientFindUnique(...args),
      create: (...args: unknown[]) => mockPatientCreate(...args),
    },
    therapistProfile: {
      findUnique: (...args: unknown[]) => mockTherapistFindUnique(...args),
      create: (...args: unknown[]) => mockTherapistCreate(...args),
      upsert: (...args: unknown[]) => mockTherapistUpsert(...args),
    },
  },
}));

const { FakePrismaClientKnownRequestError } = vi.hoisted(() => {
  class FakePrismaClientKnownRequestError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
    }
  }
  return { FakePrismaClientKnownRequestError };
});

vi.mock('../generated/prisma/index.js', () => ({
  Prisma: {
    PrismaClientKnownRequestError: FakePrismaClientKnownRequestError,
  },
}));

import {
  ensureProfileForUser,
  upsertTherapistProfileFromApplication,
} from './profile-provisioning.js';

describe('ensureProfileForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a PatientProfile and returns true when none exists', async () => {
    mockPatientFindUnique.mockResolvedValueOnce(null);
    mockPatientCreate.mockResolvedValueOnce({});

    const created = await ensureProfileForUser('user-1', 'PATIENT', 'Jane', 'jane@example.com');

    expect(created).toBe(true);
    expect(mockPatientCreate).toHaveBeenCalledWith({
      data: { userId: 'user-1', userName: 'Jane', role: 'PATIENT', email: 'jane@example.com' },
    });
    expect(mockTherapistCreate).not.toHaveBeenCalled();
  });

  it('returns false without creating when a PatientProfile already exists', async () => {
    mockPatientFindUnique.mockResolvedValueOnce({ userId: 'user-1' });

    const created = await ensureProfileForUser('user-1', 'PATIENT');

    expect(created).toBe(false);
    expect(mockPatientCreate).not.toHaveBeenCalled();
  });

  it('creates a TherapistProfile and returns true when none exists', async () => {
    mockTherapistFindUnique.mockResolvedValueOnce(null);
    mockTherapistCreate.mockResolvedValueOnce({});

    const created = await ensureProfileForUser('user-2', 'THERAPIST', 'Dr. X');

    expect(created).toBe(true);
    expect(mockTherapistCreate).toHaveBeenCalledWith({
      data: { userId: 'user-2', userName: 'Dr. X', role: 'THERAPIST', email: undefined },
    });
  });

  it('returns false for ADMIN without touching either profile table', async () => {
    const created = await ensureProfileForUser('user-3', 'ADMIN');

    expect(created).toBe(false);
    expect(mockPatientFindUnique).not.toHaveBeenCalled();
    expect(mockTherapistFindUnique).not.toHaveBeenCalled();
  });

  it('swallows a unique-constraint race on create and returns false', async () => {
    mockPatientFindUnique.mockResolvedValueOnce(null);
    mockPatientCreate.mockRejectedValueOnce(
      new FakePrismaClientKnownRequestError('duplicate', 'P2002')
    );

    const created = await ensureProfileForUser('user-1', 'PATIENT');

    expect(created).toBe(false);
  });

  it('rethrows a non-unique-constraint error from create', async () => {
    mockPatientFindUnique.mockResolvedValueOnce(null);
    mockPatientCreate.mockRejectedValueOnce(new Error('connection lost'));

    await expect(ensureProfileForUser('user-1', 'PATIENT')).rejects.toThrow('connection lost');
  });
});

describe('upsertTherapistProfileFromApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joins specialisations into the legacy single free-text field and upserts APPROVED', async () => {
    mockTherapistUpsert.mockResolvedValueOnce({});

    await upsertTherapistProfileFromApplication('user-1', 'app-1', {
      fullName: 'Dr. Jane Doe',
      professionalBio: 'Bio text',
      specialisations: ['Anxiety', 'Trauma'],
      languages: ['English', 'Kinyarwanda'],
      timezone: 'Africa/Kigali',
      contactEmail: 'jane@example.com',
    });

    expect(mockTherapistUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        create: expect.objectContaining({
          userId: 'user-1',
          userName: 'Dr. Jane Doe',
          specialisation: 'Anxiety, Trauma',
          languages: ['English', 'Kinyarwanda'],
          role: 'THERAPIST',
          applicationStatus: 'APPROVED',
          applicationId: 'app-1',
          isSuspended: false,
        }),
        update: expect.objectContaining({
          specialisation: 'Anxiety, Trauma',
          applicationStatus: 'APPROVED',
          applicationId: 'app-1',
          isSuspended: false,
        }),
      })
    );
  });
});
