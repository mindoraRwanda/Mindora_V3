import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './database.js';

const PORT = process.env.PORT || 3005;

// Without these, a crash mid-request kills the process with nothing in the
// terminal but the default stack — and from the frontend it appears only as
// a gateway 502, since Kong sees the connection drop rather than a reply.
process.on('uncaughtException', (error) => {
  console.error('✗ [community-service] uncaught exception — exiting:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('✗ [community-service] unhandled promise rejection:', reason);
});

const start = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Community Service running on port ${PORT}`);
  });
};

start();
