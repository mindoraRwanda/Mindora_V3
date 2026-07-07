import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './database.js';

const PORT = process.env.PORT || 3005;

const start = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Community Service running on port ${PORT}`);
  });
};

start();
