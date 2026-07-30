import express from 'express';
import swaggerUi from 'swagger-ui-express';
import {
  authenticate,
  type AuthenticatedRequest,
} from '@mindora/auth-middleware';
import aiRouter from './routes/ai.routes.js';
import { openApiSpec } from './docs/openapi.js';

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

// JWT authentication is required on every endpoint — no public routes in this service.
app.use(authenticate as express.RequestHandler);

const healthResponse = () => ({ status: 'ok', service: SERVICE_NAME });

app.get('/health', (_req: AuthenticatedRequest, res) => {
  res.status(200).json(healthResponse());
});

app.get(GATEWAY_HEALTH_PATH, (_req: AuthenticatedRequest, res) => {
  res.status(200).json(healthResponse());
});

app.use('/api/v1/ai', aiRouter);

export default app;
