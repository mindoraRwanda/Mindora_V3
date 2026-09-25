export const config = {
  port: Number(process.env.PORT) || 3002,
  jwtSecret:
    process.env.JWT_SECRET ?? 'mindora-dev-jwt-secret-change-in-production',
  jwtIssuer: process.env.JWT_ISSUER ?? 'mindora-auth',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  rabbitUrl:
    process.env.RABBITMQ_URL ?? 'amqp://mindora:mindora@localhost:5672',
  kongUrl: process.env.KONG_URL ?? 'http://localhost:8000',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN ?? '',
  objectStorage: {
    bucket: process.env.OBJECT_STORAGE_BUCKET ?? '',
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
    region: process.env.OBJECT_STORAGE_REGION ?? 'auto',
    accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY ?? '',
  },
};
