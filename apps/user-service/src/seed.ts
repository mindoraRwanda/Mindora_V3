import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const patient = await prisma.user.findUnique({
    where: { email: 'patient@test.mindora.local' },
  });
  const therapist = await prisma.user.findUnique({
    where: { email: 'therapist@test.mindora.local' },
  });
  const therapist2 = await prisma.user.findUnique({
    where: { email: 'therapist2@test.mindora.local' },
  });

  if (patient) {
    await prisma.patientProfile.upsert({
      where: { userId: patient.id },
      update: {},
      create: {
        userId: patient.id,
        userName: 'Test Patient',
        bio: 'Sprint 2 seeded patient profile',
        timezone: 'Africa/Kigali',
        languagePreference: 'en',
        notificationPreferences: { email: true, push: false },
      },
    });
    console.log('Seeded patient profile');
  }

  if (therapist) {
    await prisma.therapistProfile.upsert({
      where: { userId: therapist.id },
      update: {},
      create: {
        userId: therapist.id,
        userName: 'Dr. Test Therapist',
        bio: 'CBT specialist',
        timezone: 'Africa/Kigali',
        languagePreference: 'en',
        specialisation: 'CBT',
        languages: ['en', 'fr'],
        isAcceptingPatients: true,
        notificationPreferences: { email: true },
      },
    });
    console.log('Seeded therapist profile');
  }

  if (therapist2) {
    await prisma.therapistProfile.upsert({
      where: { userId: therapist2.id },
      update: {},
      create: {
        userId: therapist2.id,
        userName: 'Dr. Second Therapist',
        bio: 'Anxiety and trauma',
        specialisation: 'Anxiety',
        languages: ['en'],
        isAcceptingPatients: true,
      },
    });
    console.log('Seeded second therapist profile');
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
