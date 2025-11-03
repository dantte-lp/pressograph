import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION, ATTR_DEPLOYMENT_ENVIRONMENT } from '@opentelemetry/semantic-conventions';

// VictoriaMetrics endpoints (configure via environment variables)
const VICTORIA_METRICS_URL = process.env.VICTORIA_METRICS_URL || 'http://victoria-metrics:8428';
const VICTORIA_LOGS_URL = process.env.VICTORIA_LOGS_URL || 'http://victoria-logs:9428';
const VICTORIA_TRACES_URL = process.env.VICTORIA_TRACES_URL || 'http://victoria-traces:4318';

// Resource attributes (identify the service)
const resource = new Resource({
  [ATTR_SERVICE_NAME]: 'pressograph',
  [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '2.0.0',
  [ATTR_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
});

// Metrics exporter (VictoriaMetrics)
const metricsExporter = new OTLPMetricExporter({
  url: `${VICTORIA_METRICS_URL}/opentelemetry/v1/metrics`,
  headers: {},
});

// Trace exporter (VictoriaMetrics with Tempo/Jaeger compatibility)
const traceExporter = new OTLPTraceExporter({
  url: `${VICTORIA_TRACES_URL}/v1/traces`,
  headers: {},
});

// Logs exporter (VictoriaLogs)
const logExporter = new OTLPLogExporter({
  url: `${VICTORIA_LOGS_URL}/opentelemetry/v1/logs`,
  headers: {},
});

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  resource,
  traceExporter,
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
  console.log('📊 OpenTelemetry initialized with VictoriaMetrics stack');
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
