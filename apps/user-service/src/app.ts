import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import swaggerUi from 'swagger-ui-express';
import { userRouter } from './routes/user.routes.js';
import { openApiSpec } from './docs/openapi.js';

export function createApp() {
  const app = express();
  // Trust exactly one hop (Kong) so req.ip / express-rate-limit read the
  // real client IP from X-Forwarded-For instead of Kong's own container IP.
  app.set('trust proxy', 1);

  // Public, unauthenticated — mounted before any other middleware. The JSON
  // route must come before the /docs mount below — swaggerUi.setup()'s
  // fallback renders the HTML shell for any sub-path under the mount that
  // isn't a static asset, so registering this after it would make it
  // unreachable.
  app.get('/docs/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, { customSiteTitle: 'User Service API Docs' })
  );

  app.use(express.json());
  app.use(userRouter);

  // Catches errors forwarded via next(err) — including rejected promises
  // from asyncHandler-wrapped routes — so a transient failure (e.g. a
  // dropped DB connection) returns a 500 instead of crashing the process.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
}
