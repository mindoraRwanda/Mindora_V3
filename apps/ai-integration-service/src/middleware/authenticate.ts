import { createVerifyJwt, resolveJwtSecret } from '@mindora/auth-middleware';

// Eagerly resolved at module load so a missing/insecure JWT_SECRET fails
// fast at boot — unlike @mindora/auth-middleware's shared `authenticate`
// export, which resolves the secret lazily on the first authenticated
// request and would otherwise leave this service looking "up" while every
// authenticated request 500s.
export const authenticate = createVerifyJwt({
  jwtSecret: resolveJwtSecret(),
  jwtIssuer: process.env.JWT_ISSUER,
  redisUrl: process.env.REDIS_URL,
});
