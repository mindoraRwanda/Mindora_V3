import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
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

const mockFindUnique = vi.fn();
const mockFindFirst = vi.fn();
const mockUserCreate = vi.fn();
const mockRefreshCreate = vi.fn();
const mockRefreshUpdate = vi.fn();
const mockRefreshUpdateMany = vi.fn();
const mockUserUpdate = vi.fn();
const mockUserCount = vi.fn();
const mockIsBlacklisted = vi.fn();
const mockBlacklistToken = vi.fn();
const mockStoreReset = vi.fn();
const mockGetResetUser = vi.fn();
const mockDeleteReset = vi.fn();

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
      count: (...args: unknown[]) => mockUserCount(...args),
    },
    refreshToken: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockRefreshCreate(...args),
      update: (...args: unknown[]) => mockRefreshUpdate(...args),
      updateMany: (...args: unknown[]) => mockRefreshUpdateMany(...args),
    },
  },
}));

vi.mock('@mindora/auth-middleware', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@mindora/auth-middleware')>();
  return {
    ...actual,
    isTokenBlacklisted: (...args: unknown[]) => mockIsBlacklisted(...args),
    blacklistToken: (...args: unknown[]) => mockBlacklistToken(...args),
  };
});

vi.mock('../lib/redis.js', () => ({
  connectRedis: vi.fn(),
  storePasswordResetToken: (...args: unknown[]) => mockStoreReset(...args),
  getPasswordResetUserId: (...args: unknown[]) => mockGetResetUser(...args),
  deletePasswordResetToken: (...args: unknown[]) => mockDeleteReset(...args),
  isTokenBlacklisted: (...args: unknown[]) => mockIsBlacklisted(...args),
  blacklistToken: (...args: unknown[]) => mockBlacklistToken(...args),
}));

import { createApp } from '../app.js';
import { hashPassword } from '../lib/password.js';
import { config } from '../config.js';
import { signAccessToken } from '../lib/tokens.js';

describe('POST /register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a user successfully', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ id: 'user-123' });

    const app = createApp();
    const response = await request(app).post('/register').send({
      email: 'patient@example.com',
      password: 'securePass1',
      role: 'PATIENT',
      userName: 'Test Patient',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ userId: 'user-123' });
  });

  it('rejects duplicate email with 409', async () => {
    mockFindUnique.mockResolvedValue({ id: 'existing-user' });

    const app = createApp();
    const response = await request(app).post('/register').send({
      email: 'patient@example.com',
      password: 'securePass1',
      role: 'PATIENT',
      userName: 'Test Patient',
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Email already exists');
  });

  it('rejects missing userName with 400', async () => {
    const app = createApp();
    const response = await request(app).post('/register').send({
      email: 'patient@example.com',
      password: 'securePass1',
      role: 'PATIENT',
    });

    expect(response.status).toBe(400);
    expect(mockUserCreate).not.toHaveBeenCalled();
  });
});

describe('POST /login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefreshCreate.mockResolvedValue({ id: 'refresh-1' });
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('returns an access token for valid credentials', async () => {
    const passwordHash = await hashPassword('securePass1');
    mockFindUnique.mockResolvedValue({
      id: 'user-123',
      email: 'patient@example.com',
      passwordHash,
      role: 'PATIENT',
      isActive: true,
    });

    const app = createApp();
    const response = await request(app).post('/login').send({
      email: 'patient@example.com',
      password: 'securePass1',
    });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeTypeOf('string');
    expect(response.headers['set-cookie']?.[0]).toContain('refreshToken=');
  });

  it('rejects invalid credentials with 401', async () => {
    const passwordHash = await hashPassword('securePass1');
    mockFindUnique.mockResolvedValue({
      id: 'user-123',
      email: 'patient@example.com',
      passwordHash,
      role: 'PATIENT',
    });

    const app = createApp();
    const response = await request(app).post('/login').send({
      email: 'patient@example.com',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });

  it('rejects login for a suspended account with 403', async () => {
    const passwordHash = await hashPassword('securePass1');
    mockFindUnique.mockResolvedValue({
      id: 'user-123',
      email: 'patient@example.com',
      passwordHash,
      role: 'PATIENT',
      isActive: false,
    });

    const app = createApp();
    const response = await request(app).post('/login').send({
      email: 'patient@example.com',
      password: 'securePass1',
    });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Account suspended');
  });
});

describe('POST /logout', () => {
  beforeEach(() => {
    mockIsBlacklisted.mockResolvedValue(false);
    mockBlacklistToken.mockResolvedValue(undefined);
    mockRefreshUpdateMany.mockResolvedValue({ count: 1 });
  });

  it('returns 200 and blacklists token', async () => {
    const accessToken = signAccessToken({
      userId: 'user-123',
      email: 'patient@example.com',
      role: 'PATIENT',
    });

    const app = createApp();
    const response = await request(app)
      .post('/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', 'refreshToken=test-refresh');

    expect(response.status).toBe(200);
    expect(mockBlacklistToken).toHaveBeenCalled();
    expect(mockRefreshUpdateMany).toHaveBeenCalled();
  });
});

describe('POST /refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rotates refresh token and returns new access token', async () => {
    const oldRefresh = 'old-refresh-token-value';
    mockFindFirst.mockResolvedValue({
      id: 'rt-old',
      userId: 'user-123',
      user: {
        id: 'user-123',
        email: 'patient@example.com',
        role: 'PATIENT',
        isActive: true,
      },
    });
    mockRefreshCreate.mockResolvedValue({ id: 'rt-new' });
    mockRefreshUpdate.mockResolvedValue({});

    const app = createApp();
    const response = await request(app)
      .post('/refresh')
      .set('Cookie', `refreshToken=${oldRefresh}`);

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeTypeOf('string');
    expect(mockRefreshCreate).toHaveBeenCalled();
    expect(mockRefreshUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rt-old' },
        data: expect.objectContaining({
          revoked: true,
          replacedByTokenId: 'rt-new',
        }),
      })
    );
  });

  it('rejects missing refresh cookie with 401', async () => {
    const app = createApp();
    const response = await request(app).post('/refresh');

    expect(response.status).toBe(401);
  });

  it('rejects refresh for a suspended account with 403', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'rt-old',
      userId: 'user-123',
      user: {
        id: 'user-123',
        email: 'patient@example.com',
        role: 'PATIENT',
        isActive: false,
      },
    });

    const app = createApp();
    const response = await request(app)
      .post('/refresh')
      .set('Cookie', 'refreshToken=some-refresh-token');

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Account suspended');
    expect(mockRefreshCreate).not.toHaveBeenCalled();
  });
});

describe('POST /forgot-password', () => {
  it('always returns 200', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-123', email: 'a@b.com' });
    mockStoreReset.mockResolvedValue(undefined);

    const app = createApp();
    const response = await request(app)
      .post('/forgot-password')
      .send({ email: 'a@b.com' });

    expect(response.status).toBe(200);
    expect(mockStoreReset).toHaveBeenCalled();
  });
});

describe('GET /me', () => {
  beforeEach(() => {
    mockIsBlacklisted.mockResolvedValue(false);
  });

  it('rejects expired access tokens with 401', async () => {
    const expiredToken = jwt.sign(
      {
        sub: 'user-123',
        email: 'patient@example.com',
        role: 'PATIENT',
      },
      config.jwtSecret,
      {
        expiresIn: -1,
        issuer: config.jwtIssuer,
        jwtid: 'expired-jti',
      }
    );

    const app = createApp();
    const response = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });
});

describe('GET /internal/auth/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsBlacklisted.mockResolvedValue(false);
  });

  function serviceToken(): string {
    return signAccessToken({
      userId: 'user-service',
      email: 'service@mindora.internal',
      role: 'SERVICE',
    });
  }

  it('returns totalUsers and activeUsersLast30Days', async () => {
    mockUserCount.mockResolvedValueOnce(50).mockResolvedValueOnce(12);

    const app = createApp();
    const response = await request(app)
      .get('/internal/auth/analytics')
      .set('Authorization', `Bearer ${serviceToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalUsers: 50,
      activeUsersLast30Days: 12,
    });
    expect(mockUserCount).toHaveBeenCalledTimes(2);
    // Second call is the "active" filter — createdAt OR refreshTokens.some within 30 days
    expect(mockUserCount.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ createdAt: expect.any(Object) }),
            expect.objectContaining({ refreshTokens: expect.any(Object) }),
          ]),
        }),
      })
    );
  });

  it('rejects a non-SERVICE (ADMIN) token with 403', async () => {
    const adminToken = signAccessToken({
      userId: 'admin-1',
      email: 'admin@example.com',
      role: 'ADMIN',
    });

    const app = createApp();
    const response = await request(app)
      .get('/internal/auth/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(403);
    expect(mockUserCount).not.toHaveBeenCalled();
  });

  it('rejects a request with no token with 401', async () => {
    const app = createApp();
    const response = await request(app).get('/internal/auth/analytics');

    expect(response.status).toBe(401);
  });
});
