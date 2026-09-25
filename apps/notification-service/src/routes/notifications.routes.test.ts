import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

vi.hoisted(() => {
  process.env.JWT_SECRET = 'mindora-dev-jwt-secret-change-in-production';
  process.env.JWT_ISSUER = 'mindora-auth';
  process.env.NODE_ENV = 'test';
});

vi.mock('ioredis', () => {
  const Redis = vi.fn(function () {
    return {
      status: 'ready' as const,
      connect: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(0),
      set: vi.fn().mockResolvedValue('OK'),
      get: vi.fn().mockResolvedValue(null),
      del: vi.fn().mockResolvedValue(1),
      on: vi.fn(),
    };
  });
  return { default: Redis, Redis };
});

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateMany = vi.fn();
const mockIsBlacklisted = vi.fn();

vi.mock('../notificationLogger.js', () => ({
  prisma: {
    notification_logs: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
  },
  logNotification: vi.fn(),
}));

vi.mock('@mindora/auth-middleware', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@mindora/auth-middleware')>();
  return {
    ...actual,
    isTokenBlacklisted: (...args: unknown[]) => mockIsBlacklisted(...args),
  };
});

import { createApp } from '../app.js';

const userId = '11111111-1111-4111-8111-111111111111';

function userToken(role = 'PATIENT') {
  return jwt.sign(
    { sub: userId, email: 'user@example.com', role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m', issuer: process.env.JWT_ISSUER, jwtid: randomUUID() }
  );
}

function adminToken() {
  return jwt.sign(
    { sub: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
    process.env.JWT_SECRET!,
    { expiresIn: '15m', issuer: process.env.JWT_ISSUER, jwtid: randomUUID() }
  );
}

function sampleLog(overrides: Record<string, unknown> = {}) {
  return {
    id: 'log-1',
    userId,
    eventType: 'appointment.confirmed',
    channel: 'push',
    status: 'delivered',
    attempts: 1,
    deliveredAt: new Date('2026-06-10T09:00:00.000Z'),
    failureReason: null,
    createdAt: new Date('2026-06-10T09:00:00.000Z'),
    readAt: null,
    ...overrides,
  };
}

describe('GET /api/v1/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it("returns the caller's own notifications with display text and an unread count", async () => {
    mockFindMany.mockResolvedValueOnce([sampleLog()]);
    mockCount
      .mockResolvedValueOnce(1) // total
      .mockResolvedValueOnce(1); // unreadCount

    const app = createApp();
    const response = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      total: 1,
      unreadCount: 1,
      notifications: [
        {
          id: 'log-1',
          eventType: 'appointment.confirmed',
          title: 'Appointment Confirmed',
          readAt: null,
        },
      ],
    });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId } })
    );
  });

  it('falls back to a humanized title for an eventType with no explicit mapping', async () => {
    mockFindMany.mockResolvedValueOnce([
      sampleLog({ eventType: 'some_new.event_type' }),
    ]);
    mockCount.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    const app = createApp();
    const response = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.notifications[0].title).toBe('Some New Event Type');
  });

  it('rejects a request with no token with 401', async () => {
    const app = createApp();
    const response = await request(app).get('/api/v1/notifications');
    expect(response.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

describe('PUT /api/v1/notifications/:id/read', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('marks the notification read when owned by the caller', async () => {
    mockFindUnique.mockResolvedValueOnce(sampleLog());
    mockUpdate.mockResolvedValueOnce(
      sampleLog({ readAt: new Date('2026-06-11T00:00:00.000Z') })
    );

    const app = createApp();
    const response = await request(app)
      .put('/api/v1/notifications/log-1/read')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.readAt).toBe('2026-06-11T00:00:00.000Z');
  });

  it('404s when the notification belongs to a different user', async () => {
    mockFindUnique.mockResolvedValueOnce(sampleLog({ userId: 'someone-else' }));

    const app = createApp();
    const response = await request(app)
      .put('/api/v1/notifications/log-1/read')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(response.status).toBe(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('404s when the notification does not exist', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const app = createApp();
    const response = await request(app)
      .put('/api/v1/notifications/does-not-exist/read')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(response.status).toBe(404);
  });
});

describe('PUT /api/v1/notifications/read-all', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it("marks every one of the caller's unread notifications as read", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 4 });

    const app = createApp();
    const response = await request(app)
      .put('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ updated: 4 });
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { userId, readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });
});

describe('GET /api/v1/notifications/logs (admin) — not shadowed by the new user-facing routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('still works for an admin caller', async () => {
    mockFindMany.mockResolvedValueOnce([sampleLog()]);
    mockCount.mockResolvedValueOnce(1);

    const app = createApp();
    const response = await request(app)
      .get('/api/v1/notifications/logs')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    // Kigali offset is +02:00, not the previously-wrong +03:00.
    expect(response.body.logs[0].createdAtKigali).toBe('2026-06-10T11:00:00.000+02:00');
  });

  it('rejects a non-admin caller with 403', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/api/v1/notifications/logs')
      .set('Authorization', `Bearer ${userToken()}`);

    expect(response.status).toBe(403);
  });
});
