import { subscribe } from '@mindora/queue';
import { ensureProfileForUser, type UserRole } from './profile-provisioning.js';

// NOTE: the spec for this called for a `mindora.auth` topic exchange with a
// `user.registered` routing key, but @mindora/queue's subscribeToExchange
// only supports fanout exchanges (it ignores routing keys and asserts the
// exchange as 'fanout'), while publishToExchange asserts it as 'topic'.
// Declaring the same exchange name with two different types makes RabbitMQ
// throw a channel error. Using the plain queue publish/subscribe instead —
// the same pattern Community Service uses for `community.reported` — avoids
// that entirely and is sufficient for a single consumer.
const QUEUE_NAME = 'mindora.auth';
const EVENT_NAME = 'user.registered';

interface UserRegisteredEvent {
  event: string;
  userId: string;
  role: UserRole;
  userName: string;
  email: string;
}

function isUserRegisteredEvent(
  content: unknown
): content is UserRegisteredEvent {
  if (typeof content !== 'object' || content === null) return false;
  const record = content as Record<string, unknown>;
  return (
    record.event === EVENT_NAME &&
    typeof record.userId === 'string' &&
    typeof record.role === 'string' &&
    typeof record.userName === 'string' &&
    typeof record.email === 'string'
  );
}

export async function startUserRegisteredConsumer(): Promise<void> {
  await subscribe(QUEUE_NAME, async (content) => {
    if (!isUserRegisteredEvent(content)) {
      console.warn(
        `[user-service] Ignoring unrecognized message on ${QUEUE_NAME}:`,
        content
      );
      return;
    }

    const { userId, role, userName, email } = content;

    if (role === 'ADMIN') {
      return;
    }

    const created = await ensureProfileForUser(userId, role, userName, email);
    if (created) {
      console.log(
        `[user-service] Profile created for userId=${userId} role=${role} userName=${userName}`
      );
    }
  });

  console.log(
    `[user-service] Subscribed to ${QUEUE_NAME} queue for ${EVENT_NAME} events`
  );
}
