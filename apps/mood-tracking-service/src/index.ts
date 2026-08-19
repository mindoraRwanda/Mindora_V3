import './env.js'; // must be first — loads .env before any module reads process.env
import { createApp } from './app.js';
import { config } from './config.js';
import { registerHealthEndpoints } from './lib/health.js';

const SERVICE_NAME = 'mood-tracking-service';
const GATEWAY_HEALTH_PATH = '/api/v1/mood/health';

const app = createApp();
registerHealthEndpoints(app, SERVICE_NAME, GATEWAY_HEALTH_PATH);

app.listen(config.port, () => {
  console.log(
    `mood-tracking-service listening on http://localhost:${config.port}`
  );
});
