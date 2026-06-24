import './env.js'; // must be first — loads .env before any module reads process.env
import express from 'express';
import { connect } from '@mindora/queue';
import { startConsumers, SUBSCRIBED_EXCHANGES } from './consumers.js';
import { initFirebase } from './fcm.js';
import { setupRetryInfrastructure } from './retry.js';

const SERVICE_NAME = 'notification-service';
const PORT = Number(process.env.PORT) || 3008;
const GATEWAY_HEALTH_PATH = '/api/v1/notifications/health';

const app = express();

const healthResponse = () => ({
  status: 'ok',
  service: SERVICE_NAME,
});

app.get('/health', (_req, res) => {
  res.status(200).json(healthResponse());
});

app.get(GATEWAY_HEALTH_PATH, (_req, res) => {
  res.status(200).json(healthResponse());
});

async function main(): Promise<void> {
  initFirebase();

  await connect();
  console.log('✓ RabbitMQ connection established');

  await setupRetryInfrastructure();
  console.log('✓ Retry infrastructure ready (DLQ: mindora.notifications.dlq)');

  await startConsumers();
  console.log('✓ Subscribed to exchanges:');
  SUBSCRIBED_EXCHANGES.forEach((exchange) => {
    console.log(`  · ${exchange}`);
  });

  app.listen(PORT, () => {
    console.log(`${SERVICE_NAME} listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
