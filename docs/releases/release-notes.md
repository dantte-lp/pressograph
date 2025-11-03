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
- ✅ **Sprint 5 COMPLETED (2025-10-29)** - Help Page Implementation
  - Comprehensive Help & Documentation page with 6 sections
  - Interactive search functionality (real-time filtering)
  - Collapsible FAQ with 8 common questions (Accordion)
  - Copy-to-clipboard for code examples
  - Responsive sidebar navigation (sticky on desktop)
  - 100+ translation keys (English + Russian)
  - Theme-aware design with performance optimization
  - Getting Started, Test Configuration, Graph Interpretation, Export Options, FAQ, Keyboard Shortcuts
- ✅ **Sprint 6 COMPLETED (2025-10-29)** - History Page Implementation
  - Backend API endpoints: getHistory (search, filter, sort), deleteGraph, downloadGraph
  - Complete History page with table, search, and pagination (665 lines)
  - Interactive modals: preview graph details, delete confirmation, share link generation
  - Download functionality for PNG, PDF, JSON formats
  - Debounced search (300ms), format filtering, sorting options
  - 100+ translation keys (English + Russian)
  - Type-safe API integration with comprehensive error handling
  - Toast notifications for all user actions
- ✅ **Sprint 7 COMPLETED (100% - 2025-10-29)** - Frontend Improvements
  - ✅ US-021: Error Boundaries - React error boundary with fallback UI, reset functionality (commit: fdc2e59)
  - ✅ US-022: Loading States - TableSkeleton, CardSkeleton, button loading states (commit: f66df30)
  - ✅ US-023: Form Validation - Real-time validation with debouncing, visual feedback (commit: 73e0095)
  - ✅ US-024: Accessibility - ARIA labels, keyboard shortcuts, WCAG 2.1 AA compliance (commit: b5e8d17)
  - [View Complete Sprint 7 Report →](releases/sprint7-frontend-improvements-complete-2025-10-29.md)
- Sprint 8 (Next) - Testing & Quality Assurance or Admin Dashboard

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

| Version                                 | Release Date | Type  | Status        |
| --------------------------------------- | ------------ | ----- | ------------- |
| [v1.1.0](releases/v1.1.0-2025-10-29.md) | 2025-10-29   | MINOR | ✅ Production |
| [v1.0.2](releases/v1.0.2.md)            | 2025-10-28   | PATCH | ✅ Production |
| [v1.0.1](releases/v1.0.1.md)            | 2025-10-28   | MINOR | ✅ Production |
| [v1.0.0](releases/v1.0.0.md)            | 2025-10-28   | MAJOR | ✅ Production |

---

## Resources

- [GitHub Releases](https://github.com/dantte-lp/pressograph/releases)
- [Full Changelog](https://github.com/dantte-lp/pressograph/commits/master)
- [Issue Tracker](https://github.com/dantte-lp/pressograph/issues)
- [Roadmap](TODO.md)

## Contributing

For guidelines on reporting issues and suggesting features, see our [GitHub Issues](https://github.com/dantte-lp/pressograph/issues) page.

---

**Last Updated:** 2025-10-29 - Sprint 7 (Frontend Improvements) completed - 100% complete (all 4 user stories)
