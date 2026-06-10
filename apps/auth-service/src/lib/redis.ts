import {
  blacklistToken,
  getRedisClient,
  isTokenBlacklisted,
  passwordResetKey,
} from '@mindora/auth-middleware';
import { config } from '../config.js';

export { blacklistToken, isTokenBlacklisted, passwordResetKey };

export async function connectRedis(): Promise<void> {
  const client = getRedisClient(config.redisUrl);
  if (client.status === 'ready') {
    return;
  }
  await client.connect();
  await client.ping();
}

export async function storePasswordResetToken(
  tokenHash: string,
  userId: string
): Promise<void> {
  const client = getRedisClient(config.redisUrl);
  if (client.status !== 'ready') {
    await client.connect();
  }
  await client.set(passwordResetKey(tokenHash), userId, 'EX', 15 * 60);
}

export async function getPasswordResetUserId(
  tokenHash: string
): Promise<string | null> {
  const client = getRedisClient(config.redisUrl);
  if (client.status !== 'ready') {
    await client.connect();
  }
  return client.get(passwordResetKey(tokenHash));
}

export async function deletePasswordResetToken(tokenHash: string): Promise<void> {
  const client = getRedisClient(config.redisUrl);
  if (client.status !== 'ready') {
    await client.connect();
  }
  await client.del(passwordResetKey(tokenHash));
}
