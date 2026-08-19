// Loads .env files before anything else reads process.env.
//
// This must be imported first, on its own line, by index.ts. It cannot live in
// index.ts itself: ES module imports are hoisted and fully evaluated before any
// statement in the importing module's body, so a `dotenv.config()` call sitting
// below `import { config } from './config.js'` runs *after* config.ts has
// already read process.env and frozen its values.
//
// Nothing here depends on another local module, which is what makes the import
// order safe to rely on.
import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Anchored to this file rather than process.cwd(), so the paths hold whether
// the service is started from the repo root or from its own directory.
// src/env.ts -> src/ -> <service>/ -> apps/ -> repo root.
const moduleDir = dirname(fileURLToPath(import.meta.url));

// Order matters: dotenv does not overwrite a variable that is already set, so
// the first file to define a key wins. Real environment variables (Docker, pm2,
// CI) are set before any of this runs and therefore always take precedence.
dotenv.config({ path: resolve(moduleDir, '../../../.env') });
dotenv.config({ path: resolve(moduleDir, '../../../packages/database/.env') });
dotenv.config();
