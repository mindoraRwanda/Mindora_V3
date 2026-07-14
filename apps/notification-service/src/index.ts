import './env.js'; // must be first — loads .env before any module reads process.env
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import swaggerUi from 'swagger-ui-express';
import { connect } from '@mindora/queue';
import { startConsumers, SUBSCRIBED_EXCHANGES } from './consumers.js';
import { initFirebase } from './fcm.js';
import { initResend } from './email.js';
import { initSms } from './sms.js';
import { setupRetryInfrastructure } from './retry.js';
import { swaggerSpec } from './docs/swagger.js';
import { healthRouteLimiter } from './middleware/rate-limit.js';
import { notificationsRouter } from './routes/notifications.routes.js';

const SERVICE_NAME = 'notification-service';
const PORT = Number(process.env.PORT) || 3008;
const GATEWAY_HEALTH_PATH = '/api/v1/notifications/health';

const app = express();
// Trust exactly one hop (Kong) so req.ip / express-rate-limit read the
// real client IP from X-Forwarded-For instead of Kong's own container IP.
app.set('trust proxy', 1);
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

const healthResponse = () => ({
  status: 'ok',
  service: SERVICE_NAME,
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Service health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is running.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 * /api/v1/notifications/health:
 *   get:
 *     summary: Service health check (gateway path)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is running.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health', (_req, res) => {
  res.status(200).json(healthResponse());
});

app.get(GATEWAY_HEALTH_PATH, healthRouteLimiter, (_req, res) => {
  res.status(200).json(healthResponse());
});

app.use(notificationsRouter);

// Catches errors forwarded via next(err) — including rejected promises from
// asyncHandler-wrapped routes — so a route failure (e.g. a DB error) returns
// a 500 instead of crashing the whole process.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

async function main(): Promise<void> {
  initFirebase();
  initResend();
  initSms();

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
