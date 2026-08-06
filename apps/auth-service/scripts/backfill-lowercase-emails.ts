// One-time backfill: lowercases every users.email so it matches the
// normalized (trim + toLowerCase) form now used by register/login/
// forgot-password (see packages/validation/src/auth.ts). Without this,
// accounts created before that change keep whatever casing they were
// originally stored with, and Postgres text equality is case-sensitive —
// so a lowercase login lookup will never match a mixed-case stored row.
//
// Safe by construction: aborts with no writes if lowercasing would collide
// two existing rows onto the same email (needs manual resolution first).
//
// Usage: npm run backfill:lowercase-emails --workspace=@mindora/auth-service
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as dotenvConfig } from 'dotenv';

const moduleDir = fileURLToPath(new URL('.', import.meta.url));
dotenvConfig({ path: resolve(moduleDir, '../../../.env') });
dotenvConfig();

const { prisma } = await import('../src/lib/prisma.js');

const users = await prisma.user.findMany({
  select: { id: true, email: true },
});

const byLowercase = new Map<string, { id: string; email: string }[]>();
for (const user of users) {
  const key = user.email.trim().toLowerCase();
  const group = byLowercase.get(key) ?? [];
  group.push(user);
  byLowercase.set(key, group);
}

const collisions = [...byLowercase.entries()].filter(
  ([, group]) => group.length > 1
);
if (collisions.length > 0) {
  console.error(
    `Aborting: ${collisions.length} email(s) collide once lowercased. Resolve these manually first (merge or rename), then re-run:`
  );
  for (const [normalized, group] of collisions) {
    console.error(
      `  ${normalized}: ${group.map((u) => `${u.id} (${u.email})`).join(', ')}`
    );
  }
  process.exit(1);
}

const needsUpdate = users.filter(
  (u) => u.email !== u.email.trim().toLowerCase()
);
console.log(
  `${needsUpdate.length} of ${users.length} user(s) need normalization.`
);

for (const user of needsUpdate) {
  const normalized = user.email.trim().toLowerCase();
  await prisma.user.update({
    where: { id: user.id },
    data: { email: normalized },
  });
  console.log(`  ${user.id}: ${user.email} -> ${normalized}`);
}

console.log('Done.');
process.exit(0);
