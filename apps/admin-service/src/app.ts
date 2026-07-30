import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import swaggerUi from 'swagger-ui-express';
import { authenticate } from '@mindora/auth-middleware';
import { adminRouter } from './routes/admin.routes.js';
import { openApiSpec } from './docs/openapi.js';
import { authenticatedRouteLimiter } from './middleware/rate-limit.js';

const SERVICE_NAME = 'admin-service';
const GATEWAY_HEALTH_PATH = '/api/v1/admin/health';

export function createApp() {
  const app = express();

  app.use(express.json());

  // Must come before the /docs mount below — swaggerUi.setup()'s fallback
  // renders the HTML shell for any sub-path under the mount that isn't a
  // static asset, so registering this after it would make it unreachable.
  app.get('/docs/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, { customSiteTitle: 'Admin Service API Docs' })
  );

  const healthResponse = () => ({ status: 'ok', service: SERVICE_NAME });

  // Health endpoints — no auth required
  app.get('/health', (_req, res) => {
    res.status(200).json(healthResponse());
  });

  app.get(GATEWAY_HEALTH_PATH, (_req, res) => {
    res.status(200).json(healthResponse());
  });

  // All admin routes require JWT + ADMIN role.
  // authenticate populates req.user, requireAdmin (inside adminRouter) checks role.
  // Mounted at root, not '/api/v1/admin' — Kong's admin-api route has
  // strip_path: true (see infrastructure/kong/kong.yml), so it forwards
  // e.g. 'GET /users' with the prefix already removed. Same convention as
  // mood-tracking-service and messaging-service.
  app.use(authenticatedRouteLimiter, authenticate, adminRouter);

  // Global error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[admin-service] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
