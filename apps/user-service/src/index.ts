import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as dotenvConfig } from 'dotenv';
import { createApp } from './app.js';
import { config } from './config.js';
import { connectMongo } from './lib/mongo.js';
import { startUserRegisteredConsumer } from './lib/user-registered-consumer.js';

const moduleDir = dirname(fileURLToPath(import.meta.url));

dotenvConfig({ path: resolve(moduleDir, '../../../.env') });
dotenvConfig({ path: resolve(moduleDir, '../../../packages/database/.env') });
dotenvConfig();

// Therapist application document upload/download 500s without this, but
// nothing else in the service depends on Mongo - don't block the HTTP
// server (or the rest of the application flow) on it starting, same
// don't-block-startup treatment already given to the RabbitMQ consumer
// below.
connectMongo().catch((error) => {
  console.error('[user-service] Failed to connect to MongoDB:', error);
});

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
