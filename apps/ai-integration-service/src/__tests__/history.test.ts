import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';

vi.hoisted(() => {
  process.env.JWT_SECRET = 'mindora-dev-jwt-secret-change-in-production';
  process.env.JWT_ISSUER = 'mindora-auth';
  process.env.NODE_ENV = 'test';
  process.env.AI_DATABASE_URL = 'postgresql://test:test@localhost:5432/test_ai';
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

vi.mock('@mindora/queue', () => ({
  connect: vi.fn().mockResolvedValue({ createChannel: vi.fn() }),
}));

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockDeleteMany = vi.fn();

vi.mock('../database.js', () => ({
  prisma: {
    aiInteraction: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
    },
  },
  connectDatabase: vi.fn().mockResolvedValue(undefined),
}));

const mockDeleteRemoteConversation = vi.fn();
vi.mock('../chatbotClient.js', () => ({
  chatWithBot: vi.fn(),
  deleteRemoteConversation: (...args: unknown[]) =>
    mockDeleteRemoteConversation(...args),
}));

const { encrypt } = await import('../lib/crypto.js');
const app = (await import('../app.js')).default;

const JWT_SECRET = 'mindora-dev-jwt-secret-change-in-production';

function makeToken(
  role: 'ADMIN' | 'PATIENT',
  sub = `${role.toLowerCase()}-id`
) {
  return jwt.sign(
    { sub, email: `${role.toLowerCase()}@test.com`, role },
    JWT_SECRET,
    { expiresIn: '15m', issuer: 'mindora-auth', jwtid: `${sub}-jti` }
  );
}

describe('GET /api/v1/ai/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the caller's own history, newest first, decrypted", async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        id: 'row-1',
        session_id: 'sess-1',
        user_message: encrypt('how are you'),
        ai_response: encrypt('I am doing well, thanks for asking'),
        crisis_level: 0,
        created_at: new Date('2026-09-01T00:00:00.000Z'),
      },
    ]);
    mockCount.mockResolvedValueOnce(1);

    const res = await request(app)
      .get('/api/v1/ai/history')
      .set('Authorization', `Bearer ${makeToken('PATIENT', 'patient-1')}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      interactions: [
        {
          id: 'row-1',
          sessionId: 'sess-1',
          message: 'how are you',
          response: 'I am doing well, thanks for asking',
          crisisLevel: 0,
          createdAt: '2026-09-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 'patient-1' } })
    );
  });

  it('returns null message/response for a row that fails to decrypt, without failing the whole page', async () => {
    mockFindMany.mockResolvedValueOnce([
      {
        id: 'row-bad',
        session_id: 'sess-1',
        user_message: 'not-actually-encrypted',
        ai_response: 'also-not-encrypted',
        crisis_level: 0,
        created_at: new Date('2026-09-01T00:00:00.000Z'),
      },
    ]);
    mockCount.mockResolvedValueOnce(1);

    const res = await request(app)
      .get('/api/v1/ai/history')
      .set('Authorization', `Bearer ${makeToken('PATIENT')}`);

    expect(res.status).toBe(200);
    expect(res.body.interactions[0].message).toBeNull();
    expect(res.body.interactions[0].response).toBeNull();
  });

  it('clamps limit to 50 and defaults page to 1', async () => {
    mockFindMany.mockResolvedValueOnce([]);
    mockCount.mockResolvedValueOnce(0);

    const res = await request(app)
      .get('/api/v1/ai/history?limit=500&page=0')
      .set('Authorization', `Bearer ${makeToken('PATIENT')}`);

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(50);
    expect(res.body.page).toBe(1);
  });

  it('rejects a non-PATIENT (ADMIN) token with 403', async () => {
    const res = await request(app)
      .get('/api/v1/ai/history')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

    expect(res.status).toBe(403);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('rejects a request with no token with 401', async () => {
    const res = await request(app).get('/api/v1/ai/history');
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/v1/ai/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the caller's own interactions and reports remote deletion status", async () => {
    mockDeleteMany.mockResolvedValueOnce({ count: 7 });
    mockDeleteRemoteConversation.mockResolvedValueOnce(true);

    const res = await request(app)
      .delete('/api/v1/ai/history')
      .set('Authorization', `Bearer ${makeToken('PATIENT', 'patient-1')}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'History deleted',
      localInteractionsDeleted: 7,
      remoteConversationDeleted: true,
    });
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { user_id: 'patient-1' },
    });
    expect(mockDeleteRemoteConversation).toHaveBeenCalledWith('patient-1');
  });

  it('honestly reports remoteConversationDeleted: false when the vendor call fails', async () => {
    mockDeleteMany.mockResolvedValueOnce({ count: 2 });
    mockDeleteRemoteConversation.mockResolvedValueOnce(false);

    const res = await request(app)
      .delete('/api/v1/ai/history')
      .set('Authorization', `Bearer ${makeToken('PATIENT')}`);

    expect(res.status).toBe(200);
    expect(res.body.localInteractionsDeleted).toBe(2);
    expect(res.body.remoteConversationDeleted).toBe(false);
  });

  it('rejects a non-PATIENT (ADMIN) token with 403', async () => {
    const res = await request(app)
      .delete('/api/v1/ai/history')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

    expect(res.status).toBe(403);
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });
});
