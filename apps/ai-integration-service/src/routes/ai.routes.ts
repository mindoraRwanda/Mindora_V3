import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import {
  requireRole,
  type AuthenticatedRequest,
} from '@mindora/auth-middleware';
import { connect } from '@mindora/queue';
import { EXCHANGES } from '@mindora/events';
import { runPreFilter } from '../preFilter.js';
import { prisma } from '../database.js';
import { chatWithBot, deleteRemoteConversation } from '../chatbotClient.js';
import { decrypt, encrypt } from '../lib/crypto.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { chatRouteLimiter } from '../middleware/rate-limit.js';

const router = Router();

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

async function publishCrisisEvent(
  userId: string,
  crisisLevel: number,
  sessionId: string | null,
  messageExcerpt: string,
  interactionId: string,
  conversationExcerpt: string
): Promise<void> {
  const connection = await connect();
  const channel = await connection.createConfirmChannel();
  const eventId = randomUUID();
  try {
    await channel.assertExchange(EXCHANGES.AI, 'fanout', { durable: true });
    channel.publish(
      EXCHANGES.AI,
      '',
      Buffer.from(
        JSON.stringify({
          eventId,
          occurredAt: new Date().toISOString(),
          userId,
          sessionId,
          crisisLevel,
          timestamp: new Date().toISOString(),
          messageExcerpt,
          conversationExcerpt,
          interactionId,
          source: 'web-chatbot',
        })
      ),
      { persistent: true, contentType: 'application/json' }
    );
    await channel.waitForConfirms();
  } finally {
    await channel.close();
  }
}

// POST /api/v1/ai/chat — submit a message to the AI (PATIENT only)
router.post(
  '/chat',
  chatRouteLimiter,
  requireRole('PATIENT'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { message, sessionId } = req.body as {
      message?: unknown;
      sessionId?: unknown;
    };

    if (typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ error: 'message must be a non-empty string' });
      return;
    }

    const userId = req.user?.userId;
    const email = req.user?.email;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const resolvedSessionId = isUuid(sessionId) ? sessionId : null;
    const crisisLevel = await runPreFilter(message, userId);

    // Levels 3–5 receive an immediate supportive response; the generative model
    // is bypassed so the safety message is not delayed by a provider call.
    if (crisisLevel >= 3) {
      const interactionSessionId = resolvedSessionId ?? randomUUID();
      const approvedClinicalResources =
        process.env.CRISIS_CONTACTS_APPROVED === 'true'
          ? (process.env.CRISIS_APPROVED_RESOURCES ?? '')
              .split(';')
              .map((value) => value.trim())
              .filter(Boolean)
          : [];
      const approvedResourcesText = approvedClinicalResources.length
        ? ` MINDORA-approved resources: ${approvedClinicalResources.join('; ')}.`
        : '';
      const safetyResponse =
        "I'm really glad you told me. Your safety matters, and you deserve support right now. If you may act on these thoughts, have already hurt yourself, or cannot stay safe, please contact local emergency services or go to the nearest emergency department now. If possible, move away from anything you could use to hurt yourself and stay with someone you trust while you get help. For general MINDORA support during published business hours (Monday to Friday, 9:00 AM–5:00 PM), call +250 783 974-066 or email info@mindora.rw (stated response time within 24 hours). These are general support contacts, not emergency services or a 24/7 crisis hotline. For therapist follow-up when safe, visit https://app.mindora.rw/therapists." +
        approvedResourcesText;

      let interactionId = randomUUID();
      try {
        const storedInteraction = await prisma.aiInteraction.create({
          data: {
            user_id: userId,
            session_id: interactionSessionId,
            user_message: encrypt(message),
            ai_response: encrypt(safetyResponse),
            input_flagged: true,
            output_flagged: false,
            crisis_level: crisisLevel,
            response_ms: 0,
          },
        });
        interactionId = storedInteraction.id;
      } catch (error) {
        console.error(
          '[pre-filter] Failed to store encrypted crisis interaction:',
          error
        );
      }

      // The persisted conversation remains encrypted. Only a bounded excerpt
      // is included in the restricted operations email for immediate triage.
      let conversationExcerpt = '';
      try {
        const recent = await prisma.aiInteraction.findMany({
          where: { user_id: userId, session_id: interactionSessionId },
          orderBy: { created_at: 'desc' },
          take: 4,
          select: { user_message: true, ai_response: true },
        });
        conversationExcerpt = recent
          .reverse()
          .map((row) => {
            let userMessage = '[Unable to decrypt earlier message]';
            let assistantMessage = '[Unable to decrypt earlier response]';
            try {
              userMessage = decrypt(row.user_message);
            } catch {
              /* retain safe marker */
            }
            try {
              assistantMessage = decrypt(row.ai_response);
            } catch {
              /* retain safe marker */
            }
            return `User: ${userMessage.slice(0, 700)}\nMINDORA: ${assistantMessage.slice(0, 700)}`;
          })
          .join('\n\n')
          .slice(0, 5000);
      } catch (error) {
        console.error(
          '[pre-filter] Could not collect bounded crisis transcript:',
          error
        );
      }

      publishCrisisEvent(
        userId,
        crisisLevel,
        interactionSessionId,
        message.trim().slice(0, 1500),
        interactionId,
        conversationExcerpt
      ).catch((error) => {
        console.error(
          '[pre-filter] Failed to publish crisis event to RabbitMQ:',
          error
        );
      });

      res.status(200).json({
        response: safetyResponse,
        crisisLevel,
        sessionId: interactionSessionId,
        crisisSupport: {
          generalMindoraPhone: '+250 783 974-066',
          generalMindoraPhoneHours: 'Monday to Friday, 9:00 AM–5:00 PM',
          generalMindoraEmail: 'info@mindora.rw',
          generalMindoraEmailResponse: 'Within 24 hours',
          isEmergencyService: false,
          approvedClinicalResources,
          mindoraTherapistDirectory: 'https://app.mindora.rw/therapists',
        },
      });
      return;
    }

    const inputFlagged = crisisLevel >= 1;
    if (!email) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const start = Date.now();
    let botMessage;
    try {
      botMessage = await chatWithBot(userId, email, message);
    } catch (err) {
      console.error('[chat] Therapy chatbot call failed:', err);
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

// GET /api/v1/ai/history — retrieve session interaction history (PATIENT only)
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
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      prisma.aiInteraction.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aiInteraction.count({ where: { user_id: userId } }),
    ]);

    // message/response are independently nullable — a row that can't be
    // decrypted (wrong/rotated AI_INTERACTION_ENCRYPTION_KEY, corruption)
    // must not take down the whole page of history.
    const interactions = rows.map((row) => {
      let message: string | null;
      try {
        message = decrypt(row.user_message);
      } catch {
        message = null;
      }
      let response: string | null;
      try {
        response = decrypt(row.ai_response);
      } catch {
        response = null;
      }
      return {
        id: row.id,
        sessionId: row.session_id,
        message,
        response,
        crisisLevel: row.crisis_level,
        createdAt: row.created_at.toISOString(),
      };
    });

    res.status(200).json({ interactions, total, page, limit });
  })
);

// DELETE /api/v1/ai/history — delete all interaction history (PATIENT only)
router.delete(
  '/history',
  requireRole('PATIENT'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { count } = await prisma.aiInteraction.deleteMany({
      where: { user_id: userId },
    });
    // Best-effort — the vendor's own conversation/transcript is separate
    // from our audit rows just deleted above; a failure there must not
    // undo (or block reporting) the deletion of what we actually own.
    const remoteConversationDeleted = await deleteRemoteConversation(userId);

    res.status(200).json({
      message: 'History deleted',
      localInteractionsDeleted: count,
      remoteConversationDeleted,
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
