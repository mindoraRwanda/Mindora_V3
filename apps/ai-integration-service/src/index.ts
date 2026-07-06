import './env.js'; // must be first — loads .env before any module reads process.env
import http from 'http';
import app from './app.js';
import { connectDatabase } from './database.js';

const SERVICE_NAME = 'ai-integration-service';
const PORT = Number(process.env.AI_SERVICE_PORT) || 3007;

async function start(): Promise<void> {
  try {
    await connectDatabase();

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
    console.error('✗ Failed to start service:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

start();
