import { config as dotenvConfig } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Imported first by index.ts — ESM evaluates every static import before the
// importing module's own body, so loading .env inside index.ts itself runs
// too late: config.ts has already read process.env by then (silently
// falling back to defaults for JWT_SECRET, REDIS_URL, GOOGLE_*, etc).
// Anchor from this file's own location, not process.cwd().
// src/env.ts → src/ → auth-service/ → apps/ → monorepo root
const moduleDir = dirname(fileURLToPath(import.meta.url));

dotenvConfig({ path: resolve(moduleDir, '../../../.env') });
dotenvConfig({ path: resolve(moduleDir, '../../../packages/database/.env') });
dotenvConfig();
