import Redis from 'ioredis';

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
