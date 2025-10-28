// ═══════════════════════════════════════════════════════════════════
// Swagger/OpenAPI Configuration
// Automatically generates OpenAPI spec from JSDoc comments
// ═══════════════════════════════════════════════════════════════════

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Pressograph API',
      version: '1.0.0',
      description: `
REST API for Pressograph - Pressure Test Visualization Platform

## Features
- Graph generation from pressure test data
- PNG/PDF export capabilities
- Public shareable links with access control
- User authentication with JWT
- Admin dashboard and analytics

## Authentication
Most endpoints require JWT authentication. Include the access token in the Authorization header:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`
      `,
      contact: {
        name: 'API Support',
        url: 'https://github.com/dantte-lp/pressograph',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.pressograph.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from /auth/login or /auth/refresh',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            username: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'viewer'],
            },
            is_active: {
              type: 'boolean',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            last_login: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            message: {
              type: 'string',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
            accessToken: {
              type: 'string',
            },
            refreshToken: {
              type: 'string',
            },
          },
        },
        GraphSettings: {
          type: 'object',
          required: ['testNumber', 'startDate', 'startTime', 'testDuration', 'workingPressure'],
          properties: {
            testNumber: {
              type: 'string',
              description: 'Unique test identifier',
              example: 'TEST-2025-001',
            },
            startDate: {
              type: 'string',
              format: 'date',
              description: 'Test start date (ISO 8601)',
              example: '2025-10-27',
            },
            startTime: {
              type: 'string',
              description: 'Test start time',
              example: '09:00',
            },
            testDuration: {
              type: 'number',
              description: 'Total test duration in hours',
              example: 24,
            },
            workingPressure: {
              type: 'number',
              description: 'Working pressure in MPa',
              example: 30,
            },
            pressureTests: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/PressureTest',
              },
            },
            showInfo: {
              type: 'string',
              enum: ['all', 'basic', 'none'],
              default: 'all',
            },
            language: {
              type: 'string',
              enum: ['ru', 'en'],
              default: 'ru',
            },
          },
        },
        PressureTest: {
          type: 'object',
          required: ['id', 'time', 'duration'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique test ID',
            },
            time: {
              type: 'number',
              description: 'Time from start in hours',
              example: 0,
            },
            duration: {
              type: 'number',
              description: 'Test duration in minutes',
              example: 30,
            },
            pressure: {
              type: 'number',
              description: 'Test pressure in MPa',
              example: 30,
            },
            minPressure: {
              type: 'number',
              description: 'Minimum pressure during hold',
            },
            maxPressure: {
              type: 'number',
              description: 'Maximum pressure during hold',
            },
            targetPressure: {
              type: 'number',
              description: 'Target pressure after drop',
            },
            holdDrift: {
              type: 'number',
              description: 'Pressure drift during hold',
            },
          },
        },
        ShareLink: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            token: {
              type: 'string',
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'Full public URL',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            maxViews: {
              type: 'integer',
              nullable: true,
            },
            allowDownload: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Setup',
        description: 'Initial installation and configuration',
      },
      {
        name: 'Authentication',
        description: 'User authentication and token management',
      },
      {
        name: 'Graphs',
        description: 'Graph generation and management',
      },
      {
        name: 'Public',
        description: 'Public access endpoints (no auth required)',
      },
      {
        name: 'Admin',
        description: 'Administrative functions',
      },
    ],
  },
  // Path to the API routes with JSDoc comments
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/index.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
