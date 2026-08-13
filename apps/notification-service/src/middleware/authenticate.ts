import { createVerifyJwt, resolveJwtSecret } from '@mindora/auth-middleware';

export type { AuthenticatedRequest } from '@mindora/auth-middleware';

export const verifyJwt = createVerifyJwt({
  jwtSecret: resolveJwtSecret(),
  jwtIssuer: process.env.JWT_ISSUER ?? 'mindora-auth',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
});
