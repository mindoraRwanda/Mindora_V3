import express from 'express';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';
import { moodRouter } from './routes/mood.routes.js';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const openApiPath = resolve(moduleDir, '../../../docs/mood-service.yaml');

export function createApp() {
  const app = express();
  app.use(express.json());

  try {
    const spec = yaml.parse(readFileSync(openApiPath, 'utf8'));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
  } catch {
    // Swagger optional in test environments
  }

  app.use(moodRouter);
  return app;
}
