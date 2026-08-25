import './env.js'; // must be first — loads .env before any module reads process.env
import { createApp } from './app.js';
import { config } from './config.js';
import { startUserRegisteredConsumer } from './lib/user-registered-consumer.js';

// Without these, a crash mid-request kills the process with nothing in the
// terminal but the default stack — and from the frontend it appears only as
// a gateway 502, since Kong sees the connection drop rather than a reply.
process.on('uncaughtException', (error) => {
  console.error('✗ [user-service] uncaught exception — exiting:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('✗ [user-service] unhandled promise rejection:', reason);
});

const app = createApp();
app.listen(config.port, () => {
  console.log(`user-service listening on http://localhost:${config.port}`);
});

// Profile creation is eventually consistent — don't let a RabbitMQ outage
// block the HTTP server from starting.
startUserRegisteredConsumer().catch((error) => {
  console.error(
    '[user-service] Failed to start user.registered consumer:',
    error
  );
});
