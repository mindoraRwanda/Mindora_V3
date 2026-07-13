import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';

vi.hoisted(() => {
  process.env.JWT_SECRET = 'mindora-dev-jwt-secret-change-in-production';
  process.env.JWT_ISSUER = 'mindora-auth';
  process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-service-token';
  process.env.KONG_URL = 'http://localhost:8000';
  process.env.NODE_ENV = 'test';
});

vi.mock('ioredis', () => {
  const Redis = vi.fn(function () {
    return {
      status: 'ready' as const,
      connect: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(0), // never blacklisted/suspended in these tests
      set: vi.fn().mockResolvedValue('OK'),
      get: vi.fn().mockResolvedValue(null),
      del: vi.fn().mockResolvedValue(1),
      on: vi.fn(),
    };
  });
  return { default: Redis, Redis };
});

const mockHttpGet = vi.fn();
const mockCallService = vi.fn();

vi.mock('@mindora/http-client', () => ({
  httpClient: { get: (...args: unknown[]) => mockHttpGet(...args) },
  callService: (...args: unknown[]) => mockCallService(...args),
}));

const mockAuditCreate = vi.fn();
const mockAuditFindMany = vi.fn();
const mockAuditCount = vi.fn();

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    audit_logs: {
      create: (...args: unknown[]) => mockAuditCreate(...args),
      findMany: (...args: unknown[]) => mockAuditFindMany(...args),
      count: (...args: unknown[]) => mockAuditCount(...args),
    },
  },
}));

import { createApp } from '../app.js';

const JWT_SECRET = 'mindora-dev-jwt-secret-change-in-production';
const JWT_ISSUER = 'mindora-auth';

function adminToken(): string {
  return jwt.sign(
    { sub: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
    JWT_SECRET,
    { issuer: JWT_ISSUER, expiresIn: '15m' }
  );
}

function patientToken(): string {
  return jwt.sign(
    { sub: 'patient-1', email: 'patient@example.com', role: 'PATIENT' },
    JWT_SECRET,
    { issuer: JWT_ISSUER, expiresIn: '15m' }
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('role gate (requireAdmin, applied to every route below)', () => {
  it('rejects a request with no token at all with 401', async () => {
    const app = createApp();
    const response = await request(app).get('/users');

    expect(response.status).toBe(401);
  });

  it('rejects a non-admin (PATIENT) token with 403', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Admin access required');
    expect(mockHttpGet).not.toHaveBeenCalled();
  });
});

describe('GET /users', () => {
  it('proxies to User Service and returns 200 with the user list', async () => {
    mockHttpGet.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        users: [{ id: 'u1', email: 'a@example.com', role: 'PATIENT', isActive: true, createdAt: '2026-01-01' }],
        total: 1,
        page: 1,
        limit: 20,
      },
    });

    const app = createApp();
    const response = await request(app)
      .get('/users?role=PATIENT&limit=5')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(mockHttpGet).toHaveBeenCalledWith(
      'http://localhost:8000',
      expect.stringContaining('/internal/users?'),
      { headers: { Authorization: 'Bearer test-internal-service-token' } }
    );
    const [, calledPath] = mockHttpGet.mock.calls[0] as [string, string];
    expect(calledPath).toContain('role=PATIENT');
    expect(calledPath).toContain('limit=5');
  });

  it('returns 400 for an invalid query parameter', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/users?role=NOT_A_ROLE')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(400);
    expect(mockHttpGet).not.toHaveBeenCalled();
  });

  it('returns 503 when User Service is unreachable', async () => {
    mockHttpGet.mockResolvedValue({ ok: false, status: 503, data: null });

    const app = createApp();
    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(503);
  });
});

describe('PUT /users/:id/suspend', () => {
  it('suspends the user and writes an audit log entry only after the downstream call succeeds', async () => {
    mockCallService.mockResolvedValue({
      ok: true,
      status: 200,
      data: { message: 'User suspended', userId: 'u1' },
    });
    mockAuditCreate.mockResolvedValue({ id: 'audit-1' });

    const app = createApp();
    const response = await request(app)
      .put('/users/u1/suspend')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ reason: 'policy violation' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'User suspended',
      userId: 'u1',
      auditLogId: 'audit-1',
    });
    expect(mockCallService).toHaveBeenCalledWith(
      'http://localhost:8000',
      '/internal/users/u1/suspend',
      expect.objectContaining({
        method: 'PUT',
        body: { reason: 'policy violation' },
        headers: { Authorization: 'Bearer test-internal-service-token' },
      })
    );
    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminId: 'admin-1',
        actionType: 'USER_SUSPENDED',
        targetId: 'u1',
        metadata: expect.objectContaining({ reason: 'policy violation' }),
      }),
    });
  });

  it('returns 400 and never calls User Service when reason is missing', async () => {
    const app = createApp();
    const response = await request(app)
      .put('/users/u1/suspend')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({});

    expect(response.status).toBe(400);
    expect(mockCallService).not.toHaveBeenCalled();
  });

  it('returns 404 and does NOT write an audit log when the user does not exist', async () => {
    mockCallService.mockResolvedValue({ ok: false, status: 404, data: null });

    const app = createApp();
    const response = await request(app)
      .put('/users/does-not-exist/suspend')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ reason: 'policy violation' });

    expect(response.status).toBe(404);
    expect(mockAuditCreate).not.toHaveBeenCalled();
  });

  it('returns 503 and does NOT write an audit log when User Service is unreachable', async () => {
    mockCallService.mockResolvedValue({ ok: false, status: 503, data: null });

    const app = createApp();
    const response = await request(app)
      .put('/users/u1/suspend')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ reason: 'policy violation' });

    expect(response.status).toBe(503);
    expect(mockAuditCreate).not.toHaveBeenCalled();
  });

  it('rejects a non-admin caller with 403 before touching User Service', async () => {
    const app = createApp();
    const response = await request(app)
      .put('/users/u1/suspend')
      .set('Authorization', `Bearer ${patientToken()}`)
      .send({ reason: 'policy violation' });

    expect(response.status).toBe(403);
    expect(mockCallService).not.toHaveBeenCalled();
  });
});

describe('PUT /users/:id/reactivate', () => {
  it('reactivates the user and writes a USER_REACTIVATED audit log entry', async () => {
    mockCallService.mockResolvedValue({
      ok: true,
      status: 200,
      data: { message: 'User reactivated', userId: 'u1' },
    });
    mockAuditCreate.mockResolvedValue({ id: 'audit-2' });

    const app = createApp();
    const response = await request(app)
      .put('/users/u1/reactivate')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ reason: 'appeal approved' });

    expect(response.status).toBe(200);
    expect(response.body.auditLogId).toBe('audit-2');
    expect(mockCallService).toHaveBeenCalledWith(
      'http://localhost:8000',
      '/internal/users/u1/reactivate',
      expect.objectContaining({ method: 'PUT', body: { reason: 'appeal approved' } })
    );
    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ actionType: 'USER_REACTIVATED', targetId: 'u1' }),
    });
  });

  it('returns 404 and does NOT write an audit log when the user does not exist', async () => {
    mockCallService.mockResolvedValue({ ok: false, status: 404, data: null });

    const app = createApp();
    const response = await request(app)
      .put('/users/does-not-exist/reactivate')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ reason: 'appeal approved' });

    expect(response.status).toBe(404);
    expect(mockAuditCreate).not.toHaveBeenCalled();
  });
});

describe('GET /audit-log', () => {
  it('returns paginated entries', async () => {
    mockAuditFindMany.mockResolvedValue([
      { id: 'a1', adminId: 'admin-1', actionType: 'USER_SUSPENDED', targetId: 'u1', metadata: {}, createdAt: new Date() },
    ]);
    mockAuditCount.mockResolvedValue(1);

    const app = createApp();
    const response = await request(app)
      .get('/audit-log?limit=10')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.auditLogs).toHaveLength(1);
  });

  it('builds a where clause from actionType and targetId filters', async () => {
    mockAuditFindMany.mockResolvedValue([]);
    mockAuditCount.mockResolvedValue(0);

    const app = createApp();
    await request(app)
      .get('/audit-log?actionType=USER_SUSPENDED&targetId=u1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(mockAuditFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { actionType: 'USER_SUSPENDED', targetId: 'u1' },
      })
    );
    expect(mockAuditCount).toHaveBeenCalledWith({
      where: { actionType: 'USER_SUSPENDED', targetId: 'u1' },
    });
  });

  it('returns 400 for limit above the allowed maximum', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/audit-log?limit=999')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(400);
    expect(mockAuditFindMany).not.toHaveBeenCalled();
  });

  it('rejects a non-admin caller with 403', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/audit-log')
      .set('Authorization', `Bearer ${patientToken()}`);

    expect(response.status).toBe(403);
    expect(mockAuditFindMany).not.toHaveBeenCalled();
  });
});

describe('stub routes (not yet implemented)', () => {
  it('still return 501 for moderation/analytics/alerts/ai-usage', async () => {
    const app = createApp();
    const token = adminToken();

    const [queue, analytics, alerts, aiUsage] = await Promise.all([
      request(app).get('/moderation/queue').set('Authorization', `Bearer ${token}`),
      request(app).get('/analytics').set('Authorization', `Bearer ${token}`),
      request(app).get('/alerts').set('Authorization', `Bearer ${token}`),
      request(app).get('/ai/usage').set('Authorization', `Bearer ${token}`),
    ]);

    expect(queue.status).toBe(501);
    expect(analytics.status).toBe(501);
    expect(alerts.status).toBe(501);
    expect(aiUsage.status).toBe(501);
  });
});
