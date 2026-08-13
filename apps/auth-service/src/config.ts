import { resolveJwtSecret } from '@mindora/auth-middleware';

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  // Not requireEnv(): its fallback made JWT_SECRET effectively optional, so a
  // production deploy missing the var would sign tokens with the repo's public
  // dev secret. resolveJwtSecret() throws instead when NODE_ENV=production.
  jwtSecret: resolveJwtSecret(),
  jwtIssuer: process.env.JWT_ISSUER ?? 'mindora-auth',
  accessTokenTtl: '15m' as const,
  refreshTokenDays: 7,
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  cookieName: 'refreshToken',
  isProduction: process.env.NODE_ENV === 'production',
  // In production the frontend is on a different registrable domain than the
  // API (e.g. app.mindora.rw → api.mindora.rw). A SameSite=Lax cookie is NOT
  // sent on cross-site fetch, so POST /refresh would arrive with no cookie and
  // silently log every user out on reload. SameSite=None fixes that, but the
  // spec requires Secure alongside it — hence both are driven together here.
  //
  // Locally everything is on localhost (same-site regardless of port), so Lax
  // is kept: SameSite=None without Secure is rejected by browsers, and Secure
  // cookies don't survive plain http://.
  crossSiteCookies: process.env.NODE_ENV === 'production',
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
