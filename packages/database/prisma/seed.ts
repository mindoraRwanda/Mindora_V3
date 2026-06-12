import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

const seedUsers = [
  {
    email: 'patient@test.mindora.local',
    password: 'Patient123!',
    role: 'PATIENT' as const,
  },
  {
    email: 'therapist@test.mindora.local',
    password: 'Therapist123!',
    role: 'THERAPIST' as const,
  },
  {
    email: 'admin@test.mindora.local',
    password: 'Admin123!',
    role: 'ADMIN' as const,
  },
];

async function main() {
  for (const user of seedUsers) {
    const passwordHash = await argon2.hash(user.password, ARGON2_OPTIONS);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash, role: user.role },
      create: {
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
    console.log(`Seeded ${user.role}: ${user.email}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
