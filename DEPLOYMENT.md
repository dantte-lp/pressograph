# Pressograph Deployment Guide

## Container Rebuild and Deployment (Buildah/Podman)

This guide covers rebuilding and deploying Pressograph using the buildah/podman toolchain following Compose Spec 2025 standards.

---

## Prerequisites

- **Buildah** 1.29+ (for building container images)
- **Podman** 4.4+ (for running containers)
- **Podman-compose** (for orchestration)
- **Skopeo** (optional, for image operations)
- **Make** (for using Makefile targets)

### Verify Tools

```bash
make validate-tools
```

---

## Quick Start

### Production Deployment

```bash
# Full rebuild and deploy (recommended)
make full-prod

# Or step-by-step:
make rebuild-all-prod    # Rebuild frontend + backend
make deploy-all-prod     # Deploy all services
```

### Development Environment

```bash
# Start dev environment (hot reload enabled)
make dev-compose

# Or using Makefile:
make dev-up              # Start dev environment
make dev-logs            # View logs
make dev-down            # Stop dev environment
```

---

## Makefile Targets Reference

### Production Targets

| Target                  | Description                              |
| ----------------------- | ---------------------------------------- |
| `rebuild-frontend-prod` | Rebuild frontend container with buildah  |
| `rebuild-backend-prod`  | Rebuild backend container with buildah   |
| `rebuild-all-prod`      | Rebuild both frontend and backend        |
| `deploy-frontend-prod`  | Deploy frontend (restart with new image) |
| `deploy-backend-prod`   | Deploy backend (restart with new image)  |
| `deploy-all-prod`       | Deploy all services                      |
| `full-prod`             | Complete rebuild and deployment          |
| `restart-prod`          | Restart all services without rebuild     |
| `down-prod`             | Stop all production services             |
| `status-prod`           | Show production environment status       |
| `logs-frontend-prod`    | Show frontend logs (follow mode)         |
| `logs-backend-prod`     | Show backend logs (follow mode)          |

### Development Targets

| Target                 | Description                              |
| ---------------------- | ---------------------------------------- |
| `dev-compose`          | Start dev environment via podman-compose |
| `rebuild-frontend-dev` | Rebuild dev frontend container           |
| `deploy-frontend-dev`  | Deploy dev frontend                      |
| `frontend-dev`         | Full dev frontend rebuild and deploy     |
| `logs-frontend-dev`    | Show dev frontend logs                   |
| `status-dev`           | Show dev environment status              |

### Environment Setup

| Target          | Description                                |
| --------------- | ------------------------------------------ |
| `init-env-dev`  | Initialize .env.dev with generated secrets |
| `init-env-prod` | Initialize .env.prod with STRONG secrets   |
| `gen-secrets`   | Generate random secrets for manual use     |

---

## Image Registry

All images are tagged with `localhost/` prefix for local registry:

- **Frontend:** `localhost/pressograph-frontend:latest` (also tagged with version)
- **Backend:** `localhost/pressograph-backend:latest` (also tagged with version)

### View Built Images

```bash
podman images | grep pressograph
```

Example output:

```
REPOSITORY                        TAG       IMAGE ID      CREATED        SIZE
localhost/pressograph-backend     latest    4ebf9fd361e6  5 minutes ago  489 MB
localhost/pressograph-backend     1.0.0     4ebf9fd361e6  5 minutes ago  489 MB
localhost/pressograph-frontend    latest    63f02c709561  20 minutes ago 210 MB
localhost/pressograph-frontend    1.0.0     63f02c709561  20 minutes ago 210 MB
```

---

## Compose Spec 2025 Compliance

### compose.prod.yaml

- ✅ No `version` field (deprecated since Docker Compose v1.27.0+)
- ✅ Uses pre-built images (no build sections)
- ✅ YAML anchors for DRY configuration
- ✅ OCI standard labels
- ✅ Resource limits on all services
- ✅ Log rotation (10MB max, 5 files)
- ✅ Security hardening (no-new-privileges, cap_drop)
- ✅ Healthchecks with proper start_period
- ✅ Traefik integration with HTTPS

### compose.dev.yaml

- ✅ Hot reload for frontend (Vite HMR)
- ✅ Hot reload for backend (nodemon)
- ✅ Volume mounts with SELinux compatibility (`:z` suffix)
- ✅ Development-specific resource limits
- ✅ Separate dev database (pressograph_dev)

---

## Environment Configuration

### Production (.env.prod)

```bash
# Generate production secrets
make init-env-prod

# Review and customize
vim deploy/compose/.env.prod
```

**Critical variables:**

- `POSTGRES_PASSWORD` - 48+ character random string
- `JWT_SECRET` - 64 character hex string
- `JWT_REFRESH_SECRET` - 64 character hex string (different from JWT_SECRET)
- `ALLOWED_ORIGINS` - https://pressograph.infra4.dev only
- `JWT_EXPIRES_IN` - 5m (production)
- `JWT_REFRESH_EXPIRES_IN` - 24h (production)

### Development (.env.dev)

```bash
# Generate development secrets
make init-env-dev

# Already configured with:
# - Weaker passwords (acceptable for dev)
# - Debug logging enabled
# - Longer token expiry times
# - Multiple allowed origins (localhost, dev domain)
```

---

## Buildah Build Process

### Frontend Build

```bash
# Manual build (Makefile does this for you)
buildah bud \
  --format docker \
  --layers \
  --tag localhost/pressograph-frontend:latest \
  --tag localhost/pressograph-frontend:1.0.0 \
  --file deploy/Containerfile \
  --build-arg VITE_API_URL=/api \
  --build-arg NODE_ENV=production \
  .
```

**Multi-stage build:**

1. Stage 1: Build React app with Node.js 22 + Vite
2. Stage 2: Serve with Nginx 1.29 (Debian Trixie)

**Output:** ~210 MB image

### Backend Build

```bash
# Manual build (Makefile does this for you)
buildah bud \
  --format docker \
  --layers \
  --tag localhost/pressograph-backend:latest \
  --tag localhost/pressograph-backend:1.0.0 \
  --file server/Dockerfile \
  --build-arg NODE_ENV=production \
  server/
```

**Multi-stage build:**

1. Stage 1: Install dependencies + build TypeScript
2. Stage 2: Production runtime with dumb-init + canvas dependencies

**Output:** ~489 MB image

---

## Container Status

### Check Health

```bash
# All containers
make status-prod

# Individual containers
podman ps --filter "name=pressograph"

# Health status detail
podman inspect pressograph-backend | grep -A 10 Health
```

### Expected Output

```
CONTAINER ID  IMAGE                                 STATUS
01af8f3f848e  postgres:18-trixie                    Up 5 minutes (healthy)
8ab2cffe4179  localhost/pressograph-backend:1.0.0   Up 5 minutes (healthy)
da1b533e6f73  localhost/pressograph-frontend:1.0.0  Up 5 minutes (healthy)
```

---

## Accessing Services

### Production

- **Frontend:** https://pressograph.infra4.dev
- **Backend API:** https://pressograph.infra4.dev/api
- **Health Check:** https://pressograph.infra4.dev/api/health

### Development

- **Frontend:** https://dev-pressograph.infra4.dev
- **Backend API:** https://dev-pressograph.infra4.dev/api
- **Health Check:** https://dev-pressograph.infra4.dev/api/health

### Verify Deployment

```bash
# Frontend
curl -I https://pressograph.infra4.dev

# Backend
curl -s https://pressograph.infra4.dev/api/health | jq

# Expected response:
# {
#   "status": "healthy",
#   "uptime": 123.456,
#   "timestamp": "2025-10-31T03:19:43.064Z"
# }
```

---

## Logs

### View Logs

```bash
# Production
make logs-frontend-prod   # Follow frontend logs
make logs-backend-prod    # Follow backend logs

# Development
make logs-frontend-dev
make logs-backend-dev

# Or directly with podman
podman logs --tail 50 pressograph-frontend
podman logs --tail 50 pressograph-backend
podman logs --tail 50 pressograph-db
```

### Log Rotation

**Production:**

- Max size: 10 MB per file
- Max files: 5
- Compression: enabled
- Total max: 50 MB per service

**Development:**

- Max size: 10 MB per file
- Max files: 3
- Total max: 30 MB per service

---

## Database

### Connection

```bash
# Connect to production database
podman exec -it pressograph-db psql -U pressograph -d pressograph

# Connect to dev database
podman exec -it pressograph-dev-postgres psql -U pressograph -d pressograph_dev
```

### Schema Overview

**Tables (7):**

- `users` - User accounts (1 record)
- `graph_history` - Generated graphs (35 records)
- `audit_log` - Audit trail
- `share_links` - Public share links
- `refresh_tokens` - JWT refresh tokens
- `api_keys` - API authentication keys
- `app_settings` - Application settings

**Indexes (32):**

- B-tree indexes on foreign keys and frequently queried columns
- GIN indexes on JSONB columns (`audit_log.details`, `graph_history.settings`)

**Extensions (6):**

- `btree_gin` - GIN indexes on B-tree data
- `btree_gist` - GiST indexes on B-tree data
- `pg_stat_statements` - Query performance monitoring
- `pg_trgm` - Trigram matching for full-text search
- `uuid-ossp` - UUID generation
- `plpgsql` - PL/pgSQL procedural language

**Total Size:** ~728 KB (very efficient)

### Performance Optimization

✅ **Current Status: Excellent**

No immediate optimizations needed. Schema is well-indexed with:

- Proper foreign key indexes
- GIN indexes for JSONB search
- pg_stat_statements for monitoring
- pg_trgm for full-text search

**Future Considerations:**

- Implement partitioning on `graph_history` if >10K records
- Consider archiving old `audit_log` entries after 1 year
- Monitor query performance with pg_stat_statements

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
podman logs pressograph-backend

# Check healthcheck
podman inspect pressograph-backend | grep -A 10 Health

# Restart specific container
podman restart pressograph-backend
```

### Database Connection Issues

```bash
# Check database is healthy
podman exec pressograph-db pg_isready -U pressograph

# Check network connectivity
podman exec pressograph-backend ping -c 3 pressograph-db

# Verify environment variables
podman exec pressograph-backend env | grep -E "(DB_|POSTGRES_)"
```

### Traefik Routing Issues

```bash
# Check Traefik configuration
curl -s https://tr-01.infra4.dev/api/http/routers | jq '.[] | select(.name | contains("pressograph"))'

# Check container labels
podman inspect pressograph-frontend | jq '.[].Config.Labels'
```

### Image Build Failures

```bash
# Clean old images
podman image prune -f

# Rebuild with no cache
buildah bud --no-cache --tag localhost/pressograph-frontend:latest -f deploy/Containerfile .

# Check disk space
df -h
```

### Permission Issues (SELinux)

```bash
# Relabel volumes
podman unshare chown -R 999:999 /var/lib/containers/storage/volumes/pressograph-postgres-data/_data

# Or recreate with correct SELinux context
podman volume rm pressograph-postgres-data
podman volume create pressograph-postgres-data
```

---

## Backup and Restore

### Database Backup

```bash
# Backup to SQL file
podman exec pressograph-db pg_dump -U pressograph pressograph > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
podman exec pressograph-db pg_dump -U pressograph pressograph | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Volume Backup

```bash
# Backup PostgreSQL data volume
podman run --rm \
  -v pressograph-postgres-data:/data:ro \
  -v $(pwd):/backup:z \
  alpine tar czf /backup/postgres_data_$(date +%Y%m%d).tar.gz -C /data .

# Backup uploads volume
podman run --rm \
  -v pressograph-backend-uploads:/data:ro \
  -v $(pwd):/backup:z \
  alpine tar czf /backup/uploads_$(date +%Y%m%d).tar.gz -C /data .
```

### Restore

```bash
# Restore from SQL dump
podman exec -i pressograph-db psql -U pressograph -d pressograph < backup.sql

# Restore volume
podman run --rm \
  -v pressograph-postgres-data:/data \
  -v $(pwd):/backup:ro,z \
  alpine tar xzf /backup/postgres_data_20251031.tar.gz -C /data
```

---

## Security Best Practices

### Secrets Management

✅ **Never commit secrets to git**

```bash
# .gitignore includes:
deploy/compose/.env.prod
deploy/compose/.env.dev
*.env
```

✅ **Use strong passwords**

```bash
# PostgreSQL: 48+ characters
openssl rand -base64 48

# JWT secrets: 64+ characters (hex)
openssl rand -hex 32
```

✅ **Rotate secrets every 90 days**

```bash
# Regenerate and update .env.prod
make init-env-prod

# Redeploy with new secrets
make full-prod
```

### Container Security

- ✅ All containers run as non-root users
- ✅ `no-new-privileges` enabled
- ✅ All capabilities dropped, only essential added
- ✅ Frontend with read-only filesystem + tmpfs mounts
- ✅ Database isolated in internal network

### Network Security

- ✅ Database on internal network only (no internet access)
- ✅ Frontend and backend on Traefik network (HTTPS only)
- ✅ Traefik handles TLS termination
- ✅ Cloudflare in front for DDoS protection

---

## Monitoring

### Resource Usage

```bash
# Real-time stats
podman stats

# One-time snapshot
podman stats --no-stream

# Specific container
podman stats pressograph-backend --no-stream
```

### Healthchecks

```bash
# Check all healthchecks
for container in pressograph-db pressograph-backend pressograph-frontend; do
  echo "=== $container ==="
  podman inspect $container | jq '.[].State.Health'
done
```

### Query Performance (PostgreSQL)

```bash
# Top 10 slowest queries
podman exec pressograph-db psql -U pressograph -d pressograph -c "
SELECT
  calls,
  mean_exec_time::numeric(10,2) as avg_ms,
  total_exec_time::numeric(10,2) as total_ms,
  query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"
```

---

## CI/CD Integration

### Automated Builds

```bash
# In CI pipeline:
make rebuild-all-prod

# Tag with git commit
VERSION=$(git rev-parse --short HEAD)
buildah tag localhost/pressograph-frontend:latest localhost/pressograph-frontend:$VERSION
buildah tag localhost/pressograph-backend:latest localhost/pressograph-backend:$VERSION
```

### Push to Registry

```bash
# If using external registry
skopeo copy \
  containers-storage:localhost/pressograph-frontend:latest \
  docker://registry.example.com/pressograph-frontend:latest
```

---

## Updates and Maintenance

### Update Base Images

```bash
# Pull latest base images
podman pull docker.io/library/node:22-trixie-slim
podman pull docker.io/library/nginx:1.29-trixie-perl
podman pull docker.io/library/postgres:18-trixie

# Rebuild with new base
make rebuild-all-prod
make deploy-all-prod
```

### Update Dependencies

```bash
# Frontend
npm update
npm audit fix

# Backend
cd server && npm update && npm audit fix

# Rebuild
make rebuild-all-prod
```

### Database Migrations

```bash
# Place migration in server/migrations/
# Migrations run automatically on container start
# Check logs:
podman logs pressograph-backend | grep migration
```

---

## Support

### Documentation

- **Main README:** `/opt/projects/repositories/pressograph/README.md`
- **Grafana Observability:** `/opt/projects/repositories/pressograph/deploy/compose/grafana/README.md`
- **This Guide:** `/opt/projects/repositories/pressograph/DEPLOYMENT.md`

### GitHub Issues

- Create issues: https://github.com/dantte-lp/pressograph/issues
- Recent deployment: https://github.com/dantte-lp/pressograph/issues/11

---

**Last Updated:** 2025-10-31
**Deployment Version:** 1.0.0
**Stack:** Buildah/Podman + Compose Spec 2025 + Traefik + PostgreSQL 18
