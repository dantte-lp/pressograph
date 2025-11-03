# Version Updates Report - November 2025

## Overview
This document tracks the latest stable versions for all components in the Pressograph observability stack as of November 2025.

## Current vs Updated Versions

| Component | Current Version | Latest Stable | Status | Notes |
|-----------|----------------|---------------|--------|-------|
| **VictoriaMetrics** | v1.105.0 | v1.125.1 | Update Available | Latest non-LTS release |
| **VictoriaMetrics (LTS)** | v1.105.0 | v1.122.3 | Update Available | Long-term support line (12 months) |
| **VictoriaLogs** | v0.45.0-victorialogs | v0.54.1-victorialogs | Update Available | Significant updates, cluster support |
| **VictoriaTraces** | v0.1.0 | v0.1.0 | Current | No newer stable version found |
| **vmagent** | v1.105.0 | v1.125.1 | Update Available | Matches VictoriaMetrics version |
| **vmalert** | v1.105.0 | v1.125.1 | Update Available | Matches VictoriaMetrics version |
| **Grafana** | 11.3.1 | 12.2.x | Major Update Available | Major version upgrade (11 → 12) |
| **PostgreSQL** | 18-trixie | 18-trixie | Current | Latest stable (Debian Trixie base) |
| **Valkey** | 9-trixie | 9-trixie | Current | Latest stable (Redis fork) |
| **postgres_exporter** | Not installed | v0.18.1 | New Component | Prometheus Community exporter |
| **redis_exporter** | Not installed | v1.77.0 | New Component | oliver006/redis_exporter |
| **Uptrace** | Not installed | v2.0.0 | New Component | OpenTelemetry APM platform |
| **ClickHouse** | Not installed | 25.3.5 | New Component | Required for Uptrace |

## Detailed Component Analysis

### VictoriaMetrics Ecosystem

#### VictoriaMetrics Core
- **Current**: v1.105.0
- **Latest**: v1.125.1 (released September 2025)
- **LTS Option**: v1.122.3 (supported until ~September 2026)

**Recommendation**:
- **Development**: Upgrade to v1.125.1 for latest features
- **Production**: Consider v1.122.3 LTS for stability and 12-month support window

**Key Changes in v1.125.x**:
- Upgraded Go builder from Go1.24.6 to Go1.25
- Performance improvements
- Bug fixes in routing (fixed in v1.125.1)

**LTS Policy**:
- New LTS lines published every 6 months
- Each LTS line supported for 12 months
- Latest two LTS lines are v1.110.x and v1.122.x

#### VictoriaLogs
- **Current**: v0.45.0-victorialogs
- **Latest**: v0.54.1-victorialogs

**Key Features Added**:
- Cluster version support (significant scalability improvement)
- New filters: `equals_common_case`, `contains_common_case`
- Enhanced LogsQL capabilities
- Improved integration with Grafana

**Migration Notes**:
- Review API compatibility before upgrading
- Test LogsQL queries with new version
- Consider cluster deployment for high-volume logging

#### VictoriaTraces
- **Current**: v0.1.0
- **Latest**: v0.1.0 (unchanged)

**Status**: Currently on latest stable version

**Note**: VictoriaTraces is in early stages. Consider dual deployment with Uptrace for production observability redundancy.

#### vmagent & vmalert
- **Current**: v1.105.0
- **Latest**: v1.125.1

**Recommendation**: Keep synchronized with VictoriaMetrics core version

### Grafana

#### Current State
- **Current**: 11.3.1
- **Latest**: 12.2.x (minor release from September 2025)

#### Major Version Upgrade (11 → 12)

**Breaking Changes**:
- Dashboard structure changes
- Scenes-powered dynamic dashboards
- Updated alerting tools
- Enhanced observability-as-code features

**Migration Path**:
1. Backup existing dashboards and datasources
2. Test in development environment first
3. Review plugin compatibility
4. Update provisioning configurations if needed

**New Features in Grafana 12**:
- **Grafana 12.0** (May 2025): Observability as code, dynamic dashboards
- **Grafana 12.1** (July 2025): Automated health checks, streamlined alerting views
- **Grafana 12.2** (September 2025): LLM-powered SQL expressions, enhanced visualizations

**Recommendation**:
- **Development**: Upgrade to 12.2.x for latest features
- **Production**: Wait for 12.2.1+ patch release for stability

### Exporters (New Components)

#### PostgreSQL Exporter
- **Version**: v0.18.1 (September 2025)
- **Docker Image**: `quay.io/prometheuscommunity/postgres-exporter:v0.18.1`
- **Maintained by**: Prometheus Community

**Features**:
- 50+ metrics out of the box
- Custom query support
- Multi-database monitoring
- Replication lag tracking
- Connection pool statistics

**Configuration Required**:
- Database connection with monitoring user
- Custom queries for application-specific metrics
- Integration with vmagent scrape configuration

#### Redis Exporter
- **Version**: v1.77.0 (2025)
- **Docker Image**: `oliver006/redis_exporter:v1.77.0`
- **Maintained by**: oliver006

**Features**:
- Supports Valkey 7.x, 8.x and Redis 2.x-8.x
- Memory metrics
- Command statistics
- Replication status
- Key space statistics
- Optional Go runtime metrics (new flag: `--include-go-runtime-metrics`)

**Configuration Required**:
- Redis/Valkey connection string
- Optional password authentication
- vmagent scrape configuration

### New Components

#### Uptrace
- **Version**: v2.0.0
- **Docker Image**: `uptrace/uptrace:2.0.0`
- **Type**: OpenTelemetry APM Platform

**Purpose**:
- Advanced APM features beyond basic telemetry
- Distributed tracing UI
- Service maps and dependency graphs
- Alerts and notifications
- Team collaboration features

**Requirements**:
- ClickHouse 25.3.5+ (backend storage)
- PostgreSQL 17-alpine (metadata storage)
- OpenTelemetry collector configuration

**Use Case**:
- Dual export strategy with VictoriaTraces
- Development/staging environments
- Advanced trace analysis
- Performance bottleneck identification

#### ClickHouse
- **Version**: 25.3.5
- **Docker Image**: `clickhouse/clickhouse-server:25.3.5`
- **Purpose**: Backend storage for Uptrace

**Resource Requirements**:
- Memory: 2GB minimum (4GB recommended)
- Storage: SSD recommended for performance
- CPU: 2+ cores recommended

## Version Update Strategy

### Immediate Updates (Low Risk)
1. **vmagent/vmalert**: v1.105.0 → v1.125.1
   - No breaking changes
   - Backward compatible
   - Synchronized with VictoriaMetrics

2. **Install Exporters**: postgres_exporter, redis_exporter
   - New components, no migration needed
   - Immediate value for database observability

### Medium Priority (Test First)
3. **VictoriaMetrics**: v1.105.0 → v1.125.1 or v1.122.3 (LTS)
   - Test in development first
   - Verify metric retention and queries
   - Consider LTS version for production stability

4. **VictoriaLogs**: v0.45.0 → v0.54.1
   - Significant version jump
   - Test LogsQL queries compatibility
   - Review API changes

### Major Updates (Careful Planning)
5. **Grafana**: 11.3.1 → 12.2.x
   - Major version upgrade
   - Backup all dashboards and datasources
   - Test plugin compatibility
   - Review breaking changes
   - Consider waiting for 12.2.1+ patch

6. **Add Uptrace Stack**: New deployment
   - Independent deployment
   - Parallel to existing VictoriaTraces
   - Requires ClickHouse setup
   - Dual export configuration

## Docker Image References

### Updated Images

```yaml
# VictoriaMetrics Ecosystem
victoriametrics/victoria-metrics:v1.125.1       # or v1.122.3-lts
victoriametrics/victoria-logs:v0.54.1-victorialogs
victoriametrics/victoria-traces:v0.1.0          # unchanged
victoriametrics/vmagent:v1.125.1
victoriametrics/vmalert:v1.125.1

# Visualization
grafana/grafana:12.2.0                          # Major update

# Databases (unchanged)
postgres:18-trixie
docker.io/valkey/valkey:9-trixie

# Exporters (new)
quay.io/prometheuscommunity/postgres-exporter:v0.18.1
oliver006/redis_exporter:v1.77.0

# Uptrace Stack (new)
uptrace/uptrace:2.0.0
clickhouse/clickhouse-server:25.3.5
postgres:17-alpine
```

## Testing Checklist

### Before Updating
- [ ] Backup all Grafana dashboards
- [ ] Export VictoriaMetrics data (if needed)
- [ ] Document current metric retention policies
- [ ] Test scrape configurations
- [ ] Verify current alerting rules

### After Updating
- [ ] Verify all services start successfully
- [ ] Check Traefik HTTPS certificates
- [ ] Validate metric ingestion
- [ ] Test Grafana dashboard rendering
- [ ] Verify alerting rules still work
- [ ] Check logs for errors
- [ ] Monitor resource usage
- [ ] Test exporter connectivity

### For Dual Export (Uptrace + VictoriaTraces)
- [ ] Verify traces reach both backends
- [ ] Compare trace visualization
- [ ] Check for data consistency
- [ ] Monitor performance impact
- [ ] Validate sampling strategies

## References

- **VictoriaMetrics**: https://docs.victoriametrics.com/
- **VictoriaLogs**: https://docs.victoriametrics.com/victorialogs/
- **Grafana**: https://grafana.com/docs/grafana/latest/
- **postgres_exporter**: https://github.com/prometheus-community/postgres_exporter
- **redis_exporter**: https://github.com/oliver006/redis_exporter
- **Uptrace**: https://uptrace.dev/

## Rollback Plan

### If Issues Arise

1. **VictoriaMetrics/Logs/Agent/Alert**:
   ```bash
   # Edit compose file, change image tags back
   podman-compose -f deploy/compose/compose.victoria.yaml down
   # Update image tags in compose.victoria.yaml
   podman-compose -f deploy/compose/compose.victoria.yaml up -d
   ```

2. **Grafana**:
   ```bash
   # Restore from backup
   podman volume create pressograph-grafana-data-backup
   podman run --rm -v pressograph-grafana-data:/source \
     -v pressograph-grafana-data-backup:/backup \
     alpine tar czf /backup/backup.tar.gz -C /source .
   ```

3. **Exporters**:
   - Simply stop the exporter containers
   - No impact on main application

## Next Steps

1. Review this document with the team
2. Schedule maintenance window for updates
3. Prepare rollback procedures
4. Test updates in development environment
5. Monitor closely after production updates

---

**Document Version**: 1.0
**Last Updated**: November 3, 2025
**Reviewed By**: DevOps Team
**Next Review**: December 2025
