import { Router } from 'express';
import { requireRole, type AuthenticatedRequest } from '@mindora/auth-middleware';
import { connect } from '@mindora/queue';
import { EXCHANGES } from '@mindora/events';
import { runPreFilter } from '../preFilter.js';

const router = Router();

async function publishCrisisEvent(
  userId: string,
  crisisLevel: number,
  sessionId: string | null
): Promise<void> {
  const connection = await connect();
  const channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGES.AI, 'fanout', { durable: true });
  channel.publish(
    EXCHANGES.AI,
    '',
    Buffer.from(
      JSON.stringify({
        eventId: crypto.randomUUID(),
        occurredAt: new Date().toISOString(),
        userId,
        sessionId,
        crisisLevel,
        timestamp: new Date().toISOString(),
      })
    ),
    { persistent: true, contentType: 'application/json' }
  );
  await channel.close();
}

// POST /api/v1/ai/chat — submit a message to the AI (PATIENT only)
router.post('/chat', requireRole('PATIENT'), async (req: AuthenticatedRequest, res) => {
  const { message, sessionId } = req.body as { message?: unknown; sessionId?: unknown };

  // Basic body validation — full Zod schema will be added with the AI provider integration
  if (typeof message !== 'string' || message.trim() === '') {
    res.status(400).json({ error: 'message must be a non-empty string' });
    return;
  }

  const userId = req.user?.userId;
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : null;

  const crisisLevel = await runPreFilter(message, userId);

  // Level 5 — immediate escalation; AI is never called under any circumstances
  if (crisisLevel === 5) {
    // INTENTIONAL fire-and-forget: do NOT await publishCrisisEvent.
    // The safety response must reach the user even if RabbitMQ is down, restarting,
    // or unreachable. Awaiting here would mean a broker outage causes the user to
    // receive a 500 error instead of the crisis helpline message — the worst possible
    // failure mode for this code path. The .catch ensures the error is logged without
    // propagating to the response flow.
    publishCrisisEvent(userId ?? 'unknown', crisisLevel, resolvedSessionId).catch((err) => {
      console.error('[pre-filter] Failed to publish crisis event to RabbitMQ:', err);
    });

    res.status(200).json({
      response:
        "I'm concerned about your safety right now. Please reach out to a crisis helpline immediately. In Rwanda: Umutima Counselling Centre +250 788 386 225. International: Crisis Text Line — text HOME to 741741. You are not alone.",
      crisisLevel: 5,
      sessionId: null,
    });
    return;
  }

  // TODO[clinical-review]: Levels 3 and 4 currently set inputFlagged and continue
  // to the AI call. A formal escalation path for these levels — specifically whether
  // Level 3 (passive ideation) and Level 4 (active ideation without plan) should
  // trigger therapist SMS alerts, in-app safety check prompts, or modified AI system
  // prompts — has NOT been defined yet and requires clinical review before go-live.
  // See: AFSP Safe Messaging Guidelines, Columbia Suicide Severity Rating Scale (C-SSRS).
  const inputFlagged = crisisLevel >= 1;

  // inputFlagged will be written to the ai_interactions DB record when the AI provider is wired in
  void inputFlagged;

  // AI provider call not yet implemented
  res.status(501).json({ message: 'Not implemented yet', crisisLevel });
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
