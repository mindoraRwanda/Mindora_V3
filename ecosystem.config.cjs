// pm2-runtime process list for the "bundle" deploy target (Dockerfile.bundle):
// all 9 hand-written services + the docs aggregator run as sibling processes
// in one container, each on the fixed internal port docker-compose.yml also
// uses. admin-service and ai-integration-service read their own PORT-like
// variable instead of PORT (see apps/admin-service/src/index.ts and
// apps/ai-integration-service/src/index.ts) — set explicitly here so they
// don't collide with whatever single PORT Railway injects into the container.
// Postgres/Redis/MongoDB/RabbitMQ/Kong are NOT part of this image — deploy
// those as separate Railway services and point the DATABASE_URL / REDIS_URL /
// RABBITMQ_URL variables below at them via the container's env.
//
// community-service and messaging-service both read process.env.MONGO_URI
// (see apps/community-service/src/database.ts and
// apps/messaging-service/src/database.ts) but need different database names
// on the same Mongo instance — a plain container-level MONGO_URI would only
// satisfy one of them. Set MONGO_BASE_URL (e.g.
// mongodb://<mongo-service>.railway.internal:27017) once on the container
// and derive each service's full MONGO_URI here instead.
const MONGO_BASE_URL = process.env.MONGO_BASE_URL || '';

module.exports = {
  apps: [
    { name: 'auth-service', script: 'apps/auth-service/dist/index.js', env: { PORT: 3001 } },
    { name: 'user-service', script: 'apps/user-service/dist/index.js', env: { PORT: 3002 } },
    { name: 'appointment-service', script: 'apps/appointment-service/dist/index.js', env: { PORT: 3003 } },
    { name: 'mood-tracking-service', script: 'apps/mood-tracking-service/dist/index.js', env: { PORT: 3004 } },
    {
      name: 'community-service',
      script: 'apps/community-service/dist/index.js',
      // authSource=admin: safe to always append. MongoDB's driver defaults
      // authSource to whatever database is in the connection path — if
      // MONGO_BASE_URL carries credentials for a root user (created in
      // 'admin', as Railway's Mongo template does), omitting this makes
      // every per-service database an authentication failure even with the
      // right password. Harmless no-op when MONGO_BASE_URL has no
      // credentials at all (nothing to authenticate against).
      env: { PORT: 3005, ...(MONGO_BASE_URL && { MONGO_URI: `${MONGO_BASE_URL}/mindora_community?authSource=admin` }) },
    },
    {
      name: 'messaging-service',
      script: 'apps/messaging-service/dist/index.js',
      env: { PORT: 3006, ...(MONGO_BASE_URL && { MONGO_URI: `${MONGO_BASE_URL}/mindora_messaging?authSource=admin` }) },
    },
    { name: 'ai-integration-service', script: 'apps/ai-integration-service/dist/index.js', env: { AI_SERVICE_PORT: 3007 } },
    { name: 'notification-service', script: 'apps/notification-service/dist/index.js', env: { PORT: 3008 } },
    { name: 'admin-service', script: 'apps/admin-service/dist/index.js', env: { ADMIN_SERVICE_PORT: 3009 } },
    { name: 'docs-gateway', script: 'apps/docs-gateway/dist/index.js', env: { DOCS_GATEWAY_PORT: 3010 } },
  ],
};
