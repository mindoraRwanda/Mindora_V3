import dotenv from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Anchor from this file's own location, not process.cwd().
// src/env.ts → src/ → admin-service/ → apps/ → monorepo root
const dir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(dir, '..', '..', '..', '.env') });
