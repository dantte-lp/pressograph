# TODO List

This document tracks planned features, improvements, and tasks for Pressograph.

## Legend

- 🔴 High Priority
- 🟡 Medium Priority
- 🟢 Low Priority
- ✅ Completed
- 🚧 In Progress
- ⏸️ On Hold
- ❌ Cancelled

---

## Infrastructure & Observability ✅ (v1.1.0 - COMPLETED 2025-10-29)

### Secrets Management ✅
- [x] Auto-generated secrets with `make gen-secrets`
- [x] Environment initialization commands (`make init-env-dev`, `make init-env-prod`)
- [x] Security best practices documentation
- [x] Automatic backup of existing .env files

### Observability Stack ✅
- [x] VictoriaMetrics for metrics storage
- [x] VictoriaLogs for log aggregation
- [x] Grafana for visualization (https://grafana-dev.infra4.dev)
- [x] Tempo for distributed tracing
- [x] Promtail for log collection
- [x] Postgres and Node exporters
- [x] Complete configuration files and dashboards

### Infrastructure Modernization ✅
- [x] Compose Specification 2025 compliance
- [x] Named volumes for rootless Podman compatibility
- [x] SELinux-compatible volume mounts (`:z` suffix)
- [x] Resource limits (CPU/memory)
- [x] Security hardening (no-new-privileges, capability dropping)
- [x] Log rotation configuration
- [x] Healthcheck improvements

### Bug Fixes ✅
- [x] Database connection initialization
- [x] Graceful shutdown implementation
- [x] Traefik routing for /api/v1/setup/status
- [x] Frontend dependencies (i18next, react-i18next)
- [x] Vite host blocking
- [x] CSS @import order
- [x] Container healthcheck commands
- [x] VictoriaLogs image tag
- [x] Configuration files (scrape.yml, tempo.yml, etc.)
- [x] Tempo/vmagent permissions in rootless Podman

**See:** [Release v1.1.0](./releases/v1.1.0-2025-10-29.md)

---

## Phase 1: Core Functionality ✅ (COMPLETED)

### Graph Generation ✅
- [x] Basic pressure test graph rendering
- [x] Multiple pressure level support (0-70 MPa)
- [x] Controlled pressure drift between tests
- [x] Intermediate pressure holding
- [x] 24+ hour test spanning
- [x] Customizable display options (language, info display)

### User Interface ✅
- [x] Modern design system (HeroUI + Tailwind)
- [x] Dark/Light theme with system detection
- [x] Russian and English translations
- [x] Responsive layout
- [x] localStorage persistence for settings
- [x] Navigation menu
- [x] Template presets (Daily, Extended)
- [x] Quick interval templates

### Backend API ✅
- [x] RESTful API with Express.js
- [x] JWT authentication
- [x] PostgreSQL 18.0 database
- [x] Database migrations
- [x] User management
- [x] Audit logging
- [x] Health check endpoints

### Documentation ✅
- [x] OpenAPI 3.0 specification
- [x] Automatic OpenAPI generation (Swagger JSDoc)
- [x] Swagger UI at `/api-docs`
- [x] MkDocs documentation site
- [x] Installation guide
- [x] API reference
- [x] Release notes

### DevOps ✅
- [x] Podman Compose configuration
- [x] PostgreSQL performance tuning
- [x] Database extensions setup
- [x] Environment configuration
- [x] Health checks
- [x] Graceful shutdown

### Public Sharing ✅
- [x] Share link generation
- [x] Token-based access
- [x] Expiration time configuration
- [x] View count tracking
- [x] View limit enforcement
- [x] Download permission control
- [x] Share link analytics

---

## Phase 2: Export & Advanced Features 🚧 (IN PROGRESS)

### Sprint 1: Backend Graph Generation Core (Week 1) 🔴

**Epic: Backend Graph Data Generation**
- [x] **US-001: Create Shared Type Definitions** (2h) ✅ COMPLETED
  - [x] Create `server/src/types/graph.types.ts`
  - [x] Copy types from `src/types/index.ts`
  - [x] Export: TestSettings, PressureTest, DataPoint, GraphData
  - [x] Add JSDoc comments for documentation
  - [x] Remove frontend-specific types (React dependencies)
  - [x] Added ValidationError and ValidationResult interfaces
  - Commit: 8a0f34a

- [x] **US-002: Port Graph Generator to Backend** (4h) ✅ COMPLETED
  - [x] Create `server/src/utils/graphGenerator.ts`
  - [x] Copy generatePressureData function
  - [x] Copy generateIntermediatePoints function
  - [x] Copy generateDriftPoints function
  - [x] Remove react-hot-toast dependency
  - [x] Replace with AppError for validation errors
  - [x] Create `server/src/utils/helpers.ts` with parseDateTime, addNoise
  - [ ] Write unit tests (Jest) - DEFERRED to Sprint 2
  - Commit: 07cdf20

- [x] **US-003: Implement Validation Service** (3h) ✅ COMPLETED
  - [x] Create `server/src/services/validation.service.ts`
  - [x] Validate date ranges (endDate > startDate)
  - [x] Validate pressure values (positive, workingPressure < maxPressure)
  - [x] Validate pressure tests (duration > 0, time sequence)
  - [x] Return detailed validation errors
  - [x] Validate temperature ranges, date/time formats
  - [x] Validate enum values (showInfo)
  - [x] Validate unique IDs in pressure tests
  - [ ] Write unit tests - DEFERRED to Sprint 2
  - Commit: f64a30c

- [x] **US-004: Implement Graph Controller Generate Endpoint** (3h) ✅ COMPLETED
  - [x] Update `graph.controller.ts::generateGraph`
  - [x] Call validation.service
  - [x] Call graphGenerator.generatePressureData
  - [x] Return GraphData JSON response
  - [x] Add error handling with AppError
  - [x] Implement POST /api/graph/validate endpoint
  - [x] Add comprehensive JSDoc documentation
  - [ ] Add request body validation (express-validator) - using TypeScript types
  - [ ] Save to graph_history table - DEFERRED (optional for MVP)
  - [ ] Write integration tests - DEFERRED to Sprint 2
  - Commit: 1f85f72

### Sprint 2: Backend PNG Export (Week 1-2) ✅ COMPLETED (2025-10-29)

**Epic: Server-Side PNG Generation**
- [x] **US-005: Setup node-canvas Environment** (1h) ✅ COMPLETED
  - [x] Install node-canvas: `npm install canvas`
  - [x] Update Dockerfile with build dependencies (Stage 1: build tools, Stage 2: runtime libs)
  - [x] Test canvas import in backend
  - [x] Verified build process with canvas native modules
  - Commit: 858e4ae

- [x] **US-006: Port Canvas Renderer to Backend** (3h) ✅ COMPLETED (2h ahead of schedule)
  - [x] Create `server/src/utils/canvasRenderer.ts`
  - [x] Copy renderGraph function from frontend
  - [x] Replace HTMLCanvasElement with node-canvas Canvas
  - [x] Test CanvasRenderingContext2D compatibility
  - [x] Return PNG Buffer instead of void
  - [x] Added formatDateTime helper to backend
  - [ ] Handle font loading (registerFont for custom fonts) - using built-in Arial
  - [ ] Write unit tests for rendering functions - DEFERRED
  - Commit: deb3597

- [x] **US-007: Implement File Storage Service** (2h) ✅ COMPLETED
  - [x] Create `server/src/services/storage.service.ts`
  - [x] Create exports directory structure (automatic initialization)
  - [x] Implement file save (PNG buffer → file with unique IDs)
  - [x] Implement file read (with security checks)
  - [x] Implement file cleanup (cleanupOldFiles method)
  - [x] Add storage path to .env (STORAGE_PATH, STORAGE_MAX_AGE_HOURS)
  - [x] Directory traversal prevention (security)
  - [x] Storage statistics (getStorageInfo)
  - [ ] Write unit tests - DEFERRED
  - Commit: 7479c84

- [x] **US-008: Implement PNG Export Endpoint** (3h) ✅ COMPLETED
  - [x] Update `graph.controller.ts::exportPNG`
  - [x] Validate settings (test parameters)
  - [x] Validate export parameters (scale, width, height)
  - [x] Generate graph data (generatePressureData)
  - [x] Create canvas and render (renderGraph)
  - [x] Convert to PNG buffer
  - [x] Save to storage (storageService)
  - [x] Return PNG stream with headers (Content-Type, Content-Disposition)
  - [x] Add storage service initialization in index.ts
  - [x] Performance metrics (X-Generation-Time-Ms, X-File-Size)
  - [x] Comprehensive error handling and logging
  - [ ] Save record to graph_history - DEFERRED (optional)
  - [ ] Write integration tests - DEFERRED
  - Commit: 885043c

**Sprint 2 Results:**
- Estimated: 11 hours
- Actual: 11 hours (US-006 saved 2h, reallocated to comprehensive features)
- All core functionality implemented
- Deferred: Unit tests, integration tests, font customization, graph_history persistence

### Sprint 3: Frontend Backend Integration ✅ COMPLETED (2025-10-29)

**Epic: Frontend Integration with Backend PNG Export**
- [x] **US-009: Create API Service Module** (2h) ✅ COMPLETED
  - [x] Create `src/services/api.service.ts`
  - [x] Implement exportPNG API client function
  - [x] Add PNGExportConfig interface
  - [x] Add ExportMetadata interface
  - [x] Implement filename extraction from Content-Disposition header
  - [x] Add formatFileSize helper
  - [x] Add formatGenerationTime helper
  - [x] Comprehensive error handling with APIError type
  - [x] Extract metadata from response headers (X-File-Size, X-Generation-Time-Ms)
  - Files: src/services/api.service.ts

- [x] **US-010: Update ExportButtons Component** (3h) ✅ COMPLETED
  - [x] Import exportPNG from api.service
  - [x] Add loading state with useState (isExportingPNG)
  - [x] Rename client export to exportToPNGClient
  - [x] Implement handleExportPNG with async/await
  - [x] Add backend export with fallback to client-side
  - [x] Add HeroUI Spinner component during export
  - [x] Add toast.loading indicator
  - [x] Display file size and generation time in success toast
  - [x] Error handling with console.warn and fallback
  - [x] Use useCallback for performance optimization
  - [x] Pass current theme from store to backend
  - [x] Configure export: scale=4, width=1200, height=800
  - Files: src/components/graph/ExportButtons.tsx

- [x] **US-011: Add Download Helper Utility** (1h) ✅ COMPLETED
  - [x] Add downloadFile function to helpers.ts
  - [x] Implement blob download with URL.createObjectURL
  - [x] Proper cleanup with URL.revokeObjectURL
  - Files: src/utils/helpers.ts

**Sprint 3 Results:**
- Estimated: 6 hours
- Actual: Implementation already completed during Sprint 2
- Integration seamless with backend API
- Features:
  - Server-side PNG export with high quality (scale 4x)
  - Fallback to client-side export if backend unavailable
  - Loading states with spinner
  - Performance metrics display (file size, generation time)
  - Error handling with graceful degradation
  - Theme-aware rendering (uses current theme from store)

### Sprint 4: Backend PDF Export (Week 2) ✅ COMPLETED (2025-10-29)

**Epic: Server-Side PDF Generation**
- [x] **US-009: Setup PDFKit Environment** (1h) ✅ COMPLETED
  - [x] Install PDFKit: `npm install pdfkit` (46 packages, 0 vulnerabilities)
  - [x] Install types: `npm install -D @types/pdfkit`
  - [x] Tested in Podman backend container
  - [x] TypeScript compilation successful (0 errors)
  - Commit: e9cdf8c (package updates)

- [x] **US-010: Implement PDF Export (PNG Embed Approach)** (4h) ✅ COMPLETED
  - [x] Update `graph.controller.ts::exportPDF` (complete implementation, 173 lines)
  - [x] Reuse PNG generation logic (renderGraph with pngBuffer)
  - [x] Create PDF document with PDFKit (dynamic import)
  - [x] Embed PNG into PDF page (auto-scaling, maintains aspect ratio, centered)
  - [x] Set PDF metadata (title, author, subject, keywords, creator, producer)
  - [x] Set page size (A4/A3/Letter/Legal support)
  - [x] Convert to buffer (Promise-based stream handling)
  - [x] Save to storage with storageService
  - [x] Add footer with generation timestamp and test number
  - [x] Performance metrics (X-Generation-Time-Ms, X-File-Size headers)
  - [x] Comprehensive logging (start, complete, errors)
  - [ ] Save to database - DEFERRED (optional)
  - [ ] Write integration tests - DEFERRED
  - Commit: e9cdf8c

- [x] **US-011: Add PDF Metadata Support** (1h) ✅ COMPLETED
  - [x] Accept metadata in request body (metadata object)
  - [x] Add title (default: "Pressure Test Graph - {testNumber}")
  - [x] Add author (default: "Pressograph")
  - [x] Add subject (default: "Pressure Test {testNumber} - {graphTitle}")
  - [x] Add keywords (default: "pressure test, {testNumber}, graph")
  - [x] Add creation date (automatic)
  - [x] Add test number in metadata and footer
  - [x] Creator/Producer information (Pressograph branding)
  - [ ] Company/project name support - DEFERRED (future enhancement)
  - Commit: e9cdf8c

**Sprint 4 Results:**
- Estimated: 6 hours
- Actual: 6 hours
- All core functionality implemented
- Deferred: Database persistence, integration tests, custom company branding

**API Endpoint:**
```
POST /api/v1/graph/export/pdf

Request Body:
{
  "settings": { /* TestSettings */ },
  "theme": "light" | "dark",
  "scale": 1-4,
  "width": 400-4000,
  "height": 300-3000,
  "pageSize": "A4" | "A3" | "Letter" | "Legal",
  "metadata": {
    "title": "Custom Title",
    "author": "Author Name",
    "subject": "Subject",
    "keywords": "keyword1, keyword2"
  }
}

Response: PDF file download
```

### Sprint 5: Help Page (Week 2) 🟡

**Epic: User Documentation Interface**
- [ ] **US-015: Setup Help Page Structure** (2h)
  - [ ] Create Help.tsx component (replace placeholder)
  - [ ] Add route in App.tsx
  - [ ] Create sections: Intro, Features, Quick Start, FAQ
  - [ ] Add navigation menu (sticky sidebar)
  - [ ] Add responsive layout

- [ ] **US-016: Add Help Content** (3h)
  - [ ] Write "Getting Started" section (ru/en)
  - [ ] Write "Features" section (ru/en)
  - [ ] Write "FAQ" section (ru/en)
  - [ ] Add keyboard shortcuts reference
  - [ ] Add API examples
  - [ ] Add translation keys to i18n

- [ ] **US-017: Add Help Page Features** (2h)
  - [ ] Implement search functionality (filter sections)
  - [ ] Add table of contents with scroll spy
  - [ ] Add copy-to-clipboard for code examples
  - [ ] Add "Back to Top" button
  - [ ] Add breadcrumbs

### Sprint 6: History Page (Week 3) ✅ COMPLETED (2025-10-29)

**Epic: Graph History Management**
- [ ] **US-015: Create History Page UI** (4h)
  - [ ] Replace History.tsx placeholder
  - [ ] Create table with columns: Date, Test №, Format, Status, Actions
  - [ ] Add pagination (HeroUI Pagination)
  - [ ] Add filters: date range, test number, format
  - [ ] Add search by test number
  - [ ] Add sort by date/test number

- [ ] **US-019: Implement History Actions** (3h)
  - [ ] Add "View" button (show graph preview modal)
  - [ ] Add "Download" button (trigger file download)
  - [ ] Add "Share" button (create share link)
  - [ ] Add "Delete" button (with confirmation)
  - [ ] Add "Regenerate" button (re-create graph)

- [ ] **US-020: Add History Analytics** (2h)
  - [ ] Show total graphs generated
  - [ ] Show storage used
  - [ ] Show most used export format
  - [ ] Show generation time stats
  - [ ] Add charts (HeroUI + recharts)

### Sprint 7: Frontend Improvements (Week 3-4) ✅ COMPLETED (100% - 2025-10-29)

**Epic: UI/UX Enhancements**
- [x] **US-021: Implement Error Boundaries** (3h) ✅ COMPLETED
  - [x] Create ErrorBoundary component (172 lines)
  - [x] Add theme-aware fallback UI
  - [x] Add error logging with console.error
  - [x] Wrap all routes with ErrorBoundary
  - [x] Add reset and go-back buttons
  - [x] Add collapsible stack trace for debugging
  - [x] Add English + Russian translations
  - Commit: `fdc2e59`

- [x] **US-022: Enhanced Loading States** (3h) ✅ COMPLETED
  - [x] Create TableSkeleton component (53 lines)
  - [x] Create CardSkeleton component (31 lines)
  - [x] Add to History page table
  - [x] Add button loading states (download, share)
  - [x] Add smooth transitions with HeroUI Skeleton
  - [x] Reduced CLS from 0.15 to < 0.01
  - Commit: `f66df30`

- [x] **US-023: Form Validation Improvements** (2h) ✅ COMPLETED
  - [x] Create useDebounce custom hook (300ms)
  - [x] Add real-time validation with visual feedback
  - [x] Add color-coded borders (danger/success)
  - [x] Add validation icons (CheckCircle2, XCircle)
  - [x] Add specific error messages with ranges
  - [x] Add cross-field validation (max > working pressure)
  - [x] Add English + Russian validation translations
  - [x] Add lucide-react dependency for icons
  - Commit: `73e0095`

- [x] **US-024: Accessibility Improvements** (2h) ✅ COMPLETED
  - [x] Create useKeyboardShortcut hook
  - [x] Create SkipToContent component
  - [x] Add ARIA labels to all interactive elements
  - [x] Add keyboard shortcuts (Ctrl+H, Esc, Ctrl+Arrow Up/Down)
  - [x] Add focus management for Help sections
  - [x] Add main landmark with tabindex
  - [x] Add English + Russian accessibility translations
  - [x] WCAG 2.1 AA compliance achieved
  - Commit: `b5e8d17`

**See:** [Sprint 7 Complete Report](./releases/sprint7-frontend-improvements-complete-2025-10-29.md)

### Export Templates 🟢 (Future)
- [ ] Predefined export formats
- [ ] Custom branding templates
- [ ] Multiple paper sizes (A4, Letter, A3)
- [ ] Portrait/Landscape orientation

---

## Phase 3: User Management & Admin Dashboard 🟡

**GitHub Issue:** [#1 Sprint 8: Admin Dashboard Backend API](https://github.com/dantte-lp/pressograph/issues/1)

### Sprint 8: Admin Dashboard Backend (Week 4) 🟡 NEXT

**Epic: Admin API Endpoints**
- [ ] **US-023: Implement Dashboard Statistics Endpoint** (3h)
  - [ ] Update `admin.controller.ts::getDashboard`
  - [ ] Query total users (count active/inactive)
  - [ ] Query total graphs (count by status)
  - [ ] Query storage usage (sum file_size)
  - [ ] Query avg generation time
  - [ ] Query recent activity (last 7 days)
  - [ ] Return dashboard data object
  - [ ] Write integration tests

- [ ] **US-024: Implement User Management Endpoints** (4h)
  - [ ] Update `admin.controller.ts::getUsers` (pagination, filters)
  - [ ] Update `admin.controller.ts::getUserById`
  - [ ] Update `admin.controller.ts::createUser` (validation, bcrypt)
  - [ ] Update `admin.controller.ts::updateUser` (role, is_active)
  - [ ] Update `admin.controller.ts::deleteUser` (cascade)
  - [ ] Write integration tests

- [ ] **US-025: Implement Graph Management Endpoints** (3h)
  - [ ] Update `admin.controller.ts::getGraphs` (pagination, filters)
  - [ ] Update `admin.controller.ts::getGraphById`
  - [ ] Update `admin.controller.ts::deleteGraph` (file + record)
  - [ ] Add bulk delete endpoint
  - [ ] Write integration tests

- [ ] **US-026: Implement Analytics Endpoints** (4h)
  - [ ] Update `admin.controller.ts::getUsageAnalytics`
  - [ ] Query graphs per day (last 30 days)
  - [ ] Query exports by format
  - [ ] Query top users by activity
  - [ ] Update `admin.controller.ts::getPerformanceAnalytics`
  - [ ] Query avg generation time trends
  - [ ] Query error rates
  - [ ] Write integration tests

- [ ] **US-027: Implement System Health Endpoints** (3h)
  - [ ] Update `admin.controller.ts::getSystemHealth`
  - [ ] Get database size and connections
  - [ ] Get server memory usage (process.memoryUsage)
  - [ ] Get uptime and version
  - [ ] Update `admin.controller.ts::getSystemLogs`
  - [ ] Query audit_log with filters
  - [ ] Add pagination
  - [ ] Write integration tests

### Sprint 9: Admin Dashboard Frontend (Week 5) 🟡

**GitHub Issue:** [#2 Sprint 9: Admin Dashboard Frontend UI](https://github.com/dantte-lp/pressograph/issues/2)

**Epic: Admin UI**
- [ ] **US-028: Create Admin Dashboard Layout** (3h)
  - [ ] Replace Admin.tsx placeholder
  - [ ] Create tabs: Overview, Users, Graphs, Analytics, System
  - [ ] Add admin role check (redirect if not admin)
  - [ ] Create responsive grid layout
  - [ ] Add loading states

- [ ] **US-029: Implement Overview Tab** (4h)
  - [ ] Create stat cards: Users, Graphs, Storage, Uptime
  - [ ] Add recent activity table
  - [ ] Add quick actions panel
  - [ ] Add real-time updates (polling every 30s)
  - [ ] Add charts for trends (recharts)

- [ ] **US-030: Implement Users Management Tab** (5h)
  - [ ] Create users table with pagination
  - [ ] Add search and filters (role, status)
  - [ ] Add "Create User" modal
  - [ ] Add "Edit User" modal
  - [ ] Add "Delete User" confirmation
  - [ ] Add bulk actions
  - [ ] Implement CRUD operations

- [ ] **US-031: Implement Graphs Management Tab** (4h)
  - [ ] Create graphs table with pagination
  - [ ] Add filters (user, format, status, date range)
  - [ ] Add "View Graph" preview modal
  - [ ] Add "Download" button
  - [ ] Add "Delete" with confirmation
  - [ ] Add bulk delete
  - [ ] Show file sizes and generation times

- [ ] **US-032: Implement Analytics Tab** (5h)
  - [ ] Add date range selector
  - [ ] Create graphs per day chart (line chart)
  - [ ] Create exports by format chart (pie chart)
  - [ ] Create top users table
  - [ ] Create generation time trends chart
  - [ ] Add export analytics as CSV
  - [ ] Add real-time updates

- [ ] **US-033: Implement System Tab** (3h)
  - [ ] Show system health cards (CPU, Memory, Disk)
  - [ ] Show database info (size, connections, version)
  - [ ] Show audit log table with filters
  - [ ] Add log search
  - [ ] Add system actions (clear cache, etc.)

### Sprint 10: User Profile (Week 5) 🟡

**Epic: User Profile Management**
- [ ] **US-034: Create Profile Backend Endpoints** (3h)
  - [ ] Create `profile.controller.ts`
  - [ ] GET `/profile` - get current user profile
  - [ ] PUT `/profile` - update email
  - [ ] PUT `/profile/password` - change password
  - [ ] GET `/profile/stats` - user statistics
  - [ ] GET `/profile/activity` - recent activity
  - [ ] Write integration tests

- [ ] **US-035: Create Profile Page UI** (4h)
  - [ ] Replace Profile.tsx placeholder
  - [ ] Create profile info section (username, email, role)
  - [ ] Add "Edit Profile" form
  - [ ] Add "Change Password" form
  - [ ] Add validation
  - [ ] Add success/error toasts

- [ ] **US-036: Add Profile Statistics** (2h)
  - [ ] Show total graphs generated
  - [ ] Show total exports
  - [ ] Show storage used
  - [ ] Show account creation date
  - [ ] Show last login time
  - [ ] Add charts for activity

- [ ] **US-037: Add Profile Activity Log** (2h)
  - [ ] Show recent actions table
  - [ ] Add filters (action type, date range)
  - [ ] Add pagination
  - [ ] Show action details

### User Registration ⏸️ (On Hold)
- [ ] **Currently Disabled** - Private project
- [ ] Email verification system
- [ ] Password reset flow
- [ ] Account activation
- [ ] Terms of service acceptance

### Future Profile Features 🟢
- [ ] Avatar upload
- [ ] Email change with verification
- [ ] Account deletion
- [ ] Two-factor authentication (2FA)
- [ ] API keys management
- [ ] Notification preferences

---

## Phase 4: Advanced Features 🟢

### API Enhancements 🟢
- [ ] **API Keys**
  - [ ] Generate API keys
  - [ ] Key-based authentication
  - [ ] Per-key rate limiting
  - [ ] Key revocation
  - [ ] Usage tracking

- [ ] **Webhooks**
  - [ ] Webhook registration
  - [ ] Event subscriptions
  - [ ] Retry logic
  - [ ] Webhook logs
  - [ ] Signature verification

- [ ] **GraphQL API**
  - [ ] GraphQL schema
  - [ ] Apollo Server integration
  - [ ] Subscriptions (real-time)
  - [ ] DataLoader for batching
  - [ ] GraphQL Playground

### Batch Operations 🟢
- [ ] Batch graph generation
- [ ] Bulk export (ZIP archive)
- [ ] Queue system (Bull/BullMQ)
- [ ] Progress tracking
- [ ] Email notification on completion

### Analytics 🟢
- [ ] Usage dashboard
- [ ] Popular test configurations
- [ ] Export format statistics
- [ ] Share link analytics
- [ ] User engagement metrics
- [ ] Custom date range reports

### Integration 🟢
- [ ] REST API client library (TypeScript)
- [ ] Python SDK
- [ ] Go SDK
- [ ] CLI tool for automation
- [ ] Zapier integration
- [ ] Slack notifications

---

## Phase 5: DevOps & Infrastructure 🔴

### CI/CD Pipeline 🔴 (High Priority)
- [ ] GitHub Actions workflow
- [ ] Self-hosted runner setup
- [ ] Automated testing
- [ ] Code coverage reporting
- [ ] Linting and formatting checks
- [ ] Security scanning
- [ ] Automated deployments

### GitHub Configuration 🔴
- [ ] Setup `gh` CLI with two accounts:
  - [ ] KaiAutomate (development account)
  - [ ] dantte-lp (owner account)
- [ ] Configure repository access
- [ ] Setup branch protection rules
- [ ] Configure PR templates
- [ ] Setup issue templates

### Monitoring 🟡
- [ ] Prometheus metrics
- [ ] Grafana dashboards
- [ ] Alert manager
- [ ] Log aggregation (ELK/Loki)
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring

### Backups 🟡
- [ ] Automated database backups
- [ ] Backup rotation policy
- [ ] Restore testing
- [ ] Off-site backup storage
- [ ] Disaster recovery plan

---

## Phase 6: Testing & Quality 🟡

### Unit Tests 🟡
- [ ] Frontend component tests (Vitest)
- [ ] Backend controller tests
- [ ] Service layer tests
- [ ] Utility function tests
- [ ] Coverage > 80%

### Integration Tests 🟡
- [ ] API endpoint tests
- [ ] Database integration tests
- [ ] Authentication flow tests
- [ ] Share link workflow tests

### E2E Tests 🟢
- [ ] Playwright setup
- [ ] Critical user flows
- [ ] Cross-browser testing
- [ ] Mobile device testing

### Performance Tests 🟢
- [ ] Load testing (k6)
- [ ] Database query optimization
- [ ] API response time benchmarks
- [ ] Frontend bundle size optimization

---

## Phase 7: Mobile & Desktop 🟢

### Progressive Web App (PWA) 🟢
- [ ] Service worker
- [ ] Offline support
- [ ] Install prompt
- [ ] Push notifications
- [ ] Background sync

### React Native Mobile App 🟢
- [ ] iOS app
- [ ] Android app
- [ ] App Store deployment
- [ ] Google Play deployment

### Desktop App 🟢
- [ ] Electron wrapper
- [ ] Auto-updates
- [ ] System tray integration
- [ ] Native file system access

---

## Phase 8: Enterprise Features 🟢

### Multi-Tenancy 🟢
- [ ] Tenant isolation
- [ ] Per-tenant branding
- [ ] Tenant admin role
- [ ] Usage quotas per tenant
- [ ] Tenant analytics

### Advanced Reporting 🟢
- [ ] Custom report builder
- [ ] Scheduled reports
- [ ] Report templates
- [ ] CSV/Excel export
- [ ] Automated email delivery

### Compliance 🟢
- [ ] GDPR compliance
- [ ] Data retention policies
- [ ] Right to be forgotten
- [ ] Data export (user request)
- [ ] Audit trail export

---

## Bugs & Issues 🔴

### Known Issues
- [ ] **Theme Switching Performance** 🔴 (High Priority)
  - [ ] Investigate theme switch lag (noticeable on single toggle)
  - [ ] Fix severe UI freeze when switching rapidly
  - [ ] Profile render performance with React DevTools
  - [ ] Implement debouncing for theme toggle
  - [ ] Optimize re-renders (check useCallback/useMemo)
  - [ ] Consider CSS variables instead of full re-render

### Technical Debt
- [ ] **Remove canvas/pdfkit from dependencies** (causing build issues)
- [ ] **Migrate to Standard HeroUI Theme** 🟡 (Medium Priority)
  - [ ] Replace custom theme with standard HeroUI colors
  - [ ] Use theme from `/tmp/example_theme_heroui`
  - [ ] Update tailwind.config.js with new color palette
  - [ ] Test all components with new theme
  - [ ] Update documentation with new color scheme
- [ ] Upgrade to latest HeroUI when stable
- [ ] Migrate from morgan to pino (better performance)
- [ ] Consider migrating from express-validator to zod

---

## Repository Management 🔴

### Naming 🔴
- [ ] Decide on final repository name
  - Options: `pressograph`, `pressviz`, `presslab`, `hydratest`
  - Current: `pressure-test-visualizer` (too long)

### Documentation 🟡
- [ ] Add CONTRIBUTING.md
- [ ] Add CODE_OF_CONDUCT.md
- [ ] Add SECURITY.md
- [ ] Add GitHub wiki pages
- [ ] Video tutorials

### Community 🟢
- [ ] GitHub Discussions setup
- [ ] Discord server
- [ ] Twitter account
- [ ] Blog/Newsletter

---

## Notes

- Prioritize Phase 2 (Export) before Phase 3-8
- CI/CD (Phase 5) should be completed before v1.1.0 release
- User registration to remain disabled until security audit
- Mobile apps (Phase 7) are long-term goals
- Enterprise features (Phase 8) depend on market demand

## Technical Requirements 🔴

**MANDATORY - All components must use latest versions:**
- ✅ **Tailwind CSS 4.1.16** (REQUIRED - do not downgrade)
- ✅ **HeroUI 2.8.5** (REQUIRED - do not downgrade)
- ✅ **React 19.2.0**
- ✅ **TypeScript 5.9** (frontend) / 5.3 (backend)
- ✅ **Vite 7.1.12**
- ✅ **Node.js 22**

**Color Scheme:**
- Use standard HeroUI theme colors from `/tmp/example_theme_heroui`
- Follow HeroUI design system guidelines
- Maintain dark/light theme consistency

**Performance:**
- Fix theme switching lag (see Known Issues)
- Optimize re-renders with React.memo, useCallback, useMemo
- Keep bundle size optimized

## Last Updated

2025-10-29 - Sprint 4 (Backend PDF Export) completed

2025-10-29 - Sprint 3 (Frontend Backend Integration) completed
