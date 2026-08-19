import './env.js'; // must be first — loads .env before any module reads process.env
import { createApp } from './app.js';
import { config } from './config.js';
import { startUserRegisteredConsumer } from './lib/user-registered-consumer.js';

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
