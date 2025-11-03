# Pressograph Infrastructure Analysis & Modernization Plan

**Date:** 2025-10-31
**Version:** 1.2.0
**Status:** Container Infrastructure Modernization in Progress

---

## Executive Summary

This document provides a comprehensive analysis of the Pressograph project's container infrastructure, identifies critical build errors, and outlines the modernization plan to align with 2025 best practices for Podman, Buildah, and the Compose Specification.

### Current State

- **Frontend:** React 19.2.0, Vite 7.1.12, TypeScript 5.9.3
- **Backend:** Express.js, Node.js LTS, PostgreSQL 18
- **Testing:** 82 tests passing, 87.29% coverage
- **Container Tools:** Podman, Buildah (Podman Compose available)
- **Deployment:** Mixed approach (pods, compose files, Makefile targets)

### Critical Issues Found

1. ❌ **Backend Dockerfile** - Migration directory copy fails (build context issue)
2. ✅ **Compose Files** - Already modernized to compose-spec 2025
3. ⚠️ **Makefile** - Functional but could be improved
4. ℹ️ **No pods/pressograph-backend** - Directory doesn't exist (mentioned in error but not found)

---

## 1. Project Structure Analysis

### Directory Layout

```
/opt/projects/repositories/pressograph/
├── src/                          # React frontend source
│   ├── components/              # React components
│   ├── pages/                   # Route pages
│   ├── services/                # API services
│   ├── store/                   # Zustand state management
│   ├── utils/                   # Utility functions
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Entry point
│
├── server/                      # Backend API
│   ├── src/                     # TypeScript source
│   ├── dist/                    # Compiled JavaScript
│   ├── migrations/              # PostgreSQL migrations
│   ├── package.json             # Backend dependencies
│   ├── Dockerfile               # Backend container image
│   └── tsconfig.json
│
├── deploy/                      # Deployment configurations
│   ├── compose/                 # Compose files and env configs
│   │   ├── compose.dev.yaml     # Development environment
│   │   ├── compose.prod.yaml    # Production environment
│   │   ├── compose.observability.yaml  # Monitoring stack
│   │   ├── .env.dev             # Dev environment variables
│   │   ├── .env.prod            # Prod environment variables
│   │   └── .env.example         # Template
│   ├── postgres/                # PostgreSQL config
│   ├── grafana/                 # Grafana dashboards
│   ├── Containerfile            # Frontend production image
│   └── nginx.conf               # Nginx config for frontend
│
├── pods/                        # Kubernetes-style pod manifests
│   ├── pressograph-db/          # Database pod config
│   └── shared/                  # Shared configs
│
├── docs/                        # Comprehensive documentation
├── backups/                     # Database backups
├── package.json                 # Frontend dependencies
├── vite.config.ts               # Vite configuration
├── Makefile                     # Build and deployment automation
└── VERSION                      # 1.2.0
```

### Technology Stack

#### Frontend

- **Framework:** React 19.2.0 (latest stable)
- **Build Tool:** Vite 7.1.12 (extremely fast HMR)
- **UI Library:** HeroUI 2.8.5 (modern component library)
- **Styling:** Tailwind CSS 4.1.16
- **State Management:** Zustand 5.0.8
- **Testing:** Vitest 4.0.5, React Testing Library 16.3.0
- **TypeScript:** 5.9.3

#### Backend

- **Runtime:** Node.js LTS (lts-trixie)
- **Framework:** Express.js 4.18.2
- **Database:** PostgreSQL 18-trixie
- **Authentication:** JWT (jsonwebtoken 9.0.2)
- **Graphics:** Canvas 3.2.0 (for PNG generation)
- **PDF Generation:** PDFKit 0.17.2
- **TypeScript:** 5.3.3

#### Container Infrastructure

- **Container Engine:** Podman (rootless capable)
- **Build Tool:** Buildah (OCI-compliant builds)
- **Orchestration:** Podman Compose
- **Networking:** CNI plugins, Traefik reverse proxy
- **Base Images:**
  - Frontend: `node:lts-trixie` (build), `nginx:1.29-trixie-perl` (prod)
  - Backend: `node:lts-trixie`
  - Database: `postgres:18-trixie`

---

## 2. Critical Build Errors Analysis

### Error 1: Backend Dockerfile - COPY migrations fails

**Error Message:**

```
Error: building at STEP "COPY --from=builder /app/migrations ./migrations":
checking on sources under "/var/lib/containers/storage/overlay/...":
copier: stat: "/app/migrations": no such file or directory
```

**Root Cause:**

- The Dockerfile uses multi-stage build with `FROM node:lts-trixie AS builder`
- Stage 1 (builder) copies source with `COPY . .` which includes migrations/
- Stage 2 tries to `COPY --from=builder /app/migrations ./migrations`
- The issue: migrations/ is being copied in stage 1, but the build might be failing before completion OR migrations is in .dockerignore

**Investigation Results:**

```dockerfile
# server/Dockerfile - Lines 30-31
COPY . .
# Stage 2 - Line 79
COPY --from=builder /app/migrations ./migrations
```

**Solution:**
The Dockerfile looks correct. The issue is likely:

1. Build context is wrong (should be `server/` directory, not project root)
2. migrations/ directory doesn't exist in server/
3. .dockerignore excludes migrations/

**Fix:**

- Ensure build context is `server/` directory: `buildah bud -f server/Dockerfile server/`
- Verify migrations/ directory exists in server/
- Check .dockerignore doesn't exclude migrations/

### Error 2: pods/pressograph-backend - package.json not found

**Error Message:**

```
Error: building at STEP "COPY package*.json ./":
checking on sources under "/opt/projects/repositories/pressograph/pods/pressograph-backend":
Rel: can't make relative to /opt/projects/repositories/pressograph/pods/pressograph-backend;
copier: stat: ["/package*.json"]: no such file or directory
```

**Root Cause:**

- Build is trying to use `pods/pressograph-backend` directory as build context
- This directory does NOT exist in the project (only `pods/pressograph-db/` and `pods/shared/` exist)
- Makefile line 234: `buildah bud ... -f $(PODS_DIR)/pressograph-backend/Containerfile $(PROJECT_ROOT)/server`

**Investigation Results:**

```bash
$ ls -la /opt/projects/repositories/pressograph/pods/
drwxr-xr-x@ - root 28 Oct 22:58 pressograph-db
drwxr-xr-x@ - root 28 Oct 22:59 shared
# NO pressograph-backend directory!
```

**Solution:**

- Remove references to non-existent `pods/pressograph-backend` directory
- Use `server/Dockerfile` directly (which already exists and is correct)
- Update Makefile to use correct paths

### Error 3: complete-deployment.sh exit code 1

**Error Message:**

```
Exit code: 1
Message: "nothing to commit, working tree clean"
```

**Root Cause:**

- Script tries to commit changes with git
- Git exits with code 1 when there are no changes to commit
- This is expected behavior, not an actual error

**Solution:**

- Update script to check for changes before committing
- Use `git diff --quiet && echo "No changes" || git commit`
- Or suppress the error if no changes is acceptable

---

## 3. Compose Files Assessment

### compose.dev.yaml - ✅ EXCELLENT

**Status:** Already modernized to compose-spec 2025 standards

**Strengths:**

- ✅ No `version:` field (correctly omitted per compose-spec 2025)
- ✅ YAML anchors for DRY configuration (`x-common-labels`, `x-common-logging`, `x-common-security`)
- ✅ Proper healthchecks with `start_period` for slow-starting services
- ✅ Resource limits on all services
- ✅ Security hardening (`no-new-privileges`, `cap_drop: ALL`, minimal `cap_add`)
- ✅ Log rotation configured (`k8s-file` driver, `max-size: 10m`, `max-file: 3`)
- ✅ SELinux compatibility (`:z` suffix on volume mounts)
- ✅ Proper network isolation (`internal: true` for database network)
- ✅ OCI standard labels for metadata
- ✅ Traefik integration with proper labels
- ✅ Development features (hot reload, auto npm install)

**Services:**

1. **postgres** - PostgreSQL 18, isolated in internal network
2. **backend** - Node.js with hot reload (nodemon via `npm run dev`)
3. **frontend** - Vite dev server with HMR on port 5173

**Networks:**

- `traefik-public` - External network (connects to Traefik)
- `internal` - Internal network for database (no internet access)

**Volumes:**

- Persistent: `postgres-dev-data`
- Cache: `backend-dev-node-modules`, `frontend-dev-node-modules`

**Minor Improvements Needed:**

- Add WebSocket support explicitly for Vite HMR through Traefik

### compose.prod.yaml - ✅ EXCELLENT

**Status:** Already modernized to compose-spec 2025 standards

**Strengths:**

- ✅ All compose-spec 2025 best practices (same as dev)
- ✅ Enhanced security (read-only filesystem for frontend, strict capabilities)
- ✅ Production resource limits (higher for performance)
- ✅ Compressed JSON logs (`compress: true`)
- ✅ Image references: `localhost/pressograph-frontend:${VERSION:-latest}`
- ✅ Traefik TLS with strict options
- ✅ Health check integration with Traefik load balancer
- ✅ Proper dependency management with `depends_on` conditions

**Services:**

1. **postgres** - PostgreSQL 18, 1GB RAM, custom config
2. **backend** - Built image from `localhost/pressograph-backend:latest`
3. **frontend** - Built image from `localhost/pressograph-frontend:latest`, Nginx with read-only FS

**Networks:**

- `traefik-public` - External (Traefik connection)
- `pressograph-internal` - Isolated database network with custom subnet

**Volumes:**

- Critical: `postgres_data` (backup labels configured)
- Important: `backend_uploads`, `backend_exports`
- Logs: `backend_logs`

**Minor Improvements Needed:**

- Ensure images are built before deployment
- Add image build instructions to Makefile

---

## 4. Dockerfile/Containerfile Analysis

### Frontend Containerfile (deploy/Containerfile) - ✅ GOOD

**Status:** Functional multi-stage build, minor improvements needed

**Current Structure:**

```dockerfile
# Stage 1: Build React app
FROM node:lts-trixie AS builder
COPY package*.json ./
RUN npm install --prefer-offline --no-audit
COPY . .
RUN npm run build

# Stage 2: Nginx production server
FROM nginx:1.29-trixie-perl
COPY --from=builder /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
EXPOSE 80
HEALTHCHECK CMD curl -f http://localhost:80/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

**Strengths:**

- ✅ Multi-stage build (reduces final image size)
- ✅ Healthcheck configured
- ✅ Custom nginx config
- ✅ Clean layer caching

**Improvements Needed:**

- Add OCI labels for metadata
- Add build args for `VITE_API_URL`, `VERSION`, `BUILD_DATE`
- Use nginx-alpine for smaller base image (optional)
- Add non-root user (nginx already runs as user 101)
- Add security hardening

### Backend Dockerfile (server/Dockerfile) - ✅ EXCELLENT

**Status:** Modern multi-stage build with best practices

**Current Structure:**

```dockerfile
# Stage 1: Build with canvas dependencies
FROM node:lts-trixie AS builder
RUN apt-get update && apt-get install -y build-essential libcairo2-dev ...
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# Stage 2: Production with minimal runtime
FROM node:lts-trixie
RUN apt-get update && apt-get install -y dumb-init libcairo2 fontconfig fonts-dejavu-core ...
RUN groupadd -g 1001 nodejs && useradd -r -u 1001 -g nodejs nodejs
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3001
HEALTHCHECK CMD node -e "require('http').get(...)"
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

**Strengths:**

- ✅ Multi-stage build
- ✅ Non-root user (nodejs:nodejs)
- ✅ dumb-init for proper signal handling
- ✅ Canvas runtime dependencies (fonts fixed for Cyrillic)
- ✅ Healthcheck with proper script
- ✅ Production-only dependencies
- ✅ Clean layer caching

**Improvements Needed:**

- Add OCI labels
- Add build args for `VERSION`, `BUILD_DATE`, `NODE_ENV`
- Ensure migrations directory exists in build context

---

## 5. Makefile Analysis

### Current Makefile - ✅ FUNCTIONAL, ⚠️ NEEDS UPDATES

**Status:** Extensive but has some issues with paths and missing features

**Strengths:**

- ✅ Comprehensive targets (82 total)
- ✅ Color-coded output
- ✅ Help system with `make help`
- ✅ Environment initialization (`init-env-dev`, `init-env-prod`)
- ✅ Secret generation
- ✅ Buildah integration
- ✅ Observability stack management
- ✅ Frontend/backend rebuild targets

**Issues Found:**

1. ❌ Line 219: `-f $(PODS_DIR)/pressograph-frontend/Containerfile` - path doesn't exist
2. ❌ Line 233: `-f $(PODS_DIR)/pressograph-backend/Containerfile` - path doesn't exist
3. ⚠️ Build commands reference non-existent pod directories
4. ⚠️ Build context for backend is `$(PROJECT_ROOT)/server` but Containerfile path is wrong

**Improvements Needed:**

- Fix Containerfile paths to use actual files:
  - Frontend: `deploy/Containerfile`
  - Backend: `server/Dockerfile`
- Update build commands to use correct paths
- Add more comprehensive targets:
  - `make dev` - Start dev environment with Vite HMR
  - `make prod` - Start prod environment
  - `make dev-build` - Build dev images
  - `make prod-build` - Build prod images
  - `make dev-restart` - Restart dev services
  - `make prod-restart` - Restart prod services
  - `make health` - Check health of all services
  - `make ps` - List running containers
  - `make clean` - Deep clean (remove volumes)
  - `make prune` - Prune unused resources

---

## 6. Traefik Integration

### Current Status - ✅ PROPERLY CONFIGURED

**Traefik Location:** `/opt/projects/repositories/traefik`

**Network:** `traefik-public` (external, shared across all projects)

**DEV Environment** (compose.dev.yaml):

- **Frontend:** `dev-pressograph.infra4.dev` → `frontend:5173`
- **Backend API:** `dev-pressograph.infra4.dev/api` → `backend:3001`
- **Middleware:** `web-standard@file` (frontend), `api-gateway@file` (backend)
- **Priority:** API routes = 100, Frontend = 1
- **TLS:** Cloudflare DNS challenge, automatic certificates

**PROD Environment** (compose.prod.yaml):

- **Frontend:** `pressograph.infra4.dev` → `frontend:80`
- **Backend API:** `pressograph.infra4.dev/api` → `backend:3001`
- **Middleware:** `web-standard@file`, `api-gateway@file`
- **TLS Options:** `strict@file`
- **Health Checks:** Integrated with Traefik load balancer

**Strengths:**

- ✅ Automatic HTTPS with Cloudflare
- ✅ Proper path routing (API on /api, frontend on /)
- ✅ Priority-based routing (API higher priority)
- ✅ Security middleware applied
- ✅ Health check integration
- ✅ WebSocket support configured (Vite HMR)

**Improvements Needed:**

- Document WebSocket configuration for dev environment
- Ensure middleware chain is correct in Traefik config

---

## 7. Best Practices Compliance

### Compose Specification 2025 - ✅ COMPLIANT

- ✅ No `version:` field (deprecated)
- ✅ YAML anchors for DRY configuration
- ✅ Resource limits and reservations
- ✅ Healthchecks with proper intervals
- ✅ Security options (no-new-privileges, cap_drop)
- ✅ Logging with rotation
- ✅ OCI standard labels
- ✅ Network isolation
- ✅ Volume labels for backup management

### Podman Best Practices 2025 - ✅ MOSTLY COMPLIANT

- ✅ Rootless-ready (user: node:node, postgres:postgres)
- ✅ SELinux support (`:z` volume labels)
- ✅ CNI networking
- ✅ Pod support (pods/ directory available)
- ✅ systemd integration (Quadlet configs)
- ⚠️ Could use podman secrets instead of .env files (future enhancement)

### Buildah Best Practices 2025 - ⚠️ NEEDS IMPROVEMENTS

- ✅ Multi-stage builds
- ✅ Layer caching with `--layers` flag
- ✅ OCI format with `--format docker`
- ⚠️ Missing OCI labels (need to add)
- ⚠️ Missing build args for versioning
- ⚠️ Could use `buildah from scratch` for smaller images (future)

### Security Best Practices - ✅ GOOD

- ✅ Non-root users in containers
- ✅ Minimal capabilities (cap_drop: ALL)
- ✅ no-new-privileges set
- ✅ Read-only filesystem on frontend (prod)
- ✅ Network isolation for database
- ✅ Secrets management via .env files (gitignored)
- ✅ Strong password generation documented
- ⚠️ Could use podman secrets or vault (future enhancement)

---

## 8. Modernization Plan

### Phase 1: Fix Critical Errors (IMMEDIATE)

**1.1 Fix Backend Dockerfile**

- ✅ Verify migrations/ directory exists in server/
- ✅ Update Makefile to use correct build context
- ✅ Test build: `buildah bud -f server/Dockerfile server/`

**1.2 Fix Makefile Paths**

- ❌ Remove references to `pods/pressograph-backend`
- ❌ Remove references to `pods/pressograph-frontend`
- ✅ Update paths to use actual files:
  - Frontend: `deploy/Containerfile`
  - Backend: `server/Dockerfile`

**1.3 Update Containerfiles**

- Add OCI labels
- Add build args for VERSION, BUILD_DATE
- Ensure proper HEALTHCHECK endpoints exist

### Phase 2: Enhance Makefile (HIGH PRIORITY)

**2.1 Comprehensive DEV Targets**

```makefile
make dev              # Start dev environment (Vite HMR)
make dev-build        # Build dev images
make dev-restart      # Restart dev services
make dev-stop         # Stop dev services
make dev-logs         # Follow dev logs
make dev-shell        # Open shell in container
```

**2.2 Comprehensive PROD Targets**

```makefile
make prod             # Start prod environment
make prod-build       # Build prod images
make prod-restart     # Restart prod services
make prod-stop        # Stop prod services
make prod-logs        # Follow prod logs
make prod-deploy      # Full deployment (build + up)
```

**2.3 Maintenance Targets**

```makefile
make rebuild          # Rebuild all images from scratch
make clean            # Remove containers and volumes
make prune            # Prune unused images
make health           # Check health of all services
make status           # Show status of all services
make ps               # List containers
make images           # List images
make inspect SERVICE  # Inspect service configuration
```

### Phase 3: Create Deployment Scripts (MEDIUM PRIORITY)

**3.1 deploy/dev.sh**

- Pre-flight checks (network, volumes, .env files)
- Build images
- Start services
- Health checks
- Display access URLs

**3.2 deploy/prod.sh**

- Pre-flight checks (stronger validation)
- Build production images
- Database backup before deployment
- Rolling deployment (zero-downtime)
- Health checks and rollback on failure
- Display access URLs and status

**3.3 deploy/health-check.sh**

- Check all service health endpoints
- Check Traefik routing
- Check database connectivity
- Check disk space and resources
- Exit code 0 for healthy, non-zero for issues

**3.4 deploy/backup.sh**

- PostgreSQL dump
- Volume backups
- Retention management
- Compression

### Phase 4: Documentation Updates (MEDIUM PRIORITY)

**4.1 Update README.md**

- Quick start guide
- Architecture overview
- Development workflow
- Production deployment
- Troubleshooting

**4.2 Create deploy/README.md**

- Detailed deployment instructions
- Environment setup
- Traefik configuration
- Secrets management
- Monitoring setup

**4.3 Update CONTRIBUTING.md**

- Development setup
- Testing requirements
- Container build process
- Code review process

### Phase 5: Future Enhancements (LOW PRIORITY)

**5.1 Advanced Security**

- Implement podman secrets instead of .env files
- Add Vault integration for production
- Implement image signing with cosign
- Add SBOM generation

**5.2 CI/CD Integration**

- GitHub Actions for automated builds
- Automated testing in containers
- Automated deployment to staging
- Production deployment approval workflow

**5.3 Monitoring & Observability**

- Prometheus metrics exporters
- Grafana dashboards
- Centralized logging with Loki
- Distributed tracing with Tempo
- Alert rules and notifications

**5.4 Performance Optimization**

- Implement buildah from scratch for minimal images
- Add caching layers for faster builds
- Optimize Vite build for faster HMR
- Implement CDN for static assets

---

## 9. Recommended Commands

### Build Commands

```bash
# Backend
buildah bud \
  --format docker \
  --layers \
  --tag localhost/pressograph-backend:latest \
  --tag localhost/pressograph-backend:1.2.0 \
  --file server/Dockerfile \
  --build-arg VERSION=1.2.0 \
  --build-arg BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --build-arg NODE_ENV=production \
  server/

# Frontend
buildah bud \
  --format docker \
  --layers \
  --tag localhost/pressograph-frontend:latest \
  --tag localhost/pressograph-frontend:1.2.0 \
  --file deploy/Containerfile \
  --build-arg VITE_API_URL=/api \
  --build-arg VERSION=1.2.0 \
  --build-arg BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  .
```

### Development Workflow

```bash
# Start development environment
cd /opt/projects/repositories/pressograph
podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev up -d

# Follow logs
podman-compose -f deploy/compose/compose.dev.yaml logs -f

# Restart specific service
podman-compose -f deploy/compose/compose.dev.yaml restart backend

# Stop environment
podman-compose -f deploy/compose/compose.dev.yaml down
```

### Production Workflow

```bash
# Build production images
make prod-build

# Start production environment
podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod up -d

# Check health
curl https://pressograph.infra4.dev/api/health
curl https://pressograph.infra4.dev/health

# View logs
podman-compose -f deploy/compose/compose.prod.yaml logs -f --tail 100

# Database backup
podman exec pressograph-db pg_dump -U pressograph pressograph > backup_$(date +%Y%m%d).sql
```

---

## 10. Testing Strategy

### Container Builds

```bash
# Test backend build
buildah bud -f server/Dockerfile server/

# Test frontend build
buildah bud -f deploy/Containerfile .

# Inspect images
podman images | grep pressograph
skopeo inspect containers-storage:localhost/pressograph-backend:latest
```

### Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Frontend health
curl http://localhost:80/health

# Database health
podman exec pressograph-dev-postgres pg_isready -U pressograph_dev
```

### Integration Tests

```bash
# Start dev environment
make dev

# Run frontend tests
npm run test

# Run backend tests (if implemented)
cd server && npm test

# Check Traefik routing
curl -I https://dev-pressograph.infra4.dev
curl https://dev-pressograph.infra4.dev/api/health
```

---

## 11. Next Steps

### Immediate Actions (Today)

1. ✅ **Fix Makefile paths** - Update build-frontend and build-backend targets
2. ✅ **Update Containerfiles** - Add OCI labels and build args
3. ✅ **Test builds** - Verify both frontend and backend build successfully
4. ✅ **Update documentation** - Create DEPLOYMENT_MODERNIZATION.md

### Short-term (This Week)

5. ✅ **Create deployment scripts** - dev.sh, prod.sh, health-check.sh
6. ✅ **Enhance Makefile** - Add comprehensive targets
7. ✅ **Test full workflow** - Dev and prod environments
8. ✅ **Update GitHub issues** - Document infrastructure improvements

### Medium-term (This Month)

9. ⚠️ **Implement CI/CD** - GitHub Actions for automated builds
10. ⚠️ **Add monitoring** - Metrics, logs, traces
11. ⚠️ **Security audit** - Review and harden all configurations
12. ⚠️ **Performance optimization** - Faster builds, smaller images

---

## 12. Conclusion

The Pressograph project has a **solid foundation** with modern technologies and mostly correct infrastructure:

**Strengths:**

- ✅ Modern compose files (compose-spec 2025 compliant)
- ✅ Excellent security practices
- ✅ Proper Traefik integration
- ✅ Comprehensive Makefile
- ✅ Good documentation
- ✅ Active development (82 tests, 87% coverage)

**Critical Issues:**

- ❌ Makefile references non-existent pod directories
- ⚠️ Containerfiles missing OCI labels and build args

**Priority Actions:**

1. Fix Makefile paths (15 minutes)
2. Update Containerfiles (30 minutes)
3. Test builds (15 minutes)
4. Create deployment scripts (1-2 hours)
5. Update documentation (30 minutes)

**Total Time to Fix:** 3-4 hours

After these fixes, the infrastructure will be **production-ready** and follow all 2025 best practices for Podman, Buildah, and Compose Specification.

---

**Document Version:** 1.0
**Last Updated:** 2025-10-31
**Author:** Infrastructure Team
**Status:** Ready for Implementation
