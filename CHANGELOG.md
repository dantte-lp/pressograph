# Changelog

Все значимые изменения в проекте Pressograph будут документированы в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и этот проект придерживается [Semantic Versioning](https://semver.org/lang/ru/).

## [Unreleased]

### В разработке
- Завершение Sprint 1: Foundation Setup
- Миграция на Next.js 15.5.6 + React 19
- Полная интеграция NextAuth v4 с Drizzle ORM
- Theme Provider с server-side рендерингом

### Added
- ✨ Valkey cache integration with Redis client (Issue #36)
- ✨ Cache utility functions for user preferences and themes
- ✨ Connection pooling and error handling for cache operations
- ✨ Three-tier caching support (Cookie → Valkey → Database)
- ✨ Comprehensive integration tests for cache operations

### Changed
- 🔄 Authentication approach: Removed Traefik-level BasicAuth in favor of application-level NextAuth authentication (Issue #45 closed)

---

## [2.0.0-alpha] - 2025-11-05

Крупный архитектурный редизайн. Полная миграция с Vite на Next.js 15.5.6 + React 19.

### Added
- ✨ **Next.js 15.5.6** архитектура с App Router
- ✨ **React 19.2.0** с новыми возможностями
- ✨ **Drizzle ORM 0.44.7** вместо Prisma
- ✨ **NextAuth v4.24** для аутентификации
- ✨ **TanStack Query 5.90** для data fetching
- ✨ **Zustand 5.0** для state management с Immer middleware
- ✨ **OpenTelemetry** интеграция с VictoriaMetrics stack
- ✨ **VictoriaMetrics** observability stack (metrics, logs, traces)
- ✨ **Valkey 9** (Redis-compatible) для кеширования
- ✨ **PostgreSQL 18** с оптимизированной конфигурацией
- ✨ Drizzle Studio UI на https://dbdev-pressograph.infra4.dev
- ✨ Полная схема БД с 13 таблицами (users, projects, tests, audit_logs и др.)
- ✨ **Recharts 3.3** для графиков давления
- ✨ Server-side theme management с cookies
- ✨ RBAC (Role-Based Access Control) в схеме БД
- ✨ Comprehensive sprint tracking structure

### Changed
- 🔄 **BREAKING**: Полная переделка архитектуры с Vite на Next.js
- 🔄 Миграция с Prisma на Drizzle ORM
- 🔄 Container-based development с Podman
- 🔄 Улучшенная Traefik конфигурация с HTTPS routing
- 🔄 Network isolation с IPAM для всех сервисов
- 🔄 Resource limits (CPU/RAM) для всех контейнеров
- 🔄 Node.js 24 LTS в development container
- 🔄 TypeScript 5.9.3 с strict mode

### Fixed
- 🐛 SSR build issues resolved
- 🐛 Theme switching теперь работает на server-side
- 🐛 Healthcheck IPv6 issues во всех контейнерах

### Security
- 🔒 Secure secrets generation с `task secrets:generate`
- 🔒 Network isolation между dev/uptrace/victoria stacks
- 🔒 PostgreSQL и Valkey не exposed в traefik-public network
- 🔒 CORS configuration для Drizzle Studio API

### Documentation
- 📚 Sprint tracking structure в `/sprints/`
- 📚 Architecture decisions документированы
- 📚 Migration session reports
- 📚 Comprehensive handoff reports

**Migration Notes**: Старый Vite+React стек архивирован в git history (commit `8d48f03a`). Для возврата к старой версии: `git checkout 8d48f03a`.

**GitHub Issues**: #35, #37, #40-#54

---

## [1.1.0] - 2025-10-29

Infrastructure modernization и observability stack.

### Added
- ✨ Observability stack с Grafana, VictoriaMetrics, Tempo
- ✨ Podman Compose для development окружения
- ✨ Traefik reverse proxy integration
- ✨ Health check endpoints для всех сервисов
- ✨ Development environment с hot reload
- ✨ Comprehensive Makefile для common tasks

### Changed
- 🔄 Миграция на Podman от Docker
- 🔄 Улучшенная Compose configuration
- 🔄 Node.js 22 LTS в контейнерах

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

Критические исправления и улучшения производительности.

### Added
- ✨ Comment field в Test Parameters section ([#6](https://github.com/dantte-lp/pressograph/issues/6))
- ✨ Date column в History table ([#5](https://github.com/dantte-lp/pressograph/issues/5))
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
- ⚡ Theme switching optimized с useShallow
- ⚡ GraphCanvas optimization с React.memo
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
  - US-006: Canvas renderer на backend
  - US-005: node-canvas setup
- ✨ Sprint 1: Backend type definitions
  - US-001: Shared type definitions
  - US-002: Graph generator на backend
  - US-003: Validation service
  - US-004: Graph controller endpoints

### Documentation
- 📚 Sprint completion reports для Sprint 2, 5, 6, 7
- 📚 Progress reports
- 📚 Release notes

---

## [1.0.0] - 2025-10-28

Первый production release! 🎉

### Added
- ✨ Pressure test visualization
- ✨ Graph generation с customizable parameters
- ✨ Export в PNG формат
- ✨ User authentication и authorization
- ✨ History страница с saved tests
- ✨ Setup страница для initial configuration
- ✨ Database schema с Prisma
- ✨ Admin panel с user management
- ✨ i18n support (Русский/English)
- ✨ Theme switching (Light/Dark)
- ✨ Zustand state management
- ✨ Comprehensive Makefile

### Features
- 🎨 Modern React 19 UI с HeroUI components
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
- 📈 Monitoring и logging

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

## Типы изменений

Этот changelog использует следующие типы изменений:

- `Added` ✨ - новые возможности
- `Changed` 🔄 - изменения в существующей функциональности
- `Deprecated` ⚠️ - функции, которые скоро будут удалены
- `Removed` 🗑️ - удалённые функции
- `Fixed` 🐛 - исправления багов
- `Security` 🔒 - исправления уязвимостей
- `Performance` ⚡ - улучшения производительности
- `Documentation` 📚 - изменения в документации

---

## Ссылки

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
- [#9](https://github.com/dantte-lp/pressograph/issues/9) - Create CHANGELOG.md 🎯 (этот файл!)
- [#10](https://github.com/dantte-lp/pressograph/issues/10) - Link Swagger UI

✅ = Closed | 🎯 = In Progress

---

**Примечание**: Для полной истории изменений см. [Git commit log](https://github.com/dantte-lp/pressograph/commits/main).
