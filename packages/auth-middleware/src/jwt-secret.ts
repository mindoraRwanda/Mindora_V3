/**
 * Single source of truth for resolving JWT_SECRET.
 *
 * Every service previously did `process.env.JWT_SECRET ?? 'mindora-dev-...'`
 * inline. That fallback is fine locally but catastrophic in production: a
 * missing env var doesn't fail, it silently starts the service signing and
 * verifying with a secret published in this repo, so anyone can mint a token
 * the whole platform accepts.
 */

export const DEV_JWT_SECRET = 'mindora-dev-jwt-secret-change-in-production';

/**
 * Returns the configured secret, or the shared dev default outside
 * production. Throws in production when unset or still the dev value —
 * failing to boot is far safer than accepting forged tokens.
 */
export function resolveJwtSecret(): string {
  const configured = process.env.JWT_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!configured) {
      throw new Error(
        'JWT_SECRET must be set in production. Refusing to start with the ' +
          'development default, which is public in the repository.'
      );
    }
    if (configured === DEV_JWT_SECRET) {
      throw new Error(
        'JWT_SECRET is still the development default. Generate a unique ' +
          'secret (e.g. `openssl rand -base64 48`) before deploying. It must ' +
          'match the value Kong is started with.'
      );
    }
  }

  return configured ?? DEV_JWT_SECRET;
}
