import { Redis } from 'ioredis';

let _client: Redis | null = null;

export function getRedisClient(): Redis {
  if (!_client) {
    _client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    });
    _client.on('error', (err: Error) => {
      console.error('[messaging-redis] error:', err.message);
    });
  }
  return _client;
}
