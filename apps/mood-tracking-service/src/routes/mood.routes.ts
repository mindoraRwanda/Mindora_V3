import { randomUUID } from 'node:crypto';
import {
  createMoodConcernEvent,
  createMoodStreakEvent,
  MOOD_STREAK_MILESTONES,
} from '@mindora/events';
import { prisma, Prisma } from '@mindora/database';
import { logMoodSchema, moodHistoryQuerySchema } from '@mindora/validation';
import { Router } from 'express';
import { averageScore, shouldPublishMoodConcern } from '../lib/concern.js';
import { encryptJournalNote } from '../lib/journal-crypto.js';
import { computeWeeklyInsights } from '../lib/insights.js';
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

export const moodRouter = Router();

function routeParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

moodRouter.post(
  '/log',
  authenticatedRouteLimiter,
  verifyJwt,
  async (req, res) => {
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
        recordedAt: new Date(),
      },
    });

    await incrementDailyLogCount(userId);
    await deleteInsightsCache(userId);

    const recentEntries = await prisma.moodEntry.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 5,
      select: { moodScore: true },
    });
    const recentScores = recentEntries.map((item) => item.moodScore);
    if (shouldPublishMoodConcern(recentScores)) {
      await publishMoodEvent(
        createMoodConcernEvent({
          userId,
          avgMoodScore: averageScore(recentScores),
          recentScores,
        })
      );
    }

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
      await publishMoodEvent(
        createMoodStreakEvent({
          userId,
          streak,
          milestone: streak as 7 | 14 | 30,
          lastCheckedIn: `${lastCheckedIn}T00:00:00.000Z`,
        })
      );
    }

    res.status(201).json(serializeMoodEntry(entry, { includeJournal: true }));
  }
);

moodRouter.get(
  '/history',
  authenticatedRouteLimiter,
  verifyJwt,
  async (req, res) => {
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
  }
);

moodRouter.get(
  '/insights',
  authenticatedRouteLimiter,
  verifyJwt,
  async (req, res) => {
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
  }
);

moodRouter.get(
  '/report/:userId',
  authenticatedRouteLimiter,
  verifyJwt,
  async (req, res) => {
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
  }
);

moodRouter.get(
  '/streak',
  authenticatedRouteLimiter,
  verifyJwt,
  async (req, res) => {
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
  }
);
