import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from '@mindora/auth-middleware';
import { logger } from '../lib/logger.js';

/** A request that has passed through `requestLog()` and carries its id. */
export type LoggedRequest = Request & { requestId?: string };

export function getRequestId(req: Request): string | undefined {
  return (req as LoggedRequest).requestId;
}

/**
 * Logs one line per request once the response is sent, and tags every request
 * with an id that the error handler and the auth routes reuse.
 *
 * The id is echoed back as `X-Request-Id`, so a failure the user sees in the
 * browser's network tab can be grepped straight out of the backend terminal
 * instead of being matched up by timestamp.
 */
export function requestLog() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Kong can be configured to pass a correlation id through; reuse it when
    // present so gateway and service lines share one id, and fall back to a
    // short random one otherwise. Full UUIDs are unwieldy to grep by eye.
    const forwarded = req.headers['x-request-id'];
    const requestId =
      (typeof forwarded === 'string' && forwarded.trim()) ||
      randomUUID().slice(0, 8);

    (req as LoggedRequest).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const startedAt = process.hrtime.bigint();
    const elapsedMs = () =>
      Math.round(Number(process.hrtime.bigint() - startedAt) / 1e5) / 10;

    res.on('finish', () => {
      const status = res.statusCode;
      // Kong's health check hits /health every few seconds; at info level it
      // would bury everything else. LOG_LEVEL=debug brings it back.
      const level =
        req.path === '/health'
          ? 'debug'
          : status >= 500
            ? 'error'
            : status >= 400
              ? 'warn'
              : 'info';

      logger[level]('http', `${req.method} ${req.originalUrl}`, {
        req: requestId,
        status,
        ms: elapsedMs(),
        ip: req.ip,
        // Populated by `authenticate` on protected routes; absent on public
        // ones, which is itself the useful signal on an unexpected 401.
        userId: (req as AuthenticatedRequest).user?.userId,
      });
    });

    // 'finish' only fires when a response was actually written. A request that
    // dies first — process crash, socket reset, timeout — would otherwise log
    // nothing at all, which is precisely the case that surfaces at the gateway
    // as a 502 with no matching backend line to explain it.
    res.on('close', () => {
      if (res.writableEnded) {
        return;
      }
      logger.error('http', `${req.method} ${req.originalUrl} — no response`, {
        req: requestId,
        ms: elapsedMs(),
        ip: req.ip,
        detail: 'connection closed before the response was written',
      });
    });

    next();
  };
}
