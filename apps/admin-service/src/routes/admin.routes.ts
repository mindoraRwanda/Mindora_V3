import { Router } from 'express';
import type { AuthenticatedRequest } from '@mindora/auth-middleware';
import { callService, httpClient } from '@mindora/http-client';
import {
  listAuditLogQuerySchema,
  listUsersQuerySchema,
  suspendUserSchema,
} from '@mindora/validation';
import type { Prisma } from '../generated/prisma/index.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { prisma } from '../lib/prisma.js';

export const adminRouter = Router();

// Apply admin guard to all routes
adminRouter.use(requireAdmin);

const KONG_URL = process.env.KONG_URL ?? 'http://localhost:8000';

type AuthUserRecord = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

// User management

// GET /users — reached with the caller's own admin JWT (requireAdmin above
// already confirmed ADMIN), but the downstream call to User Service uses the
// INTERNAL_SERVICE_TOKEN, not that JWT — every inter-service hop in this
// codebase authenticates as SERVICE, never relays a user's own token.
adminRouter.get('/users', async (req, res) => {
  const parsed = listUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const query = new URLSearchParams();
  const { role, isActive, page, limit } = parsed.data;
  if (role) query.set('role', role);
  if (isActive !== undefined) query.set('isActive', String(isActive));
  query.set('page', String(page));
  query.set('limit', String(limit));

  const response = await httpClient.get<{
    users: AuthUserRecord[];
    total: number;
    page: number;
    limit: number;
  }>(KONG_URL, `/internal/users?${query.toString()}`, {
    headers: { Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}` },
  });

  if (!response.ok || !response.data) {
    res.status(503).json({ message: 'User Service unavailable' });
    return;
  }

  res.status(200).json(response.data);
});

adminRouter.put('/users/:id/suspend', async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  const parsed = suspendUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const userId = req.params.id as string;
  const { reason } = parsed.data;

  const response = await callService<{ message: string; userId: string }>(
    KONG_URL,
    `/internal/users/${userId}/suspend`,
    {
      method: 'PUT',
      body: { reason },
      headers: { Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}` },
    }
  );

  if (response.status === 404) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (!response.ok) {
    res.status(503).json({ message: 'User Service unavailable' });
    return;
  }

  // Audit log is written only after User Service confirms the suspension
  // actually happened — never record an action that didn't complete.
  const auditLog = await prisma.audit_logs.create({
    data: {
      adminId: authReq.user!.userId,
      actionType: 'USER_SUSPENDED',
      targetId: userId,
      metadata: { reason, suspendedAt: new Date().toISOString() },
    },
  });

  res.status(200).json({
    message: 'User suspended',
    userId,
    auditLogId: auditLog.id,
  });
});

// Mirrors PUT /users/:id/suspend above — same role gate (requireAdmin,
// applied to the whole router), same body shape (reused suspendUserSchema:
// { reason: string }), same "audit log only after the downstream call
// succeeds" rule.
adminRouter.put('/users/:id/reactivate', async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  const parsed = suspendUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const userId = req.params.id as string;
  const { reason } = parsed.data;

  const response = await callService<{ message: string; userId: string }>(
    KONG_URL,
    `/internal/users/${userId}/reactivate`,
    {
      method: 'PUT',
      body: { reason },
      headers: { Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}` },
    }
  );

  if (response.status === 404) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (!response.ok) {
    res.status(503).json({ message: 'User Service unavailable' });
    return;
  }

  const auditLog = await prisma.audit_logs.create({
    data: {
      adminId: authReq.user!.userId,
      actionType: 'USER_REACTIVATED',
      targetId: userId,
      metadata: { reason, reactivatedAt: new Date().toISOString() },
    },
  });

  res.status(200).json({
    message: 'User reactivated',
    userId,
    auditLogId: auditLog.id,
  });
});

// Moderation
adminRouter.get('/moderation/queue', (_req, res) => res.status(501).json({ message: 'Not implemented yet' }));
adminRouter.put('/moderation/:id/resolve', (_req, res) => res.status(501).json({ message: 'Not implemented yet' }));
adminRouter.post('/moderation/decrypt/:postId', (_req, res) => res.status(501).json({ message: 'Not implemented yet' }));

// Analytics
adminRouter.get('/analytics', (_req, res) => res.status(501).json({ message: 'Not implemented yet' }));

// Audit log — read only, no update or delete routes (hard requirement,
// see the "Do not" list this service was scaffolded under).
adminRouter.get('/audit-log', async (req, res) => {
  const parsed = listAuditLogQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { adminId, actionType, targetId, startDate, endDate, page, limit } =
    parsed.data;
  const where: Prisma.audit_logsWhereInput = {
    ...(adminId ? { adminId } : {}),
    ...(actionType ? { actionType } : {}),
    ...(targetId ? { targetId } : {}),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {}),
  };
  const skip = (page - 1) * limit;

  const [auditLogs, total] = await Promise.all([
    prisma.audit_logs.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.audit_logs.count({ where }),
  ]);

  res.status(200).json({ auditLogs, total, page, limit });
});

// System alerts
adminRouter.get('/alerts', (_req, res) => res.status(501).json({ message: 'Not implemented yet' }));

// AI usage proxy
adminRouter.get('/ai/usage', (_req, res) => res.status(501).json({ message: 'Not implemented yet' }));
