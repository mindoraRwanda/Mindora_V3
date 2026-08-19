import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import { authRouter } from './routes/auth.routes.js';
import { openApiSpec } from './docs/openapi.js';
import { errorFields, logger } from './lib/logger.js';
import { getRequestId, requestLog } from './middleware/request-log.js';

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
    swaggerUi.setup(openApiSpec, { customSiteTitle: 'Auth Service API Docs' })
  );

  // Mounted after /docs so swagger-ui's static assets don't drown the log,
  // but before express.json() so a malformed body still produces a line —
  // otherwise its 400 is raised before anything has been tagged.
  app.use(requestLog());

  app.use(express.json());
  app.use(passport.initialize());
  app.use(authRouter);

  // Catches errors forwarded via next(err) — including rejected promises
  // from asyncHandler-wrapped routes — so a transient failure (e.g. a
  // dropped DB connection) returns a 500 instead of crashing the process.
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const requestId = getRequestId(req);
    logger.error(
      'auth-service',
      `unhandled error on ${req.method} ${req.originalUrl}`,
      {
        req: requestId,
        ...errorFields(err),
      }
    );
    // The id goes back to the client too: the frontend surfaces this body's
    // `message`, so quoting the id from a browser error is enough to find the
    // matching stack in the terminal.
    res.status(500).json({ message: 'Internal server error', requestId });
  });

  return app;
}
