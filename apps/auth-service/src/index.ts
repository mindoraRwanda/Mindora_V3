import './env.js'; // must be first — loads .env before any module reads process.env
import { createApp } from './app.js';
import { config } from './config.js';
import { connectRedis } from './lib/redis.js';
import { errorFields, logger } from './lib/logger.js';
import { refreshCookieOptions } from './lib/session.js';
import { authenticate } from './middleware/authenticate.js';
import type { AuthenticatedRequest } from '@mindora/auth-middleware';

export { authenticate };
export type { AuthenticatedRequest };

/**
 * Prints the settings that decide how long a session survives, once, at boot.
 *
 * These are the values you actually need when a user reports being logged out
 * early, and every one of them is derived from the environment rather than
 * written down anywhere — so reading them off the running process beats
 * inferring them from the source.
 */
function logSessionConfig() {
  const cookie = refreshCookieOptions();

  logger.info('auth-service', 'session config', {
    nodeEnv: process.env.NODE_ENV ?? '(unset)',
    accessTokenTtl: config.accessTokenTtl,
    refreshTokenDays: config.refreshTokenDays,
    cookieName: config.cookieName,
    cookieSameSite: cookie.sameSite,
    cookieSecure: cookie.secure,
    appBaseUrl: config.appBaseUrl,
  });

  // The failure this catches is silent and looks exactly like "the refresh
  // token expired early": on SameSite=Lax the browser withholds the cookie
  // from a cross-origin POST /refresh, so the session dies when the 15-minute
  // access token does, no matter what refreshTokenDays says.
  if (!config.crossSiteCookies) {
    logger.warn(
      'auth-service',
      'refresh cookie is SameSite=Lax and not Secure — a browser served from a different origin than this API will not send it to POST /refresh, ending sessions after the access token expires. Correct for same-origin local dev; set NODE_ENV=production wherever the frontend is on another domain.',
      { nodeEnv: process.env.NODE_ENV ?? '(unset)' }
    );
  }
}

async function start() {
  await connectRedis();
  logger.info('auth-service', 'redis connected', { url: config.redisUrl });

  logSessionConfig();

  const app = createApp();
  app.listen(config.port, () => {
    logger.info('auth-service', 'listening', {
      url: `http://localhost:${config.port}`,
    });
  });
}

// Without these two, a crash mid-request kills the process with nothing in the
// terminal but the default stack — and from the frontend it appears only as a
// gateway 502 ("invalid response from upstream"), since Kong sees the
// connection drop rather than a reply. These make the cause land in the log
// before the process goes.
process.on('uncaughtException', (error) => {
  logger.error(
    'auth-service',
    'uncaught exception — exiting',
    errorFields(error)
  );
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  // Not fatal by default in Node's current mode for this service, but a
  // rejected promise behind a request is usually why that request never
  // answered.
  logger.error(
    'auth-service',
    'unhandled promise rejection',
    errorFields(reason)
  );
});

start().catch((error) => {
  logger.error('auth-service', 'failed to start', errorFields(error));
  process.exit(1);
});
