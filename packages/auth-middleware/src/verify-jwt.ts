import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { isTokenBlacklisted } from './redis.js';
import type { AuthMiddlewareOptions, AuthenticatedRequest } from './types.js';

const DEFAULT_REDIS_URL = 'redis://localhost:6379';
const DEFAULT_ISSUER = 'mindora-auth';

export type VerifiedToken = {
  userId: string;
  email: string;
  role: string;
  jti?: string;
};

export function verifyAccessToken(
  token: string,
  jwtSecret: string,
  jwtIssuer = DEFAULT_ISSUER
): VerifiedToken {
  const decoded = jwt.verify(token, jwtSecret, { issuer: jwtIssuer });

  if (typeof decoded === 'string' || !decoded.sub) {
    throw new jwt.JsonWebTokenError('Invalid token payload');
  }

  return {
    userId: decoded.sub,
    email: String(decoded.email ?? ''),
    role: String(decoded.role ?? ''),
    jti: typeof decoded.jti === 'string' ? decoded.jti : undefined,
  };
}

export function createVerifyJwt(options: AuthMiddlewareOptions) {
  const jwtIssuer = options.jwtIssuer ?? DEFAULT_ISSUER;
  const redisUrl = options.redisUrl ?? process.env.REDIS_URL ?? DEFAULT_REDIS_URL;

  return async function verifyJwt(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const token = header.slice('Bearer '.length);

    try {
      const payload = verifyAccessToken(token, options.jwtSecret, jwtIssuer);

      if (payload.jti && (await isTokenBlacklisted(redisUrl, payload.jti))) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      authReq.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
      next();
    } catch (error) {
      if (
        error instanceof jwt.TokenExpiredError ||
        error instanceof jwt.JsonWebTokenError
      ) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      next(error);
    }
  };
}
