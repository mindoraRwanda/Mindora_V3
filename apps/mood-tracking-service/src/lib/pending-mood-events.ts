import { prisma } from './prisma.js';
import { publishMoodEvent } from './publish-mood-event.js';
import type { MoodDomainEvent } from '@mindora/events';
import type { Prisma } from '../generated/prisma/index.js';

// Durable outbox for mood.concern and mood.streak events — same pattern as
// ai-integration-service's crisis-alerts.ts.
//
// Both events used to be a bare try/catch around publishMoodEvent() with
// nothing recorded on failure: a RabbitMQ blip at the exact moment of
// publish silently dropped the event forever, with no trace it should have
// existed. The row below is now the source of truth, written before
// publishing is attempted; a delivery failure leaves `published = false`
// for the sweeper to retry instead of vanishing into a log line.

/** Give up retrying delivery attempts beyond this. */
const MAX_ATTEMPTS = 10;
/** How often the sweeper looks for undelivered events. */
const SWEEP_INTERVAL_MS = 30_000;
/** Ignore rows the request path is probably still working on. */
const MIN_AGE_MS = 5_000;

/**
 * Records a mood domain event durably, then attempts delivery.
 *
 * Returns once the row is committed. Delivery is deliberately not awaited:
 * the HTTP response must not wait on, or fail because of, the broker. An
 * undelivered row is retried by the sweeper.
 */
export async function recordAndPublishMoodEvent(
  event: MoodDomainEvent
): Promise<void> {
  const row = await prisma.pendingMoodEvent.create({
    data: {
      eventType: event.eventType,
      payload: event as unknown as Prisma.InputJsonValue,
    },
  });

  void attemptDelivery(row.id, event).catch((err) => {
    console.error(`[mood-event] delivery attempt threw for ${row.id}:`, err);
  });
}

async function attemptDelivery(
  id: string,
  event: MoodDomainEvent
): Promise<void> {
  try {
    await publishMoodEvent(event);
    await prisma.pendingMoodEvent.update({
      where: { id },
      data: { published: true, publishedAt: new Date(), lastError: null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.pendingMoodEvent
      .update({
        where: { id },
        data: { attempts: { increment: 1 }, lastError: message },
      })
      .catch(() => {
        // If we cannot even record the failure, the sweeper will still find
        // the row by `published = false`.
      });
    console.error(
      `[mood-event] delivery failed for ${id} (${event.eventType}): ${message}`
    );
  }
}

/**
 * Re-attempts delivery for events the request path could not deliver.
 *
 * Without this, a mood-concern or streak event raised while RabbitMQ was
 * down would sit in the database and never reach admin/notification
 * consumers, which is indistinguishable from never having been detected.
 */
export async function sweepUndeliveredMoodEvents(): Promise<number> {
  const pending = await prisma.pendingMoodEvent.findMany({
    where: {
      published: false,
      attempts: { lt: MAX_ATTEMPTS },
      createdAt: { lt: new Date(Date.now() - MIN_AGE_MS) },
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  for (const row of pending) {
    await attemptDelivery(row.id, row.payload as unknown as MoodDomainEvent);
  }

  const exhausted = await prisma.pendingMoodEvent.count({
    where: { published: false, attempts: { gte: MAX_ATTEMPTS } },
  });
  if (exhausted > 0) {
    console.error(
      `[mood-event] ${exhausted} mood event(s) have exhausted ${MAX_ATTEMPTS} ` +
        'delivery attempts and have NOT reached RabbitMQ. Manual follow-up required.'
    );
  }

  return pending.length;
}

export function startMoodEventSweeper(): NodeJS.Timeout {
  const timer = setInterval(() => {
    sweepUndeliveredMoodEvents().catch((err) => {
      console.error('[mood-event] sweeper failed:', err);
    });
  }, SWEEP_INTERVAL_MS);
  // Must not hold the process open on shutdown.
  timer.unref();
  return timer;
}
