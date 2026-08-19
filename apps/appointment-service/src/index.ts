import './env.js'; // must be first — loads .env before any module reads process.env
import { createApp } from './app.js';
import { config } from './config.js';
import { registerHealthEndpoints } from './lib/health.js';

const SERVICE_NAME = 'appointment-service';
const GATEWAY_HEALTH_PATH = '/api/v1/appointments/health';

const app = createApp();
registerHealthEndpoints(app, SERVICE_NAME, GATEWAY_HEALTH_PATH);

app.listen(config.port, () => {
  console.log(
    `appointment-service listening on http://localhost:${config.port}`
  );
});
