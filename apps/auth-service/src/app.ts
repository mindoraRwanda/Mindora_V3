import cookieParser from 'cookie-parser';
import express from 'express';
import { authRouter } from './routes/auth.routes.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(authRouter);
  return app;
}
