import express from 'express';
import cors from 'cors';
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

// Trust exactly one hop (Kong) so req.ip / express-rate-limit read the
// real client IP from X-Forwarded-For instead of Kong's own container IP.
app.set('trust proxy', 1);

// Matches the Socket.io layer's existing cors: { origin: '*' } — REST needed
// the same treatment or cross-origin fetch() calls (e.g. a file:// test page)
// get silently blocked by the browser before the request ever reaches here.
// Tighten this to a real origin allowlist before production.
app.use(cors({ origin: '*' }));

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
 *     summary: Check if a user is currently online, and when they were last seen
 *     description: >
 *       Presence is set by the `register_presence` socket event (60 s TTL, refreshed
 *       every 30 s by `heartbeat`). On disconnect or `logout_presence`, the key is
 *       overwritten with `online: false` and a 5-minute TTL so `lastSeen` stays
 *       queryable briefly after the user leaves — once that TTL expires, `lastSeen`
 *       reverts to `null`.
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
// GET /api/v1/messaging/presence/:userId — online status + last seen timestamp
app.get(
  '/api/v1/messaging/presence/:userId',
  authenticatedRouteLimiter,
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    const { userId } = req.params;
    try {
      const raw = await getRedisClient().get(`presence:${userId}`);
      if (!raw) {
        res.json({ userId, online: false, lastSeen: null });
        return;
      }
      const presence = JSON.parse(raw) as { online: boolean; lastSeen: string };
      res.json({
        userId,
        online: presence.online,
        lastSeen: presence.lastSeen,
      });
    } catch {
      res.status(500).json({ error: 'Failed to check presence' });
    }
  }
);

export default app;
