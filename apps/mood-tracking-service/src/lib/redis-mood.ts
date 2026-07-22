import { getRedisClient } from '@mindora/auth-middleware';
import { config } from '../config.js';

function getRedis() {
  return getRedisClient(config.redisUrl);
}

function dailyKey(userId: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `mood:daily:${userId}:${day}`;
}

export async function incrementDailyLogCount(userId: string): Promise<number> {
  const client = getRedis();
  const key = dailyKey(userId);
  const count = await client.incr(key);
  if (count === 1) {
    const now = new Date();
    const endOfDay = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0
      )
    );
    const ttlSeconds = Math.max(
      60,
      Math.floor((endOfDay.getTime() - now.getTime()) / 1000)
    );
    await client.expire(key, ttlSeconds);
  }
  return count;
}

export async function getDailyLogCount(userId: string): Promise<number> {
  const client = getRedis();
  const value = await client.get(dailyKey(userId));
  return value ? Number(value) : 0;
}

export function insightsCacheKey(userId: string): string {
  return `mood:${userId}:weekly`;
}

export async function getInsightsCache(userId: string): Promise<string | null> {
  return getRedis().get(insightsCacheKey(userId));
}

export async function setInsightsCache(
  userId: string,
  payload: string,
  ttlSeconds = config.insightsCacheTtlSeconds
): Promise<void> {
  await getRedis().set(insightsCacheKey(userId), payload, 'EX', ttlSeconds);
}

export async function deleteInsightsCache(userId: string): Promise<void> {
  await getRedis().del(insightsCacheKey(userId));
}
