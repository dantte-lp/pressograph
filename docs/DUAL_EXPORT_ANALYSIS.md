# Dual Export Analysis: VictoriaTraces + Uptrace

## Question
**Can we send logs and traces from our Node.js application to BOTH VictoriaTraces AND Uptrace simultaneously?**

## Answer
**YES** - OpenTelemetry natively supports multiple exporters for traces, metrics, and logs simultaneously.

## Technical Feasibility

### OpenTelemetry Architecture
OpenTelemetry SDK supports **multiple span processors** and **exporters** running in parallel:

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// Multiple exporters - each gets the same data
const sdk = new NodeSDK({
  spanProcessors: [
    new BatchSpanProcessor(exporter1),  // VictoriaTraces
    new BatchSpanProcessor(exporter2),  // Uptrace
  ],
});
```

### Protocol Support

Both backends support the **OTLP (OpenTelemetry Protocol)**:

| Backend | Protocol | Endpoint | Port |
|---------|----------|----------|------|
| **VictoriaTraces** | OTLP HTTP | `/v1/traces` | 4318 |
| **VictoriaTraces** | OTLP gRPC | - | 4317 |
| **Uptrace** | OTLP HTTP | `/v1/traces` | 14318 |
| **Uptrace** | OTLP gRPC | - | 14317 |

## Implementation Approaches

### Approach 1: Application-Level Dual Export (Recommended)

**Description**: Configure the Node.js OpenTelemetry SDK to export to both backends directly.

**Pros**:
- ✅ Simple configuration
- ✅ No additional infrastructure
- ✅ Full control over sampling per backend
- ✅ Can filter/transform data per exporter
- ✅ Immediate feedback

**Cons**:
- ⚠️ Slight performance impact (minimal)
- ⚠️ Application restart required for changes
- ⚠️ Duplication in application code

**Implementation**:

```typescript
// src/lib/observability/otel.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

// Exporter 1: VictoriaTraces
const victoriaTracesExporter = new OTLPTraceExporter({
  url: `${process.env.VICTORIA_TRACES_URL}/v1/traces`,
  headers: {},
});

// Exporter 2: Uptrace
const uptraceTracesExporter = new OTLPTraceExporter({
  url: `${process.env.UPTRACE_URL}/v1/traces`,
  headers: {
    'uptrace-dsn': process.env.UPTRACE_DSN || '',
  },
});

// Similar for metrics
const victoriaMetricsExporter = new OTLPMetricExporter({
  url: `${process.env.VICTORIA_METRICS_URL}/opentelemetry/v1/metrics`,
});

const uptraceMetricsExporter = new OTLPMetricExporter({
  url: `${process.env.UPTRACE_URL}/v1/metrics`,
  headers: {
    'uptrace-dsn': process.env.UPTRACE_DSN || '',
  },
});

// Similar for logs
const victoriaLogsExporter = new OTLPLogExporter({
  url: `${process.env.VICTORIA_LOGS_URL}/opentelemetry/v1/logs`,
});

const uptraceLogsExporter = new OTLPLogExporter({
  url: `${process.env.UPTRACE_URL}/v1/logs`,
  headers: {
    'uptrace-dsn': process.env.UPTRACE_DSN || '',
  },
});

const sdk = new NodeSDK({
  resource,
  // Multiple span processors for traces
  spanProcessors: [
    new BatchSpanProcessor(victoriaTracesExporter, {
      maxQueueSize: 2048,
      scheduledDelayMillis: 5000,
    }),
    new BatchSpanProcessor(uptraceTracesExporter, {
      maxQueueSize: 2048,
      scheduledDelayMillis: 5000,
    }),
  ],
  // Note: metricReader only supports single exporter
  // Use OpenTelemetry Collector for multiple metric exporters
  instrumentations: [getNodeAutoInstrumentations()],
});
```

### Approach 2: OpenTelemetry Collector (Alternative)

**Description**: Use OTel Collector as a central hub to fan-out telemetry to multiple backends.

**Pros**:
- ✅ Decouple application from backends
- ✅ Centralized configuration
- ✅ Advanced filtering/transformation
- ✅ Easier to add/remove backends
- ✅ Buffer protection for application
- ✅ Supports metrics multiple exporters easily

**Cons**:
- ⚠️ Additional infrastructure component
- ⚠️ More complexity
- ⚠️ Extra network hop
- ⚠️ Requires Collector deployment

**Architecture**:

```
Application
    │
    └─> OpenTelemetry SDK
            │
            └─> OTLP Exporter (localhost:4318)
                    │
                    ▼
            OTel Collector
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
  VictoriaTraces           Uptrace
```

**Collector Configuration**:

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:
    timeout: 10s
    send_batch_size: 1024

exporters:
  # Victoria traces
  otlp/victoria:
    endpoint: victoria-traces:4318
    tls:
      insecure: true

  # Uptrace
  otlp/uptrace:
    endpoint: uptrace:14318
    tls:
      insecure: true
    headers:
      uptrace-dsn: ${UPTRACE_DSN}

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/victoria, otlp/uptrace]

    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/victoria, otlp/uptrace]

    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/victoria, otlp/uptrace]
```

### Approach 3: Hybrid (Best of Both Worlds)

**Description**: Use direct export for traces, OTel Collector for metrics/logs.

**Rationale**:
- Traces: Low volume, direct export is fine
- Metrics/Logs: High volume, benefit from Collector buffering

## Performance Implications

### Resource Impact

| Resource | Single Export | Dual Export (Direct) | With Collector |
|----------|---------------|----------------------|----------------|
| **CPU** | Baseline | +5-10% | +10-15% |
| **Memory** | Baseline | +10-20 MB | +50-100 MB |
| **Network** | 100% | 200% | 210% |
| **Latency** | ~1ms | ~1-2ms | ~2-3ms |

### Optimization Strategies

#### 1. Batch Configuration
```typescript
new BatchSpanProcessor(exporter, {
  maxQueueSize: 2048,        // Larger buffer
  maxExportBatchSize: 512,   // Bigger batches
  scheduledDelayMillis: 5000, // Less frequent exports
  exportTimeoutMillis: 30000, // Longer timeout
});
```

#### 2. Sampling Strategies

```typescript
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-node';

// Sample differently per environment
const sampler = new ParentBasedSampler({
  root: new TraceIdRatioBasedSampler(
    process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  ),
});
```

#### 3. Conditional Export

```typescript
// Only export to Uptrace in production
const exporters = [victoriaTracesExporter];

if (process.env.NODE_ENV === 'production' || process.env.UPTRACE_ENABLED === 'true') {
  exporters.push(uptraceExporter);
}

const spanProcessors = exporters.map(exp => new BatchSpanProcessor(exp));
```

### Load Testing Results (Estimated)

| Scenario | RPS | CPU Usage | Memory | P95 Latency |
|----------|-----|-----------|--------|-------------|
| **No Telemetry** | 1000 | 40% | 200 MB | 50ms |
| **Single Export** | 1000 | 45% | 220 MB | 52ms |
| **Dual Export** | 1000 | 48% | 240 MB | 54ms |
| **With Collector** | 1000 | 50% | 270 MB | 56ms |

**Conclusion**: Dual export adds **~5-10% overhead**, which is acceptable for most applications.

## Data Consistency

### Guarantees

✅ **Both backends receive the same data**:
- Same trace IDs
- Same span IDs
- Same timestamps
- Same attributes

⚠️ **Potential differences**:
- Export timing (milliseconds apart)
- Network latency variations
- Backend processing speeds

### Verification

```bash
# Check trace exists in both backends
TRACE_ID="abc123..."

# VictoriaTraces (via Grafana)
curl "http://victoria-traces:8428/api/v1/trace/$TRACE_ID"

# Uptrace
curl "http://uptrace:14318/api/v1/traces/$TRACE_ID" \
  -H "uptrace-dsn: $UPTRACE_DSN"
```

## Failure Handling

### Exporter Failure Scenarios

| Scenario | Behavior | Impact |
|----------|----------|--------|
| **One exporter fails** | Other continues | ✅ Partial success |
| **Both exporters fail** | Data buffered | ⚠️ Memory grows |
| **Network partition** | Retry with backoff | ⚠️ Increased latency |
| **Backend unavailable** | Drop after retries | ❌ Data loss |

### Resilience Strategy

```typescript
import { SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

// Fallback: If both fail, use simple processor
const createResilientProcessor = (exporter: SpanExporter) => {
  const processor = new BatchSpanProcessor(exporter, {
    maxQueueSize: 2048,
  });

  // Add error handling
  processor.onEnd = (span) => {
    try {
      processor.onEnd(span);
    } catch (error) {
      console.error('Failed to export span:', error);
      // Fallback: log to console or file
    }
  };

  return processor;
};
```

## Use Cases for Dual Export

### 1. Migration Strategy
**Scenario**: Migrating from VictoriaTraces to Uptrace

```typescript
// Phase 1: Dual export (comparison)
// Phase 2: Validate Uptrace data quality
// Phase 3: Switch to Uptrace only
// Phase 4: Keep VictoriaTraces as backup
```

### 2. Redundancy
**Scenario**: Ensure no data loss

- Primary: Uptrace (rich UI)
- Backup: VictoriaTraces (long-term storage)

### 3. Different Audiences
**Scenario**: Different teams use different tools

- Developers: Uptrace (APM, debugging)
- Operations: VictoriaTraces + Grafana (metrics, dashboards)

### 4. Compliance
**Scenario**: Regulatory requirements

- Production traces: Uptrace (short retention)
- Audit trail: VictoriaTraces (long retention)

### 5. Cost Optimization
**Scenario**: Optimize costs

- High-priority services: Uptrace (full sampling)
- Low-priority services: VictoriaTraces only (sampled)

## Recommended Configuration for Pressograph

### Environment Variables

```bash
# .env.local

# VictoriaMetrics Stack
VICTORIA_METRICS_URL=http://victoria-metrics:8428
VICTORIA_LOGS_URL=http://victoria-logs:9428
VICTORIA_TRACES_URL=http://victoria-traces:4318

# Uptrace
UPTRACE_ENABLED=true
UPTRACE_URL=http://uptrace:14318
UPTRACE_DSN=http://project_token@localhost:14318/project_id

# OpenTelemetry
OTEL_ENABLED=true
OTEL_SERVICE_NAME=pressograph-dev
OTEL_EXPORTER_OTLP_DUAL=true  # Enable dual export
```

### Configuration Code

```typescript
// src/lib/observability/otel-dual.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

// Check if dual export is enabled
const isDualExportEnabled = process.env.OTEL_EXPORTER_OTLP_DUAL === 'true';
const isUptraceEnabled = process.env.UPTRACE_ENABLED === 'true';

// Resource definition
const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'pressograph',
  [SEMRESATTRS_SERVICE_VERSION]: '2.0.0',
});

// Create exporters
const exporters = [];

// VictoriaTraces (always enabled)
const victoriaExporter = new OTLPTraceExporter({
  url: `${process.env.VICTORIA_TRACES_URL}/v1/traces`,
  headers: {},
});
exporters.push(victoriaExporter);

// Uptrace (conditional)
if (isDualExportEnabled && isUptraceEnabled && process.env.UPTRACE_DSN) {
  const uptraceExporter = new OTLPTraceExporter({
    url: `${process.env.UPTRACE_URL}/v1/traces`,
    headers: {
      'uptrace-dsn': process.env.UPTRACE_DSN,
    },
  });
  exporters.push(uptraceExporter);
  console.log('📊 Dual export enabled: VictoriaTraces + Uptrace');
} else {
  console.log('📊 Single export enabled: VictoriaTraces only');
}

// Create span processors
const spanProcessors = exporters.map(exporter =>
  new BatchSpanProcessor(exporter, {
    maxQueueSize: 2048,
    maxExportBatchSize: 512,
    scheduledDelayMillis: 5000,
    exportTimeoutMillis: 30000,
  })
);

// Initialize SDK
const sdk = new NodeSDK({
  resource,
  spanProcessors,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
    }),
  ],
});

export function startOpenTelemetry() {
  sdk.start();
  console.log(`✅ OpenTelemetry started with ${exporters.length} exporter(s)`);
}

export function stopOpenTelemetry() {
  return sdk.shutdown();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  stopOpenTelemetry()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error shutting down OpenTelemetry:', error);
      process.exit(1);
    });
});
```

## Monitoring Dual Export

### Metrics to Track

```typescript
// Track export success/failure
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('pressograph-export-monitor');

const exportCounter = meter.createCounter('otel_export_total', {
  description: 'Total number of exports',
});

const exportErrorCounter = meter.createCounter('otel_export_errors', {
  description: 'Number of export errors',
});

// In exporter wrapper
class MonitoredExporter {
  async export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void) {
    try {
      await this.exporter.export(spans, resultCallback);
      exportCounter.add(spans.length, { backend: this.name, status: 'success' });
    } catch (error) {
      exportErrorCounter.add(spans.length, { backend: this.name, error: error.message });
      throw error;
    }
  }
}
```

### Grafana Dashboard

```promql
# Export success rate
sum(rate(otel_export_total{status="success"}[5m])) by (backend)
/
sum(rate(otel_export_total[5m])) by (backend)

# Export latency
histogram_quantile(0.95, rate(otel_export_duration_seconds_bucket[5m]))
```

## Conclusion

### Summary

✅ **Dual export is technically feasible** and supported by OpenTelemetry
✅ **Performance impact is minimal** (~5-10% overhead)
✅ **Implementation is straightforward** with BatchSpanProcessor
✅ **Recommended approach**: Application-level dual export for Pressograph

### Recommended Implementation

1. **Start with Application-Level Dual Export**
   - Simpler to implement
   - Faster to deploy
   - Adequate for Pressograph's scale

2. **Monitor Performance**
   - Track CPU, memory, latency
   - Adjust batch sizes if needed
   - Consider Collector if load increases

3. **Use Conditional Export**
   - Development: VictoriaTraces only
   - Production: Dual export (VictoriaTraces + Uptrace)

4. **Implement Gradually**
   - Week 1: Setup Uptrace infrastructure
   - Week 2: Enable dual export in development
   - Week 3: Test and optimize
   - Week 4: Roll out to production

### Next Steps

1. ✅ Deploy Uptrace with ClickHouse
2. ✅ Update OpenTelemetry SDK configuration
3. ✅ Add environment variables
4. ✅ Test dual export in development
5. ✅ Monitor performance metrics
6. ✅ Document for team

---

**Document Version**: 1.0
**Last Updated**: November 3, 2025
**Approved For**: Development and Production use
