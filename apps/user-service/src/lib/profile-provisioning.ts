import { prisma } from './prisma.js';
import { Prisma } from '../generated/prisma/index.js';

// User Service no longer has a User model (that lives in Auth Service's
// isolated 'mindora_auth' database) — this is a plain local type for
// role-branching only, not derived from a Prisma schema.
export type UserRole = 'PATIENT' | 'THERAPIST' | 'ADMIN';

const PRISMA_UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === PRISMA_UNIQUE_CONSTRAINT_VIOLATION
  );
}

// Creates a profile row for a user if one doesn't already exist.
// Idempotent — safe to call more than once for the same userId (e.g. a
// redelivered queue message, or a re-run of the backfill script).
// `userName` is optional so the backfill script can supply a legacy
// email-prefix fallback for users who registered before this field existed.
// `role`/`email` are denormalized copies from Auth Service — see the NOTE
// above the role/email fields in schema.prisma.
// Returns true if a profile was created, false if it already existed or
// the role doesn't need one (ADMIN).
export async function ensureProfileForUser(
  userId: string,
  role: UserRole,
  userName?: string | null,
  email?: string | null
): Promise<boolean> {
  if (role === 'PATIENT') {
    const existing = await prisma.patientProfile.findUnique({
      where: { userId },
    });
    if (existing) return false;

    try {
      await prisma.patientProfile.create({
        data: { userId, userName, role, email },
      });
      return true;
    } catch (error) {
      if (isUniqueConstraintViolation(error)) return false;
      throw error;
    }
  }

  if (role === 'THERAPIST') {
    const existing = await prisma.therapistProfile.findUnique({
      where: { userId },
    });
    if (existing) return false;

    try {
      await prisma.therapistProfile.create({
        data: { userId, userName, role, email },
      });
      return true;
    } catch (error) {
      if (isUniqueConstraintViolation(error)) return false;
      throw error;
    }
  }

  return false;
}

// Called when a TherapistApplication is APPROVED. The applicant registered
// and has been operating as PATIENT the whole time they were under review
// (see auth.routes.ts's role-lock comment), so this is the first time a
// TherapistProfile row is created for them — PatientProfile is a separate
// table and is deliberately left as-is (stale, unused once role flips to
// THERAPIST; cleaning it up is out of scope for this milestone). Upsert,
// not create, so re-approving after a suspend/reactivate cycle or a data
// fix doesn't fail on the unique userId constraint.
export async function upsertTherapistProfileFromApplication(
  userId: string,
  applicationId: string,
  application: {
    fullName: string;
    professionalBio: string;
    specialisations: string[];
    languages: string[];
    timezone: string;
    contactEmail: string;
  }
): Promise<void> {
  // TherapistProfile.specialisation is a single free-text field (predates
  // the application system's specialisations[] list) — joined here rather
  // than widened to an array, so GET /therapists' existing
  // `specialisation: { contains }` filter keeps working unchanged.
  const specialisation = application.specialisations.join(', ');

  await prisma.therapistProfile.upsert({
    where: { userId },
    create: {
      userId,
      userName: application.fullName,
      bio: application.professionalBio,
      timezone: application.timezone,
      specialisation,
      languages: application.languages,
      role: 'THERAPIST',
      email: application.contactEmail,
      applicationStatus: 'APPROVED',
      applicationId,
      isSuspended: false,
    },
    update: {
      userName: application.fullName,
      bio: application.professionalBio,
      timezone: application.timezone,
      specialisation,
      languages: application.languages,
      role: 'THERAPIST',
      applicationStatus: 'APPROVED',
      applicationId,
      isSuspended: false,
    },
  });
}
