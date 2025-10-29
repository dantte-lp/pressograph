/**
 * ═══════════════════════════════════════════════════════════════════
 * Distributed Tracing с OpenTelemetry + Tempo
 * ═══════════════════════════════════════════════════════════════════
 *
 * Инструментация Backend для distributed tracing
 * Traces автоматически отправляются в Tempo через OTLP
 *
 * Установка:
 *   npm install @opentelemetry/sdk-node \
 *               @opentelemetry/auto-instrumentations-node \
 *               @opentelemetry/exporter-trace-otlp-grpc \
 *               @opentelemetry/api
 *
 * Использование:
 *   1. Скопируйте этот файл в server/monitoring/tracing.js
 *   2. Импортируйте В САМОМ НАЧАЛЕ index.js:
 *      require('./monitoring/tracing');
 * ═══════════════════════════════════════════════════════════════════
 */

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// ═══════════════════════════════════════════════════════════════════
// Diagnostic Logging (опционально, для debugging)
// ═══════════════════════════════════════════════════════════════════
if (process.env.OTEL_LOG_LEVEL === 'debug') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

// ═══════════════════════════════════════════════════════════════════
// Resource (метаданные о сервисе)
// ═══════════════════════════════════════════════════════════════════
const resource = new Resource({
  // Service name (ОБЯЗАТЕЛЬНО!)
  [SemanticResourceAttributes.SERVICE_NAME]: 'pressograph-backend',

  // Service version
  [SemanticResourceAttributes.SERVICE_VERSION]: process.env.VERSION || '1.0.0',

  // Deployment environment
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',

  // Дополнительные атрибуты (опционально)
  // [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'pressograph',
  // [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: process.env.HOSTNAME || 'local',
});

// ═══════════════════════════════════════════════════════════════════
// OTLP Trace Exporter (отправка в Tempo)
// ═══════════════════════════════════════════════════════════════════
const traceExporter = new OTLPTraceExporter({
  // Tempo OTLP gRPC endpoint
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://tempo:4317',

  // Headers (опционально, для authentication)
  // headers: {
  //   'x-api-key': process.env.TEMPO_API_KEY
  // },

  // Timeout
  timeoutMillis: 10000,
});

// ═══════════════════════════════════════════════════════════════════
// SDK Configuration
// ═══════════════════════════════════════════════════════════════════
const sdk = new NodeSDK({
  // Resource
  resource,

  // Trace Exporter
  traceExporter,

  // Span Processor (batching для performance)
  spanProcessor: new BatchSpanProcessor(traceExporter, {
    maxQueueSize: 100,
    maxExportBatchSize: 10,
    scheduledDelayMillis: 5000,  // Export каждые 5 секунд
    exportTimeoutMillis: 30000,
  }),

  // Auto-instrumentation для популярных библиотек
  instrumentations: [
    getNodeAutoInstrumentations({
      // ─────────────────────────────────────────────────────────
      // HTTP/HTTPS instrumentation
      // ─────────────────────────────────────────────────────────
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        // Игнорировать определенные paths
        ignoreIncomingRequestHook: (req) => {
          const ignorePaths = ['/health', '/metrics'];
          return ignorePaths.includes(req.url);
        },
        // Добавить custom attributes к spans
        requestHook: (span, request) => {
          span.setAttribute('http.user_agent', request.headers['user-agent']);
        },
        responseHook: (span, response) => {
          // Можно добавить дополнительные атрибуты
        }
      },

      // ─────────────────────────────────────────────────────────
      // Express instrumentation
      // ─────────────────────────────────────────────────────────
      '@opentelemetry/instrumentation-express': {
        enabled: true,
        // Игнорировать middleware
        ignoreLayersType: ['middleware'],
        // Request hook
        requestHook: (span, info) => {
          // Добавить route pattern к span
          if (info.route) {
            span.updateName(`${info.request.method} ${info.route}`);
          }
        }
      },

      // ─────────────────────────────────────────────────────────
      // PostgreSQL (pg) instrumentation
      // ─────────────────────────────────────────────────────────
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
        // Enhance spans с SQL query info
        enhancedDatabaseReporting: true,
        // Request hook
        requestHook: (span, queryConfig) => {
          // Можно sanitize SQL query для безопасности
          // span.setAttribute('db.statement', sanitizeSQL(queryConfig.text));
        }
      },

      // ─────────────────────────────────────────────────────────
      // Redis instrumentation (если используете)
      // ─────────────────────────────────────────────────────────
      '@opentelemetry/instrumentation-redis': {
        enabled: false,  // Включите если используете Redis
      },

      // ─────────────────────────────────────────────────────────
      // DNS instrumentation
      // ─────────────────────────────────────────────────────────
      '@opentelemetry/instrumentation-dns': {
        enabled: true,
        // Ignore localhost lookups
        ignoreHostnames: ['localhost', '127.0.0.1']
      },

      // ─────────────────────────────────────────────────────────
      // Net instrumentation (TCP)
      // ─────────────────────────────────────────────────────────
      '@opentelemetry/instrumentation-net': {
        enabled: true
      },

      // ─────────────────────────────────────────────────────────
      // FS instrumentation (File System)
      // ─────────────────────────────────────────────────────────
      '@opentelemetry/instrumentation-fs': {
        enabled: false,  // Может создавать много spans, включайте при необходимости
      }
    })
  ]
});

// ═══════════════════════════════════════════════════════════════════
// Start SDK
// ═══════════════════════════════════════════════════════════════════
sdk.start()
  .then(() => {
    console.log('✅ OpenTelemetry tracing initialized');
    console.log(`   Service: pressograph-backend`);
    console.log(`   Exporter: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://tempo:4317'}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  })
  .catch((error) => {
    console.error('❌ Error initializing OpenTelemetry:', error);
  });

// ═══════════════════════════════════════════════════════════════════
// Graceful Shutdown
// ═══════════════════════════════════════════════════════════════════
process.on('SIGTERM', async () => {
  try {
    await sdk.shutdown();
    console.log('OpenTelemetry tracing terminated');
  } catch (error) {
    console.error('Error terminating tracing:', error);
  } finally {
    process.exit(0);
  }
});

// ═══════════════════════════════════════════════════════════════════
// Manual Instrumentation API (для custom spans)
// ═══════════════════════════════════════════════════════════════════
const { trace, context, SpanStatusCode } = require('@opentelemetry/api');

/**
 * Создать custom span для функции
 *
 * @param {string} spanName - Название span
 * @param {Function} fn - Функция для инструментации
 * @param {Object} attributes - Дополнительные атрибуты
 * @returns {Promise<any>} - Результат функции
 */
async function traceFunction(spanName, fn, attributes = {}) {
  const tracer = trace.getTracer('pressograph-backend');

  return tracer.startActiveSpan(spanName, async (span) => {
    try {
      // Добавить атрибуты к span
      Object.entries(attributes).forEach(([key, value]) => {
        span.setAttribute(key, value);
      });

      // Выполнить функцию
      const result = await fn(span);

      // Mark span as successful
      span.setStatus({ code: SpanStatusCode.OK });

      return result;
    } catch (error) {
      // Record error
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });

      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Добавить event к текущему span
 *
 * @param {string} name - Event name
 * @param {Object} attributes - Event attributes
 */
function addSpanEvent(name, attributes = {}) {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Получить trace ID текущего span (для логирования)
 *
 * @returns {string|null} Trace ID
 */
function getCurrentTraceId() {
  const span = trace.getActiveSpan();
  if (span) {
    return span.spanContext().traceId;
  }
  return null;
}

/**
 * Получить span ID текущего span
 *
 * @returns {string|null} Span ID
 */
function getCurrentSpanId() {
  const span = trace.getActiveSpan();
  if (span) {
    return span.spanContext().spanId;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════
module.exports = {
  sdk,
  traceFunction,
  addSpanEvent,
  getCurrentTraceId,
  getCurrentSpanId
};

// ═══════════════════════════════════════════════════════════════════
// USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════════

/*
// ───────────────────────────────────────────────────────────────────
// 1. Setup в index.js (В САМОМ НАЧАЛЕ!)
// ───────────────────────────────────────────────────────────────────
// ВАЖНО: tracing ДОЛЖЕН быть импортирован ПЕРВЫМ!
require('./monitoring/tracing');

// Остальные импорты...
const express = require('express');
const app = express();

// Routes и т.д...

// ───────────────────────────────────────────────────────────────────
// 2. Автоматическая инструментация (HTTP, Express, PG)
// ───────────────────────────────────────────────────────────────────
// HTTP requests автоматически трейсятся:

app.get('/api/users/:id', async (req, res) => {
  // Этот request создаст автоматический span
  // - HTTP span (метод, URL, status code)
  // - Express span (route, middleware)

  const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  // PostgreSQL query создаст child span с SQL query info

  res.json({ user });
});

// ───────────────────────────────────────────────────────────────────
// 3. Manual instrumentation (custom spans)
// ───────────────────────────────────────────────────────────────────
const { traceFunction } = require('./monitoring/tracing');

app.post('/api/orders', async (req, res) => {
  try {
    // Создать custom span для business logic
    const order = await traceFunction(
      'process_order',
      async (span) => {
        // Business logic здесь
        span.setAttribute('order.amount', req.body.amount);
        span.setAttribute('order.customer_id', req.body.customerId);

        // Validate order
        const validation = await validateOrder(req.body);

        // Process payment
        const payment = await processPayment(req.body);

        // Create order in DB
        const order = await createOrder(req.body, payment);

        return order;
      },
      {
        'order.id': req.body.id
      }
    );

    res.json({ order });
  } catch (error) {
    // Error автоматически записан в span
    res.status(500).json({ error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────
// 4. Nested spans (child spans)
// ───────────────────────────────────────────────────────────────────
const { trace } = require('@opentelemetry/api');

async function processOrder(orderData) {
  const tracer = trace.getTracer('pressograph-backend');

  // Parent span
  return tracer.startActiveSpan('process_order', async (parentSpan) => {
    try {
      // Child span 1
      await tracer.startActiveSpan('validate_order', async (span) => {
        await validateOrder(orderData);
        span.end();
      });

      // Child span 2
      await tracer.startActiveSpan('charge_payment', async (span) => {
        span.setAttribute('payment.method', orderData.paymentMethod);
        await chargePayment(orderData);
        span.end();
      });

      // Child span 3
      await tracer.startActiveSpan('create_order_record', async (span) => {
        const order = await createOrderInDB(orderData);
        span.setAttribute('order.id', order.id);
        span.end();
        return order;
      });

      parentSpan.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      parentSpan.recordException(error);
      parentSpan.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      parentSpan.end();
    }
  });
}

// ───────────────────────────────────────────────────────────────────
// 5. Span Events (для важных моментов в span)
// ───────────────────────────────────────────────────────────────────
const { addSpanEvent } = require('./monitoring/tracing');

async function uploadFile(file) {
  addSpanEvent('file_validation_start', { filename: file.name });

  // Validate file
  await validateFile(file);

  addSpanEvent('file_validation_complete', { fileSize: file.size });

  // Upload to S3
  addSpanEvent('s3_upload_start');
  const url = await uploadToS3(file);
  addSpanEvent('s3_upload_complete', { url });

  return url;
}

// ───────────────────────────────────────────────────────────────────
// 6. Trace Context в логах (correlation logs ↔ traces)
// ───────────────────────────────────────────────────────────────────
const { getCurrentTraceId, getCurrentSpanId } = require('./monitoring/tracing');
const logger = require('./monitoring/logger');

app.get('/api/users/:id', async (req, res) => {
  const traceId = getCurrentTraceId();
  const spanId = getCurrentSpanId();

  logger.info({
    trace_id: traceId,
    span_id: spanId,
    user_id: req.params.id
  }, 'Fetching user');

  // Теперь можно найти логи по trace_id в VictoriaLogs
  // И перейти от лога к трейсу в Grafana!

  const user = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  res.json({ user });
});

// ───────────────────────────────────────────────────────────────────
// 7. Error handling с трейсами
// ───────────────────────────────────────────────────────────────────
const { trace, SpanStatusCode } = require('@opentelemetry/api');

app.use((err, req, res, next) => {
  const span = trace.getActiveSpan();

  if (span) {
    // Record exception в span
    span.recordException(err);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: err.message
    });

    // Add error attributes
    span.setAttribute('error.type', err.name);
    span.setAttribute('error.message', err.message);
    span.setAttribute('error.stack', err.stack);
  }

  // Log error с trace ID
  logger.error({
    error: err.message,
    stack: err.stack,
    trace_id: getCurrentTraceId()
  }, 'Request error');

  res.status(err.status || 500).json({ error: err.message });
});

// ───────────────────────────────────────────────────────────────────
// 8. External HTTP calls (автоматически трейсятся)
// ───────────────────────────────────────────────────────────────────
const axios = require('axios');

app.get('/api/external', async (req, res) => {
  // HTTP call создаст child span автоматически
  const response = await axios.get('https://api.example.com/data');

  // Span будет содержать:
  // - URL
  // - Method
  // - Status code
  // - Duration

  res.json(response.data);
});
*/

// ═══════════════════════════════════════════════════════════════════
// ENVIRONMENT VARIABLES
// ═══════════════════════════════════════════════════════════════════
/*
# Tempo endpoint
OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4317

# Log level (debug для troubleshooting)
OTEL_LOG_LEVEL=info

# Service name (опционально, можно задать в коде)
OTEL_SERVICE_NAME=pressograph-backend

# Sampling (опционально)
# 1.0 = 100% traces, 0.1 = 10% traces (для production)
# OTEL_TRACES_SAMPLER=parentbased_traceidratio
# OTEL_TRACES_SAMPLER_ARG=1.0
*/

// ═══════════════════════════════════════════════════════════════════
// GRAFANA QUERIES (Trace to Logs/Metrics)
// ═══════════════════════════════════════════════════════════════════
/*
1. Найти трейс в Tempo:
   - Explore → Tempo
   - Search by service: pressograph-backend
   - Filter by tags, duration, status

2. От трейса к логам:
   - В Tempo trace view кликнуть "Logs for this span"
   - Автоматически откроет VictoriaLogs с trace_id фильтром

3. От трейса к метрикам:
   - В Tempo trace view кликнуть "Metrics"
   - Показывает RED metrics для сервиса

4. От логов к трейсу:
   - В VictoriaLogs найти лог с trace_id
   - Кликнуть на trace_id → откроется трейс в Tempo

5. Service Graph:
   - Tempo → Service Graph
   - Визуализация зависимостей между сервисами
*/

// ═══════════════════════════════════════════════════════════════════
// BEST PRACTICES
// ═══════════════════════════════════════════════════════════════════
/*
1. Span Naming:
   ✅ "GET /api/users/:id"
   ✅ "process_payment"
   ✅ "database_query"
   ❌ "GET /api/users/123" (high cardinality)

2. Span Attributes:
   - Добавляйте важные атрибуты (user_id, order_id)
   - НЕ добавляйте sensitive data (passwords, tokens)
   - Используйте semantic conventions (http.*, db.*)

3. Sampling:
   - Development: 100% (для debugging)
   - Production: 1-10% (снижает overhead)
   - Critical endpoints: 100% (payment, auth)

4. Performance:
   - Overhead: ~1-2% latency с auto-instrumentation
   - Batching spans снижает network calls
   - Async export не блокирует requests

5. Correlation:
   - ВСЕГДА логируйте trace_id в логах
   - Используйте для debugging (logs → traces → metrics)
   - Service graph помогает понять dependencies

6. Troubleshooting:
   - Проверить что Tempo доступен: nc -zv tempo 4317
   - Включить debug logging: OTEL_LOG_LEVEL=debug
   - Проверить spans в Grafana Tempo UI
*/
