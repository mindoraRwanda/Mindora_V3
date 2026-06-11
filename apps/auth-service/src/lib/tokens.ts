import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export type AccessTokenPayload = {
  userId: string;
  email: string;
  role: string;
};

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(
    {
      sub: payload.userId,
      email: payload.email,
      role: payload.role,
    },
    config.jwtSecret,
    {
      expiresIn: config.accessTokenTtl,
      issuer: config.jwtIssuer,
      jwtid: randomUUID(),
    }
  );
}

export function verifyAccessToken(
  token: string
): AccessTokenPayload & { jti?: string } {
  const decoded = jwt.verify(token, config.jwtSecret, {
    issuer: config.jwtIssuer,
  });

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

export function getRefreshTokenExpiry(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.refreshTokenDays);
  return expiresAt;
}
