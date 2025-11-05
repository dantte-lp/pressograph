# Uptrace Stack - OpenTelemetry Observability

Complete OpenTelemetry-based observability platform for distributed tracing, metrics, and logs.

## Components

- **Uptrace**: OpenTelemetry backend (UI and data processing)
- **ClickHouse**: OLAP database for telemetry data storage
- **PostgreSQL**: Metadata storage for Uptrace

## Quick Start

```bash
# Start the stack
cd /opt/projects/repositories/pressograph
podman-compose -f deploy/compose/docker-compose.uptrace.yml up -d

# Check status
podman-compose -f deploy/compose/docker-compose.uptrace.yml ps

# View logs
podman logs uptrace -f
```

## Access URLs

- **Uptrace UI**: https://dev-uptrace.infra4.dev
- **ClickHouse**: http://clickhouse:8123 (HTTP)
- **OTLP gRPC**: http://uptrace:14317
- **OTLP HTTP**: http://uptrace:14318

## Configuration Files

1. **uptrace.yml** - Main Uptrace configuration
2. **clickhouse-config.xml** - ClickHouse performance tuning

## Data Retention

- **Traces**: 30 days (720 hours)
- **Metrics**: 30 days (720 hours)
- **Logs**: 14 days (336 hours)

## Sending Telemetry Data

### From Next.js Application

```typescript
// lib/observability/otel.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.UPTRACE_DSN,
  }),
  serviceName: 'pressograph-dev',
});

sdk.start();
```

### Manual cURL Test

```bash
# Send test trace
curl -X POST http://uptrace:14318/v1/traces \
  -H "Content-Type: application/json" \
  -d '{
    "resourceSpans": [{
      "resource": {
        "attributes": [
          {"key": "service.name", "value": {"stringValue": "test-service"}}
        ]
      },
      "scopeSpans": [{
        "spans": [{
          "name": "test-span",
          "startTimeUnixNano": "1699000000000000000",
          "endTimeUnixNano": "1699000001000000000"
        }]
      }]
    }]
  }'
```

## Indexed Attributes

**Spans/Traces:**
- `service.name`
- `http.method`, `http.status_code`, `http.route`
- `db.system`, `db.name`, `db.operation`
- `rpc.service`, `rpc.method`
- `error`, `exception.type`

**Metrics:**
- `service.name`
- `http.method`, `http.status_code`
- `deployment.environment`

**Logs:**
- `service.name`
- `log.level`
- `error`, `exception.type`

## ClickHouse Optimization

Configured for OLAP workloads:
- **Compression**: ZSTD level 3
- **Memory**: 10GB per query max
- **Threads**: 8 concurrent threads
- **Query timeout**: 30 seconds
- **MergeTree**: Optimized for time-series data

### Query ClickHouse

```bash
# Connect to ClickHouse
podman exec -it uptrace-clickhouse clickhouse-client

# Check database size
SELECT
    database,
    formatReadableSize(sum(bytes_on_disk)) AS size
FROM system.parts
WHERE database = 'uptrace'
GROUP BY database;

# View recent traces
SELECT
    service_name,
    span_name,
    count() AS count
FROM uptrace.spans_index
WHERE timestamp > now() - INTERVAL 1 HOUR
GROUP BY service_name, span_name
ORDER BY count DESC
LIMIT 10;
```

## Troubleshooting

### Uptrace

```bash
# Check Uptrace logs
podman logs uptrace --tail 100

# Verify OTLP receivers
curl http://uptrace:14318/health
```

### ClickHouse

```bash
# Check ClickHouse status
curl http://clickhouse:8123/ping

# View query log
podman exec uptrace-clickhouse clickhouse-client -q "SELECT * FROM system.query_log ORDER BY event_time DESC LIMIT 5"

# Check disk usage
podman exec uptrace-clickhouse clickhouse-client -q "SELECT * FROM system.disks"
```

## Performance Tuning

### Uptrace Workers

Edit `uptrace.yml`:
```yaml
performance:
  workers:
    ingest: 16  # Increase for high ingestion rate
    query: 8    # Increase for more concurrent queries
```

### ClickHouse Memory

Edit `clickhouse-config.xml`:
```xml
<max_memory_usage>10000000000</max_memory_usage>  <!-- 10GB -->
<max_concurrent_queries>100</max_concurrent_queries>
```

## Integration with VictoriaMetrics

Uptrace can work alongside VictoriaMetrics:
- **VictoriaMetrics**: Metrics (Prometheus-compatible)
- **Uptrace**: Distributed tracing (OpenTelemetry)
- **VictoriaLogs**: Logs (LogsQL)

Grafana can query all three datasources for correlated observability.

## Backup ClickHouse

```bash
# Create backup
podman exec uptrace-clickhouse clickhouse-client -q "BACKUP DATABASE uptrace TO Disk('backups', 'uptrace_backup')"

# Restore from backup
podman exec uptrace-clickhouse clickhouse-client -q "RESTORE DATABASE uptrace FROM Disk('backups', 'uptrace_backup')"
```

## References

- [Uptrace Documentation](https://uptrace.dev/get/get-started.html)
- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/otel/)
- [ClickHouse Documentation](https://clickhouse.com/docs/en/)

---

For detailed configuration, see `uptrace.yml` and `clickhouse-config.xml`.
