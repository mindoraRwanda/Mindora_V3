import { prisma } from '../database.js';
import { publishCrisisEvent } from './publish-crisis-event.js';

// Durable crisis alerting.
//
// The clinician-facing queue lives in Admin Service and is populated from a
// RabbitMQ event. That publish used to be the ONLY record of a crisis: the
// chat route returned before writing any ai_interactions row, so a broker
// outage meant a disclosure of an active suicide plan left no trace anywhere.
//
// So the local row is now written first and treated as the source of truth,
// and the publish is treated as delivery of that row. Delivery failures leave
// `published = false` for the sweeper below to retry, rather than vanishing
// into a .catch().

/** Give up alerting on delivery attempts beyond this, and surface it loudly. */
const MAX_ATTEMPTS = 10;
/** How often the sweeper looks for undelivered alerts. */
const SWEEP_INTERVAL_MS = 30_000;
/** Ignore rows the request path is probably still working on. */
const MIN_AGE_MS = 5_000;

/**
 * Records a crisis detection durably, then attempts delivery.
 *
 * Returns once the row is committed. Delivery is deliberately not awaited:
 * the user's safety response must not wait on, or fail because of, the broker.
 * An undelivered row is retried by the sweeper.
 */
export async function recordCrisisAlert(input: {
  userId: string;
  sessionId: string | null;
  crisisLevel: number;
}): Promise<string> {
  const alert = await prisma.crisisAlert.create({
    data: {
      user_id: input.userId,
      session_id: input.sessionId,
      crisis_level: input.crisisLevel,
    },
  });

  void attemptDelivery(alert.id, input).catch((err) => {
    console.error(`[crisis] delivery attempt threw for ${alert.id}:`, err);
  });

  return alert.id;
}

async function attemptDelivery(
  alertId: string,
  input: { userId: string; sessionId: string | null; crisisLevel: number }
): Promise<void> {
  try {
    await publishCrisisEvent({
      userId: input.userId,
      sessionId: input.sessionId,
      crisisLevel: input.crisisLevel,
    });
    await prisma.crisisAlert.update({
      where: { id: alertId },
      data: { published: true, published_at: new Date(), last_error: null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.crisisAlert
      .update({
        where: { id: alertId },
        data: { attempts: { increment: 1 }, last_error: message },
      })
      .catch(() => {
        // If we cannot even record the failure, the sweeper will still find
        // the row by `published = false`.
      });
    console.error(`[crisis] delivery failed for ${alertId}: ${message}`);
  }
}

/**
 * Re-attempts delivery for alerts the request path could not deliver.
 *
 * Without this, a crisis raised while RabbitMQ was down would sit in the
 * database and never reach the clinician queue, which is indistinguishable
 * from never having been detected.
 */
export async function sweepUndeliveredAlerts(): Promise<number> {
  const pending = await prisma.crisisAlert.findMany({
    where: {
      published: false,
      attempts: { lt: MAX_ATTEMPTS },
      detected_at: { lt: new Date(Date.now() - MIN_AGE_MS) },
    },
    orderBy: { detected_at: 'asc' },
    take: 50,
  });

  for (const alert of pending) {
    await attemptDelivery(alert.id, {
      userId: alert.user_id,
      sessionId: alert.session_id,
      crisisLevel: alert.crisis_level,
    });
  }

  // Exhausted rows are a human problem, not a retry problem: a detected
  // crisis has not reached anyone and no further automation will fix it.
  const exhausted = await prisma.crisisAlert.count({
    where: { published: false, attempts: { gte: MAX_ATTEMPTS } },
  });
  if (exhausted > 0) {
    console.error(
      `[crisis] ${exhausted} crisis alert(s) have exhausted ${MAX_ATTEMPTS} ` +
        'delivery attempts and have NOT reached the clinician queue. ' +
        'Manual follow-up required.'
    );
  }

  return pending.length;
}

export function startCrisisAlertSweeper(): NodeJS.Timeout {
  const timer = setInterval(() => {
    sweepUndeliveredAlerts().catch((err) => {
      console.error('[crisis] sweeper failed:', err);
    });
  }, SWEEP_INTERVAL_MS);
  // Must not hold the process open on shutdown.
  timer.unref();
  return timer;
}
