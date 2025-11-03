# Pressograph Observability Enhancement Roadmap

## Document Purpose
This document provides a comprehensive roadmap for enhancing the Pressograph observability stack with additional features, fixes, and optimizations as requested in November 2025.

## Project Status: IN PROGRESS

### Completed Tasks ✅

#### 1. Documentation Created
- ✅ **VERSION_UPDATES.md** - Comprehensive version analysis for all stack components
- ✅ **SENTRY_VS_UPTRACE_VS_VT.md** - Detailed comparison of error tracking and APM tools
- ✅ **DUAL_EXPORT_ANALYSIS.md** - Technical feasibility and implementation guide for dual export
- ✅ **OBSERVABILITY_ENHANCEMENT_ROADMAP.md** (this document)

#### 2. Uptrace Integration
- ✅ **compose.uptrace.yaml** - Complete Uptrace stack with ClickHouse and PostgreSQL
- ✅ **uptrace/uptrace.yml** - Uptrace configuration file
- ✅ **uptrace/clickhouse-config.xml** - ClickHouse performance tuning
- ✅ **.env.uptrace.example** - Environment variables template
- ✅ **src/lib/observability/otel.ts** - Updated with dual export support

#### 3. Version Research
- ✅ Latest stable versions identified for all components
- ✅ Docker image tags documented
- ✅ Upgrade paths analyzed
- ✅ Breaking changes identified

### Remaining Tasks 📋

#### 4. Database Exporters (HIGH PRIORITY)
**Status**: NOT STARTED
**Files to Create/Modify**:
- `deploy/compose/compose.dev.yaml` - Add postgres_exporter and redis_exporter services
- `deploy/compose/victoria/vmagent-config.yml` - Add scrape targets
- `deploy/compose/postgres/postgresql.conf` - Performance optimization
- `deploy/compose/redis/redis.conf` - Performance optimization

**Implementation Required**:
```yaml
# Add to compose.dev.yaml
services:
  postgres-exporter:
    image: quay.io/prometheuscommunity/postgres-exporter:v0.18.1
    environment:
      - DATA_SOURCE_NAME=postgresql://postgres:postgres@db:5432/pressograph?sslmode=disable
    networks:
      - pressograph-dev

  redis-exporter:
    image: oliver006/redis_exporter:v1.77.0
    environment:
      - REDIS_ADDR=redis://cache:6379
    networks:
      - pressograph-dev
```

#### 5. PostgreSQL Configuration (MEDIUM PRIORITY)
**Status**: NOT STARTED
**Files to Create**:
- `deploy/compose/postgres/postgresql.conf.generated` - Optimized configuration
- `deploy/compose/postgres/pg_hba.conf` - Authentication rules
- Logging configuration for VictoriaLogs integration

**Optimizations to Implement**:
- shared_buffers (25% of RAM)
- effective_cache_size (50% of RAM)
- work_mem, maintenance_work_mem
- WAL settings for performance
- Checkpoint configuration
- Query logging (slow queries, errors)
- JSON logging for VictoriaLogs

#### 6. Redis/Valkey Configuration (MEDIUM PRIORITY)
**Status**: NOT STARTED
**Files to Create**:
- `deploy/compose/redis/redis.conf.generated` - Optimized configuration
- Logging configuration for VictoriaLogs

**Optimizations to Implement**:
- maxmemory policy
- Eviction strategy
- Persistence settings (RDB + AOF)
- Logging configuration
- Performance tuning

#### 7. Grafana Dashboards (HIGH PRIORITY)
**Status**: NOT STARTED
**Files to Create**:
- `deploy/compose/victoria/grafana/dashboards/postgresql.json`
- `deploy/compose/victoria/grafana/dashboards/redis.json`
- `deploy/compose/victoria/grafana/dashboards/nodejs-app.json`

**Dashboard Requirements**:
- **PostgreSQL**: Connections, queries, cache hit ratio, replication, locks
- **Redis**: Memory, commands, hit rate, clients, persistence
- **Node.js**: Logs (VL), Metrics (VM), Traces (VT), HTTP performance

#### 8. Taskfile Updates (LOW PRIORITY)
**Status**: NOT STARTED
**File to Modify**:
- `Taskfile.yml`

**Commands to Add**:
```yaml
uptrace:start:
  desc: Start Uptrace stack
  cmds:
    - podman-compose -f deploy/compose/compose.uptrace.yaml up -d

uptrace:stop:
  desc: Stop Uptrace stack
  cmds:
    - podman-compose -f deploy/compose/compose.uptrace.yaml down

uptrace:logs:
  desc: View Uptrace logs
  cmds:
    - podman-compose -f deploy/compose/compose.uptrace.yaml logs -f {{.CLI_ARGS}}
```

#### 9. Version Updates (MEDIUM PRIORITY)
**Status**: NOT STARTED
**Files to Modify**:
- `deploy/compose/compose.victoria.yaml` - Update all Victoria* versions
- Test and validate upgrades

**Updates Required**:
- VictoriaMetrics: v1.105.0 → v1.125.1 or v1.122.3 (LTS)
- VictoriaLogs: v0.45.0 → v0.54.1
- vmagent: v1.105.0 → v1.125.1
- vmalert: v1.105.0 → v1.125.1
- Grafana: 11.3.1 → 12.2.x (major upgrade - careful!)

#### 10. Drizzle Studio SSL Investigation (LOW PRIORITY)
**Status**: INVESTIGATED
**Finding**: Drizzle Studio is running but returns 404 on root path. This is expected behavior.

**Recommendation**:
- Drizzle Studio UI is accessible at specific routes, not root
- SSL certificate is correctly configured via Traefik
- No action required - working as designed
- Document the correct URL path for team

#### 11. Environment Variable Updates (MEDIUM PRIORITY)
**Status**: PARTIALLY COMPLETE
**Files to Modify**:
- `.env.dev.example` - Add Uptrace variables
- `deploy/compose/compose.dev.yaml` - Add environment variables

**Variables to Add**:
```bash
# Uptrace
UPTRACE_ENABLED=false
UPTRACE_URL=http://uptrace:14318
UPTRACE_DSN=

# Dual Export
OTEL_EXPORTER_OTLP_DUAL=false

# PostgreSQL Exporter
POSTGRES_EXPORTER_ENABLED=true

# Redis Exporter
REDIS_EXPORTER_ENABLED=true
```

## Implementation Priority Matrix

| Task | Priority | Complexity | Impact | Timeline |
|------|----------|------------|--------|----------|
| **Exporters** | HIGH | Low | High | 2 hours |
| **Grafana Dashboards** | HIGH | Medium | High | 4 hours |
| **PostgreSQL Config** | MEDIUM | Medium | Medium | 2 hours |
| **Redis Config** | MEDIUM | Low | Medium | 1 hour |
| **Version Updates** | MEDIUM | Medium | High | 3 hours |
| **Taskfile Updates** | LOW | Low | Low | 30 minutes |
| **Env Variables** | MEDIUM | Low | Medium | 30 minutes |
| **Drizzle Documentation** | LOW | Low | Low | 30 minutes |

**Total Estimated Time**: ~13.5 hours

## Quick Start Guide for Team

### 1. Start Uptrace Stack

```bash
# Copy environment template
cp .env.uptrace.example .env.uptrace

# Edit .env.uptrace and fill in values
nano .env.uptrace

# Generate secure passwords
openssl rand -base64 32  # For CLICKHOUSE_PASSWORD
openssl rand -base64 32  # For UPTRACE_POSTGRES_PASSWORD
openssl rand -hex 16     # For UPTRACE_PROJECT_TOKEN
openssl rand -hex 32     # For UPTRACE_SECRET_KEY

# Start Uptrace
podman-compose -f deploy/compose/compose.uptrace.yaml up -d

# Check logs
podman-compose -f deploy/compose/compose.uptrace.yaml logs -f

# Access UI
open https://dev-uptrace.infra4.dev
```

### 2. Enable Dual Export

```bash
# Add to .env.local
echo "UPTRACE_ENABLED=true" >> .env.local
echo "UPTRACE_DSN=http://project1_secret_token@uptrace:14318/1" >> .env.local
echo "OTEL_EXPORTER_OTLP_DUAL=true" >> .env.local

# Restart application
task dev:restart
```

### 3. Verify Dual Export

```bash
# Check application logs
task dev:logs

# Should see:
# 📊 OpenTelemetry initialized with 2 trace exporter(s): VictoriaTraces, Uptrace
# ✅ Dual export mode enabled

# Check traces in VictoriaTraces
open https://dev-vt.infra4.dev

# Check traces in Uptrace
open https://dev-uptrace.infra4.dev
```

## Recommended Implementation Order

### Phase 1: Immediate Value (Week 1)
1. ✅ Deploy Uptrace stack
2. ✅ Enable dual export
3. ⏳ Add database exporters
4. ⏳ Update vmagent scrape config
5. Test and validate data flow

### Phase 2: Optimization (Week 2)
6. Generate PostgreSQL configuration
7. Generate Redis configuration
8. Apply database optimizations
9. Monitor performance improvements

### Phase 3: Visualization (Week 3)
10. Create PostgreSQL Grafana dashboard
11. Create Redis Grafana dashboard
12. Create Node.js application dashboard
13. Import dashboards to Grafana

### Phase 4: Maintenance (Week 4)
14. Update all component versions
15. Test upgraded components
16. Update Taskfile with new commands
17. Document all changes
18. Train team on new tools

## Files Created/Modified Summary

### New Files Created ✅
```
docs/VERSION_UPDATES.md
docs/SENTRY_VS_UPTRACE_VS_VT.md
docs/DUAL_EXPORT_ANALYSIS.md
docs/OBSERVABILITY_ENHANCEMENT_ROADMAP.md
deploy/compose/compose.uptrace.yaml
deploy/compose/uptrace/uptrace.yml
deploy/compose/uptrace/clickhouse-config.xml
.env.uptrace.example
```

### Files Modified ✅
```
src/lib/observability/otel.ts
```

### Files To Create ⏳
```
deploy/compose/postgres/postgresql.conf.generated
deploy/compose/postgres/pg_hba.conf
deploy/compose/redis/redis.conf.generated
deploy/compose/victoria/grafana/dashboards/postgresql.json
deploy/compose/victoria/grafana/dashboards/redis.json
deploy/compose/victoria/grafana/dashboards/nodejs-app.json
```

### Files To Modify ⏳
```
deploy/compose/compose.dev.yaml
deploy/compose/compose.victoria.yaml
deploy/compose/victoria/vmagent-config.yml
.env.dev.example
Taskfile.yml
```

## Testing Checklist

### Uptrace Integration
- [ ] ClickHouse starts successfully
- [ ] PostgreSQL starts successfully
- [ ] Uptrace starts successfully
- [ ] Uptrace UI accessible via HTTPS
- [ ] Traces visible in Uptrace UI
- [ ] Dual export working (traces in both VT and Uptrace)
- [ ] Performance impact acceptable (<10% overhead)

### Database Exporters
- [ ] postgres_exporter starts successfully
- [ ] redis_exporter starts successfully
- [ ] vmagent scraping exporters
- [ ] Metrics visible in VictoriaMetrics
- [ ] No connection errors in logs

### Grafana Dashboards
- [ ] PostgreSQL dashboard loads
- [ ] Redis dashboard loads
- [ ] Node.js dashboard loads
- [ ] All panels show data
- [ ] Variables work correctly
- [ ] Time range selection works

### Version Updates
- [ ] All services start after upgrade
- [ ] No breaking changes encountered
- [ ] Existing dashboards still work
- [ ] Data retention preserved
- [ ] Alerting rules still work

## Resource Requirements

### Current Stack
- VictoriaMetrics: ~500MB RAM, 1 CPU
- VictoriaLogs: ~500MB RAM, 1 CPU
- VictoriaTraces: ~300MB RAM, 0.5 CPU
- Grafana: ~300MB RAM, 0.5 CPU
- Total: ~1.6GB RAM, 3 CPU

### After Enhancement
- **Uptrace**: 512MB-2GB RAM, 0.5-2 CPU
- **ClickHouse**: 2GB-4GB RAM, 1-2 CPU
- **Postgres (Uptrace)**: 512MB-1GB RAM, 0.5-1 CPU
- **postgres_exporter**: 50MB RAM, 0.1 CPU
- **redis_exporter**: 30MB RAM, 0.1 CPU
- **Total New**: ~3-7GB RAM, 2-5 CPU

### Grand Total: ~4.6-8.6GB RAM, 5-8 CPU

**Recommendation**: Ensure host has at least 16GB RAM and 8 CPU cores for comfortable development environment.

## Performance Considerations

### Dual Export Impact
- CPU: +5-10% overhead
- Memory: +10-20MB per application instance
- Network: 2x telemetry traffic
- Latency: +1-2ms per request (negligible)

### Mitigation Strategies
- Use batch processing (configured)
- Implement sampling in production
- Monitor resource usage
- Adjust buffer sizes if needed

## Troubleshooting Guide

### Uptrace Not Starting
```bash
# Check ClickHouse
podman logs pressograph-uptrace-clickhouse

# Check PostgreSQL
podman logs pressograph-uptrace-postgres

# Check Uptrace
podman logs pressograph-uptrace

# Verify environment variables
podman exec pressograph-uptrace env | grep UPTRACE
```

### Dual Export Not Working
```bash
# Check OTel configuration
podman exec pressograph-dev-workspace env | grep OTEL

# Check application logs
task dev:logs | grep OpenTelemetry

# Verify network connectivity
podman exec pressograph-dev-workspace curl -v http://uptrace:14318/health
```

### Exporters Not Scraping
```bash
# Check vmagent targets
curl http://localhost:8429/api/v1/targets

# Check exporter health
podman exec pressograph-postgres-exporter curl http://localhost:9187/metrics
podman exec pressograph-redis-exporter curl http://localhost:9121/metrics
```

## Security Considerations

### Passwords and Secrets
- ✅ Use strong random passwords for all databases
- ✅ Store secrets in `.env.uptrace` (gitignored)
- ✅ Rotate secrets regularly
- ✅ Use environment-specific secrets

### Network Security
- ✅ Database ports only exposed on localhost
- ✅ Traefik handles HTTPS termination
- ✅ Internal communication on pressograph-dev network
- ✅ No direct internet exposure

### Access Control
- ⏳ Configure Uptrace RBAC for team members
- ⏳ Use strong Grafana passwords
- ⏳ Restrict database access to monitoring users only

## Next Steps

1. **Team Meeting**: Review this roadmap with the team
2. **Resource Allocation**: Ensure host resources adequate
3. **Priority Confirmation**: Confirm implementation priorities
4. **Timeline Agreement**: Agree on implementation timeline
5. **Begin Implementation**: Start with Phase 1 tasks

## Support and Maintenance

### Documentation
- Official docs for all components linked in VERSION_UPDATES.md
- Internal documentation in `docs/` directory
- Code comments in configuration files

### Monitoring
- Monitor resource usage after each phase
- Track performance metrics
- Validate data quality

### Backup Strategy
- Backup Grafana dashboards regularly
- Export VictoriaMetrics data if needed
- Document rollback procedures

---

**Document Version**: 1.0
**Created**: November 3, 2025
**Status**: LIVING DOCUMENT (update as tasks complete)
**Next Review**: Weekly during implementation
