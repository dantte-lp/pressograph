/**
 * ═══════════════════════════════════════════════════════════════════
 * Structured Logging для интеграции с VictoriaLogs
 * ═══════════════════════════════════════════════════════════════════
 *
 * Structured JSON logging с использованием Pino
 * Логи автоматически парсятся в Promtail и отправляются в VictoriaLogs
 *
 * Установка:
 *   npm install pino pino-pretty
 *
 * Использование:
 *   const logger = require('./monitoring/logger');
 *   logger.info({ userId: 123 }, 'User logged in');
 * ═══════════════════════════════════════════════════════════════════
 */

const pino = require('pino');

// ═══════════════════════════════════════════════════════════════════
// Logger Configuration
// ═══════════════════════════════════════════════════════════════════
const logger = pino({
  // Log level (debug, info, warn, error, fatal)
  level: process.env.LOG_LEVEL || 'info',

  // Formatters
  formatters: {
    // Level as string (не number)
    level: (label) => {
      return { level: label };
    },
    // Add custom fields to every log
    log: (object) => {
      return {
        ...object,
        // Можно добавить дополнительные поля
        // hostname: os.hostname(),
        // pid: process.pid,
      };
    }
  },

  // ISO timestamp (для парсинга в Promtail)
  timestamp: pino.stdTimeFunctions.isoTime,

  // Base fields (добавляются ко всем логам)
  base: {
    service: 'pressograph-backend',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.VERSION || '1.0.0'
  },

  // Serializers для безопасного логирования объектов
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
    // Custom serializer для user (скрыть пароли)
    user: (user) => {
      if (!user) return user;
      const { password, passwordHash, ...safeUser } = user;
      return safeUser;
    }
  },

  // Redact sensitive fields (автоматически скрывать)
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'req.headers.authorization',
      'req.headers.cookie'
    ],
    censor: '[REDACTED]'
  },

  // Pretty print для development (только в консоли, не в production!)
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: false,
      messageFormat: '{levelLabel} - {msg}'
    }
  } : undefined
});

// ═══════════════════════════════════════════════════════════════════
// Child Loggers (для разных модулей)
// ═══════════════════════════════════════════════════════════════════

/**
 * Создать child logger для модуля/компонента
 *
 * @param {string} module - Название модуля
 * @returns {Object} Pino logger instance
 */
function createModuleLogger(module) {
  return logger.child({ module });
}

// Примеры child loggers
const authLogger = createModuleLogger('auth');
const dbLogger = createModuleLogger('database');
const apiLogger = createModuleLogger('api');

// ═══════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Log HTTP request
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {number} duration - Request duration in ms
 */
function logHttpRequest(req, res, duration) {
  const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

  logger[level]({
    method: req.method,
    url: req.url,
    path: req.path,
    status_code: res.statusCode,
    duration_ms: duration,
    user_agent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    // Trace ID для correlation с трейсами
    trace_id: req.headers['x-trace-id'] || req.id,
    // User ID (если authenticated)
    user_id: req.user?.id
  }, `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
}

/**
 * Log database query
 *
 * @param {string} operation - SQL operation (SELECT, INSERT, etc.)
 * @param {string} table - Table name
 * @param {number} duration - Query duration in ms
 * @param {Object} options - Additional options
 */
function logDatabaseQuery(operation, table, duration, options = {}) {
  const { error, rowCount } = options;

  if (error) {
    dbLogger.error({
      operation,
      table,
      duration_ms: duration,
      error: error.message,
      stack: error.stack
    }, `Database query failed: ${operation} ${table}`);
  } else if (duration > 1000) {
    // Slow query warning (> 1s)
    dbLogger.warn({
      operation,
      table,
      duration_ms: duration,
      row_count: rowCount
    }, `Slow database query: ${operation} ${table} - ${duration}ms`);
  } else {
    dbLogger.debug({
      operation,
      table,
      duration_ms: duration,
      row_count: rowCount
    }, `Database query: ${operation} ${table}`);
  }
}

/**
 * Log authentication event
 *
 * @param {string} event - Event type (login, logout, failed)
 * @param {Object} details - Event details
 */
function logAuthEvent(event, details = {}) {
  const level = event === 'failed' ? 'warn' : 'info';

  authLogger[level]({
    event,
    ...details
  }, `Authentication ${event}`);
}

// ═══════════════════════════════════════════════════════════════════
// Express Middleware для автоматического логирования
// ═══════════════════════════════════════════════════════════════════

/**
 * Express middleware для логирования HTTP requests
 */
function loggingMiddleware(req, res, next) {
  const start = Date.now();

  // Generate request ID (для трейсинга)
  req.id = req.headers['x-request-id'] || generateRequestId();

  // Override res.end для логирования после завершения
  const originalEnd = res.end;
  res.end = function(...args) {
    originalEnd.apply(res, args);

    const duration = Date.now() - start;
    logHttpRequest(req, res, duration);
  };

  next();
}

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ═══════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════
module.exports = logger;
module.exports.createModuleLogger = createModuleLogger;
module.exports.authLogger = authLogger;
module.exports.dbLogger = dbLogger;
module.exports.apiLogger = apiLogger;
module.exports.logHttpRequest = logHttpRequest;
module.exports.logDatabaseQuery = logDatabaseQuery;
module.exports.logAuthEvent = logAuthEvent;
module.exports.loggingMiddleware = loggingMiddleware;

// ═══════════════════════════════════════════════════════════════════
// USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════════

/*
// ───────────────────────────────────────────────────────────────────
// Basic Logging
// ───────────────────────────────────────────────────────────────────
const logger = require('./monitoring/logger');

// Info log
logger.info('Application started');

// With context
logger.info({ port: 3001, environment: 'development' }, 'Server listening');

// Different levels
logger.debug({ userId: 123, action: 'fetch' }, 'Fetching user data');
logger.warn({ threshold: 90, current: 95 }, 'CPU usage high');
logger.error({ error: err.message, stack: err.stack }, 'Request failed');
logger.fatal({ error: err.message }, 'Unrecoverable error');

// ───────────────────────────────────────────────────────────────────
// Module Loggers
// ───────────────────────────────────────────────────────────────────
const { authLogger, dbLogger } = require('./monitoring/logger');

// Auth module
authLogger.info({ userId: 123, method: 'password' }, 'User logged in');
authLogger.warn({ username: 'john', attempts: 3 }, 'Multiple failed login attempts');

// Database module
dbLogger.debug({ operation: 'SELECT', table: 'users', rows: 10 }, 'Query executed');
dbLogger.error({ operation: 'INSERT', error: 'duplicate key' }, 'Query failed');

// ───────────────────────────────────────────────────────────────────
// HTTP Request Logging (middleware)
// ───────────────────────────────────────────────────────────────────
const express = require('express');
const { loggingMiddleware } = require('./monitoring/logger');

const app = express();

// Apply logging middleware
app.use(loggingMiddleware);

// Routes...
app.get('/api/users', (req, res) => {
  // Log будет создан автоматически
  res.json({ users: [] });
});

// ───────────────────────────────────────────────────────────────────
// Database Query Logging
// ───────────────────────────────────────────────────────────────────
const { logDatabaseQuery } = require('./monitoring/logger');

async function getUsers() {
  const start = Date.now();
  try {
    const result = await db.query('SELECT * FROM users');
    const duration = Date.now() - start;

    logDatabaseQuery('SELECT', 'users', duration, {
      rowCount: result.rows.length
    });

    return result.rows;
  } catch (error) {
    const duration = Date.now() - start;
    logDatabaseQuery('SELECT', 'users', duration, { error });
    throw error;
  }
}

// ───────────────────────────────────────────────────────────────────
// Authentication Logging
// ───────────────────────────────────────────────────────────────────
const { logAuthEvent } = require('./monitoring/logger');

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await authenticateUser(req.body);

    logAuthEvent('login', {
      user_id: user.id,
      username: user.username,
      ip: req.ip
    });

    res.json({ user });
  } catch (error) {
    logAuthEvent('failed', {
      username: req.body.username,
      ip: req.ip,
      reason: error.message
    });

    res.status(401).json({ error: 'Authentication failed' });
  }
});

// ───────────────────────────────────────────────────────────────────
// Error Logging
// ───────────────────────────────────────────────────────────────────
const logger = require('./monitoring/logger');

app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    user_id: req.user?.id,
    trace_id: req.headers['x-trace-id']
  }, 'Unhandled error');

  res.status(500).json({ error: 'Internal server error' });
});

// ───────────────────────────────────────────────────────────────────
// Trace Correlation (связь с трейсами)
// ───────────────────────────────────────────────────────────────────
const opentelemetry = require('@opentelemetry/api');

function logWithTrace(message, context) {
  const span = opentelemetry.trace.getActiveSpan();
  const traceId = span?.spanContext().traceId;
  const spanId = span?.spanContext().spanId;

  logger.info({
    ...context,
    trace_id: traceId,
    span_id: spanId
  }, message);
}

// Usage:
logWithTrace('Processing payment', { userId: 123, amount: 99.99 });
*/

// ═══════════════════════════════════════════════════════════════════
// LOG LEVELS
// ═══════════════════════════════════════════════════════════════════
/*
1. fatal (60): Application crash, unrecoverable error
   - Use: Крайне редко, только перед process.exit()

2. error (50): Error conditions, operation failed
   - Use: Failed requests, database errors, external API failures
   - Example: logger.error({ error: err }, 'Payment processing failed')

3. warn (40): Warning conditions, potential issues
   - Use: Slow queries, deprecated API usage, high resource usage
   - Example: logger.warn({ duration: 2000 }, 'Slow database query')

4. info (30): Informational messages, normal operations
   - Use: Application startup, user actions, important state changes
   - Example: logger.info({ userId: 123 }, 'User logged in')

5. debug (20): Debug information, detailed operations
   - Use: Development, troubleshooting, detailed flow
   - Example: logger.debug({ query: sql }, 'Executing SQL query')

6. trace (10): Very detailed debug information
   - Use: Очень редко, для deep debugging

Recommendation:
- Development: LOG_LEVEL=debug
- Production: LOG_LEVEL=info
*/

// ═══════════════════════════════════════════════════════════════════
// BEST PRACTICES
// ═══════════════════════════════════════════════════════════════════
/*
1. Structured Data:
   ✅ logger.info({ userId: 123, action: 'login' }, 'User logged in')
   ❌ logger.info('User 123 logged in')

2. Context Fields:
   - Добавляйте контекст (userId, traceId, requestId)
   - Используйте consistent field names
   - Избегайте null/undefined values

3. Message Format:
   - Короткие, descriptive messages
   - Present tense ("Processing payment", не "Processed payment")
   - Не дублируйте данные из context

4. Sensitive Data:
   - НЕ логируйте passwords, tokens, credit cards
   - Используйте redact paths в конфигурации
   - Sanitize user input перед логированием

5. Performance:
   - Pino очень быстрый (< 1ms overhead)
   - Async logging в production
   - Избегайте JSON.stringify больших объектов

6. Correlation:
   - Всегда логируйте trace_id для связи с трейсами
   - Используйте request_id для tracking requests
   - Добавляйте user_id для user journey tracking

7. Log Levels:
   - Development: debug или trace
   - Production: info (warn и error всегда)
   - Никогда не используйте console.log в production!
*/

// ═══════════════════════════════════════════════════════════════════
// INTEGRATION С VICTORIALOGS
// ═══════════════════════════════════════════════════════════════════
/*
Promtail автоматически собирает логи из Docker/Podman и парсит JSON.

Queries в Grafana (LogsQL):

1. Все логи backend:
   {service="pressograph-backend"}

2. Error logs:
   {service="pressograph-backend"} | json | level="error"

3. Slow queries:
   {service="pressograph-backend"} | json | duration_ms > 1000

4. By user:
   {service="pressograph-backend"} | json | user_id="123"

5. By trace ID (correlation с трейсами):
   {service="pressograph-backend"} | json | trace_id="abc123"

6. HTTP 5xx errors:
   {service="pressograph-backend"} | json | status_code >= 500

7. Authentication failures:
   {service="pressograph-backend"} | json | module="auth" | event="failed"
*/
