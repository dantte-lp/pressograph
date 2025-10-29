# Release Notes

This document provides an overview of all Pressograph releases. For detailed release notes, see the individual release files in the [releases](releases/) directory.

## Latest Release

### [v1.1.0 - Infrastructure Modernization & Observability](releases/v1.1.0-2025-10-29.md) (2025-10-29)

Major infrastructure update with comprehensive observability stack and modern container orchestration.

**Highlights:**
- 📊 Full Observability Stack: VictoriaMetrics, VictoriaLogs, Grafana, Tempo
- 🔐 Auto-generated secrets with environment initialization commands
- 🐳 Compose Specification 2025 compliance
- 🛡️ Security hardening (resource limits, SELinux, capabilities)
- 🔧 Fixed healthcheck IPv6 issues (all containers healthy)
- 🔄 Fixed Vite HMR over HTTPS/WSS
- 🌐 Fixed i18n system (4 pages corrected)
- ✅ Development environment: https://dev-pressograph.infra4.dev

[View Full Release Notes →](releases/v1.1.0-2025-10-29.md)

---

## Previous Releases

### [v1.0.0 - Initial Production Release](releases/v1.0.0.md) (2025-10-28)

First production release of Pressograph with full-stack implementation.

**Key Changes:**
- Modern Stack: React 19, TypeScript 5.9, Node.js 22, PostgreSQL 18
- Dark/Light Theme with persistent settings
- Canvas-based high-resolution graph rendering
- Export to PNG (4K), PDF (A4), JSON
- JWT authentication with role-based access control
- Multi-language support (Russian/English)

[View Full Release Notes →](releases/v1.0.0.md)

### [v1.0.2 - Setup Improvements & Build Optimization](releases/v1.0.2.md) (2025-10-28)

Patch release with database initialization improvements and Dockerfile migration to Debian.

**Key Changes:**
- Fixed initialization error when tables already exist
- Migrated backend from Alpine to Debian Trixie
- Added database size and schema version display
- Enhanced setup status endpoint

[View Full Release Notes →](releases/v1.0.2.md)

### [v1.0.1 - UI Improvements & Authentication](releases/v1.0.1.md) (2025-10-28)

Minor release adding authentication system and UI enhancements.

**Key Changes:**
- Implemented JWT authentication with role-based access
- Fixed Select component visibility in dark/light themes
- Added 28 new translation keys
- Replaced toggle buttons with HeroUI Switch components
- Created login page and navigation structure

[View Full Release Notes →](releases/v1.0.1.md)

---

## Release Types

- **MAJOR** - Breaking changes, significant new features
- **MINOR** - New features, backward-compatible
- **PATCH** - Bug fixes, minor improvements

## Upcoming Releases

### Version 1.2.0 (In Progress)

**Phase 2: Export & Advanced Features**
- ✅ **Sprint 2 COMPLETED (2025-10-29)** - Backend PNG Export
  - Server-side PNG generation with node-canvas
  - File storage service with automatic cleanup
  - Configurable dimensions, scale, and themes
  - Performance metrics and comprehensive logging
- ✅ **Sprint 3 COMPLETED (2025-10-29)** - Frontend Backend Integration
  - API service module with exportPNG client
  - ExportButtons updated with server-side export
  - Automatic fallback to client-side export if backend unavailable
  - Loading states with spinner and toast notifications
  - Performance metrics display (file size, generation time)
  - Theme-aware rendering from store
- ✅ **Sprint 4 COMPLETED (2025-10-29)** - Backend PDF Export
  - PDFKit integration for server-side PDF generation
  - Reuses PNG rendering from Sprint 2 for consistency
  - Multiple page size support: A4, A3, Letter, Legal
  - Custom metadata support (title, author, subject, keywords)
  - Auto-scaling image to fit page with aspect ratio maintenance
  - Footer with generation timestamp and test number
  - Complete validation and error handling
  - Performance metrics in response headers
- Sprint 5 (Next) - Help page with comprehensive documentation (7 hours)
- Sprint 6 - History page with graph management (9 hours)
- Sprint 7 - Frontend improvements (error boundaries, loading states) (10 hours)

### Version 1.3.0 (Planned)

**Phase 3: Admin & User Management**
- Admin dashboard with analytics
- User profile management
- System monitoring and health checks
- Advanced reporting features

### Version 2.0.0 (Future)

**Enterprise Features:**
- Multi-tenant support
- Custom branding and templates
- Webhooks and API integrations
- Batch operations and queue system
- GraphQL API
- Mobile app (React Native)

---

## Version History

| Version | Release Date | Type | Status |
|---------|--------------|------|--------|
| [v1.1.0](releases/v1.1.0-2025-10-29.md) | 2025-10-29 | MINOR | ✅ Production |
| [v1.0.2](releases/v1.0.2.md) | 2025-10-28 | PATCH | ✅ Production |
| [v1.0.1](releases/v1.0.1.md) | 2025-10-28 | MINOR | ✅ Production |
| [v1.0.0](releases/v1.0.0.md) | 2025-10-28 | MAJOR | ✅ Production |

---

## Resources

- [GitHub Releases](https://github.com/dantte-lp/pressograph/releases)
- [Full Changelog](https://github.com/dantte-lp/pressograph/commits/master)
- [Issue Tracker](https://github.com/dantte-lp/pressograph/issues)
- [Roadmap](TODO.md)

## Contributing

For guidelines on reporting issues and suggesting features, see our [GitHub Issues](https://github.com/dantte-lp/pressograph/issues) page.

---

**Last Updated:** 2025-10-29 - Sprint 4 (Backend PDF Export) completed
