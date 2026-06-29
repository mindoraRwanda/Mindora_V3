import type { Response } from 'express';
import { prisma } from '@mindora/database';
import { config } from '../config.js';
import {
  createRefreshToken,
  getRefreshTokenExpiry,
  hashToken,
  signAccessToken,
} from './tokens.js';

type SessionUser = {
  id: string;
  email: string;
  role: string;
};

export async function issueAuthSession(
  res: Response,
  user: SessionUser
): Promise<{ accessToken: string }> {
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = createRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  res.cookie(config.cookieName, refreshToken, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    maxAge: config.refreshTokenDays * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return { accessToken };
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/',
  });
}
