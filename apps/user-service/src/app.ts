import express, { type NextFunction, type Request, type Response } from 'express';
import { userRouter } from './routes/user.routes.js';

export function createApp() {
  const app = express();
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
