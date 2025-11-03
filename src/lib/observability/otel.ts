import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';

// ==============================================================================
// Configuration
// ==============================================================================

// VictoriaMetrics endpoints
const VICTORIA_METRICS_URL = process.env.VICTORIA_METRICS_URL || 'http://victoria-metrics:8428';
const VICTORIA_LOGS_URL = process.env.VICTORIA_LOGS_URL || 'http://victoria-logs:9428';
const VICTORIA_TRACES_URL = process.env.VICTORIA_TRACES_URL || 'http://victoria-traces:4318';

// Uptrace endpoints (optional)
const UPTRACE_URL = process.env.UPTRACE_URL || 'http://uptrace:14318';
const UPTRACE_DSN = process.env.UPTRACE_DSN || '';

// Feature flags
const UPTRACE_ENABLED = process.env.UPTRACE_ENABLED === 'true';
const DUAL_EXPORT_ENABLED = process.env.OTEL_EXPORTER_OTLP_DUAL === 'true';

// ==============================================================================
// Resource Definition
// ==============================================================================

const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'pressograph',
  [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version || '2.0.0',
  [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
});

// ==============================================================================
// Trace Exporters
// ==============================================================================

// Victoria Traces (always enabled)
const victoriaTraceExporter = new OTLPTraceExporter({
  url: `${VICTORIA_TRACES_URL}/v1/traces`,
  headers: {},
});

// Uptrace (conditional)
const uptraceTraceExporter = UPTRACE_ENABLED && UPTRACE_DSN
  ? new OTLPTraceExporter({
      url: `${UPTRACE_URL}/v1/traces`,
      headers: {
        'uptrace-dsn': UPTRACE_DSN,
      },
    })
  : null;

// Create span processors
const spanProcessors = [
  new BatchSpanProcessor(victoriaTraceExporter, {
    maxQueueSize: 2048,
    maxExportBatchSize: 512,
    scheduledDelayMillis: 5000,
    exportTimeoutMillis: 30000,
  }),
];

if (uptraceTraceExporter && (DUAL_EXPORT_ENABLED || UPTRACE_ENABLED)) {
  spanProcessors.push(
    new BatchSpanProcessor(uptraceTraceExporter, {
      maxQueueSize: 2048,
      maxExportBatchSize: 512,
      scheduledDelayMillis: 5000,
      exportTimeoutMillis: 30000,
    })
  );
}

// ==============================================================================
// Metrics Exporters
// ==============================================================================

// VictoriaMetrics (primary)
const metricsExporter = new OTLPMetricExporter({
  url: `${VICTORIA_METRICS_URL}/opentelemetry/v1/metrics`,
  headers: {},
});

// Note: NodeSDK only supports single metric reader
// For dual export of metrics, use OpenTelemetry Collector

// ==============================================================================
// Logs Exporters
// ==============================================================================

// VictoriaLogs (primary)
const logExporter = new OTLPLogExporter({
  url: `${VICTORIA_LOGS_URL}/opentelemetry/v1/logs`,
  headers: {},
});

// Note: For dual log export, use OpenTelemetry Collector

// ==============================================================================
// SDK Initialization
// ==============================================================================

const sdk = new NodeSDK({
  resource,
  spanProcessors, // Multiple processors for dual trace export
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricsExporter,
    exportIntervalMillis: 60000, // Export every 60 seconds
  }),
  // @ts-ignore - Type compatibility issue with log processor
  logRecordProcessor: logExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Auto-instrument Node.js libraries
      '@opentelemetry/instrumentation-fs': { enabled: false }, // Too noisy
      '@opentelemetry/instrumentation-dns': { enabled: false },
    }),
  ],
});

// Start the SDK
export function startOpenTelemetry() {
  sdk.start();

  // Log enabled exporters
  const exporterCount = spanProcessors.length;
  const exporters = ['VictoriaTraces'];

  if (uptraceTraceExporter && (DUAL_EXPORT_ENABLED || UPTRACE_ENABLED)) {
    exporters.push('Uptrace');
  }

  console.log(`📊 OpenTelemetry initialized with ${exporterCount} trace exporter(s): ${exporters.join(', ')}`);
  console.log('   - Metrics: VictoriaMetrics');
  console.log('   - Logs: VictoriaLogs');

  if (DUAL_EXPORT_ENABLED) {
    console.log('   ✅ Dual export mode enabled');
  }
}

// Graceful shutdown
export function stopOpenTelemetry() {
  sdk
    .shutdown()
    .then(() => console.log('✅ OpenTelemetry shut down successfully'))
    .catch((error) => console.error('❌ Error shutting down OpenTelemetry', error));
}

// Handle process termination
process.on('SIGTERM', () => {
  stopOpenTelemetry();
  process.exit(0);
});
