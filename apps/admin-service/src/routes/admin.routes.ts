import { Router } from 'express';
import type { AuthenticatedRequest } from '@mindora/auth-middleware';
import { callService, httpClient } from '@mindora/http-client';
import {
  listAlertsQuerySchema,
  listAuditLogQuerySchema,
  listUsersQuerySchema,
  resolveModerationSchema,
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
    `/internal/users/${encodeURIComponent(userId)}/suspend`,
    {
      method: 'PUT',
      body: { reason },
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
      },
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
    `/internal/users/${encodeURIComponent(userId)}/reactivate`,
    {
      method: 'PUT',
      body: { reason },
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
      },
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

// Pull-based, not event-driven: community-service publishes a
// community.reported RabbitMQ event on every report, but nothing consumes
// it — this proxies live to community-service's own report list instead of
// mirroring reports into a new local table. Keeps admin-service's schema
// unchanged; the event is currently unused (flagged, not acted on further).
adminRouter.get('/moderation/queue', async (req, res) => {
  const page = (req.query.page as string) ?? '1';
  const limit = (req.query.limit as string) ?? '20';

  const response = await httpClient.get<{
    reports: unknown[];
    total: number;
    page: number;
    limit: number;
  }>(
    KONG_URL,
    `/internal/community/reports?status=PENDING&page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
      },
    }
  );

  if (!response.ok || !response.data) {
    res.status(503).json({ message: 'Community Service unavailable' });
    return;
  }

  res.status(200).json(response.data);
});

// decision REMOVED maps to community's REVIEWED status (community has no
// REMOVED value — admin-service's own moderation_decisions row below is the
// record of what was actually decided; community's status just needs to
// reflect "no longer pending").
adminRouter.put('/moderation/:id/resolve', async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  const parsed = resolveModerationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const reportId = req.params.id as string;
  const { decision, reason } = parsed.data;
  const communityStatus = decision === 'REMOVED' ? 'REVIEWED' : 'DISMISSED';

  const response = await callService<{
    _id: string;
    contentId: string;
    contentType: string;
  }>(
    KONG_URL,
    `/internal/community/reports/${encodeURIComponent(reportId)}/resolve`,
    {
      method: 'PUT',
      body: { status: communityStatus },
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
      },
    }
  );

  if (response.status === 404) {
    res.status(404).json({ message: 'Report not found' });
    return;
  }

  if (!response.ok) {
    res.status(503).json({ message: 'Community Service unavailable' });
    return;
  }

  // moderation_decisions is the structured, domain-specific record;
  // audit_logs is the universal admin-action trail — both are written,
  // only after Community Service confirms the resolution actually happened.
  const decisionRecord = await prisma.moderation_decisions.create({
    data: { reportId, adminId: authReq.user!.userId, decision, reason },
  });

  await prisma.audit_logs.create({
    data: {
      adminId: authReq.user!.userId,
      actionType: 'REPORT_RESOLVED',
      targetId: reportId,
      metadata: {
        decision,
        reason,
        contentId: response.data?.contentId ?? null,
        contentType: response.data?.contentType ?? null,
      },
    },
  });

  res.status(200).json({
    message: 'Report resolved',
    reportId,
    decision,
    moderationDecisionId: decisionRecord.id,
  });
});

// Reveals the real identity behind an anonymous post — sensitive enough to
// audit like AI_USAGE_VIEWED: logged only after a successful lookup.
adminRouter.post('/moderation/decrypt/:postId', async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  const postId = req.params.postId as string;

  const response = await httpClient.get<{ userId: string }>(
    KONG_URL,
    `/internal/community/posts/${encodeURIComponent(postId)}/author`,
    {
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
      },
    }
  );

  if (response.status === 404) {
    res.status(404).json({ message: 'Post not found' });
    return;
  }

  if (!response.ok || !response.data) {
    res.status(503).json({ message: 'Community Service unavailable' });
    return;
  }

  await prisma.audit_logs.create({
    data: {
      adminId: authReq.user!.userId,
      actionType: 'POST_AUTHOR_DECRYPTED',
      targetId: postId,
      metadata: { decryptedAt: new Date().toISOString() },
    },
  });

  res.status(200).json({ postId, userId: response.data.userId });
});

// Analytics — every downstream call is independent and null-safe: one
// service being down degrades that slice of the response, never the whole
// request. All fired in parallel so nothing waits on anything else.
adminRouter.get('/analytics', async (req, res) => {
  const serviceHeaders = {
    Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
  };

  const [userStats, appointmentStats, moodStats, aiStats] = await Promise.all([
    httpClient.get<{ totalUsers: number; activeUsersLast30Days: number }>(
      KONG_URL,
      '/internal/users/analytics',
      { headers: serviceHeaders }
    ),
    httpClient.get<{
      totalAppointments: number;
      completedAppointments: number;
    }>(KONG_URL, '/internal/appointments/analytics', {
      headers: serviceHeaders,
    }),
    httpClient.get<{
      totalMoodEntries: number;
      avgMoodScorePlatform: number | null;
    }>(KONG_URL, '/internal/mood/analytics', { headers: serviceHeaders }),
    // /api/v1/ai/usage requires an ADMIN JWT specifically (requireRole('ADMIN')
    // in ai-integration-service) — the SERVICE token used for every other call
    // here would be rejected there, so this one forwards the caller's own token.
    httpClient.get<{ totalInteractions: number; totalCrisisEvents: number }>(
      KONG_URL,
      '/api/v1/ai/usage',
      { headers: { Authorization: req.headers.authorization ?? '' } }
    ),
  ]);

  res.status(200).json({
    totalUsers: userStats.ok ? (userStats.data?.totalUsers ?? null) : null,
    activeUsersLast30Days: userStats.ok
      ? (userStats.data?.activeUsersLast30Days ?? null)
      : null,
    totalAppointments: appointmentStats.ok
      ? (appointmentStats.data?.totalAppointments ?? null)
      : null,
    completedAppointments: appointmentStats.ok
      ? (appointmentStats.data?.completedAppointments ?? null)
      : null,
    totalMoodEntries: moodStats.ok
      ? (moodStats.data?.totalMoodEntries ?? null)
      : null,
    avgMoodScorePlatform: moodStats.ok
      ? (moodStats.data?.avgMoodScorePlatform ?? null)
      : null,
    totalCommunityPosts: null, // Community Service not deployed in V1
    totalAiInteractions: aiStats.ok
      ? (aiStats.data?.totalInteractions ?? null)
      : null,
    totalCrisisEvents: aiStats.ok
      ? (aiStats.data?.totalCrisisEvents ?? null)
      : null,
  });
});

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

// System alerts — created by the ai.crisis / mood.concern RabbitMQ
// consumers in consumers.ts, never by an admin route directly.
adminRouter.get('/alerts', async (req, res) => {
  const parsed = listAlertsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;
  const where = { resolved: false };

  const [alerts, total] = await Promise.all([
    prisma.system_alerts.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.system_alerts.count({ where }),
  ]);

  res.status(200).json({ alerts, total, page, limit });
});

adminRouter.put('/alerts/:id/resolve', async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
  const { id } = req.params;

  const alert = await prisma.system_alerts.findUnique({ where: { id } });
  if (!alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  await prisma.system_alerts.update({
    where: { id },
    data: { resolved: true },
  });

  await prisma.audit_logs.create({
    data: {
      adminId: authReq.user!.userId,
      actionType: 'ALERT_RESOLVED',
      targetId: id,
      metadata: { eventType: alert.eventType, severity: alert.severity },
    },
  });

  res.status(200).json({ message: 'Alert resolved', id });
});

// AI usage proxy — forwards the caller's own JWT, not the internal service
// token: /api/v1/ai/usage requires requireRole('ADMIN') on ai-integration-
// service, which a SERVICE-role token would fail. Audit log is written only
// after a successful fetch (consistent with every other write in this file
// — "viewed" should mean they actually saw the data, not merely attempted to).
adminRouter.get('/ai/usage', async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;

  const response = await httpClient.get<Record<string, unknown>>(
    KONG_URL,
    '/api/v1/ai/usage',
    { headers: { Authorization: req.headers.authorization ?? '' } }
  );

  if (!response.ok || !response.data) {
    res
      .status(response.status || 503)
      .json({ message: 'AI Service unavailable' });
    return;
  }

  await prisma.audit_logs.create({
    data: {
      adminId: authReq.user!.userId,
      actionType: 'AI_USAGE_VIEWED',
      metadata: { viewedAt: new Date().toISOString() },
    },
  });

  res.status(200).json(response.data);
});
