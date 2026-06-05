import express from 'express';
import { connectDatabase } from './database';
import { CommunityGroup } from './models'
import router from './routes/community.routes'
import 'dotenv/config'

const SERVICE_NAME = 'community-service';
const PORT = 3005;
const GATEWAY_HEALTH_PATH = '/api/v1/community/health';

const app = express();

app.use(express.json())

// Mount community routes
app.use('/api/v1/community', router)

const healthResponse = () => ({
  status: 'ok',
  service: SERVICE_NAME,
});

app.get('/health', (_req, res) => {
  res.status(200).json(healthResponse());
});

app.get(GATEWAY_HEALTH_PATH, (_req, res) => {
  res.status(200).json(healthResponse());
});

const start = async () => {
  await connectDatabase()
  app.listen(PORT, () => {
    console.log(`Community Service running on port ${PORT}`)
  })
  
}

start()

export default app
