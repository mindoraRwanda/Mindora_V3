import { PrismaClient } from '@prisma/client';
import {
  createCipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from 'node:crypto';

const prisma = new PrismaClient();

function encryptNote(plaintext: string, secret: string): string {
  const key = createHash('sha256').update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

async function main() {
  const patient = await prisma.user.findUnique({
    where: { email: 'patient@test.mindora.local' },
  });

  if (!patient) {
    console.warn('Run npm run db:seed first for patient@test.mindora.local');
    return;
  }

  const secret =
    process.env.MOOD_JOURNAL_ENCRYPTION_KEY ??
    'mindora-dev-mood-journal-key-32bytes!!';

  await prisma.moodEntry.deleteMany({ where: { userId: patient.id } });

  const now = new Date();
  const entries = [];

  for (let day = 29; day >= 0; day -= 1) {
    const recordedAt = new Date(now);
    recordedAt.setUTCDate(recordedAt.getUTCDate() - day);
    recordedAt.setUTCHours(12, 0, 0, 0);

    const moodScore = day < 5 ? [1, 2, 2, 3, 2][day]! : 5 + (day % 4);

    entries.push({
      id: randomUUID(),
      userId: patient.id,
      moodScore,
      emotions: day < 5 ? ['anxious', 'tired'] : ['calm'],
      sleepHours: day < 5 ? 4 + (day % 3) : 7,
      stressLevel: day < 5 ? 8 : 4,
      energyLevel: day < 5 ? 3 : 6,
      triggers: day < 5 ? ['work', 'sleep'] : [],
      journalNoteEncrypted: encryptNote(
        day < 5 ? 'Feeling low today.' : 'Steady day.',
        secret
      ),
      recordedAt,
      createdAt: recordedAt,
    });
  }

  await prisma.moodEntry.createMany({ data: entries });
  console.log(
    `Seeded ${entries.length} mood entries (last 5 low scores for concern trigger)`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
