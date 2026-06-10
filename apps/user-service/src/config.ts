export const config = {
  port: Number(process.env.PORT) || 3002,
  jwtSecret:
    process.env.JWT_SECRET ?? 'mindora-dev-jwt-secret-change-in-production',
  jwtIssuer: process.env.JWT_ISSUER ?? 'mindora-auth',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
};
