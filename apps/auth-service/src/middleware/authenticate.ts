import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../lib/tokens.js';
import { isTokenBlacklisted } from '../lib/redis.js';

export type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
};

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
