# VictoriaMetrics Observability Stack Configuration

This directory contains configuration files for the complete VictoriaMetrics observability stack.

## Directory Structure

```
victoria/
├── README.md                           # This file
├── vmagent-config.yml                  # Metrics scraping configuration
├── vmalert-rules.yml                   # Alerting and recording rules
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── victoriametrics.yml     # Datasource definitions
        └── dashboards/
            ├── default.yml             # Dashboard provider config
            └── json/                   # Dashboard JSON files (add here)
```

## Configuration Files

### vmagent-config.yml

Prometheus scrape configuration for vmagent. Defines which endpoints to scrape for metrics.

**Default scrape targets:**
- vmagent itself (port 8429)
- VictoriaMetrics (port 8428)
- VictoriaLogs (port 9428)
- VictoriaTraces (port 8428)
- vmalert (port 8880)
- Grafana (port 3000)
- Pressograph application (port 3000, `/api/metrics`)

**To add new scrape targets:**
```yaml
scrape_configs:
  - job_name: 'my-service'
    static_configs:
      - targets: ['my-service:9090']
        labels:
          service: my-service
```

### vmalert-rules.yml

Alerting and recording rules evaluated by vmalert.

**Rule groups:**
1. `pressograph-availability`: Service uptime alerts
2. `pressograph-performance`: Request rate, error rate, latency alerts
3. `pressograph-resources`: Memory, CPU, connection pool alerts
4. `pressograph-storage`: Disk usage alerts
5. `pressograph-business`: Business metric alerts (cache hit ratio)
6. `pressograph-recording`: Pre-calculated metrics for dashboards

**To add new alert:**
```yaml
groups:
  - name: my-alerts
    interval: 1m
    rules:
      - alert: MyAlert
        expr: my_metric > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Alert summary"
          description: "Alert description"
```

### grafana/provisioning/datasources/victoriametrics.yml

Datasource definitions automatically loaded by Grafana on startup.

**Configured datasources:**
- VictoriaMetrics (default, Prometheus-compatible)
- VictoriaLogs (LogsQL queries)
- VictoriaTraces (Jaeger-compatible)

### grafana/provisioning/dashboards/default.yml

Dashboard provider configuration. Tells Grafana to load dashboards from `json/` directory.

**To add custom dashboard:**
1. Create dashboard in Grafana UI
2. Export as JSON (Settings → JSON Model)
3. Save to `grafana/provisioning/dashboards/json/my-dashboard.json`
4. Restart Grafana: `task metrics:restart`

## Usage

### Start the stack
```bash
task metrics:start
```

### View status
```bash
task metrics:status
```

### View logs
```bash
task metrics:logs          # All services
task metrics:logs grafana  # Specific service
```

### Stop the stack
```bash
task metrics:stop
```

### Access services
- Grafana: https://dev-grafana.infra4.dev (admin/admin)
- VictoriaMetrics: https://dev-vm.infra4.dev
- VictoriaLogs: https://dev-vl.infra4.dev
- VictoriaTraces: https://dev-vt.infra4.dev

## Customization

### Change retention periods

Edit `compose.victoria.yaml`:

```yaml
victoria-metrics:
  command:
    - '--retentionPeriod=24'  # 24 months

victoria-logs:
  command:
    - '--retentionPeriod=6'   # 6 months

victoria-traces:
  command:
    - '--retentionPeriod=2'   # 2 months
```

### Limit memory usage

Edit `compose.victoria.yaml`:

```yaml
victoria-metrics:
  command:
    - '--memory.allowedPercent=50'  # Limit to 50% RAM
```

### Add scrape targets

Edit `vmagent-config.yml` and add to `scrape_configs`.

### Add alerting rules

Edit `vmalert-rules.yml` and add to appropriate group or create new group.

## Troubleshooting

### Check service health
```bash
# VictoriaMetrics
curl http://localhost:8428/health

# VictoriaLogs
curl http://localhost:9428/health

# VictoriaTraces
curl http://localhost:8428/health

# Grafana
curl http://localhost:3001/api/health
```

### View configuration
```bash
# vmagent active config
curl http://localhost:8429/config

# vmalert rules
curl http://localhost:8880/api/v1/rules
```

### Reset data
```bash
# Stop services
task metrics:stop

# Remove volumes
podman volume rm pressograph-victoria-metrics-data
podman volume rm pressograph-victoria-logs-data
podman volume rm pressograph-victoria-traces-data
podman volume rm pressograph-grafana-data

# Restart
task metrics:start
```

## Best Practices

1. **Retention periods**: Balance storage costs vs data needs
   - Metrics: 12 months (default)
   - Logs: 3 months (default)
   - Traces: 1 month (default)

2. **Scrape intervals**: Balance freshness vs load
   - System metrics: 15s (default)
   - Application metrics: 30s
   - Slow-changing metrics: 1m

3. **Alert tuning**: Avoid alert fatigue
   - Use `for` duration to prevent flapping
   - Set appropriate severity levels
   - Include actionable information in descriptions

4. **Dashboard organization**:
   - Group related panels
   - Use consistent naming
   - Document query logic in panel descriptions

5. **Resource limits**:
   - Set memory limits for VictoriaMetrics
   - Monitor disk usage
   - Use recording rules for expensive queries

## References

- [VictoriaMetrics Docs](https://docs.victoriametrics.com/)
- [vmagent Configuration](https://docs.victoriametrics.com/vmagent.html)
- [vmalert Rules](https://docs.victoriametrics.com/vmalert.html)
- [Grafana Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
