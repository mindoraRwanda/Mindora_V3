// pm2-runtime process list for the "bundle" deploy target (Dockerfile.bundle):
// all 9 hand-written services + the docs aggregator run as sibling processes
// in one container, each on the fixed internal port docker-compose.yml also
// uses. admin-service and ai-integration-service read their own PORT-like
// variable instead of PORT (see apps/admin-service/src/index.ts and
// apps/ai-integration-service/src/index.ts) — set explicitly here so they
// don't collide with whatever single PORT Railway injects into the container.
// Postgres/Redis/MongoDB/RabbitMQ/Kong are NOT part of this image — deploy
// those as separate Railway services and point the DATABASE_URL / REDIS_URL /
// MONGO_URI / RABBITMQ_URL variables below at them via the container's env.
module.exports = {
  apps: [
    { name: 'auth-service', script: 'apps/auth-service/dist/index.js', env: { PORT: 3001 } },
    { name: 'user-service', script: 'apps/user-service/dist/index.js', env: { PORT: 3002 } },
    { name: 'appointment-service', script: 'apps/appointment-service/dist/index.js', env: { PORT: 3003 } },
    { name: 'mood-tracking-service', script: 'apps/mood-tracking-service/dist/index.js', env: { PORT: 3004 } },
    { name: 'community-service', script: 'apps/community-service/dist/index.js', env: { PORT: 3005 } },
    { name: 'messaging-service', script: 'apps/messaging-service/dist/index.js', env: { PORT: 3006 } },
    { name: 'ai-integration-service', script: 'apps/ai-integration-service/dist/index.js', env: { AI_SERVICE_PORT: 3007 } },
    { name: 'notification-service', script: 'apps/notification-service/dist/index.js', env: { PORT: 3008 } },
    { name: 'admin-service', script: 'apps/admin-service/dist/index.js', env: { ADMIN_SERVICE_PORT: 3009 } },
    { name: 'docs-gateway', script: 'apps/docs-gateway/dist/index.js', env: { DOCS_GATEWAY_PORT: 3010 } },
  ],
};
