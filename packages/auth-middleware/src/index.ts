export {
  blacklistKey,
  blacklistToken,
  getRedisClient,
  isTokenBlacklisted,
  isUserSuspended,
  passwordResetKey,
  setUserSuspended,
  suspendedKey,
} from './redis.js';
export type {
  AuthMiddlewareOptions,
  AuthenticatedRequest,
  AuthUser,
} from './types.js';
export {
  createVerifyJwt,
  requireRole,
  verifyAccessToken,
  type VerifiedToken,
} from './verify-jwt.js';
export { DEV_JWT_SECRET, resolveJwtSecret } from './jwt-secret.js';

// Convenience middleware that reads config from env vars.
// Services that need custom config should use createVerifyJwt() instead.
export { authenticate } from './compat.js';
