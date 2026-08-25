import { randomUUID } from 'node:crypto';
import { connect } from '@mindora/queue';
import { EXCHANGES } from '@mindora/events';

export interface CrisisEventInput {
  userId: string;
  sessionId: string | null;
  crisisLevel: number;
}

/**
 * Publishes an ai.crisis event, which is what populates the clinician alert
 * queue in Admin Service.
 *
 * Extracted from ai.routes.ts so the delivery path can be retried by the
 * outbox sweeper rather than only being attempted once inline.
 *
 * Throws on failure. Callers are expected to record that failure durably;
 * see lib/crisis-alerts.ts.
 */
export async function publishCrisisEvent(
  input: CrisisEventInput
): Promise<void> {
  const connection = await connect();
  const channel = await connection.createChannel();
  try {
    await channel.assertExchange(EXCHANGES.AI, 'fanout', { durable: true });

    const now = new Date().toISOString();
    // Shape must satisfy aiCrisisEventSchema in @mindora/events — the Admin
    // and Notification consumers both drop payloads that fail validation, so
    // a malformed event here is a silently discarded crisis alert.
    const payload = {
      eventId: randomUUID(),
      occurredAt: now,
      userId: input.userId,
      sessionId: input.sessionId,
      crisisLevel: input.crisisLevel,
      timestamp: now,
    };

    channel.publish(EXCHANGES.AI, '', Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      contentType: 'application/json',
    });
  } finally {
    await channel.close();
  }
}
