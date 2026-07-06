export const config = {
  port: Number(process.env.PORT) || 3004,
  jwtSecret:
    process.env.JWT_SECRET ?? 'mindora-dev-jwt-secret-change-in-production',
  jwtIssuer: process.env.JWT_ISSUER ?? 'mindora-auth',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  rabbitUrl:
    process.env.RABBITMQ_URL ?? 'amqp://mindora:mindora@localhost:5672',
  journalEncryptionKey:
    process.env.MOOD_JOURNAL_ENCRYPTION_KEY ??
    'mindora-dev-mood-journal-key-32bytes!!',
  insightsCacheTtlSeconds: 3600,
  dailyLogLimit: 10,
};
