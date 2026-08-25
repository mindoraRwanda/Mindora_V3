import { resolveJwtSecret } from '@mindora/auth-middleware';

export const config = {
  port: Number(process.env.PORT) || 3003,
  jwtSecret: resolveJwtSecret(),
  jwtIssuer: process.env.JWT_ISSUER ?? 'mindora-auth',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  rabbitUrl:
    process.env.RABBITMQ_URL ?? 'amqp://mindora:mindora@localhost:5672',
};
