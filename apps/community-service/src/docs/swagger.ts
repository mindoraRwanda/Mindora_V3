import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mindora Community Service',
      version: '1.0.0',
      description: 'API documentation for the Mindora Community Service. Handles community groups, posts, comments, and moderation.'
    },
    servers: [
      {
        url: 'http://localhost:3005',
        description: 'Local development'
      },
      {
        url: 'http://localhost:8000',
        description: 'Via Kong Gateway'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your JWT access token here. Get one from POST /api/v1/auth/login'
        }
      },
      schemas: {
        CommunityGroup: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            name: { type: 'string', example: 'Anxiety Support Circle' },
            description: { type: 'string', example: 'A safe space for people managing anxiety' },
            category: {
              type: 'string',
              enum: ['ANXIETY', 'DEPRESSION', 'GRIEF', 'RELATIONSHIPS', 'STRESS', 'ADDICTION', 'GENERAL']
            },
            isAnonymous: { type: 'boolean', example: false },
            memberCount: { type: 'number', example: 0 },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Post: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d2' },
            communityId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            content: { type: 'string', example: 'Breathing exercises have helped me a lot.' },
            isAnonymous: { type: 'boolean', example: false },
            author: {
              nullable: true,
              type: 'object',
              properties: {
                userId: { type: 'string' }
              }
            },
            reactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['LIKE', 'HEART', 'SUPPORT'] },
                  count: { type: 'number' }
                }
              }
            },
            commentCount: { type: 'number', example: 0 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Validation failed' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
}

export const swaggerSpec = swaggerJsdoc(options)