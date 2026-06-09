import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';

export type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
};

type AccessTokenPayload = {
  userId: string;
  email: string;
  role: string;
  jti?: string;
};

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }
  return redisClient;
}

function verifyAccessToken(token: string): AccessTokenPayload {
  const jwtSecret = process.env.JWT_SECRET ?? 'mindora-dev-jwt-secret-change-in-production';
  const jwtIssuer = process.env.JWT_ISSUER ?? 'mindora';

  const decoded = jwt.verify(token, jwtSecret, {
    issuer: jwtIssuer,
  });

  if (typeof decoded === 'string' || !decoded.sub) {
    throw new jwt.JsonWebTokenError('Invalid token payload');
  }

  return {
    userId: decoded.sub as string,
    email: String(decoded.email ?? ''),
    role: String(decoded.role ?? ''),
    jti: typeof decoded.jti === 'string' ? decoded.jti : undefined,
  };
}

async function isTokenBlacklisted(jti: string): Promise<boolean> {
  try {
    const redis = getRedisClient();
    if (redis.status !== 'ready' && redis.status !== 'connecting') {
      await redis.connect();
    }
    const result = await redis.exists(`auth:blacklist:${jti}`);
    return result === 1;
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    return false;
  }
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    if (payload.jti && (await isTokenBlacklisted(payload.jti))) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    next(error);
  }
}
