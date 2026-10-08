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

  setRefreshCookie(res, refreshToken);

  return { accessToken };
}

const baseCookieOptions = () =>
  ({
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/',
  }) as const;

export function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(config.cookieName, refreshToken, {
    ...baseCookieOptions(),
    domain: config.cookieDomain,
    maxAge: config.refreshTokenDays * 24 * 60 * 60 * 1000,
  });
  clearLegacyHostOnlyCookie(res);
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(config.cookieName, {
    ...baseCookieOptions(),
    domain: config.cookieDomain,
  });
  clearLegacyHostOnlyCookie(res);
}

// Sessions issued before COOKIE_DOMAIN was set still hold a host-only
// refreshToken on the API host. Left in place, the browser sends both
// cookies and getRequestCookie may pick the stale one first — so drop it
// whenever the domain-scoped cookie is written or cleared.
function clearLegacyHostOnlyCookie(res: Response): void {
  if (config.cookieDomain) {
    res.clearCookie(config.cookieName, baseCookieOptions());
  }
}
