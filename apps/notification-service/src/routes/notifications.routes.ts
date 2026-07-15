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

/**
 * @swagger
 * /api/v1/notifications/logs:
 *   get:
 *     summary: List notification delivery logs
 *     description: >
 *       Admin only. Paginated, filterable by userId/status/channel/eventType.
 *       Each log's UTC createdAt/deliveredAt are returned alongside
 *       createdAtKigali/deliveredAtKigali — the same instants converted to
 *       Africa/Kigali (UTC+3, no DST) with the +03:00 offset baked into the string.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [delivered, failed, skipped] }
 *       - in: query
 *         name: channel
 *         schema: { type: string, enum: [push, email, sms] }
 *       - in: query
 *         name: eventType
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated notification logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NotificationLog'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin only
 */
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
