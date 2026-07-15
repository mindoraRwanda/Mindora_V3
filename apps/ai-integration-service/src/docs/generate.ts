import { dump } from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { openApiSpec } from './openapi.js';

const docsDir = path.join(process.cwd(), 'docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

fs.writeFileSync(
  path.join(docsDir, 'ai-service.yaml'),
  dump(openApiSpec, { lineWidth: 120 })
);

console.log('OpenAPI spec written to docs/ai-service.yaml');
