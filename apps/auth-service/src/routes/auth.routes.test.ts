import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';

vi.hoisted(() => {
  process.env.JWT_SECRET = 'mindora-dev-jwt-secret-change-in-production';
  process.env.JWT_ISSUER = 'mindora-auth';
  process.env.NODE_ENV = 'test';
});

const mockFindUnique = vi.fn();
const mockUserCreate = vi.fn();
const mockRefreshCreate = vi.fn();
const mockIsBlacklisted = vi.fn();

vi.mock('@mindora/database', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
    },
    refreshToken: {
      create: (...args: unknown[]) => mockRefreshCreate(...args),
    },
  },
}));

vi.mock('../lib/redis.js', () => ({
  isTokenBlacklisted: (...args: unknown[]) => mockIsBlacklisted(...args),
  getRedis: vi.fn(),
  connectRedis: vi.fn(),
  blacklistKey: (jti: string) => `auth:blacklist:${jti}`,
  disconnectRedis: vi.fn(),
}));

import { createApp } from '../app.js';
import { hashPassword } from '../lib/password.js';
import { config } from '../config.js';

describe('POST /register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a user successfully', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({ id: 'user-123' });

    const app = createApp();
    const response = await request(app)
      .post('/register')
      .send({
        email: 'patient@example.com',
        password: 'securePass1',
        role: 'PATIENT',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ userId: 'user-123' });
  });

  it('rejects duplicate email with 409', async () => {
    mockFindUnique.mockResolvedValue({ id: 'existing-user' });

    const app = createApp();
    const response = await request(app)
      .post('/register')
      .send({
        email: 'patient@example.com',
        password: 'securePass1',
        role: 'PATIENT',
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Email already exists');
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
