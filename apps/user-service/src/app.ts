import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerUi from 'swagger-ui-express';
import { userRouter } from './routes/user.routes.js';
import { openApiSpec } from './docs/openapi.js';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const therapistPhotosDir = resolve(moduleDir, '../public/therapist-photos');

export function createApp() {
  const app = express();
  // Trust exactly one hop (Kong) so req.ip / express-rate-limit read the
  // real client IP from X-Forwarded-For instead of Kong's own container IP.
  app.set('trust proxy', 1);

  // Public, unauthenticated — mounted before any other middleware.
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, { customSiteTitle: 'User Service API Docs' })
  );
  app.get('/docs/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });

  // Therapist profile photos — public, unauthenticated (an <img> tag can't
  // send an Authorization header), mirrored at both the bare path (direct
  // dev access) and the full gateway path (matches Kong's strip_path: false
  // user-photos route, same pattern as /health).
  app.use('/photos', express.static(therapistPhotosDir));
  app.use('/api/v1/users/photos', express.static(therapistPhotosDir));

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
