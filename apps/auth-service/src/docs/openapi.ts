export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Mindora Auth Service API',
    version: '1.0.0',
    description:
      'Handles user registration, login, session management (access + refresh tokens), ' +
      'password reset, and Google OAuth for the Mindora V3 platform. Issues the JWTs ' +
      'that every other service validates via the shared `@mindora/auth-middleware` package.',
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Local development (direct)' },
    {
      url: 'http://localhost:8000/api/v1/auth',
      description: 'Via Kong gateway (local)',
    },
    {
      url: 'https://api.mindora.rw/api/v1/auth',
      description: 'Via Kong gateway (production)',
    },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Registration & Login' },
    { name: 'Session' },
    { name: 'Password Reset' },
    { name: 'OAuth' },
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
        properties: {
          message: { type: 'string' },
        },
      },
      ValidationError: {
        type: 'object',
        required: ['message', 'errors'],
        properties: {
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
      HealthResponse: {
        type: 'object',
        required: ['status', 'service'],
        properties: {
          status: { type: 'string', example: 'ok' },
          service: { type: 'string', example: 'auth-service' },
        },
      },
      UserRole: {
        type: 'string',
        enum: ['PATIENT', 'THERAPIST', 'ADMIN'],
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'role', 'userName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: {
            type: 'string',
            minLength: 8,
            maxLength: 128,
            description: 'Hashed with argon2 before storage.',
          },
          role: { $ref: '#/components/schemas/UserRole' },
          userName: { type: 'string', minLength: 2, maxLength: 100 },
        },
      },
      RegisterResponse: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', format: 'uuid' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
      },
      AccessTokenResponse: {
        type: 'object',
        required: ['accessToken'],
        properties: {
          accessToken: {
            type: 'string',
            description: 'Short-lived (15m) JWT, signed with JWT_SECRET.',
          },
        },
      },
      MeResponse: {
        type: 'object',
        required: ['userId', 'email', 'role'],
        properties: {
          userId: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          role: { $ref: '#/components/schemas/UserRole' },
        },
      },
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: { type: 'string' },
          newPassword: { type: 'string', minLength: 8, maxLength: 128 },
        },
      },
      MessageResponse: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string' },
        },
      },
      OAuthCallbackResponse: {
        type: 'object',
        required: ['accessToken', 'userId', 'email', 'role'],
        properties: {
          accessToken: { type: 'string' },
          userId: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          role: { $ref: '#/components/schemas/UserRole' },
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
      ValidationError: {
        description: 'Request body failed validation',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ValidationError' },
          },
        },
      },
      RateLimited: {
        description: 'Too many requests',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorMessage' },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Service health check',
        description: 'Liveness check. No authentication required.',
        security: [],
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/health': {
      get: {
        tags: ['Health'],
        summary: 'Service health check (Kong gateway path)',
        description:
          'Same response as GET /health. Kong forwards this path unchanged ' +
          '(strip_path: false) rather than stripping to /health, so both paths ' +
          'exist and return identical output.',
        security: [],
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/register': {
      post: {
        tags: ['Registration & Login'],
        summary: 'Register a new user',
        description:
          'Creates a new user account with an argon2-hashed password. On success, ' +
          'publishes a `user.registered` event to RabbitMQ (queue `mindora.auth`) so ' +
          'User Service can provision a patient/therapist profile — this is fire-and-forget; ' +
          'a RabbitMQ outage does not fail the registration request.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '409': {
            description: 'Email already registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorMessage' },
                example: { message: 'Email already exists' },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/login': {
      post: {
        tags: ['Registration & Login'],
        summary: 'Log in with email and password',
        description:
          'Verifies credentials and issues a short-lived access token plus a ' +
          'long-lived refresh token, delivered as an httpOnly `refreshToken` cookie ' +
          '(7 days, SameSite=Lax). The access token is returned in the response body only.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AccessTokenResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': {
            description: 'Invalid email or password',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorMessage' },
                example: { message: 'Invalid credentials' },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/logout': {
      post: {
        tags: ['Session'],
        summary: 'Log out the current session',
        description:
          "Requires a valid access token. Blacklists the current access token's JWT ID " +
          '(via Redis, TTL matching its remaining lifetime) and revokes the associated ' +
          'refresh token, then clears the refresh cookie. Still returns 200 and clears the ' +
          'cookie even if the access token has already expired.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Logged out',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { message: 'Logged out' },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/refresh': {
      post: {
        tags: ['Session'],
        summary: 'Exchange a refresh token for a new access token',
        description:
          'Reads the httpOnly `refreshToken` cookie (not a request body or bearer header) ' +
          'and, if it is valid, unrevoked, and unexpired, rotates it: issues a new refresh ' +
          'token (replacing the old one, which is marked revoked and linked via ' +
          '`replacedByTokenId`), sets the new cookie, and returns a new access token. ' +
          'This endpoint is public — no access token is required, since its entire purpose ' +
          'is to issue a new one.',
        security: [],
        responses: {
          '200': {
            description: 'New access token issued',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AccessTokenResponse' },
              },
            },
          },
          '401': {
            description:
              'Missing, invalid, expired, or already-revoked refresh token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorMessage' },
                example: { message: 'Unauthorized' },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/forgot-password': {
      post: {
        tags: ['Password Reset'],
        summary: 'Request a password reset link',
        description:
          'Always returns 200 with the same message regardless of whether the email ' +
          'exists, to avoid leaking which addresses are registered. If the email does ' +
          'match a user, a reset token is generated and stored in Redis; in this ' +
          'environment the reset URL is logged to the console rather than emailed.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Request accepted (does not confirm the email exists)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: {
                  message: 'If that email exists, a reset link has been sent.',
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/reset-password': {
      post: {
        tags: ['Password Reset'],
        summary: 'Reset password using a reset token',
        description:
          'Consumes the token issued by POST /forgot-password. Revokes all of the ' +
          "user's existing refresh tokens on success, forcing re-login on every device.",
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { message: 'Password updated successfully' },
              },
            },
          },
          '400': {
            description: 'Validation error, or invalid/expired reset token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorMessage' },
              },
            },
          },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/me': {
      get: {
        tags: ['Session'],
        summary: 'Get the current authenticated user',
        description:
          'Returns identity claims decoded directly from the presented JWT.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MeResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/oauth/google': {
      get: {
        tags: ['OAuth'],
        summary: 'Start Google OAuth login',
        description:
          "Redirects the browser to Google's consent screen. Not usable directly from " +
          'Swagger UI\'s "Try it out" (it is a redirect flow, not a JSON API call).',
        security: [],
        responses: {
          '302': { description: "Redirect to Google's OAuth consent screen" },
          '503': {
            description: 'Google OAuth is not configured on this deployment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorMessage' },
              },
            },
          },
        },
      },
    },
    '/oauth/google/callback': {
      get: {
        tags: ['OAuth'],
        summary: 'Google OAuth callback',
        description:
          'Google redirects here after the user grants consent. Issues an access token ' +
          'and sets the refresh cookie, same as POST /login. Called by Google, not by ' +
          'API clients directly.',
        security: [],
        responses: {
          '200': {
            description: 'OAuth login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OAuthCallbackResponse' },
              },
            },
          },
          '401': {
            description: 'OAuth authentication failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorMessage' },
                example: { message: 'OAuth authentication failed' },
              },
            },
          },
          '503': {
            description: 'Google OAuth is not configured on this deployment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorMessage' },
              },
            },
          },
        },
      },
    },
  },
};
