# Pressograph - Pressure Test Visualizer

> Modern web application for visualizing and analyzing pressure test results

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-22.x-green.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/postgresql-18-blue.svg)](https://www.postgresql.org)

## 📚 Documentation

Complete documentation is available in the [`docs/`](./docs/) directory:

- **[Getting Started](./docs/getting-started/installation.md)** - Installation and setup guide
- **[Project Overview](./docs/project/README.md)** - Project structure and architecture
- **[Compose Deployment](./docs/compose/START_HERE.md)** - Docker/Podman Compose quickstart
- **[Observability](./docs/grafana/QUICKSTART.md)** - Monitoring, metrics, logs, and tracing
- **[API Documentation](./docs/api/overview.md)** - REST API reference
- **[Server Documentation](./docs/server/README.md)** - Backend architecture and development
- **[Development Guide](./docs/development/)** - Contributing and development workflow
- **[Release Notes](./docs/releases/)** - Version history and changelogs

### Quick Links

| Topic | Link |
|-------|------|
| 🚀 Quick Start | [Compose Quick Start](./docs/compose/START_HERE.md) |
| 🛠️ Development Setup | [Development Guide](./docs/project/CONTRIBUTING.md) |
| 📊 Observability Stack | [Observability Setup](./docs/grafana/README.md) |
| 🔒 Security Policy | [Security](./docs/project/SECURITY.md) |
| 📖 API Design | [API Design](./docs/API_DESIGN.md) |
| 📝 Release Notes | [Latest Releases](./docs/releases/) |

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
