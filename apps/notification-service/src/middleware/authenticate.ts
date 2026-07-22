import { createVerifyJwt } from '@mindora/auth-middleware';

export type { AuthenticatedRequest } from '@mindora/auth-middleware';

export const verifyJwt = createVerifyJwt({
  jwtSecret:
    process.env.JWT_SECRET ?? 'mindora-dev-jwt-secret-change-in-production',
  jwtIssuer: process.env.JWT_ISSUER ?? 'mindora-auth',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
});
