import express from 'express';
import passport from 'passport';
import { authRouter } from './routes/auth.routes.js';

export function createApp() {
  const app = express();
  // Trust exactly one hop (Kong) so req.ip / express-rate-limit read the
  // real client IP from X-Forwarded-For instead of Kong's own container IP.
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(passport.initialize());
  app.use(authRouter);
  return app;
}
