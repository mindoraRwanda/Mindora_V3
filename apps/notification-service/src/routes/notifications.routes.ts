import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  verifyJwt,
  type AuthenticatedRequest,
} from '../middleware/authenticate.js';
import { authenticatedRouteLimiter } from '../middleware/rate-limit.js';
import { prisma } from '../notificationLogger.js';
import type { Prisma } from '../generated/prisma/index.js';

export const notificationsRouter = Router();

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// Storage stays UTC (createdAt/deliveredAt are 'timestamp without time zone',
// always written via Prisma's now()) — that's the correct place to store it.
// Rwanda (Africa/Kigali) is a fixed UTC+3 with no DST, so a flat offset is
// always correct here — this must NOT be reused for timezones that observe DST.
const KIGALI_OFFSET_MS = 3 * 60 * 60 * 1000;

// Returns an ISO 8601 string carrying the '+03:00' offset explicitly, so the
// timezone is self-evident from the value itself — not just a raw UTC string
// a reader has to remember to mentally shift.
function toKigaliIso(date: Date | null): string | null {
  if (!date) return null;
  return new Date(date.getTime() + KIGALI_OFFSET_MS)
    .toISOString()
    .replace('Z', '+03:00');
}

notificationsRouter.get(
  '/api/v1/notifications/logs',
  authenticatedRouteLimiter,
  verifyJwt,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.role !== 'ADMIN') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);

    const { userId, status, channel, eventType } = req.query as Record<
      string,
      string | undefined
    >;

    const where: Prisma.notification_logsWhereInput = {
      ...(userId ? { userId } : {}),
      ...(status ? { status } : {}),
      ...(channel ? { channel } : {}),
      ...(eventType ? { eventType } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.notification_logs.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification_logs.count({ where }),
    ]);

    // createdAt/deliveredAt stay as-is (UTC) for anyone relying on the raw
    // stored value; createdAtKigali/deliveredAtKigali are added for display,
    // explicitly named and carrying the '+03:00' offset so there's no
    // ambiguity about which timezone they're in.
    const logs = rows.map((row) => ({
      ...row,
      createdAtKigali: toKigaliIso(row.createdAt),
      deliveredAtKigali: toKigaliIso(row.deliveredAt),
    }));

    res.status(200).json({ logs, total, page, limit });
  })
);
