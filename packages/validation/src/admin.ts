import { z } from 'zod';

export const suspendUserSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const listUsersQuerySchema = z.object({
  role: z.enum(['PATIENT', 'THERAPIST', 'ADMIN']).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const listAuditLogQuerySchema = z.object({
  adminId: z.string().optional(),
  actionType: z.string().optional(),
  targetId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listAlertsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const resolveModerationSchema = z.object({
  decision: z.enum(['REMOVED', 'DISMISSED']),
  reason: z.string().min(1).max(500),
});

// Shared by every service's analytics endpoint (auth/user/appointment
// internal, and admin-service's own aggregating endpoint) so the date-range
// contract is identical everywhere a caller picks Today/7d/30d/90d/custom.
// Defaults applied by each route handler individually (last 30 days), not
// here, since "now" has to be evaluated per-request, not at schema-parse time.
export const analyticsRangeQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type SuspendUserDto = z.infer<typeof suspendUserSchema>;
export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;
export type ListAuditLogQueryDto = z.infer<typeof listAuditLogQuerySchema>;
export type ListAlertsQueryDto = z.infer<typeof listAlertsQuerySchema>;
export type ResolveModerationDto = z.infer<typeof resolveModerationSchema>;
export type AnalyticsRangeQueryDto = z.infer<typeof analyticsRangeQuerySchema>;
