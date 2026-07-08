// One-time backfill: creates a profile for any existing user that doesn't
// have one yet (PATIENT/THERAPIST only — ADMIN needs no profile). This only
// covers users who registered before the user.registered event consumer and
// the required userName field existed, so userName is derived from the
// email prefix as a legacy fallback rather than sourced from an event.
// Usage: npm run backfill:profiles --workspace=@mindora/user-service
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as dotenvConfig } from 'dotenv';

const moduleDir = fileURLToPath(new URL('.', import.meta.url));
dotenvConfig({ path: resolve(moduleDir, '../../../.env') });
dotenvConfig({ path: resolve(moduleDir, '../../../packages/database/.env') });
dotenvConfig();

const { prisma } = await import('@mindora/database');
const { ensureProfileForUser } = await import(
  '../src/lib/profile-provisioning.js'
);

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, role: true, email: true },
  });

  let created = 0;
  let patched = 0;
  for (const user of users) {
    const legacyUserName = user.email.split('@')[0];
    const wasCreated = await ensureProfileForUser(
      user.id,
      user.role,
      legacyUserName
    );
    if (wasCreated) {
      created += 1;
      console.log(
        `[backfill] Profile created for userId=${user.id} role=${user.role} email=${user.email}`
      );
      continue;
    }

    // Profile already existed (e.g. created blank by an earlier, pre-userName
    // version of this backfill). Patch in the legacy fallback name so it's
    // never left blank, without touching any name a user may have since set.
    if (user.role === 'PATIENT') {
      const { count } = await prisma.patientProfile.updateMany({
        where: { userId: user.id, userName: null },
        data: { userName: legacyUserName },
      });
      if (count > 0) patched += 1;
    } else if (user.role === 'THERAPIST') {
      const { count } = await prisma.therapistProfile.updateMany({
        where: { userId: user.id, userName: null },
        data: { userName: legacyUserName },
      });
      if (count > 0) patched += 1;
    }
  }

  console.log(
    `[backfill] Done. ${created} profile(s) created, ${patched} existing blank profile(s) patched with a legacy userName, out of ${users.length} user(s).`
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
