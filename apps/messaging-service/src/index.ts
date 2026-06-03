import express from 'express';

const SERVICE_NAME = 'messaging-service';
const PORT = Number(process.env.PORT) || 3006;
const GATEWAY_HEALTH_PATH = '/api/v1/messaging/health';

const app = express();

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

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} listening on http://localhost:${PORT}`);
});
