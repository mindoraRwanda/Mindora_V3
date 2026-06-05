import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as dotenvConfig } from 'dotenv';
import { createApp } from './app.js';
import { config } from './config.js';
import { connectRedis } from './lib/redis.js';
import { authenticate } from './middleware/authenticate.js';

export { authenticate };
export type { AuthenticatedRequest } from './middleware/authenticate.js';

const moduleDir = dirname(fileURLToPath(import.meta.url));

dotenvConfig({ path: resolve(moduleDir, '../../../.env') });
dotenvConfig({ path: resolve(moduleDir, '../../../packages/database/.env') });
dotenvConfig();

async function start() {
  await connectRedis();
  console.log('Redis connected (auth:blacklist:{jti} ready for logout in Sprint 2)');

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`auth-service listening on http://localhost:${config.port}`);
  });
}

// Only run start if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((error) => {
    console.error('Failed to start auth-service:', error);
    process.exit(1);
  });
}
