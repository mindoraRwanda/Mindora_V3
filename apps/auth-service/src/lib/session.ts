import type { Response } from 'express';
import { prisma } from './prisma.js';
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
    ...refreshCookieOptions(),
    maxAge: config.refreshTokenDays * 24 * 60 * 60 * 1000,
  });

  return { accessToken };
}

/**
 * Shared flags for setting and clearing the refresh cookie.
 *
 * clearCookie only matches a cookie whose attributes line up with how it was
 * set, so these must stay identical — keeping them in one place means a change
 * to sameSite/secure can't leave logout silently failing to clear anything.
 */
export function refreshCookieOptions() {
  return {
    httpOnly: true,
    // SameSite=None requires Secure; see config.crossSiteCookies.
    secure: config.crossSiteCookies || config.isProduction,
    sameSite: config.crossSiteCookies ? ('none' as const) : ('lax' as const),
    path: '/',
  };
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(config.cookieName, refreshCookieOptions());
}
