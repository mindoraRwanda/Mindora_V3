import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const patient = await prisma.user.findUnique({
    where: { email: 'patient@test.mindora.local' },
  });
  const therapist = await prisma.user.findUnique({
    where: { email: 'therapist@test.mindora.local' },
  });

  if (!patient || !therapist) {
    console.warn(
      'Run npm run db:seed first to create patient@test and therapist@test users'
    );
    return;
  }

  const pendingStart = new Date();
  pendingStart.setUTCDate(pendingStart.getUTCDate() + 1);
  pendingStart.setUTCHours(10, 0, 0, 0);
  const pendingEnd = new Date(pendingStart.getTime() + 60 * 60 * 1000);

  const confirmedStart = new Date(pendingStart);
  confirmedStart.setUTCDate(confirmedStart.getUTCDate() + 1);
  confirmedStart.setUTCHours(11, 0, 0, 0);
  const confirmedEnd = new Date(confirmedStart.getTime() + 60 * 60 * 1000);

  const completedStart = new Date(pendingStart);
  completedStart.setUTCDate(completedStart.getUTCDate() - 7);
  completedStart.setUTCHours(14, 0, 0, 0);
  const completedEnd = new Date(completedStart.getTime() + 60 * 60 * 1000);

  await prisma.appointment.deleteMany({
    where: {
      patientId: patient.id,
      therapistId: therapist.id,
    },
  });

  await prisma.appointment.createMany({
    data: [
      {
        patientId: patient.id,
        therapistId: therapist.id,
        slotStart: pendingStart,
        slotEnd: pendingEnd,
        sessionType: 'VIDEO',
        status: 'PENDING',
      },
      {
        patientId: patient.id,
        therapistId: therapist.id,
        slotStart: confirmedStart,
        slotEnd: confirmedEnd,
        sessionType: 'CHAT',
        status: 'CONFIRMED',
      },
      {
        patientId: patient.id,
        therapistId: therapist.id,
        slotStart: completedStart,
        slotEnd: completedEnd,
        sessionType: 'IN_PERSON',
        status: 'COMPLETED',
        rating: 5,
      },
    ],
  });

  console.log('Seeded 3 appointments (PENDING, CONFIRMED, COMPLETED)');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
