import { resolveJwtSecret } from '@mindora/auth-middleware';

export const config = {
  port: Number(process.env.PORT) || 3002,
  jwtSecret: resolveJwtSecret(),
  jwtIssuer: process.env.JWT_ISSUER ?? 'mindora-auth',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
};
