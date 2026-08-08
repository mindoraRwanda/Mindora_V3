function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: requireEnv(
    'JWT_SECRET',
    'mindora-dev-jwt-secret-change-in-production'
  ),
  jwtIssuer: process.env.JWT_ISSUER ?? 'mindora-auth',
  accessTokenTtl: '15m' as const,
  refreshTokenDays: 7,
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  cookieName: 'refreshToken',
  isProduction: process.env.NODE_ENV === 'production',
  appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3001',
  // Where the browser lands after a successful Google OAuth callback. The
  // frontend route there does no token parsing — it just waits on its own
  // mount-time bootstrap (POST /refresh) to pick up the refreshToken cookie
  // this callback already set via issueAuthSession, same as a normal login.
  oauthSuccessRedirectUrl:
    process.env.OAUTH_SUCCESS_REDIRECT_URL ??
    'http://localhost:3000/oauth/success',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ??
      'http://localhost:3001/oauth/google/callback',
  },
};

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(config.google.clientId && config.google.clientSecret);
}
