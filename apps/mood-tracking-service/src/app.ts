import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { moodRouter } from './routes/mood.routes.js';
import { registerOpenApiDocs } from './lib/openapi-docs.js';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const openApiPath = resolve(moduleDir, '../../../docs/mood-service.yaml');

export function createApp() {
  const app = express();
  app.use(express.json());

  try {
    registerOpenApiDocs(app, openApiPath);
  } catch {
    // OpenAPI spec optional in test environments without the file path
  }

  app.use(moodRouter);
  return app;
}
