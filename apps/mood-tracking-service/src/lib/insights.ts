import { prisma } from './prisma.js';

export type TrendDirection = 'improving' | 'declining' | 'stable';

export interface WeeklyBucket {
  bucketStart: string;
  avgMood: number | null;
  avgSleep: number | null;
  avgStress: number | null;
  avgEnergy: number | null;
}

export interface WeeklyInsights {
  buckets: WeeklyBucket[];
  trend: TrendDirection;
}

function toTrend(
  previous: number | null,
  latest: number | null
): TrendDirection {
  if (previous === null || latest === null) {
    return 'stable';
  }
  const delta = latest - previous;
  if (delta > 0.5) {
    return 'improving';
  }
  if (delta < -0.5) {
    return 'declining';
  }
  return 'stable';
}

export async function computeWeeklyInsights(
  userId: string
): Promise<WeeklyInsights> {
  const rows = await prisma.$queryRaw<
    Array<{
      bucket: Date;
      avg_mood: number | null;
      avg_sleep: number | null;
      avg_stress: number | null;
      avg_energy: number | null;
    }>
  >`
    SELECT
      time_bucket('7 days', recorded_at) AS bucket,
      AVG(mood_score)::float AS avg_mood,
      AVG(sleep_hours)::float AS avg_sleep,
      AVG(stress_level)::float AS avg_stress,
      AVG(energy_level)::float AS avg_energy
    FROM mood_entries
    WHERE user_id = ${userId}::uuid
      AND recorded_at >= NOW() - INTERVAL '3 months'
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  const buckets: WeeklyBucket[] = rows.map((row) => ({
    bucketStart: row.bucket.toISOString(),
    avgMood: row.avg_mood,
    avgSleep: row.avg_sleep,
    avgStress: row.avg_stress,
    avgEnergy: row.avg_energy,
  }));

  const last = buckets.at(-1)?.avgMood ?? null;
  const previous = buckets.at(-2)?.avgMood ?? null;

  return {
    buckets,
    trend: toTrend(previous, last),
  };
}
