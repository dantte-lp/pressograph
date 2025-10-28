// ═══════════════════════════════════════════════════════════════════
// Server Entry Point
// ═══════════════════════════════════════════════════════════════════

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { swaggerSpec } from './config/swagger';

// Routes
import authRoutes from './routes/auth.routes';
import graphRoutes from './routes/graph.routes';
import adminRoutes from './routes/admin.routes';
import setupRoutes from './routes/setup.routes';
import publicRoutes from './routes/public.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

// ═══════════════════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════════════════

// Security
app.use(helmet());

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// ═══════════════════════════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════════════════════════

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns the health status of the API
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                   example: 86400
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: '2025-10-28T12:00:00.000Z'
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Swagger UI - Interactive API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Pressograph API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
  explorer: true,
}));

// OpenAPI JSON spec
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

logger.info('📚 Swagger UI available at /api-docs');
logger.info('📄 OpenAPI spec available at /api-docs.json');

// API Routes
app.use('/api/v1/setup', setupRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/graph', graphRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/public', publicRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// ═══════════════════════════════════════════════════════════════════
// Server Initialization
// ═══════════════════════════════════════════════════════════════════

const server = createServer(app);

server.listen(PORT, () => {
  logger.info(`🚀 Server running at http://${HOST}:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
