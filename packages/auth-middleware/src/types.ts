import type { Request } from 'express';

export type AuthUser = {
  userId: string;
  email: string;
  role: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

export type AuthMiddlewareOptions = {
  jwtSecret: string;
  jwtIssuer?: string;
  redisUrl?: string;
};
