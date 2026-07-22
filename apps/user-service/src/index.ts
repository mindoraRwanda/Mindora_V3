import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as dotenvConfig } from 'dotenv';
import { createApp } from './app.js';
import { config } from './config.js';
import { startUserRegisteredConsumer } from './lib/user-registered-consumer.js';

const moduleDir = dirname(fileURLToPath(import.meta.url));

dotenvConfig({ path: resolve(moduleDir, '../../../.env') });
dotenvConfig({ path: resolve(moduleDir, '../../../packages/database/.env') });
dotenvConfig();

const app = createApp();
app.listen(config.port, () => {
  console.log(`user-service listening on http://localhost:${config.port}`);
});

// Profile creation is eventually consistent — don't let a RabbitMQ outage
// block the HTTP server from starting.
startUserRegisteredConsumer().catch((error) => {
  console.error(
    '[user-service] Failed to start user.registered consumer:',
    error
  );
});
