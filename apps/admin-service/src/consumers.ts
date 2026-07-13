import { subscribeToExchange } from '@mindora/queue';
import { EXCHANGES, aiCrisisEventSchema, moodDomainEventSchema } from '@mindora/events';
import { prisma } from './lib/prisma.js';

const ADMIN_QUEUES = {
  AI: 'admin.ai',
  MOOD: 'admin.mood',
} as const;

// No retry/DLQ here (unlike notification-service's retry.ts) — these
// handlers only write one row to the local database, with no external
// service calls that can flake. A thrown error here is nacked with
// requeue=false by subscribeToExchange (permanent drop, not redelivery) —
// so validation failures return early rather than throw, since a malformed
// payload will never parse differently on a hypothetical redelivery anyway.

async function handleAiCrisis(payload: unknown): Promise<void> {
  const parsed = aiCrisisEventSchema.safeParse(payload);
  if (!parsed.success) {
    console.error(
      '[admin] Invalid ai.crisis payload, dropping:',
      parsed.error.message
    );
    return;
  }

  await prisma.system_alerts.create({
    data: {
      eventType: 'AI_CRISIS',
      severity: 'HIGH',
      payload: parsed.data,
      resolved: false,
    },
  });

  console.log(
    `[admin] system_alert created for ai.crisis (userId=${parsed.data.userId}, crisisLevel=${parsed.data.crisisLevel})`
  );
}

async function handleMoodConcern(payload: unknown): Promise<void> {
  const parsed = moodDomainEventSchema.safeParse(payload);
  if (!parsed.success) {
    console.error(
      '[admin] Invalid mood event payload, dropping:',
      parsed.error.message
    );
    return;
  }

  // mindora.mood carries both mood.concern and mood.streak — only concern
  // is alert-worthy; streak milestones aren't a system_alerts concern.
  if (parsed.data.eventType !== 'mood.concern') return;

  await prisma.system_alerts.create({
    data: {
      eventType: 'MOOD_CONCERN',
      severity: 'MEDIUM',
      payload: parsed.data,
      resolved: false,
    },
  });

  console.log(
    `[admin] system_alert created for mood.concern (userId=${parsed.data.userId}, avgMoodScore=${parsed.data.avgMoodScore})`
  );
}

export async function startConsumers(): Promise<void> {
  // mindora.ai is a fanout exchange (see ai-integration-service/ai.routes.ts).
  await subscribeToExchange(EXCHANGES.AI, ADMIN_QUEUES.AI, handleAiCrisis, 'fanout');
  console.log(`[admin] Subscribed to ${EXCHANGES.AI} exchange (queue: ${ADMIN_QUEUES.AI})`);

  // mindora.mood is a topic exchange (mood-tracking-service publishes via
  // publishToExchange) — must match or RabbitMQ throws PRECONDITION_FAILED.
  await subscribeToExchange(EXCHANGES.MOOD, ADMIN_QUEUES.MOOD, handleMoodConcern, 'topic');
  console.log(`[admin] Subscribed to ${EXCHANGES.MOOD} exchange (queue: ${ADMIN_QUEUES.MOOD})`);
}
