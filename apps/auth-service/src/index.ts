import './env.js'; // must be first — loads .env before any module reads process.env
import { createApp } from './app.js';
import { config } from './config.js';
import { connectRedis } from './lib/redis.js';
import { authenticate } from './middleware/authenticate.js';
import type { AuthenticatedRequest } from '@mindora/auth-middleware';

export { authenticate };
export type { AuthenticatedRequest };

async function start() {
  await connectRedis();
  console.log(
    'Redis connected (auth:blacklist:{jti} ready for logout in Sprint 2)'
  );

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`auth-service listening on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start auth-service:', error);
  process.exit(1);
});
