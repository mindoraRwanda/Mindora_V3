import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const services = [
  { dir: 'auth-service', name: '@mindora/auth-service', port: 3001, health: '/api/v1/auth/health', extraImports: true },
  { dir: 'user-service', name: '@mindora/user-service', port: 3002, health: '/api/v1/users/health' },
  { dir: 'appointment-service', name: '@mindora/appointment-service', port: 3003, health: '/api/v1/appointments/health' },
  { dir: 'mood-tracking-service', name: '@mindora/mood-tracking-service', port: 3004, health: '/api/v1/mood/health' },
  { dir: 'community-service', name: '@mindora/community-service', port: 3005, health: '/api/v1/community/health' },
  { dir: 'messaging-service', name: '@mindora/messaging-service', port: 3006, health: '/api/v1/messaging/health' },
  { dir: 'ai-integration-service', name: '@mindora/ai-integration-service', port: 3007, health: '/api/v1/ai/health' },
  { dir: 'notification-service', name: '@mindora/notification-service', port: 3008, health: '/api/v1/notifications/health' },
  { dir: 'admin-service', name: '@mindora/admin-service', port: 3009, health: '/api/v1/admin/health' },
];

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps');

for (const svc of services) {
  const base = join(root, svc.dir);
  mkdirSync(join(base, 'src'), { recursive: true });

  const deps = {
    express: '^4.21.2',
  };
  const workspaceDeps = {};
  if (svc.extraImports) {
    workspaceDeps['@mindora/database'] = '1.0.0';
    workspaceDeps['@mindora/validation'] = '1.0.0';
  }

  writeFileSync(
    join(base, 'package.json'),
    JSON.stringify(
      {
        name: svc.name,
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'tsx watch src/index.ts',
          build: 'tsc',
          start: 'node dist/index.js',
          lint: 'eslint src/',
          test: 'vitest run --passWithNoTests',
        },
        dependencies: { ...deps, ...workspaceDeps },
        devDependencies: {
          '@types/express': '^5.0.0',
          tsx: '^4.19.3',
          typescript: '^5.8.2',
          vitest: '^3.0.9',
        },
      },
      null,
      2
    )
  );

  writeFileSync(
    join(base, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '../../tsconfig.base.json',
        compilerOptions: {
          outDir: './dist',
          rootDir: './src',
        },
        include: ['src/**/*'],
      },
      null,
      2
    )
  );

  const importLines = svc.extraImports
    ? `// Workspace packages (Sprint 1 shared setup — used by Auth in Sprint 1)\nimport '@mindora/database';\nimport '@mindora/validation';\n\n`
    : '';

  writeFileSync(
    join(base, 'src/index.ts'),
    `${importLines}import express from 'express';

const SERVICE_NAME = '${svc.dir}';
const PORT = Number(process.env.PORT) || ${svc.port};
const GATEWAY_HEALTH_PATH = '${svc.health}';

const app = express();

const healthResponse = () => ({
  status: 'ok',
  service: SERVICE_NAME,
});

app.get('/health', (_req, res) => {
  res.status(200).json(healthResponse());
});

app.get(GATEWAY_HEALTH_PATH, (_req, res) => {
  res.status(200).json(healthResponse());
});

app.listen(PORT, () => {
  console.log(\`\${SERVICE_NAME} listening on http://localhost:\${PORT}\`);
});
`
  );
}

console.log('Created', services.length, 'service stubs');
