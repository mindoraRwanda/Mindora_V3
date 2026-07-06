import { Router } from 'express';
import { requireRole } from '@mindora/auth-middleware';

const router = Router();

// POST /api/v1/ai/chat — submit a message to the AI (PATIENT only)
router.post('/chat', requireRole('PATIENT'), (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// GET /api/v1/ai/history — retrieve session interaction history (PATIENT only)
router.get('/history', requireRole('PATIENT'), (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// DELETE /api/v1/ai/history — delete all interaction history (PATIENT only)
router.delete('/history', requireRole('PATIENT'), (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// GET /api/v1/ai/usage — aggregate token usage report (ADMIN only)
router.get('/usage', requireRole('ADMIN'), (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
