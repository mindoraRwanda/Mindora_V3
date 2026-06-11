import { Redis } from 'ioredis';
import { config } from '../config.js';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  const client = getRedis();
  if (client.status === 'ready') {
    return;
  }
  await client.connect();
  await client.ping();
}

export function blacklistKey(jti: string): string {
  return `auth:blacklist:${jti}`;
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const result = await getRedis().exists(blacklistKey(jti));
  return result === 1;
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
