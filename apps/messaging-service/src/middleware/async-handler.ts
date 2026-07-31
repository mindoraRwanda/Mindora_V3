import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Express 4 does not forward rejected promises from async handlers to
// next() automatically — an uncaught rejection becomes an unhandledRejection
// and crashes the process. Wrap async route handlers with this so DB/other
// errors are routed to the error-handling middleware instead.
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
