import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
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

  // Catches errors forwarded via next(err) — including rejected promises
  // from asyncHandler-wrapped routes — so a transient failure (e.g. a
  // dropped DB connection) returns a 500 instead of crashing the process.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}
