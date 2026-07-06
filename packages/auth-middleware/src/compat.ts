import { createVerifyJwt } from './verify-jwt.js';

const DEFAULT_JWT_SECRET = 'mindora-dev-jwt-secret-change-in-production';

// Lazily instantiated so env vars set by dotenv before app startup are used.
let _authenticate: ReturnType<typeof createVerifyJwt> | null = null;

function getAuthenticate(): ReturnType<typeof createVerifyJwt> {
  if (!_authenticate) {
    _authenticate = createVerifyJwt({
      jwtSecret: process.env.JWT_SECRET ?? DEFAULT_JWT_SECRET,
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
