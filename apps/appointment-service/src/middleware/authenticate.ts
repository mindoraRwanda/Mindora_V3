import { createVerifyJwt } from '@mindora/auth-middleware';
import { config } from '../config.js';

export type { AuthenticatedRequest } from '@mindora/auth-middleware';

export const verifyJwt = createVerifyJwt({
  jwtSecret: config.jwtSecret,
  jwtIssuer: config.jwtIssuer,
  redisUrl: config.redisUrl,
});
