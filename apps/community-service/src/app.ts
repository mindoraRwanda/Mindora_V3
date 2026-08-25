import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import mongoose from 'mongoose';
import communityRoutes, { internalRouter } from './routes/community.routes.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import { publicRouteLimiter } from './middleware/rate-limit.js';

// mongoose tracks connection state in memory — readyState 1 is "connected".
// A bare 200 can't tell an operator "up but the database is gone" from
// "actually fine".
function isDatabaseHealthy(): boolean {
  return mongoose.connection.readyState === 1;
}

function healthResponse(healthy: boolean) {
  return { status: healthy ? 'ok' : 'error', service: 'community-service' };
}

const app = express();

// Trust exactly one hop (Kong) so req.ip / express-rate-limit read the
// real client IP from X-Forwarded-For instead of Kong's own container IP.
app.set('trust proxy', 1);

app.use(express.json());

// Swagger docs
app.use(
  '/docs',
  publicRouteLimiter,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// Export the raw spec as JSON so other tools can consume it
app.get('/docs.json', publicRouteLimiter, (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/health', publicRouteLimiter, (_req, res) => {
  const healthy = isDatabaseHealthy();
  res.status(healthy ? 200 : 503).json(healthResponse(healthy));
});

app.use('/api/v1/community', communityRoutes);

// Mounted at root, not under /api/v1/community — Kong's community-internal
// route forwards /internal/community/... unchanged (strip_path: false).
app.use(internalRouter);

app.get('/api/v1/community/health', publicRouteLimiter, (_req, res) => {
  const healthy = isDatabaseHealthy();
  res.status(healthy ? 200 : 503).json(healthResponse(healthy));
});

// Catches errors forwarded via next(err) — including rejected promises
// from asyncHandler-wrapped routes — so a transient failure (e.g. a
// dropped DB connection) returns a 500 instead of crashing the process.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
