import './env.js'; // must be first — loads .env before any module reads process.env
import { createApp } from './app.js';
import { config } from './config.js';
import { registerHealthEndpoints } from './lib/health.js';
import { prisma } from './lib/prisma.js';

const SERVICE_NAME = 'appointment-service';
const GATEWAY_HEALTH_PATH = '/api/v1/appointments/health';

// Without these, a crash mid-request kills the process with nothing in the
// terminal but the default stack — and from the frontend it appears only as
// a gateway 502, since Kong sees the connection drop rather than a reply.
process.on('uncaughtException', (error) => {
  console.error(`✗ [${SERVICE_NAME}] uncaught exception — exiting:`, error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(`✗ [${SERVICE_NAME}] unhandled promise rejection:`, reason);
});

async function isDatabaseHealthy(): Promise<boolean> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('health check timeout')), 3000)
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

const app = createApp();
registerHealthEndpoints(
  app,
  SERVICE_NAME,
  GATEWAY_HEALTH_PATH,
  isDatabaseHealthy
);

app.listen(config.port, () => {
  console.log(
    `appointment-service listening on http://localhost:${config.port}`
  );
});
