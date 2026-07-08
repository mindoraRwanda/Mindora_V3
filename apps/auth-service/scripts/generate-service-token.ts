// One-time script to mint a non-expiring internal service JWT.
// Usage: npm run generate:service-token --workspace=@mindora/auth-service [-- <serviceId>]
// Prints the token to stdout — copy it into INTERNAL_SERVICE_TOKEN in the root .env.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as dotenvConfig } from 'dotenv';

const moduleDir = fileURLToPath(new URL('.', import.meta.url));
dotenvConfig({ path: resolve(moduleDir, '../../../.env') });
dotenvConfig();

const { config } = await import('../src/config.js');
const { default: jwt } = await import('jsonwebtoken');

const serviceId = process.argv[2] ?? 'community-service';

// No expiresIn/jwtid — this token does not expire and is never blacklist-checked.
const token = jwt.sign(
  {
    sub: serviceId,
    role: 'SERVICE',
    serviceId,
  },
  config.jwtSecret,
  {
    issuer: config.jwtIssuer,
  }
);

console.log(token);
