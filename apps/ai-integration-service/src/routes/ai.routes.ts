import { Router } from 'express';
import {
  requireRole,
  type AuthenticatedRequest,
} from '@mindora/auth-middleware';
import { runPreFilter } from '../preFilter.js';
import { recordCrisisAlert } from '../lib/crisis-alerts.js';
import { prisma } from '../database.js';
import {
  chatWithBot,
  ChatbotApiError,
  deleteChatbotConversation,
} from '../chatbotClient.js';
import { decrypt, encrypt } from '../lib/crypto.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = Router();

// One unreadable row (key rotation, a bad historical write) must not fail the
// whole history page. Null is honest about the loss; throwing would hide the
// rest of the user's history behind a 500.
function safeDecrypt(value: string): string | null {
  try {
    return decrypt(value);
  } catch {
    return null;
  }
}

// Shown verbatim when the pre-filter detects an active plan. Wording supplied
// by clinical review (Rulinda, 2026-08): it avoids implying the system has
// independently assessed the person's clinical risk, and points at services
// rather than asserting a diagnosis.
//
// PENDING: the specific helpline numbers this used to hard-code were removed
// because they had not been verified. Before launch these must be replaced
// with verified, current services for the user's region, ideally as
// configuration so they can be corrected without a deploy.
const CRISIS_RESPONSE =
  'It sounds like you may be going through a very difficult moment, and you ' +
  'deserve support from someone who can help you stay safe. Please reach out ' +
  'to a mental health professional or an appropriate crisis or emergency ' +
  'service in your area. If you are in immediate danger, please seek urgent ' +
  'in-person help now. We can also help connect you with appropriate support.';

// POST /api/v1/ai/chat — submit a message to the AI (PATIENT only)
router.post(
  '/chat',
  requireRole('PATIENT'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { message, sessionId } = req.body as {
      message?: unknown;
      sessionId?: unknown;
    };

    // Basic body validation — full Zod schema will be added with the AI provider integration
    if (typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ error: 'message must be a non-empty string' });
      return;
    }

    const userId = req.user?.userId;
    // Checked before the crisis branch, not after: an alert with no user is
    // undeliverable (the event schema requires a UUID userId, and consumers
    // drop payloads that fail validation), so 'unknown' would have been a
    // silently discarded crisis.
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const resolvedSessionId = typeof sessionId === 'string' ? sessionId : null;

    const crisisLevel = await runPreFilter(message, userId);

    // Level 5 — immediate escalation; AI is never called under any circumstances
    if (crisisLevel === 5) {
      // Durable first, delivery second. recordCrisisAlert commits a row to
      // this service's own database before returning, then attempts the
      // RabbitMQ publish that populates the clinician queue without blocking
      // this response — a broker outage must never delay or fail the safety
      // message, but it must also no longer lose the alert (an undelivered
      // row is retried by the sweeper in lib/crisis-alerts.ts).
      await recordCrisisAlert({
        userId,
        sessionId: resolvedSessionId,
        crisisLevel,
      });

      // Recorded in the patient's own history too. This route used to return
      // before writing anything, so the single most serious thing a user can
      // disclose was the one thing absent from their record.
      await prisma.aiInteraction
        .create({
          data: {
            user_id: userId,
            session_id: resolvedSessionId ?? 'crisis',
            user_message: encrypt(message),
            ai_response: encrypt(CRISIS_RESPONSE),
            input_flagged: true,
            output_flagged: false,
            crisis_level: crisisLevel,
            response_ms: 0,
          },
        })
        .catch((err) => {
          // The alert is already durable; failing to write the history copy
          // must not stop the user seeing the safety message.
          console.error('[crisis] failed to record interaction:', err);
        });

      res.status(200).json({
        response: CRISIS_RESPONSE,
        crisisLevel: 5,
        sessionId: null,
      });
      return;
    }

    // ⚠️ KNOWN GAP — NOT SAFE FOR REAL USERS. Levels 3 and 4 (passive ideation,
    // and suicidal or self-harm thoughts) are flagged here and then sent to the
    // AI as an ordinary message. No clinician is alerted and no safety response
    // is shown.
    //
    // Clinical review (Rulinda, 2026-08) has since specified the intended
    // behaviour: L3 should give a supportive, safety-focused response plus a
    // clinical flag; L4 should raise a higher-priority alert while the AI gives
    // only a brief supportive reply and attempts no safety assessment.
    //
    // That is NOT implemented, for two reasons, both tracked in
    // docs/ai-safety-handoff.md:
    //   1. The external chatbot API accepts only {conversation_id, content} —
    //      there is no way to instruct its tone, so a "safety-focused AI
    //      response" needs either a new upstream parameter or a templated
    //      reply from our side. That choice is still open.
    //   2. The detection layer itself is being rebuilt by the AI team with
    //      clinical input; wiring L3/L4 to today's keyword matcher would
    //      escalate on its false positives.
    //
    // Current deployment is TESTERS ONLY on that basis.
    const inputFlagged = crisisLevel >= 1;

    const start = Date.now();
    let botMessage;
    try {
      botMessage = await chatWithBot(userId, message);
    } catch (err) {
      console.error('[chat] Therapy chatbot call failed:', err);
      // A rate limit is the user sending too fast, not the service being
      // broken. Pass it through as 429 with the wait time so the client can
      // show a countdown rather than "temporarily unavailable", which would
      // read as a fault and invite an immediate retry.
      if (err instanceof ChatbotApiError && err.status === 429) {
        const retryAfter = err.retryAfterSeconds ?? 60;
        res.setHeader('Retry-After', String(retryAfter));
        res.status(429).json({
          message:
            'Too many messages. Please wait a moment before sending again.',
          retryAfterSeconds: retryAfter,
        });
        return;
      }
      res
        .status(502)
        .json({ message: 'The AI companion is temporarily unavailable' });
      return;
    }
    const responseMs = Date.now() - start;

    await prisma.aiInteraction.create({
      data: {
        user_id: userId,
        session_id: resolvedSessionId ?? botMessage.id,
        user_message: encrypt(message),
        ai_response: encrypt(botMessage.content),
        input_flagged: inputFlagged,
        output_flagged: false,
        crisis_level: crisisLevel,
        response_ms: responseMs,
      },
    });

    res.status(200).json({
      response: botMessage.content,
      crisisLevel,
      sessionId: resolvedSessionId,
    });
  })
);

// GET /api/v1/ai/history — retrieve own chat history (PATIENT only)
//
// Served from this service's own ai_interactions rows rather than proxied to
// the chatbot: the data is already here, it stays readable when the external
// service is down, and it avoids a second round-trip per page load.
router.get(
  '/history',
  requireRole('PATIENT'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    const [rows, total] = await Promise.all([
      prisma.aiInteraction.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aiInteraction.count({ where: { user_id: userId } }),
    ]);

    res.status(200).json({
      interactions: rows.map((row) => ({
        id: row.id,
        sessionId: row.session_id,
        // Stored encrypted; a row that fails to decrypt (key rotation, bad
        // write) must not take down the whole page, so it degrades to null
        // rather than throwing.
        message: safeDecrypt(row.user_message),
        response: safeDecrypt(row.ai_response),
        crisisLevel: row.crisis_level,
        createdAt: row.created_at,
      })),
      total,
      page,
      limit,
    });
  })
);

// DELETE /api/v1/ai/history — erase own chat history (PATIENT only)
//
// Deletes on BOTH sides. Previously this was a 501 stub, and nothing in this
// repo ever called the chatbot's delete endpoint, so a user's therapy
// transcript survived on the external service forever.
router.delete(
  '/history',
  requireRole('PATIENT'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Remote first: if it throws unexpectedly we still want to have tried
    // before touching local rows. It resolves false rather than throwing when
    // the remote refuses.
    const remoteDeleted = await deleteChatbotConversation(userId);

    const { count } = await prisma.aiInteraction.deleteMany({
      where: { user_id: userId },
    });

    // remoteDeleted is reported, not hidden: if it is false the transcript may
    // still exist on the chatbot's side and someone needs to follow up. A
    // silent 200 here would misrepresent a data-deletion request as complete.
    if (!remoteDeleted) {
      console.warn(
        `[ai.history] Local history cleared for ${userId} but remote ` +
          `conversation was not confirmed deleted — manual follow-up needed.`
      );
    }

    res.status(200).json({
      message: 'Chat history deleted',
      localInteractionsDeleted: count,
      remoteConversationDeleted: remoteDeleted,
    });
  })
);

// GET /api/v1/ai/usage — aggregate token usage report (ADMIN only)
router.get(
  '/usage',
  requireRole('ADMIN'),
  asyncHandler(async (_req, res) => {
    type DailyRow = { date: Date; count: bigint | number };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // All five queries run in parallel — this is an analytics endpoint and latency matters.
    const [
      aggregate,
      totalInteractions,
      totalCrisisEvents,
      topUsersRaw,
      dailyRaw,
    ] = await Promise.all([
      // 1. Sum of tokens + average response time across all interactions
      prisma.aiInteraction.aggregate({
        _sum: { tokens_used: true },
        _avg: { response_ms: true },
      }),
      // 2. Total row count
      prisma.aiInteraction.count(),
      // 3. Rows where the pre-filter triggered immediate escalation
      prisma.aiInteraction.count({ where: { crisis_level: 5 } }),
      // 4. Top 10 users by interaction volume, descending
      prisma.aiInteraction.groupBy({
        by: ['user_id'],
        _count: { user_id: true },
        orderBy: { _count: { user_id: 'desc' } },
        take: 10,
      }),
      // 5. Daily interaction counts for the last 30 days.
      // Prisma 6 groupBy cannot group by a derived date expression (DATE_TRUNC),
      // so $queryRaw is used only here; all other queries use the type-safe Prisma API.
      prisma.$queryRaw<DailyRow[]>`
        SELECT DATE_TRUNC('day', created_at)::date AS date,
               COUNT(*)::int                        AS count
        FROM   ai_interactions
        WHERE  created_at >= ${thirtyDaysAgo}
        GROUP  BY 1
        ORDER  BY 1 ASC
      `,
    ]);

    res.status(200).json({
      totalInteractions,
      totalTokensUsed: aggregate._sum.tokens_used ?? 0,
      totalCrisisEvents,
      avgResponseMs: Math.round(aggregate._avg.response_ms ?? 0),
      topUsers: topUsersRaw.map((row) => ({
        userId: row.user_id,
        interactionCount: row._count.user_id,
      })),
      // COUNT(*)::int comes back as a JS number from pg; Number() handles the rare
      // BigInt case if the driver ever returns one.
      dailyBreakdown: (dailyRaw as DailyRow[]).map((row) => ({
        date: new Date(row.date).toISOString().split('T')[0],
        count: Number(row.count),
      })),
    });
  })
);

export default router;
