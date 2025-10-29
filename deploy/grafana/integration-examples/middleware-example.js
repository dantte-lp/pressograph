/**
 * ═══════════════════════════════════════════════════════════════════
 * Metrics Middleware для автоматического сбора HTTP метрик
 * ═══════════════════════════════════════════════════════════════════
 *
 * Автоматически собирает метрики для всех HTTP requests:
 * - Duration (длительность запроса)
 * - Total requests (общее количество)
 * - Request/Response size
 * - Active connections
 *
 * Использование:
 *   app.use(metricsMiddleware);
 * ═══════════════════════════════════════════════════════════════════
 */

const {
  httpRequestDuration,
  httpRequestTotal,
  httpRequestSize,
  httpResponseSize,
  activeConnections
} = require('./metrics');

/**
 * Express middleware для сбора HTTP метрик
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
function metricsMiddleware(req, res, next) {
  // ═══════════════════════════════════════════════════════════════
  // Setup
  // ═══════════════════════════════════════════════════════════════
  const start = process.hrtime.bigint();  // High-resolution timer

  // Increment active connections
  activeConnections.inc();

  // Extract route (без ID параметров для low cardinality)
  const getRoute = () => {
    if (req.route) {
      return req.route.path;
    }
    // Fallback: normalize path (заменить ID на :id)
    return req.path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9]{24}/g, '/:id')  // MongoDB ObjectID
      .replace(/\/[a-f0-9-]{36}/g, '/:id'); // UUID
  };

  // Request size (в байтах)
  const requestSize = parseInt(req.headers['content-length'] || '0', 10);

  // ═══════════════════════════════════════════════════════════════
  // Override res.end для захвата метрик после завершения response
  // ═══════════════════════════════════════════════════════════════
  const originalEnd = res.end;

  res.end = function(chunk, encoding, ...args) {
    // Call original res.end
    originalEnd.call(this, chunk, encoding, ...args);

    // ───────────────────────────────────────────────────────────
    // Calculate metrics
    // ───────────────────────────────────────────────────────────
    const duration = Number(process.hrtime.bigint() - start) / 1e9;  // seconds
    const route = getRoute();
    const method = req.method;
    const statusCode = res.statusCode;

    // Response size (в байтах)
    let responseSize = 0;
    if (chunk) {
      if (Buffer.isBuffer(chunk)) {
        responseSize = chunk.length;
      } else if (typeof chunk === 'string') {
        responseSize = Buffer.byteLength(chunk, encoding);
      }
    }

    // ───────────────────────────────────────────────────────────
    // Record metrics
    // ───────────────────────────────────────────────────────────

    // Duration histogram
    httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode
      },
      duration
    );

    // Total requests counter
    httpRequestTotal.inc({
      method,
      route,
      status_code: statusCode
    });

    // Request size
    if (requestSize > 0) {
      httpRequestSize.observe({ method, route }, requestSize);
    }

    // Response size
    if (responseSize > 0) {
      httpResponseSize.observe(
        { method, route, status_code: statusCode },
        responseSize
      );
    }

    // Decrement active connections
    activeConnections.dec();

    // ───────────────────────────────────────────────────────────
    // Optional: Log slow requests (> 1s)
    // ───────────────────────────────────────────────────────────
    if (duration > 1.0) {
      console.warn(`[SLOW] ${method} ${route} - ${duration.toFixed(3)}s - ${statusCode}`);
    }
  };

  next();
}

// ═══════════════════════════════════════════════════════════════════
// Advanced: Metrics Middleware с skip patterns
// ═══════════════════════════════════════════════════════════════════

/**
 * Создает middleware с возможностью skip определенных путей
 *
 * @param {Object} options - Configuration options
 * @param {Array<string|RegExp>} options.skip - Paths to skip (например, /health, /metrics)
 * @returns {Function} Express middleware
 */
function createMetricsMiddleware(options = {}) {
  const { skip = [] } = options;

  return function(req, res, next) {
    // Check if path should be skipped
    const shouldSkip = skip.some(pattern => {
      if (typeof pattern === 'string') {
        return req.path === pattern;
      } else if (pattern instanceof RegExp) {
        return pattern.test(req.path);
      }
      return false;
    });

    // Skip metrics collection для определенных endpoints
    if (shouldSkip) {
      return next();
    }

    // Apply metrics middleware
    return metricsMiddleware(req, res, next);
  };
}

// ═══════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════
module.exports = metricsMiddleware;
module.exports.createMetricsMiddleware = createMetricsMiddleware;

// ═══════════════════════════════════════════════════════════════════
// USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════════

/*
// ───────────────────────────────────────────────────────────────────
// Basic Usage
// ───────────────────────────────────────────────────────────────────
const express = require('express');
const metricsMiddleware = require('./monitoring/middleware');

const app = express();

// Apply BEFORE routes
app.use(metricsMiddleware);

// Your routes...
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

// ───────────────────────────────────────────────────────────────────
// Advanced Usage (с skip patterns)
// ───────────────────────────────────────────────────────────────────
const { createMetricsMiddleware } = require('./monitoring/middleware');

// Skip /metrics и /health endpoints
app.use(createMetricsMiddleware({
  skip: [
    '/metrics',
    '/health',
    /^\/static\//,  // Skip /static/* paths
  ]
}));

// ───────────────────────────────────────────────────────────────────
// С другими middleware (порядок важен!)
// ───────────────────────────────────────────────────────────────────
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const metricsMiddleware = require('./monitoring/middleware');

const app = express();

// Security & CORS middleware ПЕРВЫМИ
app.use(helmet());
app.use(cors());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics middleware ПОСЛЕ body parsers (для accurate request size)
app.use(metricsMiddleware);

// Routes
app.use('/api', apiRoutes);

// ───────────────────────────────────────────────────────────────────
// Custom error handler с metrics
// ───────────────────────────────────────────────────────────────────
const { errors } = require('./monitoring/metrics');

app.use((err, req, res, next) => {
  // Increment error counter
  errors.inc({
    type: err.name || 'UnknownError',
    route: req.route?.path || req.path
  });

  // Log error
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // Send response
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});
*/

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE NOTES
// ═══════════════════════════════════════════════════════════════════
/*
1. Overhead:
   - Middleware добавляет ~0.1-0.5ms latency
   - Negligible для большинства API (< 0.5% overhead)
   - process.hrtime.bigint() очень быстрый (nanosecond precision)

2. Memory:
   - Metrics хранятся в памяти (prom-client)
   - ~100 bytes на unique metric label combination
   - Low cardinality labels критично!

3. Route Normalization:
   - ID параметры заменяются на :id
   - Предотвращает high cardinality (миллионы unique routes)
   - Важно для performance VictoriaMetrics

4. Skip Patterns:
   - Используйте для /metrics, /health endpoints
   - Избегайте рекурсивного сбора метрик о самих метриках

5. Best Practices:
   - НЕ собирайте метрики для static assets (/static/*, /images/*)
   - НЕ добавляйте userId/traceId в labels (high cardinality)
   - Используйте route normalization (/:id вместо /123)
   - Metrics endpoint должен быть быстрым (< 10ms)
*/
