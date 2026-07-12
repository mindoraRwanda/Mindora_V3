import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

vi.hoisted(() => {
  process.env.JWT_SECRET = 'mindora-dev-jwt-secret-change-in-production';
  process.env.JWT_ISSUER = 'mindora-auth';
  process.env.NODE_ENV = 'test';
  process.env.MOOD_JOURNAL_ENCRYPTION_KEY =
    'mindora-dev-mood-journal-key-32bytes!!';
});

vi.mock('ioredis', () => {
  const store = new Map<string, string>();
  const Redis = vi.fn(function () {
    return {
      status: 'ready',
      connect: vi.fn().mockResolvedValue(undefined),
      exists: vi
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(store.has(key) ? 1 : 0)
        ),
      get: vi
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(store.get(key) ?? null)
        ),
      set: vi.fn().mockImplementation((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve('OK');
      }),
      del: vi.fn().mockImplementation((key: string) => {
        store.delete(key);
        return Promise.resolve(1);
      }),
      incr: vi.fn().mockImplementation((key: string) => {
        const next = Number(store.get(key) ?? '0') + 1;
        store.set(key, String(next));
        return Promise.resolve(next);
      }),
      expire: vi.fn().mockResolvedValue(1),
      on: vi.fn(),
    };
  });
  return { default: Redis };
});

const mockMoodCreate = vi.fn();
const mockMoodFindMany = vi.fn();
const mockMoodCount = vi.fn();
const mockQueryRaw = vi.fn();
const mockPublishMoodEvent = vi.fn();
const mockIsBlacklisted = vi.fn();
const mockGetDailyLogCount = vi.fn();
const mockIncrementDailyLogCount = vi.fn();
const mockGetInsightsCache = vi.fn();
const mockSetInsightsCache = vi.fn();
const mockDeleteInsightsCache = vi.fn();

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    moodEntry: {
      create: (...args: unknown[]) => mockMoodCreate(...args),
      findMany: (...args: unknown[]) => mockMoodFindMany(...args),
      count: (...args: unknown[]) => mockMoodCount(...args),
    },
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

vi.mock('../middleware/authenticate.js', () => ({
  verifyJwt: (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    try {
      const token = header.slice('Bearer '.length);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
        issuer: process.env.JWT_ISSUER,
      });
      if (typeof decoded === 'string' || !decoded.sub) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      req.user = {
        userId: decoded.sub,
        email: String(decoded.email ?? ''),
        role: String(decoded.role ?? ''),
      };
      next();
    } catch {
      res.status(401).json({ message: 'Unauthorized' });
    }
  },
}));

vi.mock('@mindora/auth-middleware', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@mindora/auth-middleware')>();
  return {
    ...actual,
    isTokenBlacklisted: (...args: unknown[]) => mockIsBlacklisted(...args),
  };
});

vi.mock('../lib/publish-mood-event.js', () => ({
  publishMoodEvent: (...args: unknown[]) => mockPublishMoodEvent(...args),
}));

vi.mock('../lib/redis-mood.js', () => ({
  getDailyLogCount: (...args: unknown[]) => mockGetDailyLogCount(...args),
  incrementDailyLogCount: (...args: unknown[]) =>
    mockIncrementDailyLogCount(...args),
  getInsightsCache: (...args: unknown[]) => mockGetInsightsCache(...args),
  setInsightsCache: (...args: unknown[]) => mockSetInsightsCache(...args),
  deleteInsightsCache: (...args: unknown[]) => mockDeleteInsightsCache(...args),
  insightsCacheKey: (userId: string) => `mood:${userId}:weekly`,
}));

import { createApp } from '../app.js';
import { calculateStreak } from '../lib/streak.js';
import { shouldPublishMoodConcern } from '../lib/concern.js';

const patientId = '11111111-1111-4111-8111-111111111111';

function patientToken() {
  return jwt.sign(
    { sub: patientId, email: 'patient@example.com', role: 'PATIENT' },
    process.env.JWT_SECRET!,
    {
      expiresIn: '15m',
      issuer: process.env.JWT_ISSUER,
      jwtid: randomUUID(),
    }
  );
}

function sampleEntry(overrides: Record<string, unknown> = {}) {
  const recordedAt = new Date('2026-06-10T12:00:00.000Z');
  return {
    id: randomUUID(),
    userId: patientId,
    moodScore: 6,
    emotions: ['calm'],
    sleepHours: 7,
    stressLevel: 4,
    energyLevel: 6,
    journalNoteEncrypted: null,
    triggers: [],
    recordedAt,
    createdAt: recordedAt,
    ...overrides,
  };
}

describe('POST /log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
    mockGetDailyLogCount.mockResolvedValue(0);
    mockIncrementDailyLogCount.mockResolvedValue(1);
    mockDeleteInsightsCache.mockResolvedValue(undefined);
    mockPublishMoodEvent.mockResolvedValue(undefined);
    mockMoodCreate.mockReset();
    mockMoodFindMany.mockReset();
    mockMoodCreate.mockResolvedValue(sampleEntry());
    mockMoodFindMany
      .mockResolvedValueOnce([{ moodScore: 2 }, { moodScore: 2 }])
      .mockResolvedValueOnce([
        { recordedAt: new Date('2026-06-10T12:00:00.000Z') },
      ]);
  });

  it('logs mood entry successfully', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/log')
      .set('Authorization', `Bearer ${patientToken()}`)
      .send({
        moodScore: 6,
        emotions: ['calm'],
        sleepHours: 7,
        stressLevel: 4,
        energyLevel: 6,
        journalNote: 'Good day',
        triggers: [],
      });

    expect(response.status).toBe(201);
    expect(response.body.moodScore).toBe(6);
    expect(mockDeleteInsightsCache).toHaveBeenCalled();
  });

  it('returns 429 when daily limit exceeded', async () => {
    mockGetDailyLogCount.mockResolvedValue(10);

    const app = createApp();
    const response = await request(app)
      .post('/log')
      .set('Authorization', `Bearer ${patientToken()}`)
      .send({ moodScore: 5 });

    expect(response.status).toBe(429);
  });
});

describe('GET /history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
    mockMoodFindMany.mockReset();
    mockMoodCount.mockReset();
    mockMoodFindMany.mockResolvedValue([sampleEntry()]);
    mockMoodCount.mockResolvedValue(1);
  });

  it('returns paginated history', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/history?page=1&limit=10')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.entries).toHaveLength(1);
  });
});

describe('GET /insights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('returns cached insights without DB query', async () => {
    mockGetInsightsCache.mockResolvedValue(
      JSON.stringify({
        buckets: [],
        trend: 'stable',
      })
    );

    const app = createApp();
    const response = await request(app)
      .get('/insights')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.cached).toBe(true);
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });

  it('computes insights on cache miss', async () => {
    mockGetInsightsCache.mockResolvedValue(null);
    mockQueryRaw.mockResolvedValue([
      {
        bucket: new Date('2026-05-01T00:00:00.000Z'),
        avg_mood: 5,
        avg_sleep: 7,
        avg_stress: 4,
        avg_energy: 6,
      },
      {
        bucket: new Date('2026-05-08T00:00:00.000Z'),
        avg_mood: 6.5,
        avg_sleep: 7.5,
        avg_stress: 3,
        avg_energy: 7,
      },
    ]);

    const app = createApp();
    const response = await request(app)
      .get('/insights')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.cached).toBe(false);
    expect(response.body.trend).toBe('improving');
    expect(mockSetInsightsCache).toHaveBeenCalled();
  });
});

describe('GET /streak', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
    mockMoodFindMany.mockReset();
    mockMoodFindMany.mockResolvedValue([
      { recordedAt: new Date('2026-06-10T12:00:00.000Z') },
      { recordedAt: new Date('2026-06-09T12:00:00.000Z') },
    ]);
  });

  it('returns streak count', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/streak')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.streak).toBe(2);
  });
});

describe('mood helpers', () => {
  it('detects concern pattern', () => {
    expect(shouldPublishMoodConcern([3, 2, 5, 2, 1])).toBe(true);
    expect(shouldPublishMoodConcern([5, 6, 7, 8, 9])).toBe(false);
  });

  it('calculates consecutive streak', () => {
    const result = calculateStreak([
      { recordedAt: new Date('2026-06-10T10:00:00.000Z') },
      { recordedAt: new Date('2026-06-09T09:00:00.000Z') },
      { recordedAt: new Date('2026-06-08T08:00:00.000Z') },
    ]);
    expect(result.streak).toBe(3);
  });
});

describe('mood.concern event', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
    mockGetDailyLogCount.mockResolvedValue(0);
    mockIncrementDailyLogCount.mockResolvedValue(1);
    mockDeleteInsightsCache.mockResolvedValue(undefined);
    mockPublishMoodEvent.mockResolvedValue(undefined);
    mockMoodCreate.mockReset();
    mockMoodFindMany.mockReset();
    mockMoodCreate.mockResolvedValue(sampleEntry({ moodScore: 2 }));
    mockMoodFindMany
      .mockResolvedValueOnce([
        { moodScore: 2 },
        { moodScore: 1 },
        { moodScore: 3 },
        { moodScore: 2 },
        { moodScore: 2 },
      ])
      .mockResolvedValueOnce([
        { recordedAt: new Date('2026-06-10T12:00:00.000Z') },
      ]);
  });

  it('publishes mood.concern on low score pattern', async () => {
    const app = createApp();
    await request(app)
      .post('/log')
      .set('Authorization', `Bearer ${patientToken()}`)
      .send({ moodScore: 2 });

    expect(mockPublishMoodEvent).toHaveBeenCalled();
    const event = mockPublishMoodEvent.mock.calls[0]?.[0];
    expect(event.eventType).toBe('mood.concern');
  });
});
