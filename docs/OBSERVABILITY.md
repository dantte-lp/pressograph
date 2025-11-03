# Pressograph Observability Guide

Complete guide to monitoring, metrics, logs, and traces in Pressograph using OpenTelemetry and VictoriaMetrics.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Components](#components)
- [Custom Metrics](#custom-metrics)
- [Distributed Tracing](#distributed-tracing)
- [Grafana Dashboards](#grafana-dashboards)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Overview

Pressograph uses a modern observability stack:

- **OpenTelemetry**: Industry-standard instrumentation for metrics, logs, and traces
- **VictoriaMetrics**: High-performance time-series database for metrics
- **VictoriaLogs**: Fast log aggregation and search
- **Grafana**: Unified visualization platform

### Key Benefits

- **Zero overhead in development** (disabled by default)
- **Production-ready monitoring** (comprehensive metrics and traces)
- **Cost-effective** (self-hosted, no vendor lock-in)
- **Scalable** (VictoriaMetrics handles millions of metrics)

## Architecture

```
┌─────────────┐
│  Next.js    │──┐
│ Application │  │ OpenTelemetry SDK
└─────────────┘  │
                 │
                 ├──► VictoriaMetrics (metrics)
                 ├──► VictoriaLogs (logs)
                 └──► Tempo/Jaeger (traces) [optional]
                          │
                          ▼
                    ┌──────────┐
                    │ Grafana  │
                    └──────────┘
```

### Data Flow

1. **Instrumentation**: OpenTelemetry SDK auto-instruments Next.js, database queries, HTTP requests
2. **Export**: Metrics/logs/traces exported via OTLP HTTP protocol
3. **Storage**: VictoriaMetrics stores time-series data, VictoriaLogs stores logs
4. **Visualization**: Grafana queries data sources and displays dashboards

## Quick Start

### 1. Enable OpenTelemetry

Edit `.env.local`:

```bash
# Enable OpenTelemetry
OTEL_ENABLED=true

# VictoriaMetrics endpoints (defaults)
VICTORIA_METRICS_URL=http://victoria-metrics:8428
VICTORIA_LOGS_URL=http://victoria-logs:9428
VICTORIA_TRACES_URL=http://victoria-traces:4318
```

### 2. Start VictoriaMetrics Stack

```bash
# Start observability stack
task metrics:start

# Check status
task metrics:status

# View logs
task metrics:logs
```

### 3. Access Grafana

Open https://grafana-pressograph.infra4.dev

**Default credentials:**
- Username: `admin`
- Password: `admin` (change on first login)

### 4. Verify Data Collection

1. Navigate to **Explore** in Grafana
2. Select **VictoriaMetrics** datasource
3. Query: `http_requests_total`
4. You should see request metrics

## Components

### OpenTelemetry SDK

**Location:** `src/lib/observability/otel.ts`

Initializes the OpenTelemetry SDK with:
- Auto-instrumentation for Node.js libraries
- OTLP exporters for metrics, logs, traces
- Resource attributes (service name, version, environment)

### Custom Metrics

**Location:** `src/lib/observability/metrics.ts`

Pre-defined business metrics:

```typescript
import { httpRequestsTotal, pressureTestsTotal } from '@/lib/observability/metrics';

// Increment HTTP request counter
httpRequestsTotal.add(1, { method: 'GET', path: '/api/tests' });

// Increment pressure test counter
pressureTestsTotal.add(1, { status: 'completed' });
```

**Available metrics:**
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `db_queries_total` - Database query count
- `db_query_duration_seconds` - Query latency
- `cache_hits_total` / `cache_misses_total` - Cache performance
- `active_users` - Current active users
- `pressure_tests_total` - Pressure tests executed
- `exports_total` - Export operations (PDF, PNG, SVG)
- `auth_events_total` - Authentication events
- `api_errors_total` - API errors by status code

### Distributed Tracing

**Location:** `src/lib/observability/tracing.ts`

Utilities for manual tracing:

```typescript
import { traceAsync, traceSync } from '@/lib/observability/tracing';

// Trace async functions
const user = await traceAsync('fetchUser', async () => {
  return await db.query.users.findFirst({ where: eq(users.id, userId) });
}, { userId });

// Trace sync functions
const result = traceSync('calculatePressure', () => {
  return workingPressure * 1.5;
}, { workingPressure });
```

**Advanced usage:**

```typescript
import { createSpan, addEvent } from '@/lib/observability/tracing';

const span = createSpan('complexOperation', { userId: '123' });
try {
  // Do work
  addEvent('milestone_1', { step: 1 });

  // More work
  addEvent('milestone_2', { step: 2 });

  span.end();
} catch (error) {
  span.recordException(error as Error);
  span.setStatus({ code: SpanStatusCode.ERROR });
  span.end();
  throw error;
}
```

## Custom Metrics

### Creating New Metrics

1. **Add to metrics.ts:**

```typescript
export const customMetric = meter.createCounter('custom_metric_total', {
  description: 'Description of what this metric tracks',
  unit: '1',
});
```

2. **Use in application code:**

```typescript
import { customMetric } from '@/lib/observability/metrics';

customMetric.add(1, {
  label1: 'value1',
  label2: 'value2',
});
```

3. **Query in Grafana:**

```promql
# Total count
sum(custom_metric_total)

# Rate per second
rate(custom_metric_total[5m])

# By labels
sum by (label1) (custom_metric_total)
```

### Metric Types

**Counter** (always increasing):
```typescript
meter.createCounter('requests_total', { unit: '1' });
```

**Histogram** (distribution of values):
```typescript
meter.createHistogram('request_duration_seconds', { unit: 's' });
```

**UpDownCounter** (can increase/decrease):
```typescript
meter.createUpDownCounter('active_connections', { unit: '1' });
```

## Grafana Dashboards

### Pre-configured Dashboards

**Pressograph Overview**
- HTTP request rate and latency
- Database query performance
- Cache hit ratio
- Active users
- Error rates

**Location:** `deploy/compose/grafana/provisioning/dashboards/json/pressograph-overview.json`

### Creating Custom Dashboards

1. Open Grafana → **Dashboards** → **New Dashboard**
2. Add panel → Select **VictoriaMetrics** datasource
3. Enter PromQL query
4. Configure visualization
5. Save dashboard

**Example queries:**

```promql
# Request rate by endpoint
sum by (path) (rate(http_requests_total[5m]))

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Cache hit ratio
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))

# Error rate
sum(rate(api_errors_total[5m]))
```

### Exporting/Importing Dashboards

**Export:**
1. Open dashboard → **Settings** (gear icon)
2. **JSON Model** → Copy JSON
3. Save to `deploy/compose/grafana/provisioning/dashboards/json/`

**Import:**
- Dashboards in provisioning folder are automatically loaded

## Production Deployment

### Environment Variables

```bash
# Production settings
NODE_ENV=production
OTEL_ENABLED=true

# VictoriaMetrics endpoints (update for production)
VICTORIA_METRICS_URL=https://metrics.pressograph.com
VICTORIA_LOGS_URL=https://logs.pressograph.com
VICTORIA_TRACES_URL=https://traces.pressograph.com

# Optional: Custom service name
OTEL_SERVICE_NAME=pressograph-prod
```

### Security Considerations

1. **Change Grafana password:**
   ```bash
   # In compose.victoria.yaml
   GF_SECURITY_ADMIN_PASSWORD=STRONG_PASSWORD
   ```

2. **Enable authentication:**
   ```yaml
   # Add Traefik middleware for basic auth
   - "traefik.http.routers.grafana.middlewares=grafana-auth"
   - "traefik.http.middlewares.grafana-auth.basicauth.users=admin:$$apr1$$..."
   ```

3. **Restrict access:**
   - Use firewall rules to limit access to metrics endpoints
   - Only expose Grafana via HTTPS with valid certificates

### Data Retention

**VictoriaMetrics:**
```yaml
command:
  - '--retentionPeriod=12'  # 12 months
```

**VictoriaLogs:**
```yaml
command:
  - '--retentionPeriod=3'  # 3 months
```

### Backup

**Metrics:**
```bash
# Snapshot VictoriaMetrics data
curl -X POST http://victoria-metrics:8428/snapshot/create

# Backup volume
podman volume export pressograph-victoria-metrics-data -o metrics-backup.tar
```

**Dashboards:**
```bash
# Export all dashboards
podman exec pressograph-grafana grafana-cli admin export
```

## Troubleshooting

### OpenTelemetry Not Starting

**Check environment variable:**
```bash
# In container
echo $OTEL_ENABLED
# Should output: true
```

**Check logs:**
```bash
# Development server logs
task dev:logs

# Look for: "📊 OpenTelemetry initialized with VictoriaMetrics stack"
```

### No Metrics in Grafana

**1. Verify VictoriaMetrics is running:**
```bash
task metrics:status

# Should show: victoria-metrics, victoria-logs, grafana - Up
```

**2. Test VictoriaMetrics endpoint:**
```bash
curl http://localhost:8428/api/v1/query?query=up
```

**3. Check Grafana datasource:**
- Grafana → **Configuration** → **Data Sources** → **VictoriaMetrics**
- Click **Test** → Should show "Data source is working"

### High Memory Usage

**VictoriaMetrics uses aggressive caching. To limit:**

```yaml
victoria-metrics:
  command:
    - '--memory.allowedPercent=50'  # Limit to 50% of available RAM
```

### Missing Traces

**Note:** Basic setup only includes metrics and logs. For distributed tracing:

1. Add Tempo or Jaeger to compose file
2. Update `VICTORIA_TRACES_URL` to Tempo endpoint
3. Configure trace sampling rate in `otel.ts`

## Additional Resources

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [VictoriaMetrics Docs](https://docs.victoriametrics.com/)
- [VictoriaLogs Docs](https://docs.victoriametrics.com/VictoriaLogs/)
- [Grafana Docs](https://grafana.com/docs/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)

## Support

For issues or questions:
1. Check logs: `task metrics:logs`
2. Review this documentation
3. Open GitHub issue with logs and configuration
