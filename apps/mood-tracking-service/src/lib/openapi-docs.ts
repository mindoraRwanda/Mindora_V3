import type { Application, NextFunction, Request, Response } from 'express';
import { readFileSync } from 'node:fs';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';

/**
 * Serves OpenAPI for frontend tooling (codegen, Postman) and interactive Swagger UI.
 */
export function registerOpenApiDocs(
  app: Application,
  openApiPath: string
): void {
  const specYaml = readFileSync(openApiPath, 'utf8');
  const spec = yaml.parse(specYaml) as Record<string, unknown>;

  const withCors = (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  };

  app.get('/openapi.json', withCors, (_req, res) => {
    res.json(spec);
  });

  app.get('/openapi.yaml', withCors, (_req, res) => {
    res.type('text/yaml').send(specYaml);
  });

  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle:
        (spec.info as { title?: string } | undefined)?.title ?? 'API Docs',
      swaggerOptions: {
        url: '/openapi.json',
      },
    })
  );
}
