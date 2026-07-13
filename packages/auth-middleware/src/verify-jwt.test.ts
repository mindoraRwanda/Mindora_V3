import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const mockExists = vi.fn();

vi.mock('ioredis', () => {
  const Redis = vi.fn(function () {
    return {
      status: 'ready' as const,
      connect: vi.fn().mockResolvedValue(undefined),
      exists: (...args: unknown[]) => mockExists(...args),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      get: vi.fn().mockResolvedValue(null),
      on: vi.fn(),
    };
  });
  return { default: Redis, Redis };
});

import { createVerifyJwt } from './verify-jwt.js';
import type { AuthenticatedRequest } from './types.js';

const JWT_SECRET = 'test-jwt-secret';
const JWT_ISSUER = 'mindora-auth';
const REDIS_URL = 'redis://localhost:6379';

function signToken(
  overrides: Partial<{
    sub: string;
    email: string;
    role: string;
    jti: string;
  }> = {}
): string {
  return jwt.sign(
    {
      sub: 'user-123',
      email: 'user@example.com',
      role: 'PATIENT',
      jti: 'jti-123',
      ...overrides,
    },
    JWT_SECRET,
    { issuer: JWT_ISSUER, expiresIn: '15m' }
  );
}

function buildApp() {
  const app = express();
  const verifyJwt = createVerifyJwt({
    jwtSecret: JWT_SECRET,
    jwtIssuer: JWT_ISSUER,
    redisUrl: REDIS_URL,
  });
  app.get('/protected', verifyJwt, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    res.status(200).json({ user: authReq.user });
  });
  return app;
}

describe('createVerifyJwt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Neither blacklisted nor suspended by default.
    mockExists.mockResolvedValue(0);
  });

  it('allows a valid, active token through and populates req.user', async () => {
    const app = buildApp();
    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${signToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({
      userId: 'user-123',
      email: 'user@example.com',
      role: 'PATIENT',
    });
  });

  it('rejects a missing Authorization header with 401', async () => {
    const app = buildApp();
    const response = await request(app).get('/protected');

    expect(response.status).toBe(401);
  });

  it('rejects a malformed token with 401', async () => {
    const app = buildApp();
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer not-a-real-jwt');

    expect(response.status).toBe(401);
  });

  it('rejects a blacklisted token with 401', async () => {
    mockExists.mockImplementation((key: string) =>
      Promise.resolve(key.startsWith('auth:blacklist:') ? 1 : 0)
    );
    const app = buildApp();
    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${signToken()}`);

    expect(response.status).toBe(401);
  });

  it('rejects a suspended user with 403, even though the token itself is valid', async () => {
    mockExists.mockImplementation((key: string) =>
      Promise.resolve(key.startsWith('auth:suspended:') ? 1 : 0)
    );
    const app = buildApp();
    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${signToken()}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Account suspended');
  });

  it('checks blacklist before suspension — a blacklisted token is rejected as 401, not 403', async () => {
    // Both keys "exist" — blacklist check runs first and must win.
    mockExists.mockResolvedValue(1);
    const app = buildApp();
    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${signToken()}`);

    expect(response.status).toBe(401);
  });

  it('checks suspension per-request — a request right after the account is reactivated succeeds', async () => {
    mockExists.mockResolvedValueOnce(0); // blacklist check
    mockExists.mockResolvedValueOnce(0); // suspension check
    const app = buildApp();
    const token = signToken();

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });
});
