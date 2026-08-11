import { randomUUID } from 'node:crypto';
import {
  createMoodConcernEvent,
  createMoodStreakEvent,
  MOOD_STREAK_MILESTONES,
} from '@mindora/events';
import { prisma } from '../lib/prisma.js';
import { Prisma } from '../generated/prisma/index.js';
import {
  logMoodSchema,
  moodHistoryQuerySchema,
  moodSummaryQuerySchema,
  moodTodayQuerySchema,
  updateMoodSchema,
} from '@mindora/validation';
import { Router } from 'express';
import { averageScore, shouldPublishMoodConcern } from '../lib/concern.js';
import { encryptJournalNote } from '../lib/journal-crypto.js';
import { computeWeeklyInsights } from '../lib/insights.js';
import { localDayRange } from '../lib/local-day.js';
import { publishMoodEvent } from '../lib/publish-mood-event.js';
import {
  deleteInsightsCache,
  getDailyLogCount,
  getInsightsCache,
  incrementDailyLogCount,
  setInsightsCache,
} from '../lib/redis-mood.js';
import { serializeMoodEntry } from '../lib/serialize-mood-entry.js';
import { calculateStreak } from '../lib/streak.js';
import { config } from '../config.js';
import {
  verifyJwt,
  type AuthenticatedRequest,
} from '../middleware/authenticate.js';
import { authenticatedRouteLimiter } from '../middleware/rate-limit.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const moodRouter = Router();

function routeParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Re-evaluates the rolling mood-concern signal and publishes if it trips.
 *
 * Called after any write that can change recent mood scores — including edits,
 * since a user revising an entry downward is exactly as much a safety signal
 * as logging it that low first time.
 */
async function checkForMoodConcern(userId: string): Promise<void> {
  const recentEntries = await prisma.moodEntry.findMany({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
    take: 5,
    select: { moodScore: true },
  });
  const recentScores = recentEntries.map((item) => item.moodScore);
  if (!shouldPublishMoodConcern(recentScores)) {
    return;
  }
  // RabbitMQ being down must never fail a write that's already committed.
  try {
    await publishMoodEvent(
      createMoodConcernEvent({
        userId,
        avgMoodScore: averageScore(recentScores),
        recentScores,
      })
    );
  } catch (err) {
    console.error('[mood.concern] Failed to publish event:', err);
  }
}

moodRouter.post(
  '/log',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (authReq.user.role !== 'PATIENT') {
      res.status(403).json({ message: 'Requires PATIENT role' });
      return;
    }

    const parsed = logMoodSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const userId = authReq.user.userId;
    const currentCount = await getDailyLogCount(userId);
    if (currentCount >= config.dailyLogLimit) {
      res.status(429).json({
        message: `Daily mood log limit of ${config.dailyLogLimit} exceeded`,
      });
      return;
    }

    const data = parsed.data;
    const entry = await prisma.moodEntry.create({
      data: {
        id: randomUUID(),
        userId,
        moodScore: data.moodScore,
        emotions: data.emotions,
        sleepHours: data.sleepHours,
        stressLevel: data.stressLevel,
        energyLevel: data.energyLevel,
        triggers: data.triggers,
        journalNoteEncrypted: data.journalNote
          ? encryptJournalNote(data.journalNote)
          : null,
        // Omitted by the normal "check in now" path; supplied when the user is
        // filling in a day they missed. Bounds (not future, not >1y old) are
        // enforced by logMoodSchema.
        recordedAt: data.recordedAt ?? new Date(),
      },
    });

    // Deliberately counts writes made *today*, regardless of the day an entry
    // is recorded for — it's a write-rate limit, so backdating a batch of
    // entries still draws down the same daily allowance.
    await incrementDailyLogCount(userId);
    await deleteInsightsCache(userId);

    await checkForMoodConcern(userId);

    const allRecordedDays = await prisma.moodEntry.findMany({
      where: { userId },
      select: { recordedAt: true },
      orderBy: { recordedAt: 'desc' },
    });
    const { streak, lastCheckedIn } = calculateStreak(allRecordedDays);
    if (
      lastCheckedIn &&
      MOOD_STREAK_MILESTONES.includes(
        streak as (typeof MOOD_STREAK_MILESTONES)[number]
      )
    ) {
      try {
        await publishMoodEvent(
          createMoodStreakEvent({
            userId,
            streak,
            milestone: streak as 7 | 14 | 30,
            lastCheckedIn: `${lastCheckedIn}T00:00:00.000Z`,
          })
        );
      } catch (err) {
        console.error('[mood.streak] Failed to publish event:', err);
      }
    }

    res.status(201).json(serializeMoodEntry(entry, { includeJournal: true }));
  })
);

moodRouter.get(
  '/history',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (authReq.user.role !== 'PATIENT') {
      res.status(403).json({ message: 'Requires PATIENT role' });
      return;
    }

    const parsed = moodHistoryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { page, limit, startDate, endDate } = parsed.data;
    const skip = (page - 1) * limit;
    const where: Prisma.MoodEntryWhereInput = {
      userId: authReq.user.userId,
      ...(startDate || endDate
        ? {
            recordedAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const [entries, total] = await Promise.all([
      prisma.moodEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { recordedAt: 'desc' },
      }),
      prisma.moodEntry.count({ where }),
    ]);

    res.status(200).json({
      entries: entries.map((entry) =>
        serializeMoodEntry(entry, { includeJournal: true })
      ),
      total,
      page,
      limit,
    });
  })
);

moodRouter.get(
  '/insights',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (authReq.user.role !== 'PATIENT') {
      res.status(403).json({ message: 'Requires PATIENT role' });
      return;
    }

    const userId = authReq.user.userId;
    const cached = await getInsightsCache(userId);
    if (cached) {
      res.status(200).json({ ...JSON.parse(cached), cached: true });
      return;
    }

    const insights = await computeWeeklyInsights(userId);
    await setInsightsCache(userId, JSON.stringify(insights));
    res.status(200).json({ ...insights, cached: false });
  })
);

moodRouter.get(
  '/report/:userId',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (authReq.user.role !== 'THERAPIST') {
      res.status(403).json({ message: 'Requires THERAPIST role' });
      return;
    }

    const patientId = routeParam(req.params.userId);
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 30);

    const entries = await prisma.moodEntry.findMany({
      where: {
        userId: patientId,
        recordedAt: { gte: since },
      },
      select: {
        moodScore: true,
        sleepHours: true,
        stressLevel: true,
        energyLevel: true,
        recordedAt: true,
      },
      orderBy: { recordedAt: 'desc' },
    });

    if (entries.length === 0) {
      res.status(404).json({ message: 'No mood data for patient' });
      return;
    }

    const avg = (values: Array<number | null>) => {
      const nums = values.filter((v): v is number => v !== null);
      if (nums.length === 0) {
        return null;
      }
      return nums.reduce((sum, v) => sum + v, 0) / nums.length;
    };

    const { streak, lastCheckedIn } = calculateStreak(entries);
    const insights = await computeWeeklyInsights(patientId);

    res.status(200).json({
      userId: patientId,
      entryCount: entries.length,
      avgMoodScore: avg(entries.map((e) => e.moodScore)),
      avgSleepHours: avg(entries.map((e) => e.sleepHours)),
      avgStressLevel: avg(entries.map((e) => e.stressLevel)),
      avgEnergyLevel: avg(entries.map((e) => e.energyLevel)),
      streak,
      lastCheckedIn,
      trend: insights.trend,
    });
  })
);

moodRouter.get(
  '/streak',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (authReq.user.role !== 'PATIENT') {
      res.status(403).json({ message: 'Requires PATIENT role' });
      return;
    }

    const entries = await prisma.moodEntry.findMany({
      where: { userId: authReq.user.userId },
      select: { recordedAt: true },
      orderBy: { recordedAt: 'desc' },
    });

    const { streak, lastCheckedIn } = calculateStreak(entries);
    res.status(200).json({
      streak,
      lastCheckedIn: lastCheckedIn ? `${lastCheckedIn}T00:00:00.000Z` : null,
    });
  })
);

// Answers "has the user already checked in today?" without making the client
// fetch history and do date maths itself — which it can't do correctly anyway,
// since only the server knows the stored recordedAt instants and the client
// would have to reimplement the local-day boundary logic.
moodRouter.get(
  '/today',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (authReq.user.role !== 'PATIENT') {
      res.status(403).json({ message: 'Requires PATIENT role' });
      return;
    }

    const parsed = moodTodayQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { timezone } = parsed.data;
    const { start, end, localDate } = localDayRange(new Date(), timezone);

    // Latest-first: if a user logged more than once today, the check-in card
    // should reflect the most recent entry.
    const entry = await prisma.moodEntry.findFirst({
      where: {
        userId: authReq.user.userId,
        recordedAt: { gte: start, lt: end },
      },
      orderBy: { recordedAt: 'desc' },
    });

    const entriesToday = await prisma.moodEntry.count({
      where: {
        userId: authReq.user.userId,
        recordedAt: { gte: start, lt: end },
      },
    });

    res.status(200).json({
      hasCheckedIn: entry !== null,
      localDate,
      timezone,
      entriesToday,
      remainingToday: Math.max(0, config.dailyLogLimit - entriesToday),
      entry: entry ? serializeMoodEntry(entry, { includeJournal: true }) : null,
    });
  })
);

// Bucketed averages over an arbitrary range — backs the dashboard chart.
// Distinct from /history (raw rows, paginated) and /insights (fixed 3-month
// weekly window, cached).
moodRouter.get(
  '/summary',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (authReq.user.role !== 'PATIENT') {
      res.status(403).json({ message: 'Requires PATIENT role' });
      return;
    }

    const parsed = moodSummaryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { granularity } = parsed.data;
    const endDate = parsed.data.endDate ?? new Date();
    const startDate =
      parsed.data.startDate ??
      new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const bucketInterval = {
      day: '1 day',
      week: '7 days',
      month: '30 days',
    }[granularity];

    const rows = await prisma.$queryRaw<
      Array<{
        bucket: Date;
        avg_mood: number | null;
        avg_sleep: number | null;
        avg_stress: number | null;
        avg_energy: number | null;
        min_mood: number | null;
        max_mood: number | null;
        entry_count: number;
      }>
    >`
      SELECT
        time_bucket(${bucketInterval}::interval, recorded_at) AS bucket,
        AVG(mood_score)::float AS avg_mood,
        AVG(sleep_hours)::float AS avg_sleep,
        AVG(stress_level)::float AS avg_stress,
        AVG(energy_level)::float AS avg_energy,
        MIN(mood_score)::int AS min_mood,
        MAX(mood_score)::int AS max_mood,
        COUNT(*)::int AS entry_count
      FROM mood_entries
      WHERE user_id = ${authReq.user.userId}::uuid
        AND recorded_at >= ${startDate}
        AND recorded_at < ${endDate}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    const buckets = rows.map((row) => ({
      bucketStart: row.bucket.toISOString(),
      avgMood: row.avg_mood,
      avgSleep: row.avg_sleep,
      avgStress: row.avg_stress,
      avgEnergy: row.avg_energy,
      minMood: row.min_mood,
      maxMood: row.max_mood,
      entryCount: row.entry_count,
    }));

    // Weighted by entry count so the headline figure matches a plain average
    // over the raw entries, rather than averaging the per-bucket averages
    // (which would over-weight sparse buckets).
    const totalEntries = buckets.reduce((sum, b) => sum + b.entryCount, 0);
    const weightedMoodTotal = buckets.reduce(
      (sum, b) => sum + (b.avgMood ?? 0) * b.entryCount,
      0
    );

    res.status(200).json({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      granularity,
      totalEntries,
      avgMood: totalEntries > 0 ? weightedMoodTotal / totalEntries : null,
      buckets,
    });
  })
);

// INTERNAL SERVICE ENDPOINT — same SERVICE-role convention as Auth/User
// Service's /internal/* routes. Backs Admin Service's platform analytics.
moodRouter.get(
  '/internal/mood/analytics',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.role !== 'SERVICE') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const [totalMoodEntries, avgResult] = await Promise.all([
      prisma.moodEntry.count(),
      prisma.moodEntry.aggregate({ _avg: { moodScore: true } }),
    ]);

    res.status(200).json({
      totalMoodEntries,
      avgMoodScorePlatform: avgResult._avg.moodScore ?? null,
    });
  })
);

// ---------------------------------------------------------------------------
// Wildcard `/:id` routes are registered last so they can never shadow a
// literal path above (e.g. GET /today).
//
// Both use updateMany/deleteMany rather than update/delete because
// mood_entries has a composite primary key ([id, recordedAt], required by the
// TimescaleDB hypertable partitioning) — so `id` alone is not a unique
// selector Prisma will accept. The many-variants take an arbitrary filter,
// which also lets ownership be enforced in the same statement rather than in
// a separate read-then-write that could race.
// ---------------------------------------------------------------------------

moodRouter.put(
  '/:id',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (authReq.user.role !== 'PATIENT') {
      res.status(403).json({ message: 'Requires PATIENT role' });
      return;
    }

    const id = routeParam(req.params.id);
    // A malformed id is a client-shaped error, not a server fault — 404 rather
    // than letting the ::uuid cast blow up. Same convention as Auth/User
    // Service's internal lookups.
    if (!UUID_PATTERN.test(id)) {
      res.status(404).json({ message: 'Mood entry not found' });
      return;
    }

    const parsed = updateMoodSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const body = parsed.data;
    const data: Prisma.MoodEntryUpdateManyMutationInput = {
      moodScore: body.moodScore,
      emotions: body.emotions,
      sleepHours: body.sleepHours,
      stressLevel: body.stressLevel,
      energyLevel: body.energyLevel,
      triggers: body.triggers,
    };
    // Distinguish "absent" (leave as-is) from an explicit null (clear it).
    if (body.journalNote !== undefined) {
      data.journalNoteEncrypted =
        body.journalNote === null ? null : encryptJournalNote(body.journalNote);
    }

    const result = await prisma.moodEntry.updateMany({
      where: { id, userId: authReq.user.userId },
      data,
    });

    // Deliberately does not distinguish "no such entry" from "belongs to
    // someone else" — that difference would leak the existence of other
    // users' entries.
    if (result.count === 0) {
      res.status(404).json({ message: 'Mood entry not found' });
      return;
    }

    await deleteInsightsCache(authReq.user.userId);
    // An edit can lower recent mood scores just as a fresh log can, so the
    // same safety signal has to be re-evaluated.
    await checkForMoodConcern(authReq.user.userId);

    const updated = await prisma.moodEntry.findFirst({
      where: { id, userId: authReq.user.userId },
    });
    if (!updated) {
      res.status(404).json({ message: 'Mood entry not found' });
      return;
    }

    res.status(200).json(serializeMoodEntry(updated, { includeJournal: true }));
  })
);

moodRouter.delete(
  '/:id',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (authReq.user.role !== 'PATIENT') {
      res.status(403).json({ message: 'Requires PATIENT role' });
      return;
    }

    const id = routeParam(req.params.id);
    if (!UUID_PATTERN.test(id)) {
      res.status(404).json({ message: 'Mood entry not found' });
      return;
    }

    const result = await prisma.moodEntry.deleteMany({
      where: { id, userId: authReq.user.userId },
    });

    if (result.count === 0) {
      res.status(404).json({ message: 'Mood entry not found' });
      return;
    }

    await deleteInsightsCache(authReq.user.userId);
    // No concern re-check here: deleting only removes signal. Re-running it
    // could surface an alert from older entries sliding back into the
    // "recent 5" window, which isn't a new disclosure by the user.

    res.status(204).send();
  })
);
