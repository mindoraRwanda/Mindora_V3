import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectDatabase } from './database.js';
import { initializeSocket } from './socket.js';
import { startMessageEventSweeper } from './lib/pending-message-events.js';

const PORT = process.env.PORT || 3006;

// Without these, a crash mid-request kills the process with nothing in the
// terminal but the default stack — and from the frontend it appears only as
// a gateway 502, since Kong sees the connection drop rather than a reply.
process.on('uncaughtException', (error) => {
  console.error('✗ [messaging-service] uncaught exception — exiting:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('✗ [messaging-service] unhandled promise rejection:', reason);
});

const start = async () => {
  try {
    // CRITICAL: Connect to MongoDB BEFORE initializing Socket.io
    // This prevents Mongoose query buffering timeouts
    console.log('⏳ Connecting to MongoDB...');
    await connectDatabase();
    console.log('✓ Database connection established');

    // Retries message.received events that could not be delivered when they
    // were raised (typically a RabbitMQ outage). Without it, an event
    // recorded during downtime would never reach Notification Service.
    startMessageEventSweeper();

    // Create HTTP server from Express app
    const httpServer = http.createServer(app);

    // Attach Socket.io to the HTTP server
    console.log('⏳ Initializing Socket.io...');
    const io = await initializeSocket(httpServer);
    console.log('✓ Socket.io initialized');

    // Store io on app so routes can access it later if needed
    app.set('io', io);

    // Listen on the HTTP server, not the Express app directly
    httpServer.listen(PORT, () => {
      console.log(`✓ Messaging Service running on port ${PORT}`);
    });

    process.on('SIGTERM', () => {
      console.log('⏳ SIGTERM received, closing gracefully...');
      httpServer.close();
    });
    process.on('SIGINT', () => {
      console.log('⏳ SIGINT received, closing gracefully...');
      httpServer.close();
    });
  } catch (error) {
    console.error(
      '✗ Failed to start service:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
};

start();
