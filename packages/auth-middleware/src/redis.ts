import { Redis } from 'ioredis';

let redis: Redis | null = null;

export function getRedisClient(redisUrl: string): Redis {
  if (!redis) {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }
  return redis;
}

export function blacklistKey(jti: string): string {
  return `auth:blacklist:${jti}`;
}

export async function isTokenBlacklisted(
  redisUrl: string,
  jti: string
): Promise<boolean> {
  const client = getRedisClient(redisUrl);
  if (client.status !== 'ready') {
    await client.connect();
  }
  const result = await client.exists(blacklistKey(jti));
  return result === 1;
}

export async function blacklistToken(
  redisUrl: string,
  jti: string,
  ttlSeconds: number
): Promise<void> {
  const client = getRedisClient(redisUrl);
  if (client.status !== 'ready') {
    await client.connect();
  }
  if (ttlSeconds > 0) {
    await client.set(blacklistKey(jti), '1', 'EX', ttlSeconds);
  }
}

export function passwordResetKey(tokenHash: string): string {
  return `auth:reset:${tokenHash}`;
}

export function suspendedKey(userId: string): string {
  return `auth:suspended:${userId}`;
}

// Checked on every authenticated request (see createVerifyJwt) so a
// suspension takes effect immediately — without this, a still-valid access
// token would keep working until it naturally expires, even though the
// database's isActive flag (the source of truth) already says otherwise.
export async function isUserSuspended(
  redisUrl: string,
  userId: string
): Promise<boolean> {
  const client = getRedisClient(redisUrl);
  if (client.status !== 'ready') {
    await client.connect();
  }
  const result = await client.exists(suspendedKey(userId));
  return result === 1;
}

// No TTL — unlike the jti blacklist (which only needs to outlive the token
// it revokes), a suspension has no natural expiry. It's cleared explicitly
// when an admin reactivates the account.
export async function setUserSuspended(
  redisUrl: string,
  userId: string,
  suspended: boolean
): Promise<void> {
  const client = getRedisClient(redisUrl);
  if (client.status !== 'ready') {
    await client.connect();
  }
  if (suspended) {
    await client.set(suspendedKey(userId), '1');
  } else {
    await client.del(suspendedKey(userId));
  }
}
