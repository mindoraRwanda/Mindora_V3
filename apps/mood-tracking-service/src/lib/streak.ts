import type { MoodEntry } from '@mindora/database';

export function calculateStreak(entries: Pick<MoodEntry, 'recordedAt'>[]): {
  streak: number;
  lastCheckedIn: string | null;
} {
  if (entries.length === 0) {
    return { streak: 0, lastCheckedIn: null };
  }

  const daySet = new Set(
    entries.map((entry) => entry.recordedAt.toISOString().slice(0, 10))
  );
  const sortedDays = [...daySet].sort().reverse();
  const lastCheckedIn = sortedDays[0] ?? null;

  let streak = 1;
  for (let i = 1; i < sortedDays.length; i += 1) {
    const prev = new Date(`${sortedDays[i - 1]}T00:00:00.000Z`);
    const curr = new Date(`${sortedDays[i]}T00:00:00.000Z`);
    const dayDiff = (prev.getTime() - curr.getTime()) / 86_400_000;
    if (dayDiff === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return { streak, lastCheckedIn };
}
