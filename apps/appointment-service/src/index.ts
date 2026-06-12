import express from 'express';

const SERVICE_NAME = 'appointment-service';
const PORT = Number(process.env.PORT) || 3003;
const GATEWAY_HEALTH_PATH = '/api/v1/appointments/health';

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
