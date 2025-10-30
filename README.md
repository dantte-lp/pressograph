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

- **[Getting Started](./docs/getting-started/installation.md)** - Installation and setup guide
- **[Project Overview](./docs/project/README.md)** - Project structure and architecture
- **[Compose Deployment](./docs/compose/START_HERE.md)** - Docker/Podman Compose quickstart
- **[Observability](./docs/grafana/QUICKSTART.md)** - Monitoring, metrics, logs, and tracing
- **[API Documentation](./docs/api/overview.md)** - REST API reference
- **[Server Documentation](./docs/server/README.md)** - Backend architecture and development
- **[Development Guide](./docs/project/CONTRIBUTING.md)** - Contributing and development workflow
- **[Release Notes](./docs/release-notes.md)** - Version history and changelogs

### Quick Links

| Topic | Link |
|-------|------|
| 🚀 Quick Start | [Compose Quick Start](./docs/compose/START_HERE.md) |
| 🛠️ Development Setup | [Development Guide](./docs/project/CONTRIBUTING.md) |
| 📊 Observability Stack | [Observability Setup](./docs/grafana/README.md) |
| 🔒 Security Policy | [Security](./docs/project/SECURITY.md) |
| 📖 API Design | [API Design](./docs/API_DESIGN.md) |
| 🔌 **Interactive API Docs** | **[Swagger UI](https://pressograph.infra4.dev/api-docs)** |
| 📝 Release Notes | [Release Notes](./docs/release-notes.md) |
| 📋 Development Roadmap | [TODO](./docs/TODO.md) |

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

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/project/CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

For security concerns, please refer to our [Security Policy](./docs/project/SECURITY.md).
