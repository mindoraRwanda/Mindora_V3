export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Mindora Admin Service API',
    version: '1.0.0',
    description:
      'Platform administration — user management, moderation, analytics, and an immutable ' +
      'audit log. **No real logic is implemented yet** — every route below returns 501 ' +
      'pending subsequent tasks; only routing, auth, and the ADMIN role gate are live today.',
  },
  servers: [
    { url: 'http://localhost:3009', description: 'Local development (direct)' },
    { url: 'http://localhost:8000/api/v1/admin', description: 'Via Kong gateway' },
  ],
  tags: [
    { name: 'Users' },
    { name: 'Moderation' },
    { name: 'Analytics' },
    { name: 'Audit Log' },
    { name: 'Alerts' },
    { name: 'AI Usage' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorMessage: {
        type: 'object',
        required: ['message'],
        properties: { message: { type: 'string' } },
      },
      UserRecord: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['PATIENT', 'THERAPIST', 'ADMIN'] },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      SuspendReactivateBody: {
        type: 'object',
        required: ['reason'],
        properties: { reason: { type: 'string', minLength: 1, maxLength: 500 } },
      },
      SuspendReactivateResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          userId: { type: 'string', format: 'uuid' },
          auditLogId: { type: 'string', format: 'uuid' },
        },
      },
      AuditLogEntry: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          adminId: { type: 'string', format: 'uuid' },
          actionType: { type: 'string', example: 'USER_SUSPENDED' },
          targetId: { type: 'string', nullable: true },
          metadata: { type: 'object', nullable: true, additionalProperties: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid JWT',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorMessage' },
            example: { message: 'Unauthorized' },
          },
        },
      },
      Forbidden: {
        description: 'Authenticated but not an ADMIN',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorMessage' },
            example: { error: 'Admin access required' },
          },
        },
      },
      NotImplemented: {
        description: 'Not implemented yet',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorMessage' },
            example: { message: 'Not implemented yet' },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Users'],
        summary: 'Service health check',
        description: 'Public — no JWT required.',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string', example: 'ok' }, service: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List platform users (ADMIN only)',
        description: 'Proxies through User Service to Auth Service, the source of truth for the users table.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'role', schema: { type: 'string', enum: ['PATIENT', 'THERAPIST', 'ADMIN'] } },
          { in: 'query', name: 'isActive', schema: { type: 'boolean' } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Paginated user list.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: { type: 'array', items: { $ref: '#/components/schemas/UserRecord' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid query parameters', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '503': { description: 'User Service unavailable', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/users/{id}/suspend': {
      put: {
        tags: ['Users'],
        summary: 'Suspend a user account (ADMIN only)',
        description:
          'Blocks the account immediately — an already-issued, still-valid access token stops ' +
          'working on its very next request, not just at its natural expiry (see createVerifyJwt\'s ' +
          'Redis suspension check). Refresh tokens are revoked too. Writes an audit_logs entry ' +
          '(actionType USER_SUSPENDED) only after the downstream suspend actually succeeds.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SuspendReactivateBody' } } },
        },
        responses: {
          '200': {
            description: 'User suspended.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuspendReactivateResponse' } } },
          },
          '400': { description: 'Missing/invalid reason', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
          '503': { description: 'User Service unavailable', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/users/{id}/reactivate': {
      put: {
        tags: ['Users'],
        summary: 'Reactivate a previously suspended user account (ADMIN only)',
        description:
          'Mirrors PUT /users/{id}/suspend exactly — clears the Redis suspension flag so the ' +
          'account can authenticate again, and writes an audit_logs entry (actionType ' +
          'USER_REACTIVATED). Does not restore any refresh tokens revoked at suspension time — ' +
          'the user logs in fresh.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SuspendReactivateBody' } } },
        },
        responses: {
          '200': {
            description: 'User reactivated.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuspendReactivateResponse' } } },
          },
          '400': { description: 'Missing/invalid reason', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
          '503': { description: 'User Service unavailable', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } } },
        },
      },
    },
    '/moderation/queue': {
      get: {
        tags: ['Moderation'],
        summary: 'List pending moderation reports (ADMIN only)',
        security: [{ bearerAuth: [] }],
        responses: {
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '501': { $ref: '#/components/responses/NotImplemented' },
        },
      },
    },
    '/moderation/{id}/resolve': {
      put: {
        tags: ['Moderation'],
        summary: 'Resolve a moderation report (ADMIN only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '501': { $ref: '#/components/responses/NotImplemented' },
        },
      },
    },
    '/moderation/decrypt/{postId}': {
      post: {
        tags: ['Moderation'],
        summary: 'Decrypt an anonymous community post for review (ADMIN only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'postId', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '501': { $ref: '#/components/responses/NotImplemented' },
        },
      },
    },
    '/analytics': {
      get: {
        tags: ['Analytics'],
        summary: 'Platform-wide analytics (ADMIN only)',
        security: [{ bearerAuth: [] }],
        responses: {
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '501': { $ref: '#/components/responses/NotImplemented' },
        },
      },
    },
    '/audit-log': {
      get: {
        tags: ['Audit Log'],
        summary: 'Read the immutable admin action audit log (ADMIN only)',
        description: 'Read-only — there is intentionally no update or delete route for this resource.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'adminId', schema: { type: 'string' }, description: 'Filter to actions taken by this admin.' },
          { in: 'query', name: 'actionType', schema: { type: 'string' }, example: 'USER_SUSPENDED' },
          { in: 'query', name: 'targetId', schema: { type: 'string' }, description: 'Filter to actions targeting this resource id.' },
          { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Paginated audit log entries, newest first.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    auditLogs: { type: 'array', items: { $ref: '#/components/schemas/AuditLogEntry' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid query parameters',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/alerts': {
      get: {
        tags: ['Alerts'],
        summary: 'List system alerts raised from ai.crisis / mood.concern events (ADMIN only)',
        security: [{ bearerAuth: [] }],
        responses: {
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '501': { $ref: '#/components/responses/NotImplemented' },
        },
      },
    },
    '/ai/usage': {
      get: {
        tags: ['AI Usage'],
        summary: 'Proxy AI Integration Service usage report (ADMIN only)',
        security: [{ bearerAuth: [] }],
        responses: {
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '501': { $ref: '#/components/responses/NotImplemented' },
        },
      },
    },
  },
};
