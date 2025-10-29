/**
 * ═══════════════════════════════════════════════════════════════════
 * Backend Metrics Integration Example (Node.js + Express)
 * ═══════════════════════════════════════════════════════════════════
 *
 * Этот файл показывает как интегрировать экспорт метрик в Backend
 * используя библиотеку prom-client (Prometheus client)
 *
 * Установка:
 *   npm install prom-client
 *
 * Использование:
 *   1. Скопируйте этот файл в server/monitoring/metrics.js
 *   2. Создайте middleware.js (см. middleware-example.js)
 *   3. Добавьте в app.js (см. ниже)
 * ═══════════════════════════════════════════════════════════════════
 */

const promClient = require('prom-client');

// ═══════════════════════════════════════════════════════════════════
// Registry - хранилище метрик
// ═══════════════════════════════════════════════════════════════════
const register = new promClient.Registry();

// ═══════════════════════════════════════════════════════════════════
// Default Metrics (CPU, Memory, Event Loop, GC)
// ═══════════════════════════════════════════════════════════════════
// Автоматически собирает стандартные Node.js метрики
promClient.collectDefaultMetrics({
  register,
  prefix: 'pressograph_nodejs_',
  labels: {
    service: 'pressograph-backend',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.VERSION || '1.0.0'
  },
  // Собирать каждые 10 секунд
  timeout: 10000
});

// ═══════════════════════════════════════════════════════════════════
// Custom Application Metrics
// ═══════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────
// HTTP Request Duration (Histogram)
// ───────────────────────────────────────────────────────────────────
// Измеряет длительность HTTP запросов
const httpRequestDuration = new promClient.Histogram({
  name: 'pressograph_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  // Buckets (в секундах): 1ms, 10ms, 50ms, 100ms, 500ms, 1s, 5s, 10s
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 5, 10]
});
register.registerMetric(httpRequestDuration);

// ───────────────────────────────────────────────────────────────────
// HTTP Request Total (Counter)
// ───────────────────────────────────────────────────────────────────
// Считает общее количество HTTP запросов
const httpRequestTotal = new promClient.Counter({
  name: 'pressograph_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestTotal);

// ───────────────────────────────────────────────────────────────────
// HTTP Request Size (Summary)
// ───────────────────────────────────────────────────────────────────
// Измеряет размер HTTP request body
const httpRequestSize = new promClient.Summary({
  name: 'pressograph_http_request_size_bytes',
  help: 'Size of HTTP request body in bytes',
  labelNames: ['method', 'route'],
  percentiles: [0.5, 0.9, 0.99]
});
register.registerMetric(httpRequestSize);

// ───────────────────────────────────────────────────────────────────
// HTTP Response Size (Summary)
// ───────────────────────────────────────────────────────────────────
// Измеряет размер HTTP response body
const httpResponseSize = new promClient.Summary({
  name: 'pressograph_http_response_size_bytes',
  help: 'Size of HTTP response body in bytes',
  labelNames: ['method', 'route', 'status_code'],
  percentiles: [0.5, 0.9, 0.99]
});
register.registerMetric(httpResponseSize);

// ───────────────────────────────────────────────────────────────────
// Active Connections (Gauge)
// ───────────────────────────────────────────────────────────────────
// Текущее количество активных соединений
const activeConnections = new promClient.Gauge({
  name: 'pressograph_active_connections',
  help: 'Number of active HTTP connections'
});
register.registerMetric(activeConnections);

// ───────────────────────────────────────────────────────────────────
// Database Query Duration (Histogram)
// ───────────────────────────────────────────────────────────────────
// Длительность SQL запросов к PostgreSQL
const dbQueryDuration = new promClient.Histogram({
  name: 'pressograph_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
});
register.registerMetric(dbQueryDuration);

// ───────────────────────────────────────────────────────────────────
// Database Query Total (Counter)
// ───────────────────────────────────────────────────────────────────
// Общее количество SQL запросов
const dbQueryTotal = new promClient.Counter({
  name: 'pressograph_db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status']
});
register.registerMetric(dbQueryTotal);

// ───────────────────────────────────────────────────────────────────
// Database Connection Pool (Gauge)
// ───────────────────────────────────────────────────────────────────
// Метрики connection pool (если используете pg pool)
const dbPoolSize = new promClient.Gauge({
  name: 'pressograph_db_pool_size',
  help: 'Current size of database connection pool',
  labelNames: ['state']  // active, idle, waiting
});
register.registerMetric(dbPoolSize);

// ───────────────────────────────────────────────────────────────────
// Authentication Attempts (Counter)
// ───────────────────────────────────────────────────────────────────
// Попытки аутентификации (успешные/неуспешные)
const authAttempts = new promClient.Counter({
  name: 'pressograph_auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['result']  // success, failure
});
register.registerMetric(authAttempts);

// ───────────────────────────────────────────────────────────────────
// Business Metrics (Examples)
// ───────────────────────────────────────────────────────────────────

// Общее количество users
const usersTotal = new promClient.Gauge({
  name: 'pressograph_users_total',
  help: 'Total number of registered users'
});
register.registerMetric(usersTotal);

// Количество активных sessions
const activeSessions = new promClient.Gauge({
  name: 'pressograph_active_sessions',
  help: 'Number of active user sessions'
});
register.registerMetric(activeSessions);

// ───────────────────────────────────────────────────────────────────
// Error Metrics
// ───────────────────────────────────────────────────────────────────
const errors = new promClient.Counter({
  name: 'pressograph_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'route']  // validation, database, network, etc.
});
register.registerMetric(errors);

// ═══════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Инструментация database query
 *
 * @param {string} operation - SELECT, INSERT, UPDATE, DELETE
 * @param {string} table - название таблицы
 * @param {Function} queryFn - функция выполняющая query
 * @returns {Promise<any>} - результат query
 */
async function instrumentDatabaseQuery(operation, table, queryFn) {
  const start = Date.now();
  let status = 'success';

  try {
    const result = await queryFn();
    return result;
  } catch (error) {
    status = 'error';
    throw error;
  } finally {
    const duration = (Date.now() - start) / 1000;

    // Record metrics
    dbQueryDuration.observe({ operation, table, status }, duration);
    dbQueryTotal.inc({ operation, table, status });
  }
}

/**
 * Обновить метрики connection pool (для pg)
 *
 * @param {Object} pool - pg Pool instance
 */
function updateDatabasePoolMetrics(pool) {
  if (!pool) return;

  dbPoolSize.set({ state: 'total' }, pool.totalCount || 0);
  dbPoolSize.set({ state: 'idle' }, pool.idleCount || 0);
  dbPoolSize.set({ state: 'waiting' }, pool.waitingCount || 0);
}

/**
 * Обновить business metrics (вызывать периодически)
 *
 * @param {Object} db - database connection
 */
async function updateBusinessMetrics(db) {
  try {
    // Пример: подсчет users
    const result = await db.query('SELECT COUNT(*) as count FROM users');
    usersTotal.set(parseInt(result.rows[0].count));

    // Пример: active sessions
    const sessionsResult = await db.query(
      'SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()'
    );
    activeSessions.set(parseInt(sessionsResult.rows[0].count));
  } catch (error) {
    console.error('Error updating business metrics:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════
module.exports = {
  // Registry
  register,

  // HTTP Metrics
  httpRequestDuration,
  httpRequestTotal,
  httpRequestSize,
  httpResponseSize,
  activeConnections,

  // Database Metrics
  dbQueryDuration,
  dbQueryTotal,
  dbPoolSize,

  // Auth Metrics
  authAttempts,

  // Business Metrics
  usersTotal,
  activeSessions,

  // Error Metrics
  errors,

  // Helper Functions
  instrumentDatabaseQuery,
  updateDatabasePoolMetrics,
  updateBusinessMetrics
};

// ═══════════════════════════════════════════════════════════════════
// USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════════

/*
// ───────────────────────────────────────────────────────────────────
// В app.js или index.js
// ───────────────────────────────────────────────────────────────────
const express = require('express');
const { register } = require('./monitoring/metrics');
const metricsMiddleware = require('./monitoring/middleware');

const app = express();

// Apply metrics middleware ПЕРЕД всеми routes
app.use(metricsMiddleware);

// Your routes...
app.get('/api/users', async (req, res) => {
  // ...
});

// Metrics endpoint для Prometheus/VictoriaMetrics
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// ───────────────────────────────────────────────────────────────────
// Инструментация database queries
// ───────────────────────────────────────────────────────────────────
const { instrumentDatabaseQuery } = require('./monitoring/metrics');

// Wrapper для pg query
async function queryWithMetrics(operation, table, query, params) {
  return instrumentDatabaseQuery(operation, table, async () => {
    return db.query(query, params);
  });
}

// Usage:
const users = await queryWithMetrics(
  'SELECT',
  'users',
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// ───────────────────────────────────────────────────────────────────
// Authentication metrics
// ───────────────────────────────────────────────────────────────────
const { authAttempts } = require('./monitoring/metrics');

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await authenticateUser(req.body);
    authAttempts.inc({ result: 'success' });
    res.json({ user });
  } catch (error) {
    authAttempts.inc({ result: 'failure' });
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// ───────────────────────────────────────────────────────────────────
// Business metrics (периодическое обновление)
// ───────────────────────────────────────────────────────────────────
const { updateBusinessMetrics, updateDatabasePoolMetrics } = require('./monitoring/metrics');

// Обновлять каждые 60 секунд
setInterval(async () => {
  await updateBusinessMetrics(db);
  updateDatabasePoolMetrics(pool);
}, 60000);

// ───────────────────────────────────────────────────────────────────
// Error tracking
// ───────────────────────────────────────────────────────────────────
const { errors } = require('./monitoring/metrics');

app.use((err, req, res, next) => {
  errors.inc({
    type: err.name || 'UnknownError',
    route: req.route?.path || req.path
  });

  // Your error handler...
  res.status(500).json({ error: 'Internal server error' });
});
*/

// ═══════════════════════════════════════════════════════════════════
// NOTES
// ═══════════════════════════════════════════════════════════════════
/*
1. Metric Types:
   - Counter: монотонно возрастает (requests, errors)
   - Gauge: может увеличиваться/уменьшаться (connections, memory)
   - Histogram: распределение значений (duration, size)
   - Summary: аналог histogram но с percentiles

2. Labels:
   - Добавляйте labels для фильтрации (method, route, status)
   - НЕ используйте high-cardinality labels (userId, traceId)
   - Оптимальное количество: 3-5 labels

3. Naming Convention:
   - prefix_subsystem_name_unit
   - Примеры: pressograph_http_requests_total, pressograph_db_query_duration_seconds

4. Performance:
   - Default metrics собираются в background
   - Metrics endpoint быстрый (< 10ms)
   - Не влияет на latency приложения

5. Visualization:
   - Используйте Grafana для dashboards
   - Histogram → heatmaps, percentiles
   - Counter → rate(), increase()
   - Gauge → current value, trends
*/
