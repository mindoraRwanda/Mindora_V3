import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';

// Set env vars before any module is imported
vi.hoisted(() => {
  process.env.JWT_SECRET = 'mindora-dev-jwt-secret-change-in-production';
  process.env.JWT_ISSUER = 'mindora-auth';
  process.env.NODE_ENV = 'test';
  process.env.AI_DATABASE_URL = 'postgresql://test:test@localhost:5432/test_ai';
});

// Auth middleware uses ioredis for JWT blacklist checks
vi.mock('ioredis', () => {
  const Redis = vi.fn(function () {
    return {
      status: 'ready' as const,
      connect: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(0), // token is never blacklisted in tests
      set: vi.fn().mockResolvedValue('OK'),
      get: vi.fn().mockResolvedValue(null),
      del: vi.fn().mockResolvedValue(1),
      on: vi.fn(),
    };
  });
  return { default: Redis, Redis };
});

// Queue is imported by ai.routes.ts — mock to prevent any connection attempt
vi.mock('@mindora/queue', () => ({
  connect: vi.fn().mockResolvedValue({ createChannel: vi.fn() }),
}));

const mockAggregate = vi.fn();
const mockCount = vi.fn();
const mockGroupBy = vi.fn();
const mockQueryRaw = vi.fn();

vi.mock('../database.js', () => ({
  prisma: {
    aiInteraction: {
      aggregate: (...args: unknown[]) => mockAggregate(...args),
      count: (...args: unknown[]) => mockCount(...args),
      groupBy: (...args: unknown[]) => mockGroupBy(...args),
    },
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
  connectDatabase: vi.fn().mockResolvedValue(undefined),
}));

import app from '../app.js';

const JWT_SECRET = 'mindora-dev-jwt-secret-change-in-production';

function makeToken(role: 'ADMIN' | 'PATIENT'): string {
  return jwt.sign(
    // auth-middleware reads decoded.sub as userId — must use sub, not userId
    {
      sub: `${role.toLowerCase()}-id`,
      email: `${role.toLowerCase()}@test.com`,
      role,
    },
    JWT_SECRET,
    { issuer: 'mindora-auth', expiresIn: '1h' }
  );
}

// Standard mock setup used by most tests: 10 rows total, 2 crisis events
function setupDefaultMocks(): void {
  mockAggregate.mockResolvedValue({
    _sum: { tokens_used: 2625 },
    _avg: { response_ms: 730 },
  });
  mockCount.mockImplementation((args?: { where?: { crisis_level?: number } }) =>
    Promise.resolve(args?.where?.crisis_level === 5 ? 2 : 10)
  );
  mockGroupBy.mockResolvedValue([
    { user_id: 'user-001', _count: { user_id: 4 } },
    { user_id: 'user-002', _count: { user_id: 3 } },
    { user_id: 'user-003', _count: { user_id: 3 } },
  ]);
  mockQueryRaw.mockResolvedValue([
    { date: new Date('2026-07-01T00:00:00Z'), count: 2 },
    { date: new Date('2026-07-03T00:00:00Z'), count: 5 },
    { date: new Date('2026-07-06T00:00:00Z'), count: 3 },
  ]);
}

describe('GET /api/v1/ai/usage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when called with a PATIENT token', async () => {
    const res = await request(app)
      .get('/api/v1/ai/usage')
      .set('Authorization', `Bearer ${makeToken('PATIENT')}`);

    expect(res.status).toBe(403);
  });

  it('returns 200 with the correct response shape for an ADMIN token', async () => {
    setupDefaultMocks();

    const res = await request(app)
      .get('/api/v1/ai/usage')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body).toHaveProperty('totalInteractions');
    expect(body).toHaveProperty('totalTokensUsed');
    expect(body).toHaveProperty('totalCrisisEvents');
    expect(body).toHaveProperty('avgResponseMs');
    expect(body).toHaveProperty('topUsers');
    expect(body).toHaveProperty('dailyBreakdown');
    expect(Array.isArray(body.topUsers)).toBe(true);
    expect(Array.isArray(body.dailyBreakdown)).toBe(true);
  });

  it('totalInteractions matches the number of seeded rows (10)', async () => {
    setupDefaultMocks();

    const res = await request(app)
      .get('/api/v1/ai/usage')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

    expect(res.body.totalInteractions).toBe(10);
  });

  it('totalCrisisEvents matches the number of seeded rows with crisis_level = 5 (2)', async () => {
    setupDefaultMocks();

    const res = await request(app)
      .get('/api/v1/ai/usage')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

    expect(res.body.totalCrisisEvents).toBe(2);
  });

  it('topUsers is sorted descending by interaction count', async () => {
    setupDefaultMocks();

    const res = await request(app)
      .get('/api/v1/ai/usage')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

    const topUsers = res.body.topUsers as {
      userId: string;
      interactionCount: number;
    }[];
    expect(topUsers[0].userId).toBe('user-001');
    expect(topUsers[0].interactionCount).toBe(4);
    // Verify counts are non-increasing
    for (let i = 1; i < topUsers.length; i++) {
      expect(topUsers[i].interactionCount).toBeLessThanOrEqual(
        topUsers[i - 1].interactionCount
      );
    }
  });

  it('dailyBreakdown returns ISO date strings and numeric counts', async () => {
    setupDefaultMocks();

    const res = await request(app)
      .get('/api/v1/ai/usage')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

    const breakdown = res.body.dailyBreakdown as {
      date: string;
      count: number;
    }[];
    expect(breakdown).toHaveLength(3);
    // Dates must be ISO date strings (YYYY-MM-DD)
    expect(breakdown[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(breakdown[0].date).toBe('2026-07-01');
    expect(breakdown[0].count).toBe(2);
    // count is a JS number, not a BigInt
    expect(typeof breakdown[0].count).toBe('number');
  });

  it('empty table returns all zeroes and empty arrays without crashing', async () => {
    mockAggregate.mockResolvedValue({
      _sum: { tokens_used: null },
      _avg: { response_ms: null },
    });
    mockCount.mockResolvedValue(0);
    mockGroupBy.mockResolvedValue([]);
    mockQueryRaw.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/v1/ai/usage')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalInteractions: 0,
      totalTokensUsed: 0,
      totalCrisisEvents: 0,
      avgResponseMs: 0,
      topUsers: [],
      dailyBreakdown: [],
    });
  });
});
