import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import swaggerUi from 'swagger-ui-express';
import { authenticate } from '@mindora/auth-middleware';
import aiRouter from './routes/ai.routes.js';
import { openApiSpec } from './docs/openapi.js';
import { authenticatedRouteLimiter } from './middleware/rate-limit.js';

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

const healthResponse = () => ({ status: 'ok', service: SERVICE_NAME });

// Also public, unauthenticated — same reasoning as /docs above, and the
// same pattern every other service follows (health is checked by Docker/Kong
// before a caller could ever have a token). Must come before
// app.use(authenticate) or it 401s instead of 200ing, which is exactly what
// made this service's Docker healthcheck unworkable (see docker-compose.yml).
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json(healthResponse());
});

app.get(GATEWAY_HEALTH_PATH, (_req: Request, res: Response) => {
  res.status(200).json(healthResponse());
});

// Rate limiter must precede authenticate, not just the route handlers past
// it — authenticate itself does I/O (Redis blacklist/suspension checks) on
// every request, including ones with a garbage/invalid token that never
// reach a route handler at all, so it needs its own protection rather than
// inheriting whatever a specific route below happens to apply.
app.use(authenticatedRouteLimiter);

// JWT authentication is required on every other endpoint in this service.
app.use(authenticate as express.RequestHandler);

app.use('/api/v1/ai', aiRouter);

// Catches errors forwarded via next(err) — including rejected promises
// from asyncHandler-wrapped routes — so a transient failure (e.g. a
// dropped DB connection) returns a 500 instead of crashing the process.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
