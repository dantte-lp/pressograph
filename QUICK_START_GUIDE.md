# Pressograph - Quick Start Guide

**Last Updated**: 2025-11-03
**Status**: Production Ready

## Prerequisites

- Podman and podman-compose installed
- Task (go-task) installed
- Access to Traefik instance at traefik-public network
- DNS records pointing to Traefik host:
  - dev-pressograph.infra4.dev
  - dbdev-pressograph.infra4.dev
  - dev-grafana.infra4.dev
  - dev-vm.infra4.dev
  - dev-vl.infra4.dev
  - dev-vt.infra4.dev

## 1. Initial Setup (First Time Only)

```bash
# Navigate to project directory
cd /opt/projects/repositories/pressograph

# Generate secure secrets
task secrets:generate

# Review generated .env.local
cat .env.local

# Optional: Enable OpenTelemetry
sed -i 's/OTEL_ENABLED=false/OTEL_ENABLED=true/' .env.local
```

## 2. Start Development Environment

```bash
# Start all development services
task dev:start

# Check status
task ps

# View logs
task dev:logs
```

**Services Started**:
- PostgreSQL 18 (port 5432)
- Valkey 9 (port 6379)
- Next.js workspace (port 3000)

**URLs**:
- Application: https://dev-pressograph.infra4.dev
- Drizzle Studio: https://dbdev-pressograph.infra4.dev

## 3. Start Observability Stack

```bash
# Start VictoriaMetrics stack
task metrics:start

# Check status
task metrics:status

# View logs
task metrics:logs
```

**Services Started**:
- VictoriaMetrics (metrics storage)
- VictoriaLogs (log aggregation)
- VictoriaTraces (distributed tracing)
- vmagent (metrics collection)
- vmalert (alerting)
- Grafana (visualization)

**URLs**:
- Grafana: https://dev-grafana.infra4.dev (admin/admin)
- VictoriaMetrics: https://dev-vm.infra4.dev
- VictoriaLogs: https://dev-vl.infra4.dev
- VictoriaTraces: https://dev-vt.infra4.dev

## 4. Daily Development Workflow

### Enter Development Container
```bash
task dev:enter
```

### Run Next.js Development Server
```bash
# Inside container or from host
task dev:next
```

### Database Operations
```bash
# Push schema changes
task db:push

# Open Drizzle Studio (https://dbdev-pressograph.infra4.dev)
task db:studio

# Generate migrations
task db:migrate

# Seed database
task db:seed
```

### Code Quality
```bash
# Lint
task lint

# Format
task format

# Type check
task type-check

# Run tests
task test
```

### View Logs
```bash
# All dev services
task dev:logs

# Follow logs
task dev:logs -f

# Observability logs
task metrics:logs
task metrics:logs grafana  # Specific service
```

## 5. Access Services

### Application
- Main App: https://dev-pressograph.infra4.dev
- Database UI: https://dbdev-pressograph.infra4.dev

### Observability
- Grafana Dashboard: https://dev-grafana.infra4.dev
  - Username: admin
  - Password: admin (change on first login)
- VictoriaMetrics UI: https://dev-vm.infra4.dev
- VictoriaLogs UI: https://dev-vl.infra4.dev
- VictoriaTraces UI: https://dev-vt.infra4.dev

### Local Ports
- Next.js: http://localhost:3000
- PostgreSQL: localhost:5432
- Valkey: localhost:6379
- Grafana: http://localhost:3001
- VictoriaMetrics: http://localhost:8428
- VictoriaLogs: http://localhost:9428
- VictoriaTraces OTLP HTTP: http://localhost:4318

## 6. Common Tasks

### Restart Services
```bash
# Restart dev environment
task dev:restart

# Restart observability
task metrics:restart
```

### Stop Services
```bash
# Stop dev environment
task dev:stop

# Stop observability
task metrics:stop
```

### Clean Up
```bash
# Destroy dev environment (removes containers, keeps volumes)
task dev:destroy

# Remove everything (including volumes)
podman-compose -f deploy/compose/compose.dev.yaml down -v
podman-compose -f deploy/compose/compose.victoria.yaml down -v
```

### View Resource Usage
```bash
task stats
```

## 7. Troubleshooting

### Taskfile Errors
```bash
# Validate syntax
task --list
```

### Compose File Errors
```bash
# Validate dev compose
podman-compose -f deploy/compose/compose.dev.yaml config

# Validate victoria compose
podman-compose -f deploy/compose/compose.victoria.yaml config
```

### Service Not Starting
```bash
# Check logs
task dev:logs SERVICE_NAME
task metrics:logs SERVICE_NAME

# Check container status
podman ps -a

# Inspect container
podman inspect CONTAINER_NAME
```

### Traefik Not Routing
```bash
# Check if Traefik sees the service
curl -s https://tr-01.infra4.dev/api/http/routers | grep pressograph

# Check container labels
podman inspect pressograph-dev-workspace | grep -A 20 Labels

# Verify network connection
podman network inspect traefik-public
```

### OpenTelemetry Not Working
```bash
# Check environment variables
podman exec pressograph-dev-workspace env | grep OTEL

# Check Victoria services are running
task metrics:status

# Test connectivity
podman exec pressograph-dev-workspace curl -v http://victoria-traces:4318/v1/traces
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
task ps | grep db

# Test connection
podman exec pressograph-dev-workspace psql -h db -U postgres -d pressograph -c "SELECT 1"
```

### Grafana Access Issues
```bash
# Reset Grafana admin password
podman exec -it pressograph-grafana grafana-cli admin reset-admin-password newpassword

# Check Grafana logs
task metrics:logs grafana
```

## 8. Best Practices

### Development
- Always use `task` commands instead of direct podman-compose
- Keep `.env.local` secure and never commit it
- Use `task dev:enter` for interactive work in container
- Monitor logs during development: `task dev:logs -f`

### Observability
- Change Grafana admin password on first login
- Create custom dashboards for your metrics
- Export dashboards to `victoria/grafana/provisioning/dashboards/json/`
- Review and tune alert thresholds in `vmalert-rules.yml`

### Security
- Rotate secrets every 90 days: `task secrets:rotate`
- Don't expose database/cache to traefik-public network
- Use Traefik middleware for additional security
- Review container logs regularly

### Performance
- Monitor resource usage: `task stats`
- Adjust VictoriaMetrics retention if disk space is limited
- Use named volumes for better performance
- Clean up unused volumes periodically

## 9. Documentation

### Project Documentation
- `/opt/projects/repositories/pressograph/docs/OBSERVABILITY.md` - Complete observability guide
- `/opt/projects/repositories/pressograph/deploy/compose/victoria/README.md` - Victoria config
- `/opt/projects/repositories/pressograph/COMPOSE_VALIDATION_REPORT.md` - Validation details
- `/opt/projects/repositories/pressograph/CHANGES_SUMMARY.md` - All changes made

### External Resources
- [Compose Specification](https://github.com/compose-spec/compose-spec)
- [Podman Documentation](https://docs.podman.io/)
- [VictoriaMetrics Docs](https://docs.victoriametrics.com/)
- [Traefik Docker Provider](https://doc.traefik.io/traefik/providers/docker/)
- [OpenTelemetry Docs](https://opentelemetry.io/docs/)

## 10. Getting Help

### Check Status
```bash
# Overall status
task ps
task metrics:status

# Detailed service info
podman inspect CONTAINER_NAME
podman logs CONTAINER_NAME
```

### Health Checks
```bash
# VictoriaMetrics
curl http://localhost:8428/health

# VictoriaLogs
curl http://localhost:9428/health

# Grafana
curl http://localhost:3001/api/health

# PostgreSQL
podman exec pressograph-dev-db pg_isready -U postgres
```

### Configuration Validation
```bash
# Taskfile
task --list

# Compose files
podman-compose -f deploy/compose/compose.dev.yaml config
podman-compose -f deploy/compose/compose.victoria.yaml config

# Environment variables
cat .env.local
```

## Quick Command Reference

```bash
# Setup
task secrets:generate              # Generate secure secrets

# Development
task dev:start                     # Start dev environment
task dev:stop                      # Stop dev environment
task dev:restart                   # Restart dev environment
task dev:enter                     # Enter container
task dev:logs                      # View logs

# Application
task dev:next                      # Start Next.js dev server
task build                         # Build for production
task start                         # Start production server

# Database
task db:push                       # Push schema
task db:studio                     # Open Drizzle Studio
task db:migrate                    # Generate migrations

# Code Quality
task lint                          # Run ESLint
task format                        # Format with Prettier
task type-check                    # TypeScript check
task test                          # Run tests

# Observability
task metrics:start                 # Start Victoria stack
task metrics:stop                  # Stop Victoria stack
task metrics:restart               # Restart Victoria stack
task metrics:logs                  # View logs
task metrics:status                # Show status
task grafana:open                  # Open Grafana

# Monitoring
task ps                            # Container status
task stats                         # Resource usage
```

## Support

For issues or questions:
1. Check logs: `task dev:logs` or `task metrics:logs`
2. Review documentation in `/docs/`
3. Validate configuration with commands above
4. Check Traefik routing and DNS records

**Status**: All services operational and ready for development
