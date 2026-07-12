import { connect, subscribeToExchange } from '@mindora/queue';
import { FatalNotificationError, InvalidEventPayloadError } from './errors.js';

const DLQ = 'mindora.notifications.dlq';
const REPROCESS_QUEUE = 'mindora.notifications.reprocess';

// Set RETRY_TEST_MODE=true in .env to use short delays for a full-cycle test run.
// IMPORTANT: RabbitMQ bakes TTL into the queue at creation time — changing the TTL on an
// existing queue name throws PRECONDITION_FAILED. Test mode uses a separate queue name
// prefix so prod and test queues never conflict, even if both have been created before.
const TEST_MODE = process.env.RETRY_TEST_MODE === 'true';

const RETRY_DELAYS_MS: readonly [number, number, number, number] = TEST_MODE
  ? [5_000, 15_000, 30_000, 60_000] // test:  5s · 15s · 30s · 1m
  : [60_000, 300_000, 1_800_000, 7_200_000]; // prod:  1m · 5m · 30m · 2h

// Separate queue prefix per mode to prevent TTL property conflicts in RabbitMQ.
const RETRY_QUEUE_PREFIX = TEST_MODE
  ? 'mindora.notifications.retry.test.'
  : 'mindora.notifications.retry.';

const MAX_RETRIES = RETRY_DELAYS_MS.length;

interface RetryEnvelope {
  exchange: string;
  payload: unknown;
  attempt: number;
}

type Handler = (payload: unknown) => Promise<void>;

const exchangeHandlers = new Map<string, Handler>();

async function publishToRetryQueue(
  delayIndex: number,
  envelope: RetryEnvelope
): Promise<void> {
  const connection = await connect();
  const ch = await connection.createChannel();
  const queue = `${RETRY_QUEUE_PREFIX}${delayIndex}`;
  await ch.assertQueue(queue, {
    durable: true,
    arguments: {
      'x-message-ttl': RETRY_DELAYS_MS[delayIndex],
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': REPROCESS_QUEUE,
    },
  });
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(envelope)), {
    persistent: true,
  });
  await ch.close();
}

async function publishToDlq(
  envelope: RetryEnvelope,
  err: unknown
): Promise<void> {
  const connection = await connect();
  const ch = await connection.createChannel();
  await ch.assertQueue(DLQ, { durable: true });
  ch.sendToQueue(
    DLQ,
    Buffer.from(
      JSON.stringify({
        ...envelope,
        failedAt: new Date().toISOString(),
        error: String(err),
      })
    ),
    { persistent: true }
  );
  await ch.close();
}

async function scheduleRetry(
  envelope: RetryEnvelope,
  err: unknown
): Promise<void> {
  // Fatal errors (invalid/unregistered token) will never succeed — skip all retries.
  if (err instanceof FatalNotificationError) {
    console.error(
      `[retry] fatal notification error (${err.providerCode}) for exchange=${envelope.exchange} — routing to DLQ immediately`
    );
    await publishToDlq(envelope, err);
    return;
  }

  // A payload that fails schema validation will fail the exact same way on
  // every redelivery — skip retries and go straight to the DLQ.
  if (err instanceof InvalidEventPayloadError) {
    console.error(
      `[retry] invalid event payload for exchange=${envelope.exchange} — routing to DLQ immediately: ${err.message}`
    );
    await publishToDlq(envelope, err);
    return;
  }

  const { attempt, exchange } = envelope;

  if (attempt >= MAX_RETRIES) {
    console.error(
      `[retry] all ${MAX_RETRIES} retries exhausted for exchange=${exchange} — routing to DLQ`,
      err
    );
    await publishToDlq(envelope, err);
    return;
  }

  const delayMs = RETRY_DELAYS_MS[attempt];
  console.warn(
    `[retry] attempt ${attempt + 1}/${MAX_RETRIES} for exchange=${exchange}, next retry in ${delayMs / 1000}s —`,
    err instanceof Error ? err.message : err
  );
  await publishToRetryQueue(attempt, { ...envelope, attempt: attempt + 1 });
}

export async function setupRetryInfrastructure(): Promise<void> {
  if (TEST_MODE) {
    console.warn(
      `[retry] TEST MODE — delays: ${RETRY_DELAYS_MS.map((d) => `${d / 1000}s`).join(' · ')} (set RETRY_TEST_MODE=false to restore production delays)`
    );
  }

  const connection = await connect();
  const ch = await connection.createChannel();

  await ch.assertQueue(DLQ, { durable: true });
  await ch.assertQueue(REPROCESS_QUEUE, { durable: true });

  for (let i = 0; i < MAX_RETRIES; i++) {
    await ch.assertQueue(`${RETRY_QUEUE_PREFIX}${i}`, {
      durable: true,
      arguments: {
        'x-message-ttl': RETRY_DELAYS_MS[i],
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': REPROCESS_QUEUE,
      },
    });
  }

  // Reprocess consumer — re-runs the handler after TTL delay elapses
  await ch.consume(REPROCESS_QUEUE, async (msg) => {
    if (!msg) return;

    let envelope: RetryEnvelope;
    try {
      envelope = JSON.parse(msg.content.toString()) as RetryEnvelope;
    } catch {
      ch.nack(msg, false, false);
      return;
    }

    const handler = exchangeHandlers.get(envelope.exchange);
    if (!handler) {
      console.error(
        `[retry] no handler registered for exchange=${envelope.exchange}`
      );
      ch.nack(msg, false, false);
      return;
    }

    try {
      await handler(envelope.payload);
      ch.ack(msg);
    } catch (err) {
      ch.ack(msg); // remove from reprocess queue before scheduling next retry
      await scheduleRetry(envelope, err);
    }
  });
  // Channel left open — consumer requires it
}

async function withRetry(
  exchange: string,
  payload: unknown,
  handler: Handler
): Promise<void> {
  try {
    await handler(payload);
  } catch (err) {
    await scheduleRetry({ exchange, payload, attempt: 0 }, err);
  }
}

/**
 * Registers a handler for retry reprocessing and subscribes to the exchange.
 * Wraps every delivery with exponential-backoff retry + DLQ fallback.
 *
 * `type` must match whatever type the exchange's publisher declares it as
 * (e.g. appointment-service and mood-tracking-service publish via
 * publishToExchange, which asserts 'topic') — RabbitMQ rejects redeclaring
 * an existing exchange under a different type.
 */
export async function subscribeWithRetry(
  exchange: string,
  queue: string,
  handler: Handler,
  type: 'fanout' | 'topic' = 'fanout'
): Promise<void> {
  exchangeHandlers.set(exchange, handler);
  await subscribeToExchange(
    exchange,
    queue,
    async (payload) => {
      await withRetry(exchange, payload, handler);
    },
    type
  );
}
