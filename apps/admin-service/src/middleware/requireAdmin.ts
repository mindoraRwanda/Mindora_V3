import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '@mindora/auth-middleware';

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
