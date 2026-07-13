import { randomUUID } from 'node:crypto';
import { EXCHANGES, messageReceivedEventSchema } from '@mindora/events';
import { connect } from '@mindora/queue';

interface MessageReceivedInput {
  messageId: string;
  conversationId: string;
  senderId: string;
  recipientId: string | null;
  content: string;
}

// EXCHANGES.MESSAGES ('mindora.messages') is consumed by Notification Service
// via subscribeToExchange(..., 'fanout') — its default type, already declared
// on the broker by the time this runs. @mindora/queue's publishToExchange()
// always asserts 'topic', which throws PRECONDITION_FAILED against an
// existing 'fanout' exchange (same class of mismatch documented on
// subscribeToExchange itself) — so this publishes with a raw channel instead,
// asserting 'fanout' to match. Every payload is validated on the consumer
// side against messageReceivedEventSchema, which requires eventId/occurredAt
// (the shared event envelope), not just the fields used here.
export async function publishMessageReceivedEvent(
  input: MessageReceivedInput
): Promise<void> {
  if (!input.recipientId) {
    console.warn(
      `[message.received] Could not resolve a recipient for conversation ${input.conversationId} — skipping publish`
    );
    return;
  }

  const event = messageReceivedEventSchema.parse({
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    messageId: input.messageId,
    conversationId: input.conversationId,
    senderId: input.senderId,
    recipientId: input.recipientId,
    content: input.content,
  });

  const connection = await connect();
  const channel = await connection.createChannel();
  // Local, one-off listener so a problem on this specific channel can't
  // become an unhandled 'error' event that crashes the process — the
  // caller's own try/catch only covers synchronous/awaited failures, not
  // async channel-level errors emitted after this function returns.
  channel.on('error', (err) => {
    console.error('[message.received] channel error:', err);
  });
  await channel.assertExchange(EXCHANGES.MESSAGES, 'fanout', { durable: true });
  channel.publish(EXCHANGES.MESSAGES, '', Buffer.from(JSON.stringify(event)), {
    persistent: true,
    contentType: 'application/json',
  });
  await channel.close();
}
