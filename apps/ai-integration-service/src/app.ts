import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import swaggerUi from 'swagger-ui-express';
import { authenticate } from './middleware/authenticate.js';
import { authenticatedRouteLimiter } from './middleware/rate-limit.js';
import aiRouter from './routes/ai.routes.js';
import { openApiSpec } from './docs/openapi.js';
import { prisma } from './database.js';

const SERVICE_NAME = 'ai-integration-service';
const GATEWAY_HEALTH_PATH = '/api/v1/ai/health';

const app = express();

app.use(express.json());

// Public, unauthenticated — the sole exception to this service's "no public
// routes" policy below. Must be mounted before app.use(authenticate) or it
// inherits the same JWT requirement as every other endpoint here. The JSON
// route must also come before the /docs mount — swaggerUi.setup()'s
// fallback renders the HTML shell for any sub-path under the mount that
// isn't a static asset, so registering this after it would make it
// unreachable.
app.get('/docs/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'AI Integration Service API Docs',
  })
);

const healthResponse = (healthy: boolean) => ({
  status: healthy ? 'ok' : 'error',
  service: SERVICE_NAME,
});

// A bare 200 can't tell an operator "up but the database is gone" from
// "actually fine". Timeout-guarded so a hung database makes the check fail
// fast (503) instead of hanging the probe.
async function isDatabaseHealthy(): Promise<boolean> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('health check timeout')), 3000)
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

// Health endpoints — no auth required. Must be mounted before
// app.use(authenticate) below, same reasoning as the /docs mount above: a
// route registered after that middleware inherits the JWT requirement.
app.get('/health', async (_req, res) => {
  const healthy = await isDatabaseHealthy();
  res.status(healthy ? 200 : 503).json(healthResponse(healthy));
});

app.get(GATEWAY_HEALTH_PATH, async (_req, res) => {
  const healthy = await isDatabaseHealthy();
  res.status(healthy ? 200 : 503).json(healthResponse(healthy));
});

// JWT authentication is required on every remaining endpoint. Rate-limited
// first, same as every other service's authenticated routes — otherwise an
// attacker can brute-force tokens against the authorization check with no
// throttling at all.
app.use(authenticatedRouteLimiter, authenticate as express.RequestHandler);

app.use('/api/v1/ai', aiRouter);

// Catches errors forwarded via next(err) — including rejected promises
// from asyncHandler-wrapped routes — so a transient failure (e.g. a
// dropped DB connection) returns a 500 instead of crashing the process.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
