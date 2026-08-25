import './env.js'; // must be first — loads .env before any module reads process.env
import http from 'http';
import { createApp } from './app.js';
import { connectDatabase } from './lib/prisma.js';
import { startConsumers } from './consumers.js';

const SERVICE_NAME = 'admin-service';
const PORT = Number(process.env.ADMIN_SERVICE_PORT) || 3009;

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

async function start(): Promise<void> {
  try {
    await connectDatabase();
    await startConsumers();

    const app = createApp();
    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`✓ ${SERVICE_NAME} running on http://localhost:${PORT}`);
    });

    process.on('SIGTERM', () => {
      console.log('⏳ SIGTERM received, closing gracefully...');
      server.close();
    });

    process.on('SIGINT', () => {
      console.log('⏳ SIGINT received, closing gracefully...');
      server.close();
    });
  } catch (error) {
    console.error(
      '✗ Failed to start service:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

start();
