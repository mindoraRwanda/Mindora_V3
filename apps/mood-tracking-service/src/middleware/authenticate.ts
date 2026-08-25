import type { NextFunction, Request, Response } from 'express';
import {
  createVerifyJwt,
  type AuthenticatedRequest,
} from '@mindora/auth-middleware';
import { config } from '../config.js';

export type { AuthenticatedRequest } from '@mindora/auth-middleware';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const baseVerifyJwt = createVerifyJwt({
  jwtSecret: config.jwtSecret,
  jwtIssuer: config.jwtIssuer,
  redisUrl: config.redisUrl,
});

/**
 * Verifies the JWT, then rejects tokens whose subject isn't a UUID.
 *
 * mood_entries.user_id is a `uuid` column and /summary casts it explicitly
 * (`${userId}::uuid`), so a non-UUID subject makes Postgres throw deep inside
 * the query — surfacing as an opaque 500 that looks like a server fault when
 * it's really a malformed credential. Failing here turns that into an honest
 * 401 that names the actual problem.
 *
 * SERVICE tokens are exempt: they carry a service name as the subject
 * (e.g. `sub: "community-service"`, see auth-service's generate-service-token
 * script) and the SERVICE-only routes never query by user id.
 */
export function verifyJwt(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  baseVerifyJwt(req, res, (err?: unknown) => {
    if (err) {
      next(err);
      return;
    }

    const user = (req as AuthenticatedRequest).user;
    if (user && user.role !== 'SERVICE' && !UUID_PATTERN.test(user.userId)) {
      res.status(401).json({
        message:
          'Invalid user identifier in token — expected a UUID. Sign in again to get a valid session.',
      });
      return;
    }

    next();
  });
}
