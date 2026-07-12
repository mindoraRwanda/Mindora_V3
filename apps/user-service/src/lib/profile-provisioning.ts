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
