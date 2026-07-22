import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as dotenvConfig } from 'dotenv';
import { createApp } from './app.js';
import { config } from './config.js';
import { registerHealthEndpoints } from './lib/health.js';

const moduleDir = dirname(fileURLToPath(import.meta.url));

dotenvConfig({ path: resolve(moduleDir, '../../../.env') });
dotenvConfig({ path: resolve(moduleDir, '../../../packages/database/.env') });
dotenvConfig();

const SERVICE_NAME = 'mood-tracking-service';
const GATEWAY_HEALTH_PATH = '/api/v1/mood/health';

const app = createApp();
registerHealthEndpoints(app, SERVICE_NAME, GATEWAY_HEALTH_PATH);

app.listen(config.port, () => {
  console.log(
    `mood-tracking-service listening on http://localhost:${config.port}`
  );
});
