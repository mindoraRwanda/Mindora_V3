import { randomUUID } from 'node:crypto';
import {
  EXCHANGES,
  messageReceivedEventSchema,
  type MessageReceivedEvent,
} from '@mindora/events';
import { connect } from '@mindora/queue';

export interface MessageReceivedInput {
  messageId: string;
  conversationId: string;
  senderId: string;
  recipientId: string | null;
  content: string;
}

/**
 * Validates and stamps a message.received event, or returns null if there's
 * no recipient to notify. Split out from publishing so a caller that needs
 * to retry delivery (see lib/pending-message-events.ts) reuses the same
 * eventId/occurredAt across attempts instead of minting a new envelope —
 * and therefore a new eventId — on every retry.
 */
export function buildMessageReceivedEvent(
  input: MessageReceivedInput
): MessageReceivedEvent | null {
  if (!input.recipientId) {
    console.warn(
      `[message.received] Could not resolve a recipient for conversation ${input.conversationId} — skipping publish`
    );
    return null;
  }

  // zod's declared output type for a schema built via .extend() widens every
  // field to optional (a known inference quirk, not a runtime concern —
  // .parse() throws unless every required field above is actually present),
  // so the result needs an explicit assertion back to the hand-written
  // MessageReceivedEvent interface.
  return messageReceivedEventSchema.parse({
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    messageId: input.messageId,
    conversationId: input.conversationId,
    senderId: input.senderId,
    recipientId: input.recipientId,
    content: input.content,
  }) as MessageReceivedEvent;
}

// EXCHANGES.MESSAGES ('mindora.messages') is consumed by Notification Service
// via subscribeToExchange(..., 'fanout') — its default type, already declared
// on the broker by the time this runs. @mindora/queue's publishToExchange()
// always asserts 'topic', which throws PRECONDITION_FAILED against an
// existing 'fanout' exchange (same class of mismatch documented on
// subscribeToExchange itself) — so this publishes with a raw channel instead,
// asserting 'fanout' to match.
export async function publishMessageReceivedEvent(
  event: MessageReceivedEvent
): Promise<void> {
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
