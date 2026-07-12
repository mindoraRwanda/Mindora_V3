import express from 'express';
import communityRoutes from './routes/community.routes.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import { publicRouteLimiter } from './middleware/rate-limit.js';

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

app.get('/health', publicRouteLimiter, (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/community', communityRoutes);

app.get('/api/v1/community/health', publicRouteLimiter, (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'community-service' });
});

export default app;
