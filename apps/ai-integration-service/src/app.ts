import express from 'express';
import {
  authenticate,
  type AuthenticatedRequest,
} from '@mindora/auth-middleware';
import aiRouter from './routes/ai.routes.js';

const SERVICE_NAME = 'ai-integration-service';
const GATEWAY_HEALTH_PATH = '/api/v1/ai/health';

const app = express();

app.use(express.json());

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
