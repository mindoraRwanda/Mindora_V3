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

const SERVICE_NAME = 'appointment-service';
const GATEWAY_HEALTH_PATH = '/api/v1/appointments/health';

const app = createApp();
registerHealthEndpoints(app, SERVICE_NAME, GATEWAY_HEALTH_PATH);

app.listen(config.port, () => {
  console.log(
    `appointment-service listening on http://localhost:${config.port}`
  );
});
