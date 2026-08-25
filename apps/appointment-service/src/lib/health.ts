import type { Application, Request, Response } from 'express';

/**
 * Registers /health and the gateway-facing health path.
 *
 * `checkHealth`, when passed, is awaited on every request — a bare 200
 * can't tell an operator "up but the database is gone" from "actually
 * fine", which is what DEPLOYMENT.md's verification curls and any
 * orchestrator liveness probe actually rely on. Omit it only for a service
 * with no dependency worth checking.
 */
export function registerHealthEndpoints(
  app: Application,
  serviceName: string,
  gatewayHealthPath: string,
  checkHealth?: () => Promise<boolean>
): void {
  const healthResponse = (healthy: boolean) => ({
    status: healthy ? 'ok' : 'error',
    service: serviceName,
  });

  const handler = async (_req: Request, res: Response) => {
    const healthy = checkHealth ? await checkHealth() : true;
    res.status(healthy ? 200 : 503).json(healthResponse(healthy));
  };

  app.get('/health', handler);
  app.get(gatewayHealthPath, handler);
}
