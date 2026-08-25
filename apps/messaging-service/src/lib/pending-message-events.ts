import { PendingMessageEvent } from '../models/index.js';
import {
  buildMessageReceivedEvent,
  publishMessageReceivedEvent,
  type MessageReceivedInput,
} from './publish-message-event.js';
import type { MessageReceivedEvent } from '@mindora/events';

// Durable outbox for message.received events — same pattern as
// ai-integration-service's crisis-alerts.ts and mood-tracking-service's
// pending-mood-events.ts.

/** Give up retrying delivery attempts beyond this. */
const MAX_ATTEMPTS = 10;
/** How often the sweeper looks for undelivered events. */
const SWEEP_INTERVAL_MS = 30_000;
/** Ignore rows the request path is probably still working on. */
const MIN_AGE_MS = 5_000;

/**
 * Records a message.received event durably, then attempts delivery.
 *
 * Returns once the row is committed (or immediately, if there's no
 * recipient to notify — same skip behavior buildMessageReceivedEvent always
 * had). Delivery is deliberately not awaited: real-time delivery already
 * happened via the socket emit before this is called, and must not wait on
 * the broker. An undelivered row is retried by the sweeper.
 */
export async function recordAndPublishMessageEvent(
  input: MessageReceivedInput
): Promise<void> {
  const event = buildMessageReceivedEvent(input);
  if (!event) return;

  const row = await PendingMessageEvent.create({ payload: event });
  const id = row._id.toString();

  void attemptDelivery(id, event).catch((err) => {
    console.error(`[message.received] delivery attempt threw for ${id}:`, err);
  });
}

async function attemptDelivery(
  id: string,
  event: MessageReceivedEvent
): Promise<void> {
  try {
    await publishMessageReceivedEvent(event);
    await PendingMessageEvent.updateOne(
      { _id: id },
      { published: true, publishedAt: new Date(), lastError: null }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await PendingMessageEvent.updateOne(
      { _id: id },
      { $inc: { attempts: 1 }, lastError: message }
    ).catch(() => {
      // If we cannot even record the failure, the sweeper will still find
      // the row by `published: false`.
    });
    console.error(`[message.received] delivery failed for ${id}: ${message}`);
  }
}

/**
 * Re-attempts delivery for events the request path could not deliver.
 *
 * Without this, a message.received event raised while RabbitMQ was down
 * would sit in Mongo and never reach Notification Service, which is
 * indistinguishable from the notification never having been triggered.
 */
export async function sweepUndeliveredMessageEvents(): Promise<number> {
  const pending = await PendingMessageEvent.find({
    published: false,
    attempts: { $lt: MAX_ATTEMPTS },
    createdAt: { $lt: new Date(Date.now() - MIN_AGE_MS) },
  })
    .sort({ createdAt: 1 })
    .limit(50);

  for (const row of pending) {
    await attemptDelivery(row._id.toString(), row.payload);
  }

  const exhausted = await PendingMessageEvent.countDocuments({
    published: false,
    attempts: { $gte: MAX_ATTEMPTS },
  });
  if (exhausted > 0) {
    console.error(
      `[message.received] ${exhausted} event(s) have exhausted ${MAX_ATTEMPTS} ` +
        'delivery attempts and have NOT reached RabbitMQ. Manual follow-up required.'
    );
  }

  return pending.length;
}

export function startMessageEventSweeper(): NodeJS.Timeout {
  const timer = setInterval(() => {
    sweepUndeliveredMessageEvents().catch((err) => {
      console.error('[message.received] sweeper failed:', err);
    });
  }, SWEEP_INTERVAL_MS);
  // Must not hold the process open on shutdown.
  timer.unref();
  return timer;
}
