function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: requireEnv('JWT_SECRET', 'mindora-dev-jwt-secret-change-in-production'),
  jwtIssuer: process.env.JWT_ISSUER ?? 'mindora-auth',
  accessTokenTtl: '15m' as const,
  refreshTokenDays: 7,
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  cookieName: 'refreshToken',
  isProduction: process.env.NODE_ENV === 'production',
};
