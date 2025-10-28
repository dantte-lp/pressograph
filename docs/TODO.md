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

### Sprint 2: Backend PNG Export (Week 1-2) 🔴

**Epic: Server-Side PNG Generation**
- [ ] **US-005: Setup node-canvas Environment** (1h)
  - [ ] Install node-canvas: `npm install canvas`
  - [ ] Update Dockerfile with build dependencies
  - [ ] Test canvas import in backend
  - [ ] Document system requirements in README

- [ ] **US-006: Port Canvas Renderer to Backend** (5h)
  - [ ] Create `server/src/utils/canvasRenderer.ts`
  - [ ] Copy renderGraph function from frontend
  - [ ] Replace HTMLCanvasElement with node-canvas Canvas
  - [ ] Test CanvasRenderingContext2D compatibility
  - [ ] Handle font loading (registerFont for custom fonts)
  - [ ] Write unit tests for rendering functions

- [ ] **US-007: Implement File Storage Service** (2h)
  - [ ] Create `server/src/services/storage.service.ts`
  - [ ] Create exports directory structure
  - [ ] Implement file save (PNG buffer → file)
  - [ ] Implement file read (for download)
  - [ ] Implement file cleanup (old files)
  - [ ] Add storage path to .env
  - [ ] Write unit tests

- [ ] **US-008: Implement PNG Export Endpoint** (3h)
  - [ ] Update `graph.controller.ts::exportPNG`
  - [ ] Validate settings
  - [ ] Generate graph data
  - [ ] Create canvas and render
  - [ ] Convert to PNG buffer
  - [ ] Save to storage
  - [ ] Save record to graph_history
  - [ ] Return PNG stream or file path
  - [ ] Write integration tests

### Sprint 3: Backend PDF Export (Week 2) 🔴

**Epic: Server-Side PDF Generation**
- [ ] **US-009: Setup PDFKit Environment** (1h)
  - [ ] Install PDFKit: `npm install pdfkit`
  - [ ] Install types: `npm install -D @types/pdfkit`
  - [ ] Test PDF generation (hello world)
  - [ ] Test PDF stream creation

- [ ] **US-010: Implement PDF Export (PNG Embed Approach)** (4h)
  - [ ] Update `graph.controller.ts::exportPDF`
  - [ ] Reuse PNG generation logic
  - [ ] Create PDF document with PDFKit
  - [ ] Embed PNG into PDF page
  - [ ] Set PDF metadata (title, author, subject)
  - [ ] Set page size (A4 default)
  - [ ] Convert to buffer
  - [ ] Save to storage and database
  - [ ] Write integration tests

- [ ] **US-011: Add PDF Metadata Support** (1h)
  - [ ] Accept metadata in request body
  - [ ] Add title, author, subject, keywords
  - [ ] Add creation date
  - [ ] Add test number in metadata
  - [ ] Add company/project name support

### Sprint 4: Help Page (Week 2) 🟡

**Epic: User Documentation Interface**
- [ ] **US-012: Setup Help Page Structure** (2h)
  - [ ] Create Help.tsx component (replace placeholder)
  - [ ] Add route in App.tsx
  - [ ] Create sections: Intro, Features, Quick Start, FAQ
  - [ ] Add navigation menu (sticky sidebar)
  - [ ] Add responsive layout

- [ ] **US-013: Add Help Content** (3h)
  - [ ] Write "Getting Started" section (ru/en)
  - [ ] Write "Features" section (ru/en)
  - [ ] Write "FAQ" section (ru/en)
  - [ ] Add keyboard shortcuts reference
  - [ ] Add API examples
  - [ ] Add translation keys to i18n

- [ ] **US-014: Add Help Page Features** (2h)
  - [ ] Implement search functionality (filter sections)
  - [ ] Add table of contents with scroll spy
  - [ ] Add copy-to-clipboard for code examples
  - [ ] Add "Back to Top" button
  - [ ] Add breadcrumbs

### Sprint 5: History Page (Week 3) 🟡

**Epic: Graph History Management**
- [ ] **US-015: Create History Page UI** (4h)
  - [ ] Replace History.tsx placeholder
  - [ ] Create table with columns: Date, Test №, Format, Status, Actions
  - [ ] Add pagination (HeroUI Pagination)
  - [ ] Add filters: date range, test number, format
  - [ ] Add search by test number
  - [ ] Add sort by date/test number

- [ ] **US-016: Implement History Actions** (3h)
  - [ ] Add "View" button (show graph preview modal)
  - [ ] Add "Download" button (trigger file download)
  - [ ] Add "Share" button (create share link)
  - [ ] Add "Delete" button (with confirmation)
  - [ ] Add "Regenerate" button (re-create graph)

- [ ] **US-017: Add History Analytics** (2h)
  - [ ] Show total graphs generated
  - [ ] Show storage used
  - [ ] Show most used export format
  - [ ] Show generation time stats
  - [ ] Add charts (HeroUI + recharts)

### Sprint 6: Frontend Improvements (Week 3-4) 🟡

**Epic: UI/UX Enhancements**
- [ ] **US-018: Add Error Boundaries** (2h)
  - [ ] Create ErrorBoundary component
  - [ ] Add fallback UI
  - [ ] Add error reporting (console.error)
  - [ ] Wrap routes with ErrorBoundary
  - [ ] Add reset button

- [ ] **US-019: Add Toast Notifications** (1h)
  - [ ] Already using react-hot-toast ✅
  - [ ] Standardize toast messages
  - [ ] Add success/error/info toast helpers
  - [ ] Add toast icons
  - [ ] Configure toast position/duration

- [ ] **US-020: Add Loading Skeletons** (2h)
  - [ ] Create Skeleton component
  - [ ] Add to History page table
  - [ ] Add to Admin dashboard
  - [ ] Add to Profile page
  - [ ] Use HeroUI Skeleton component

- [ ] **US-021: Add Confirmation Dialogs** (2h)
  - [ ] Create ConfirmDialog component (HeroUI Modal)
  - [ ] Use for delete operations
  - [ ] Use for logout
  - [ ] Add custom messages and buttons
  - [ ] Add danger variant for destructive actions

- [ ] **US-022: Improve Accessibility** (3h)
  - [ ] Add ARIA labels to all interactive elements
  - [ ] Add keyboard navigation support
  - [ ] Add focus indicators
  - [ ] Test with screen reader
  - [ ] Add skip-to-content link
  - [ ] Improve color contrast (WCAG AA)

### Export Templates 🟢 (Future)
- [ ] Predefined export formats
- [ ] Custom branding templates
- [ ] Multiple paper sizes (A4, Letter, A3)
- [ ] Portrait/Landscape orientation

---

## Phase 3: User Management & Admin Dashboard 🟡

### Sprint 7: Admin Dashboard Backend (Week 4) 🟡

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

### Sprint 8: Admin Dashboard Frontend (Week 5) 🟡

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

### Sprint 9: User Profile (Week 5) 🟡

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

2025-10-28 - Version 1.0.2 with Agile task breakdown
