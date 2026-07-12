import express from 'express';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import { authRouter } from './routes/auth.routes.js';
import { openApiSpec } from './docs/openapi.js';

export function createApp() {
  const app = express();
  // Trust exactly one hop (Kong) so req.ip / express-rate-limit read the
  // real client IP from X-Forwarded-For instead of Kong's own container IP.
  app.set('trust proxy', 1);

  // Public, unauthenticated — mounted before any other middleware.
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, { customSiteTitle: 'Auth Service API Docs' })
  );
  app.get('/docs/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });

  app.use(express.json());
  app.use(passport.initialize());
  app.use(authRouter);
  return app;
}
