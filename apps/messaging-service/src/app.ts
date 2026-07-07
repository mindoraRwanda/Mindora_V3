import express from 'express';
import swaggerUi from 'swagger-ui-express';
import conversationsRouter from './routes/conversations.routes.js';
import { authenticate } from '@mindora/auth-middleware';
import type { AuthenticatedRequest } from '@mindora/auth-middleware';
import { swaggerSpec } from './docs/swagger.js';
import { getRedisClient } from './utils/redis.js';
import {
  authenticatedRouteLimiter,
  healthRouteLimiter,
} from './middleware/rate-limit.js';

const SERVICE_NAME = 'messaging-service';
const GATEWAY_HEALTH_PATH = '/api/v1/messaging/health';
const app = express();

app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

const healthResponse = () => ({ status: 'ok', service: SERVICE_NAME });

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
 * /api/v1/messaging/health:
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

app.use('/api/v1/messaging/conversations', conversationsRouter);

/**
 * @swagger
 * /api/v1/messaging/presence/{userId}:
 *   get:
 *     summary: Check if a user is currently online
 *     description: >
 *       Returns whether the specified user has an active Socket.io presence key in Redis.
 *       Presence is set by the `register_presence` socket event and expires after 90 s
 *       unless refreshed by `heartbeat` events every 30 s.
 *     tags: [Presence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to check presence for.
 *         example: therapist-456
 *     responses:
 *       200:
 *         description: Presence status for the requested user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PresenceStatus'
 *       401:
 *         description: Missing or invalid JWT.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/v1/messaging/presence/:userId — check if a user is currently online
app.get(
  '/api/v1/messaging/presence/:userId',
  authenticatedRouteLimiter,
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    const { userId } = req.params;
    try {
      const exists = await getRedisClient().exists(`presence:${userId}`);
      res.json({ userId, online: exists === 1 });
    } catch {
      res.status(500).json({ error: 'Failed to check presence' });
    }
  }
);

export default app;
