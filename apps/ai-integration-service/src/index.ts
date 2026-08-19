import './env.js'; // must be first — loads .env before any module reads process.env
import http from 'http';
import app from './app.js';
import { connectDatabase } from './database.js';
import { startCrisisAlertSweeper } from './lib/crisis-alerts.js';

const SERVICE_NAME = 'ai-integration-service';
const PORT = Number(process.env.AI_SERVICE_PORT) || 3007;

async function start(): Promise<void> {
  try {
    await connectDatabase();

    // Retries crisis alerts that could not be delivered to the clinician
    // queue when they were raised (typically a RabbitMQ outage). Without it,
    // an alert recorded during downtime would never reach anyone.
    startCrisisAlertSweeper();

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
