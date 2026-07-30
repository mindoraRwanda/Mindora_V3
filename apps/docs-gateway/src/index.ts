import express from 'express';
import swaggerUi from 'swagger-ui-express';

const PORT = Number(process.env.DOCS_GATEWAY_PORT) || 3010;

// Only meaningful inside the "bundle" deploy (Dockerfile.bundle + pm2), where
// every service listed here runs as a sibling process in the same container
// on the fixed port ecosystem.config.cjs assigns it — so a plain localhost
// call always reaches it. specPath differs because each service's OpenAPI
// document was mounted independently, at different points in this repo's
// history, at three different paths.
const SERVICES = [
  { key: 'auth', name: 'Auth Service', port: 3001, specPath: '/docs/openapi.json' },
  { key: 'user', name: 'User Service', port: 3002, specPath: '/docs/openapi.json' },
  { key: 'appointments', name: 'Appointment Service', port: 3003, specPath: '/openapi.json' },
  { key: 'mood', name: 'Mood Tracking Service', port: 3004, specPath: '/openapi.json' },
  { key: 'community', name: 'Community Service', port: 3005, specPath: '/docs.json' },
  { key: 'messaging', name: 'Messaging Service', port: 3006, specPath: '/docs.json' },
  { key: 'ai', name: 'AI Integration Service', port: 3007, specPath: '/docs/openapi.json' },
  { key: 'notifications', name: 'Notification Service', port: 3008, specPath: '/docs.json' },
  { key: 'admin', name: 'Admin Service', port: 3009, specPath: '/docs/openapi.json' },
];

const app = express();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Proxied rather than linked directly: the browser only ever talks to this
// gateway's public origin, and each upstream spec is fetched server-side
// over the container's localhost, so the "Try it out" origin, CORS, and
// Railway's public domain all stay consistent for every service.
for (const service of SERVICES) {
  app.get(`/specs/${service.key}.json`, async (_req, res) => {
    try {
      const upstream = await fetch(`http://127.0.0.1:${service.port}${service.specPath}`);
      if (!upstream.ok) {
        throw new Error(`upstream responded with ${upstream.status}`);
      }
      res.type('application/json').send(await upstream.text());
    } catch (err) {
      res.status(502).json({
        message: `${service.name} is unreachable`,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

app.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    customSiteTitle: 'Mindora API Docs',
    swaggerOptions: {
      urls: SERVICES.map((service) => ({ url: `/specs/${service.key}.json`, name: service.name })),
    },
  })
);

app.listen(PORT, () => {
  console.log(`✓ docs-gateway running on http://localhost:${PORT}`);
});
