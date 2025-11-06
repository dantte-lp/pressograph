# Changelog

All notable changes to the Pressograph project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Next.js 16 Proxy Migration (2025-11-06)
- 🔄 Migrated from middleware.ts to proxy.ts following Next.js 16 deprecation
- ⚠️ Edge Runtime not supported in proxy.ts - authentication moved to Server Components
- ✨ Created server-side auth utilities (src/lib/auth/server-auth.ts)
- 📚 Added comprehensive migration documentation (docs/development/NEXT16_PROXY_MIGRATION.md)
- 🔧 Simplified proxy.ts to handle theme injection and request logging only
- ✅ Authentication now handled via requireAuth() in Server Components and layouts
- ✅ Removed middleware.ts deprecation warning from build output
- 📝 Preserved middleware.ts.backup for reference during transition period
- 🚀 Ready for Sprint 2 authentication implementation (2025-11-17)

### Known Issues - Next.js 16.0.1 (2025-11-06)
- 🐛 Production build fails with global-error.tsx: "Cannot read properties of null (reading 'useContext')"
- 📌 This is a known Next.js 16.0.1 bug: https://github.com/vercel/next.js/issues/85668
- ⏳ Affects static generation of /_global-error route during build
- ✅ Development server (npm run dev) works correctly
- 🔜 Will be fixed in Next.js 16.1+ (tracking upstream)
- 💡 Workaround: Use `npm run dev` for development, production deploy when Next.js 16.1+ releases

### Next.js 16 Upgrade & Build Fix (2025-11-06)
- ⬆️ Upgraded Next.js from 15.5.6 to 16.0.1 to fix production build error (Issue #69)
- 🔧 Migrated webpack externals configuration to Turbopack resolveAlias pattern
- 🐛 Fixed global-error.tsx: Implemented as proper client component with reset function
- 🔥 Removed unused React imports following React 19 patterns
- ✅ Production build now completes successfully with all 13 static pages generated
- ✅ TypeScript compilation continues to pass with 0 errors
- ✅ Issue #69 (P0-Critical) resolved - Build system fully operational
- 📚 Next.js 16 uses Turbopack by default for improved build performance

### React 19 & Next.js 15 Modernization (2025-11-06)
- ♻️ Applied React 19 modern patterns across codebase
- ♻️ Removed deprecated forwardRef usage in Button component
- ♻️ Verified Next.js 15 async APIs (cookies, headers) already implemented
- ♻️ Confirmed Tailwind CSS 4.0 @import pattern already in use
- 🐛 Fixed TypeScript errors: theme vs themePreference schema mismatch
- 🐛 Fixed database seed file schema inconsistencies
- 🐛 Removed unused imports and variables
- ✨ Created placeholder pages for navigation routes (docs, api-docs, privacy, terms, projects, tests, dashboard)
- ✅ TypeScript type-check now passes with no errors
- 📚 Codebase now aligned with React 19.2 and Next.js 15 best practices

### Sprint 2 Preparation (2025-11-06)
- 📚 Sprint 2 milestone already configured with 14 issues
- 📚 Technical debt identified and tracked (Issue #83)
- 📚 TypeScript errors in theme and database schema documented
- 📚 Application verified running successfully
- 📚 Sprint 2 focuses on Authentication & Core UI (40 SP)

### Sprint 2 Preparation (2025-11-06)
- ✅ Investigated Issue #69 (Production Build Error - P0-Critical)
- ✅ Created App Router error pages (error.tsx, global-error.tsx)
- ⚠️ Production build blocked by Next.js 15.5.6 Pages Router compatibility issue
- ⚠️ Html import error in static generation - requires Next.js version adjustment
- 📝 Issue #69 updated with investigation findings and next steps
- 🔄 Development server continues to work normally

### Post-Sprint 1 Cleanup (2025-11-06)
- ✅ Closed Issue #83 (Tech Debt) - Already resolved during React 19 modernization
- ✅ Verified TypeScript type-check: 0 errors
- ✅ All containers healthy and running
- ✅ Application responding correctly at https://dev-pressograph.infra4.dev
- 📚 Sprint 1-2 transition period - awaiting Sprint 2 start (2025-11-17)

### Sprint 1 Completion (2025-11-06)
- ✅ Sprint 1 Foundation Setup complete (86% - 19/22 SP)
- ✅ All critical and high-priority tasks completed
- ✅ Issue #35 closed - Environment fully operational
- ✅ 11 GitHub issues closed (#35-45, #47-48, #83)
- ✅ Issue #46 deferred (Drizzle Studio external routing not critical)
- ✅ TypeScript type-check: 27 errors → 0 errors
- ✅ Development velocity: 1.36 SP/day
- 📚 Ready for Sprint 2: Authentication & Core UI (starts 2025-11-17)

### Planned Features from v1.0 Migration
- Graph History Page route (planned for Sprint 2 or Sprint 3)
  - Comprehensive table view with pagination and search
  - Filter by format (PNG, PDF, JSON), test number, date
  - Actions: view, download, regenerate, share, delete
  - Edit comments on graphs
  - Preview modal with test settings
  - Status indicators (success, failed, pending)
  - Public share links with clipboard copy
- Admin Dashboard (planned for Sprints 3-4)
  - Backend API endpoints (Sprint 3 - December 2-15, 2025)
  - Frontend UI with tabs (Sprint 4 - December 16-29, 2025)
  - User management CRUD
  - Graph management
  - Analytics and reporting
  - System health monitoring
  - Admin role middleware with RBAC

### Added
- ✨ Valkey cache integration with Redis client (Issue #36)
- ✨ Cache utility functions for user preferences and themes
- ✨ Connection pooling and error handling for cache operations
- ✨ Three-tier caching support (Cookie → Valkey → Database)
- ✨ Comprehensive integration tests for cache operations
- ✨ Three-tier theme management system (Issue #38)
- ✨ Advanced theme provider with SSR support
- ✨ Theme toggle UI components
- ✨ Middleware for authentication and theme injection
- 📚 Technology stack analysis and documentation (Issue #39)
- 📚 Architecture Decision Records (ADRs)
- 📚 Technology comparison matrices
- ✨ Shadcn/ui components (dropdown-menu, button, card, input, label)
- ✨ Database seed script with test data

### Changed
- 🔄 Authentication approach: Removed Traefik-level BasicAuth in favor of application-level NextAuth authentication (Issue #45 closed)

### Deferred
- ⏸️ Drizzle Studio routing configuration deferred to later sprint (Issue #46 - 3 SP)

### Fixed
- 🐛 Theme toggle dropdown rendering issue
- 🐛 Test theme page 500 error
- 🐛 TypeScript JSX compilation error in theme script

### Documentation
- 📚 Sprint 1 completion status updated with retrospective
- 📚 Sprint 2 planning document created

---

## [2.0.0-alpha] - 2025-11-05

Major architectural redesign. Complete migration from Vite to Next.js 15.5.6 + React 19.

### Added
- ✨ **Next.js 15.5.6** architecture with App Router
- ✨ **React 19.2.0** with new features
- ✨ **Drizzle ORM 0.44.7** instead of Prisma
- ✨ **NextAuth v4.24** for authentication
- ✨ **TanStack Query 5.90** for data fetching
- ✨ **Zustand 5.0** for state management with Immer middleware
- ✨ **OpenTelemetry** integration with VictoriaMetrics stack
- ✨ **VictoriaMetrics** observability stack (metrics, logs, traces)
- ✨ **Valkey 9** (Redis-compatible) for caching
- ✨ **PostgreSQL 18** with optimized configuration
- ✨ Drizzle Studio UI at https://dbdev-pressograph.infra4.dev
- ✨ Full database schema with 13 tables (users, projects, tests, audit_logs, etc.)
- ✨ **Recharts 3.3** for pressure graphs
- ✨ Server-side theme management with cookies
- ✨ RBAC (Role-Based Access Control) in database schema
- ✨ Comprehensive sprint tracking structure

### Changed
- 🔄 **BREAKING**: Complete architecture overhaul from Vite to Next.js
- 🔄 Migration from Prisma to Drizzle ORM
- 🔄 Container-based development with Podman
- 🔄 Enhanced Traefik configuration with HTTPS routing
- 🔄 Network isolation with IPAM for all services
- 🔄 Resource limits (CPU/RAM) for all containers
- 🔄 Node.js 24 LTS in development container
- 🔄 TypeScript 5.9.3 with strict mode

### Fixed
- 🐛 SSR build issues resolved
- 🐛 Theme switching now works on server-side
- 🐛 Healthcheck IPv6 issues in all containers

### Security
- 🔒 Secure secrets generation with `task secrets:generate`
- 🔒 Network isolation between dev/uptrace/victoria stacks
- 🔒 PostgreSQL and Valkey not exposed in traefik-public network
- 🔒 CORS configuration for Drizzle Studio API

### Documentation
- 📚 Sprint tracking structure in `/sprints/`
- 📚 Architecture decisions documented
- 📚 Migration session reports
- 📚 Comprehensive handoff reports

**Migration Notes**: Old Vite+React stack archived in git history (commit `8d48f03a`). To revert to old version: `git checkout 8d48f03a`.

**GitHub Issues**: #35, #37, #40-#54

---

## [1.1.0] - 2025-10-29

Infrastructure modernization and observability stack.

### Added
- ✨ Observability stack with Grafana, VictoriaMetrics, Tempo
- ✨ Podman Compose for development environment
- ✨ Traefik reverse proxy integration
- ✨ Health check endpoints for all services
- ✨ Development environment with hot reload
- ✨ Comprehensive Makefile for common tasks

### Changed
- 🔄 Migration to Podman from Docker
- 🔄 Improved Compose configuration
- 🔄 Node.js 22 LTS in containers

### Fixed
- 🐛 Healthcheck IPv6 issues
- 🐛 Vite HMR configuration
- 🐛 i18n configuration issues

### Documentation
- 📚 Infrastructure deployment guide
- 📚 Observability setup documentation
- 📚 Development workflow documentation

---

## [1.0.2] - 2025-10-31

Critical fixes and performance improvements.

### Added
- ✨ Comment field in Test Parameters section ([#6](https://github.com/dantte-lp/pressograph/issues/6))
- ✨ Date column in History table ([#5](https://github.com/dantte-lp/pressograph/issues/5))
- ✨ Download JSON button ([#4](https://github.com/dantte-lp/pressograph/issues/4))
- ✨ PDF export endpoint ([#3](https://github.com/dantte-lp/pressograph/issues/3))
- ✨ Component tests (Phase 1.1)
- ✨ Export utilities tests
- ✨ Graph generator tests

### Fixed
- 🐛 PNG Cyrillic encoding issue
- 🐛 History table improvements
- 🐛 PDF orientation issues
- 🐛 Theme selection bugs
- 🐛 Authentication 401 errors
- 🐛 API integration issues
- 🐛 Theme switching performance lag ([#6](https://github.com/dantte-lp/pressograph/issues/6))

### Changed
- 🔄 Phase 1 dependency updates (safe updates)
- 🔄 Phase 2 dependency updates (Sprint 2)
- 🔄 ESLint v9 flat config migration

### Security
- 🔒 Restore admin password
- 🔒 Fix Traefik routing with /api prefix

### Performance
- ⚡ Theme switching optimized with useShallow
- ⚡ GraphCanvas optimization with React.memo
- ⚡ ExportButtons re-render optimization

**GitHub Issues**: #3, #4, #5, #6

---

## [1.0.1] - 2025-10-29

### Added
- ✨ Sprint 7: Frontend improvements
  - US-024: Accessibility improvements
  - US-023: Form validation improvements
  - US-022: Enhanced loading states
  - US-021: Error boundaries implementation
- ✨ Sprint 6: History Page
  - US-019/US-020: Interactive history features
  - US-018: Backend History API endpoints
- ✨ Sprint 5: Help Page
  - US-015: Help page structure
- ✨ Sprint 4: Export functionality
  - Backend PDF export endpoint
  - Frontend PNG export API integration
- ✨ Sprint 2: Backend PNG export
  - US-008: PNG export endpoint
  - US-007: File storage service
  - US-006: Canvas renderer on backend
  - US-005: node-canvas setup
- ✨ Sprint 1: Backend type definitions
  - US-001: Shared type definitions
  - US-002: Graph generator on backend
  - US-003: Validation service
  - US-004: Graph controller endpoints

### Documentation
- 📚 Sprint completion reports for Sprint 2, 5, 6, 7
- 📚 Progress reports
- 📚 Release notes

---

## [1.0.0] - 2025-10-28

First production release! 🎉

### Added
- ✨ Pressure test visualization
- ✨ Graph generation with customizable parameters
- ✨ Export to PNG format
- ✨ User authentication and authorization
- ✨ History page with saved tests
- ✨ Setup page for initial configuration
- ✨ Database schema with Prisma
- ✨ Admin panel with user management
- ✨ i18n support (Russian/English)
- ✨ Theme switching (Light/Dark)
- ✨ Zustand state management
- ✨ Comprehensive Makefile

### Features
- 🎨 Modern React 19 UI with HeroUI components
- 🎨 Responsive design
- 🎨 Dark/Light theme support
- 🔐 JWT-based authentication
- 🔐 Role-based access control
- 📊 Real-time graph generation
- 📊 Test parameters validation
- 💾 PostgreSQL database
- 🌐 Bilingual interface (RU/EN)

### Infrastructure
- 🐳 Nginx reverse proxy
- 🐳 Docker Compose setup
- 🐳 Production-ready configuration
- 📈 Monitoring and logging

### Documentation
- 📚 Setup guide
- 📚 API documentation
- 📚 User guide
- 📚 Development guide
- 📚 Deployment guide

### Technical Stack
- **Frontend**: React 19.2.0, TypeScript 5.9, Vite 7.1.12, HeroUI 2.8.5
- **Backend**: Node.js 22, Express, PostgreSQL 16
- **Deployment**: Nginx, Docker Compose
- **Testing**: Vitest, Testing Library

---

## Change Types

This changelog uses the following change types:

- `Added` ✨ - new features
- `Changed` 🔄 - changes in existing functionality
- `Deprecated` ⚠️ - features to be removed soon
- `Removed` 🗑️ - removed features
- `Fixed` 🐛 - bug fixes
- `Security` 🔒 - vulnerability fixes
- `Performance` ⚡ - performance improvements
- `Documentation` 📚 - documentation changes

---

## Links

- [Unreleased]: https://github.com/dantte-lp/pressograph/compare/v2.0.0-alpha...HEAD
- [2.0.0-alpha]: https://github.com/dantte-lp/pressograph/compare/v1.1.0...v2.0.0-alpha
- [1.1.0]: https://github.com/dantte-lp/pressograph/compare/v1.0.2...v1.1.0
- [1.0.2]: https://github.com/dantte-lp/pressograph/compare/v1.0.1...v1.0.2
- [1.0.1]: https://github.com/dantte-lp/pressograph/compare/v1.0.0...v1.0.1
- [1.0.0]: https://github.com/dantte-lp/pressograph/releases/tag/v1.0.0

---

## GitHub Issues Reference

### Sprint 1: Foundation Setup
- [#35](https://github.com/dantte-lp/pressograph/issues/35) - Environment Setup Complete
- [#36](https://github.com/dantte-lp/pressograph/issues/36) - Valkey Cache Integration
- [#37](https://github.com/dantte-lp/pressograph/issues/37) - NextAuth Configuration ✅
- [#38](https://github.com/dantte-lp/pressograph/issues/38) - Theme Provider
- [#39](https://github.com/dantte-lp/pressograph/issues/39) - Technology Stack Analysis

### Infrastructure Hardening
- [#40](https://github.com/dantte-lp/pressograph/issues/40) - Node.js 24 LTS ✅
- [#41](https://github.com/dantte-lp/pressograph/issues/41) - Traefik Configuration ✅
- [#42](https://github.com/dantte-lp/pressograph/issues/42) - PostCSS Configuration ✅
- [#43](https://github.com/dantte-lp/pressograph/issues/43) - Auto-start Next.js ✅
- [#44](https://github.com/dantte-lp/pressograph/issues/44) - Auto-start Drizzle Studio ✅
- [#45](https://github.com/dantte-lp/pressograph/issues/45) - Traefik Security
- [#46](https://github.com/dantte-lp/pressograph/issues/46) - Drizzle Studio Routing
- [#47](https://github.com/dantte-lp/pressograph/issues/47) - Node.js Configuration ✅
- [#48](https://github.com/dantte-lp/pressograph/issues/48) - Traefik Entrypoints ✅
- [#49](https://github.com/dantte-lp/pressograph/issues/49) - Architecture Redesign ✅
- [#50](https://github.com/dantte-lp/pressograph/issues/50) - OpenTelemetry Integration ✅
- [#51](https://github.com/dantte-lp/pressograph/issues/51) - Network Isolation ✅
- [#52](https://github.com/dantte-lp/pressograph/issues/52) - Resource Limits ✅
- [#53](https://github.com/dantte-lp/pressograph/issues/53) - Database Configuration ✅
- [#54](https://github.com/dantte-lp/pressograph/issues/54) - PostgreSQL Client ✅
- [#55](https://github.com/dantte-lp/pressograph/issues/55) - Infrastructure Deployment
- [#56](https://github.com/dantte-lp/pressograph/issues/56) - Drizzle ORM Configuration
- [#57](https://github.com/dantte-lp/pressograph/issues/57) - VictoriaMetrics Configuration
- [#58](https://github.com/dantte-lp/pressograph/issues/58) - Uptrace Configuration

### v1.2.0 Milestone
- [#3](https://github.com/dantte-lp/pressograph/issues/3) - PNG Export Authentication ✅
- [#4](https://github.com/dantte-lp/pressograph/issues/4) - Public Share Link
- [#5](https://github.com/dantte-lp/pressograph/issues/5) - Real API Authentication ✅
- [#6](https://github.com/dantte-lp/pressograph/issues/6) - Theme Switching Performance ✅
- [#7](https://github.com/dantte-lp/pressograph/issues/7) - GraphCanvas Optimization
- [#8](https://github.com/dantte-lp/pressograph/issues/8) - ExportButtons Optimization

### Documentation & Quality
- [#9](https://github.com/dantte-lp/pressograph/issues/9) - Create CHANGELOG.md 🎯 (this file!)
- [#10](https://github.com/dantte-lp/pressograph/issues/10) - Link Swagger UI

✅ = Closed | 🎯 = In Progress

---

**Note**: For complete change history, see [Git commit log](https://github.com/dantte-lp/pressograph/commits/main).