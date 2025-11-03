# Pressograph - Pressure Test Visualizer

> Modern web application for visualizing and analyzing pressure test results

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.0-brightgreen.svg)](docs/releases/v1.1.0-2025-10-29.md)
[![Node.js](https://img.shields.io/badge/node-22.x-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-19.2.0-blue.svg)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/postgresql-18-blue.svg)](https://www.postgresql.org)
[![Podman](https://img.shields.io/badge/podman-ready-purple.svg)](https://podman.io)

## ✨ What's New in v1.1.0

**Infrastructure Modernization & Observability Stack** (2025-10-29)

- 📊 Full observability stack with VictoriaMetrics, VictoriaLogs, Grafana, and Tempo
- 🔐 Auto-generated secrets with `make init-env-dev` and `make init-env-prod`
- 🐳 Compose Specification 2025 compliance
- 🛡️ Enhanced security (resource limits, SELinux, capability dropping)
- ✅ All containers healthy (fixed IPv6 healthcheck issues)
- 🔄 Fixed Vite HMR over HTTPS/WSS
- 🌐 Fixed i18n system in Profile, Help, Admin, and History pages

[View Full Release Notes →](./docs/releases/v1.1.0-2025-10-29.md)

## 📚 Documentation

Complete documentation is available in the [`docs/`](./docs/) directory:

- **[Getting Started](./docs/onboarding/human/installation.md)** - Installation and setup guide
- **[Project Overview](./docs/onboarding/human/README.md)** - Project structure and architecture
- **[Compose Deployment](./docs/development/containerization/START_HERE.md)** - Docker/Podman Compose quickstart
- **[Observability](./docs/development/grafana/QUICKSTART.md)** - Monitoring, metrics, logs, and tracing
- **[API Documentation](./docs/api/overview.md)** - REST API reference
- **[Server Documentation](./docs/api/SERVER_API.md)** - Backend architecture and development
- **[Development Guide](./docs/onboarding/human/CONTRIBUTING.md)** - Contributing and development workflow
- **[Release Notes](./docs/releases/release-notes.md)** - Version history and changelogs

### Quick Links

| Topic                       | Link                                                                     |
| --------------------------- | ------------------------------------------------------------------------ |
| 🚀 Quick Start              | [Compose Quick Start](./docs/development/containerization/START_HERE.md) |
| 🛠️ Development Setup        | [Development Guide](./docs/onboarding/human/CONTRIBUTING.md)             |
| 📊 Observability Stack      | [Observability Setup](./docs/development/grafana/README.md)              |
| 🔒 Security Policy          | [Security](./docs/onboarding/human/SECURITY.md)                          |
| 📖 API Design               | [API Design](./docs/api/API_DESIGN.md)                                   |
| 🔌 **Interactive API Docs** | **[Swagger UI](https://pressograph.infra4.dev/api-docs)**                |
| 📝 Release Notes            | [Release Notes](./docs/releases/release-notes.md)                        |

## 🎯 Tech Stack

### Frontend (React 19)

- **Framework**: React 19.2.0 with TypeScript 5.9
- **Build Tool**: Vite 7.1.12
- **UI Library**: HeroUI 2.8.5 (components) + Tailwind CSS 4.1.16
- **State Management**: Zustand 5.x with useShallow optimization
- **Internationalization**: i18next + react-i18next (Russian/English)
- **Routing**: React Router 7.9.4
- **Canvas Rendering**: Native Canvas API with high-res scaling
- **Date Handling**: date-fns 4.1.0

### Backend (Node.js 22)

- **Runtime**: Node.js 22 LTS (Debian Trixie)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 18 with Drizzle ORM
- **Authentication**: JWT with role-based access control (RBAC)
- **Logging**: Morgan + structured logging
- **API Documentation**: Swagger/OpenAPI 3.0

### Infrastructure & Observability

- **Container Runtime**: Podman (rootless) with Compose Spec 2025
- **Reverse Proxy**: Traefik v3 with automatic HTTPS (Cloudflare SSL)
- **Metrics**: VictoriaMetrics for time-series data
- **Logs**: VictoriaLogs + Promtail for aggregation
- **Tracing**: Tempo for distributed tracing
- **Visualization**: Grafana with pre-configured dashboards
- **Exporters**: Postgres, Node, cAdvisor

### Development Environment

- **Status**: ✅ Fully operational at https://dev-pressograph.infra4.dev
- **Hot Reload**: Vite HMR over WSS, Node.js with nodemon
- **Database**: PostgreSQL 18 (development instance)
- **Secrets**: Auto-generated with `make init-env-dev`

## 🐳 Containerization

This project uses **Podman** (rootless, daemonless container engine) and follows the technology stack standards from [Project Genesis](../project-genesis).

### Container Architecture

**Frontend:**

- **Build Stage**: `node:lts-trixie` (Debian Trixie)
- **Runtime Stage**: `nginx:1.29-trixie-perl` (Debian Trixie)
- **Multi-stage Build**: Compiles React app with Vite, serves static files with Nginx
- **Security**: Non-root user (nginx:101), read-only filesystem, minimal capabilities
- **Health Check**: HTTP check on `/health` endpoint

**Backend:**

- **Build Stage**: `node:lts-trixie` (Debian Trixie)
- **Runtime Stage**: `node:lts-trixie` (Debian Trixie)
- **Multi-stage Build**: Compiles TypeScript, installs Canvas dependencies
- **Security**: Non-root user (nodejs:1001), capability dropping, dumb-init
- **Health Check**: Node.js HTTP check on `/health` endpoint
- **Dependencies**: Canvas graphics libraries, font packages for text rendering

**Database:**

- **Image**: `postgres:18-trixie` (Debian Trixie)
- **Security**: Non-root user (postgres:999), isolated internal network
- **Health Check**: `pg_isready` command

### Why Podman? (Not Docker)

Following [Project Genesis standards](../project-genesis/docs/guides/CONTAINERIZATION_GUIDE.md), we use Podman because:

1. **Rootless by Default**: No daemon running as root
2. **Daemonless**: No background service required
3. **OCI Compatible**: Works with Docker images and Dockerfiles
4. **Kubernetes-Ready**: Pod support built-in
5. **Security First**: SELinux integration, user namespaces
6. **Drop-in Replacement**: `alias docker=podman` works seamlessly

### Base Image Policy: NO Alpine

This project follows a strict **NO Alpine** policy (Project Genesis standard):

- ✅ **Using**: Debian Trixie-based images (`node:lts-trixie`, `nginx:1.29-trixie-perl`, `postgres:18-trixie`)
- ❌ **Not Using**: Alpine Linux (compatibility issues, glibc vs musl)
- ✅ **Why Debian**: Better compatibility, more packages, stable base

### Quick Start with Podman

#### Prerequisites

```bash
# Install Podman (if not already installed)
# Fedora/RHEL/CentOS:
sudo dnf install podman podman-compose

# Debian/Ubuntu:
sudo apt install podman podman-compose

# Verify installation
podman --version
podman-compose --version
```

#### Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd pressograph

# Initialize environment with auto-generated secrets
make init-env-dev

# Start development environment with Podman Compose
make dev-compose

# Or manually:
podman-compose -f deploy/compose/compose.dev.yaml --env-file deploy/compose/.env.dev up -d

# Check status
podman-compose -f deploy/compose/compose.dev.yaml ps

# View logs
podman-compose -f deploy/compose/compose.dev.yaml logs -f

# Stop environment
podman-compose -f deploy/compose/compose.dev.yaml down
```

#### Production Deployment

```bash
# Initialize production environment (creates .env.prod with strong secrets)
make init-env-prod

# IMPORTANT: Review and update deploy/compose/.env.prod
# - Set ALLOWED_ORIGINS to your production domain
# - Set BASE_URL to your production domain
# - Verify all security settings

# Build production images
make build-images

# Start production environment
make prod-compose

# Or manually:
podman-compose -f deploy/compose/compose.prod.yaml --env-file deploy/compose/.env.prod up -d

# Check health
curl https://pressograph.infra4.dev/health
```

### Building Images with Buildah

```bash
# Frontend
buildah bud -f deploy/Containerfile \
  --tag localhost/pressograph-frontend:latest \
  --build-arg VERSION=1.2.0 \
  --build-arg VITE_API_URL=/api \
  --build-arg BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  .

# Backend
buildah bud -f server/Dockerfile \
  --tag localhost/pressograph-backend:latest \
  --build-arg VERSION=1.2.0 \
  --build-arg BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  server/
```

### Container Best Practices (Implemented)

✅ **Multi-stage builds**: Separate build and runtime stages
✅ **Non-root users**: All services run as non-root
✅ **Pinned versions**: All base images and dependencies pinned
✅ **Health checks**: All services have health checks
✅ **Resource limits**: CPU and memory limits defined
✅ **Security hardening**: Capability dropping, read-only FS where possible
✅ **OCI labels**: Metadata for inventory management
✅ **Log rotation**: Prevents disk space issues
✅ **SELinux support**: Volume mounts with `:z` suffix
✅ **Compose Spec 2025**: Modern compose file format

### Compose Environments

| Environment       | File                                        | Purpose               | Features                                       |
| ----------------- | ------------------------------------------- | --------------------- | ---------------------------------------------- |
| **Development**   | `deploy/compose/compose.dev.yaml`           | Local development     | Hot reload, auto npm install, relaxed security |
| **Production**    | `deploy/compose/compose.prod.yaml`          | Production deployment | Hardened, read-only FS, minimal capabilities   |
| **Observability** | `deploy/compose/compose.observability.yaml` | Monitoring stack      | VictoriaMetrics, Grafana, Tempo                |

### Migration from Docker

If you were using Docker before:

```bash
# Option 1: Alias (recommended for compatibility)
alias docker=podman
alias docker-compose=podman-compose

# Option 2: Use podman commands directly
# All docker commands work with podman:
podman ps
podman images
podman build -t myimage .
podman-compose up -d
```

**What's Different:**

- No daemon: Podman doesn't require a background service
- Rootless by default: Safer, runs as your user
- Pod support: Can group containers into pods (like Kubernetes)
- Systemd integration: Generate systemd units with `podman generate systemd`

**What's the Same:**

- CLI commands are identical
- Dockerfile/Containerfile format
- Image format (OCI compatible)
- Registry support (Docker Hub, quay.io, etc.)

See [CONTAINERIZATION_MIGRATION.md](./docs/development/containerization/CONTAINERIZATION_MIGRATION.md) for detailed migration guide.

### Troubleshooting

**Issue: Permission denied on volumes**

```bash
# Solution: Use :z suffix for SELinux relabeling (already configured)
# Example: ./server:/app:z
```

**Issue: Container can't connect to host**

```bash
# Solution: Use host.containers.internal instead of localhost
# Example: DATABASE_URL=postgresql://host.containers.internal:5432/db
```

**Issue: Port already in use**

```bash
# Solution: Check for conflicting containers
podman ps -a
podman stop <container-name>
```

For more issues, see [Project Genesis Containerization Guide](../project-genesis/docs/guides/CONTAINERIZATION_GUIDE.md).

## 🚀 Quick Start

### Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd pressure-test-visualizer

# Initialize environment with auto-generated secrets
make init-env-dev

# Start development environment
make dev-compose

# Access the application
open https://dev-pressograph.infra4.dev
```

**Available Commands:**

- `make gen-secrets` - Generate random secrets (display only)
- `make init-env-dev` - Create .env.dev with auto-generated secrets
- `make dev-compose` - Start development environment
- `make observability-full` - Start full observability stack (Grafana, VictoriaMetrics, etc.)

### Production Deployment

```bash
# Initialize production environment (creates .env.prod with strong secrets)
make init-env-prod

# IMPORTANT: Review and update .env.prod
# - Set ALLOWED_ORIGINS to your production domain
# - Set BASE_URL to your production domain
# - Verify all security settings

# Start production environment
make prod-compose

# Access the application
open https://pressograph.infra4.dev
```

**Security Notes:**

- Never commit `.env` files to git
- Use different secrets for each environment
- Rotate secrets every 90 days in production
- Store secrets in a password manager

## 📖 Full Documentation Index

See [`docs/index.md`](./docs/index.md) for the complete documentation index.

## 🔄 Development Process

This project follows the **Scrum methodology** with AI-assisted development.

### Working with AI Agents

This project uses AI-assisted development following the [Project Genesis Scrum framework](../project-genesis).

#### For Humans: Onboarding an AI Agent

See [User Actions for AI Development](docs/onboarding/human/USER_ACTIONS_FOR_AI_DEVELOPMENT.md) for complete guide.

**Quick Start:**

1. **Verify prerequisites**: Project Genesis accessible, .scrum-config configured
2. **Create sprint milestone**: Define Sprint Goal and assign issues
3. **Point AI agent to documentation**: AI Agent Onboarding Guide
4. **Assign first issue**: 2-3 point starter issue from current sprint
5. **Review PRs daily**: Approve, request changes, or comment
6. **Monitor progress**: Check daily updates, unblock when needed
7. **Run Sprint ceremonies**: Planning, Daily Scrum, Review, Retrospective

**Your Daily Checklist** (30-60 minutes):

- [ ] Review PRs awaiting approval
- [ ] Check in-progress issues for daily updates
- [ ] Respond to blockers and questions
- [ ] Monitor sprint progress (velocity, burndown)

**Resources:**

- [User Actions for AI Development](docs/onboarding/human/USER_ACTIONS_FOR_AI_DEVELOPMENT.md) - What YOU need to do
- [AI Agent Onboarding Example](docs/examples/AI_AGENT_ONBOARDING_EXAMPLE.md) - Complete conversation template
- [First Issue Template](docs/examples/FIRST_ISSUE_FOR_AI_AGENT.md) - Ready-to-use starter issue

#### For AI Agents: Getting Started

See [AI Agent Quick Start](docs/onboarding/ai-agent/AI_AGENT_QUICK_START.md) for immediate onboarding.

**Mandatory Reading** (~30 minutes):

1. **AI Agent Operating Manual** (20 min) - Complete workflow:
   - `/opt/projects/repositories/project-genesis/docs/scrum/AI_AGENT_INSTRUCTIONS.md`

2. **Definition of Done** (5 min) - Quality checklist:
   - `/opt/projects/repositories/project-genesis/docs/scrum/DEFINITION_OF_DONE.md`

3. **Pressograph README** (5 min) - This file (tech stack, setup)

4. **Pressograph Configuration** (2 min):
   - `.scrum-config` - Project-specific settings

**Quick Reference:**

```
WORKFLOW: Issue → Branch → TDD → PR → Review → Merge → Close
WIP LIMIT: Max 2 in-progress issues
DAILY: Update issues by 10:00 UTC
DOD: 12 universal criteria (code, tests, docs, i18n, a11y, performance, security)
SPRINT: 2 weeks, 25 story points velocity target
```

**Resources:**

- [AI Agent Quick Start](docs/onboarding/ai-agent/AI_AGENT_QUICK_START.md) - Condensed checklist
- [AI Agent Onboarding Guide](docs/onboarding/ai-agent/AI_AGENT_ONBOARDING.md) - Complete onboarding process
- [AI Agent Onboarding Example](docs/examples/AI_AGENT_ONBOARDING_EXAMPLE.md) - Conversation template

#### Current Sprint

**Check current sprint milestone:**

```bash
gh issue list --milestone "$(gh api repos/dantte-lp/pressograph/milestones | jq -r '.[0].title')"
```

**Sprint Info:**

- **Duration**: 2 weeks (Monday to Sunday)
- **Velocity Target**: 25 story points
- **Story Point Scale**: Fibonacci (1, 2, 3, 5, 8, 13)
- **WIP Limit**: 2 in-progress issues per agent

**View sprint progress:**

```bash
# Completed work
gh issue list --milestone "Sprint 1" --state closed

# In-progress work
gh issue list --milestone "Sprint 1" --label "sprint:in-progress"

# Remaining work
gh issue list --milestone "Sprint 1" --state open
```

### For AI Agents and Developers

This project was initialized from **[Project Genesis](../project-genesis)**, our universal Scrum framework.

**📚 All Scrum Documentation**: See [Project Genesis Scrum Docs](../project-genesis/docs/scrum/)

**⚙️ Project Configuration**: See [.scrum-config](./.scrum-config) for Pressograph-specific settings

### Pressograph-Specific Documentation

Project-specific documentation is in:

- `/docs/development/architecture/` - Architecture and refactoring plans
- `/docs/reports/HANDOFF_REPORT_INFRASTRUCTURE.md` - Infrastructure setup and status
- `/docs/reports/HANDOFF_REPORT_FRONTEND.md` - Frontend architecture and status
- `/docs/releases/` - Sprint release notes
- `/docs/reports/REFACTORING_SESSION_2025-10-31.md` - Development session notes

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/onboarding/human/CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

For security concerns, please refer to our [Security Policy](./docs/onboarding/human/SECURITY.md).
