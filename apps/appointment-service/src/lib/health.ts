import type { Application } from 'express';

export function registerHealthEndpoints(
  app: Application,
  serviceName: string,
  gatewayHealthPath: string
): void {
  const healthResponse = () => ({
    status: 'ok',
    service: serviceName,
  });

  app.get('/health', (_req, res) => {
    res.status(200).json(healthResponse());
  });

  app.get(gatewayHealthPath, (_req, res) => {
    res.status(200).json(healthResponse());
  });
}
