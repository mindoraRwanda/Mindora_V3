import { createVerifyJwt } from './verify-jwt.js';
import { resolveJwtSecret } from './jwt-secret.js';

// Lazily instantiated so env vars set by dotenv before app startup are used.
let _authenticate: ReturnType<typeof createVerifyJwt> | null = null;

function getAuthenticate(): ReturnType<typeof createVerifyJwt> {
  if (!_authenticate) {
    _authenticate = createVerifyJwt({
      jwtSecret: resolveJwtSecret(),
      jwtIssuer: process.env.JWT_ISSUER,
      redisUrl: process.env.REDIS_URL,
    });
  }
  return _authenticate;
}

export const authenticate: ReturnType<typeof createVerifyJwt> = (
  req,
  res,
  next
) => getAuthenticate()(req, res, next);
