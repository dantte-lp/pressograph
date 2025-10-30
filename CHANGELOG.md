# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Performance optimizations for theme switching with debouncing and requestAnimationFrame
- React.memo optimization for GraphCanvas component with useMemo for graph data
- Comprehensive Scrum development plan (DEVELOPMENT_PLAN.md)
- Documentation analysis report (DOCUMENTATION_ANALYSIS.md)
- GitHub milestones for v1.2.0, v1.3.0, and v1.4.0
- Sprint-based issue tracking with labels (sprint-1, sprint-2, etc.)
- Priority labels (high-priority, medium-priority, low-priority)
- New GitHub issues for performance optimization (#6, #7, #8)
- Documentation issues for CHANGELOG.md (#9) and Swagger UI linking (#10)

### Changed
- Optimized theme switching performance from ~200-500ms to <50ms target
- Refactored App.tsx to use debounced theme with useCallback optimization
- Enhanced GraphCanvas with memoization to prevent unnecessary re-renders

### Fixed
- Theme switching lag and UI freeze during rapid toggling (Issue #6)
- Unnecessary GraphCanvas re-renders on unrelated state changes (Issue #7)

## [1.1.0] - 2025-10-29

### Added
- **Observability Stack**: VictoriaMetrics, VictoriaLogs, Grafana, Tempo, Promtail
- **Metrics Collection**: Postgres exporter, Node exporter, cAdvisor
- **Auto-generated Secrets**: `make gen-secrets`, `make init-env-dev`, `make init-env-prod` commands
- **Named Volumes**: Tempo and vmagent volumes for rootless Podman compatibility
- **Security Hardening**: Resource limits, no-new-privileges, SELinux compatibility
- **Log Rotation**: 10MB max size, 3 files per container
- **Healthcheck Improvements**: Fixed IPv6 issues, proper start_period values

### Changed
- **Compose Specification 2025**: Removed deprecated `version` field from all compose files
- **Configuration Files**: Converted directories to proper config files (scrape.yml, tempo.yml, etc.)
- **Image Updates**: VictoriaLogs corrected to `v0.42.0-victorialogs`
- **Backend Initialization**: Added database connection and graceful shutdown
- **Frontend Dependencies**: Added missing i18next and react-i18next packages
- **Vite Configuration**: Added allowedHosts to prevent blocking

### Fixed
- Database connection initialization in backend (server/src/index.ts)
- Traefik routing for /api/v1/setup/status endpoint
- Vite HMR over HTTPS/WSS for dev environment
- CSS @import order (Google Fonts must be first)
- Container healthcheck commands (replaced wget with Node.js HTTP)
- Logging driver configuration (removed unsupported `tag` option)
- Tempo configuration (removed deprecated overrides section)
- VictoriaMetrics scrape config (removed unsupported evaluation_interval)

### Performance
- All 11 containers operational (3 dev + 8 observability)
- Development environment: https://dev-pressograph.infra4.dev (healthy)
- Grafana dashboard: https://grafana-dev.infra4.dev

## [1.0.2] - 2025-10-28

### Changed
- Migrated backend Dockerfile from Alpine to Debian Trixie
- Enhanced setup status endpoint with database size and schema version

### Fixed
- Database initialization error when tables already exist
- Setup page now handles existing installations gracefully

### Security
- Improved error handling in database initialization
- Added detailed logging for setup process

## [1.0.1] - 2025-10-28

### Added
- JWT authentication system with role-based access control (RBAC)
- Login page with authentication UI
- Protected routes with ProtectedRoute component
- User session management with token refresh
- 28 new translation keys for authentication

### Changed
- Replaced custom toggle buttons with HeroUI Switch components
- Updated theme toggle to use Switch component
- Enhanced Select component visibility in dark/light themes

### Fixed
- Select component rendering issues in different themes
- Navigation menu structure and routing
- i18n integration for authentication flows

### Security
- Implemented JWT token-based authentication
- Added password hashing with bcrypt
- Secure token storage in localStorage
- Automatic token refresh before expiration

## [1.0.0] - 2025-10-28

### Added
- **Frontend**
  - React 19.2.0 with TypeScript 5.9
  - Vite 7.1.12 build system
  - HeroUI 2.8.5 component library
  - Tailwind CSS 4.1.16 for styling
  - Dark/Light theme with system detection
  - Zustand 5.x state management with useShallow optimization
  - i18next internationalization (Russian/English)
  - Canvas-based high-resolution graph rendering
  - Export to PNG (4K), PDF (A4), JSON

- **Backend**
  - Node.js 22 with Express.js
  - PostgreSQL 18.0 database
  - JWT authentication
  - Drizzle ORM for database operations
  - OpenAPI 3.0 specification
  - Swagger UI at /api-docs
  - Health check endpoints
  - Audit logging system

- **Infrastructure**
  - Podman Compose configuration
  - Multi-stage Docker builds
  - PostgreSQL performance tuning
  - Traefik reverse proxy with HTTPS
  - Automatic SSL with Cloudflare

- **Features**
  - Pressure test graph generation
  - Multiple pressure level support (0-70 MPa)
  - Controlled pressure drift between tests
  - Intermediate pressure holding
  - 24+ hour test spanning
  - Template presets (Standard, Daily, Extended)
  - Quick interval templates
  - Persistent settings in localStorage

- **Pages**
  - Home page (graph generation)
  - Login page
  - Setup page (first-time initialization)
  - History page (graph management)
  - Admin page (placeholder)
  - Help page (comprehensive documentation)
  - Profile page (placeholder)

### Documentation
- Comprehensive README.md
- API design documentation (docs/API_DESIGN.md)
- Contributing guidelines (docs/project/CONTRIBUTING.md)
- Compose deployment guides (docs/compose/)
- Observability quickstart (docs/grafana/)
- TODO roadmap with sprint tracking (docs/TODO.md)
- Release notes (docs/release-notes.md)

---

## Release URLs

- **Latest Release**: [v1.1.0](https://github.com/dantte-lp/pressograph/releases/tag/v1.1.0)
- **Production Site**: https://pressograph.infra4.dev
- **Development Site**: https://dev-pressograph.infra4.dev
- **Documentation**: [docs/](https://github.com/dantte-lp/pressograph/tree/master/docs)

## Upgrading

See [MIGRATION_GUIDE.md](docs/compose/MIGRATION_GUIDE.md) for upgrade instructions between major versions.

## Support

- **Issues**: https://github.com/dantte-lp/pressograph/issues
- **Discussions**: https://github.com/dantte-lp/pressograph/discussions
- **Email**: pavel.lavrukhin@infra4.dev

---

[Unreleased]: https://github.com/dantte-lp/pressograph/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/dantte-lp/pressograph/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/dantte-lp/pressograph/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/dantte-lp/pressograph/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/dantte-lp/pressograph/releases/tag/v1.0.0
