// One-time backfill: for existing profile rows created before Auth Service
// separation, populate role/email (denormalized copies) by looking them up
// via Auth Service's internal endpoint through Kong. Also patches userName
// with the legacy email-prefix fallback for any row that still lacks one.
//
// Note: this can only backfill role/email for users who ALREADY have a
// profile row — it can no longer discover users with zero profile rows at
// all (the pre-separation version's other purpose), since that needs a bulk
// list-users endpoint on Auth Service that doesn't exist yet. Not currently
// a real gap: the last pre-separation run of this script reported 0
// profiles missing entirely.
// Usage: npm run backfill:profiles --workspace=@mindora/user-service
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as dotenvConfig } from 'dotenv';

const moduleDir = fileURLToPath(new URL('.', import.meta.url));
dotenvConfig({ path: resolve(moduleDir, '../../../.env') });
dotenvConfig();

const { prisma } = await import('../src/lib/prisma.js');

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

async function fetchAuthUser(userId: string): Promise<AuthUser | null> {
  const base = process.env.KONG_URL ?? 'http://localhost:8000';
  try {
    const res = await fetch(`${base}/internal/auth/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as AuthUser;
  } catch {
    return null;
  }
}

interface ProfileRow {
  userId: string;
  userName: string | null;
  role: string | null;
  email: string | null;
}

async function backfillTable(
  label: 'patient' | 'therapist',
  rows: ProfileRow[],
  update: (
    userId: string,
    data: { userName?: string; role?: string; email?: string }
  ) => Promise<unknown>
): Promise<number> {
  let patched = 0;
  for (const row of rows) {
    if (row.role && row.email && row.userName) continue;

    const authUser = await fetchAuthUser(row.userId);
    if (!authUser) {
      console.warn(
        `[backfill] Could not resolve Auth Service data for userId=${row.userId} — skipping`
      );
      continue;
    }

    const data: { userName?: string; role?: string; email?: string } = {};
    if (!row.role) data.role = authUser.role;
    if (!row.email) data.email = authUser.email;
    if (!row.userName) data.userName = authUser.email.split('@')[0];

    if (Object.keys(data).length === 0) continue;

    await update(row.userId, data);
    patched += 1;
    console.log(
      `[backfill] Patched ${label} profile userId=${row.userId} fields=${Object.keys(data).join(',')}`
    );
  }
  return patched;
}

async function main() {
  const patientProfiles = await prisma.patientProfile.findMany({
    select: { userId: true, userName: true, role: true, email: true },
  });
  const therapistProfiles = await prisma.therapistProfile.findMany({
    select: { userId: true, userName: true, role: true, email: true },
  });

  const patientPatched = await backfillTable(
    'patient',
    patientProfiles,
    (userId, data) => prisma.patientProfile.update({ where: { userId }, data })
  );
  const therapistPatched = await backfillTable(
    'therapist',
    therapistProfiles,
    (userId, data) =>
      prisma.therapistProfile.update({ where: { userId }, data })
  );

  console.log(
    `[backfill] Done. ${patientPatched} patient profile(s) and ${therapistPatched} therapist profile(s) patched, out of ${patientProfiles.length + therapistProfiles.length} total profile(s).`
  );
}

main()
  .catch((error) => {
    console.error('[backfill] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
