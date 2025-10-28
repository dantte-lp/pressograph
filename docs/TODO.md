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

### Export Functionality 🔴
- [ ] **Backend PNG Export** (High Priority)
  - [ ] Implement node-canvas integration
  - [ ] Fix canvas system dependencies
  - [ ] Generate PNG from settings
  - [ ] Return image in response
  - [ ] Add watermark support

- [ ] **Backend PDF Export** (High Priority)
  - [ ] Implement PDFKit integration
  - [ ] Generate PDF from settings
  - [ ] Add company logo support
  - [ ] Multi-page support for long tests
  - [ ] PDF metadata (author, title, etc.)

- [ ] **Export Templates** (Medium Priority)
  - [ ] Predefined export formats
  - [ ] Custom branding templates
  - [ ] Multiple paper sizes (A4, Letter, A3)
  - [ ] Portrait/Landscape orientation

### Help Page 🟡
- [ ] Create `/help` route in frontend
- [ ] Markdown renderer component
- [ ] Help content in Russian/English
- [ ] Search functionality
- [ ] Table of contents
- [ ] Keyboard shortcuts reference

### Frontend Improvements 🟡
- [ ] Print CSS for browser printing
- [ ] Keyboard shortcuts
- [ ] Accessibility improvements (ARIA labels)
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] Toast notifications
- [ ] Confirmation dialogs

---

## Phase 3: Authentication & User Management 🟡

### User Registration ⏸️
- [ ] **Currently Disabled** - Private project
- [ ] Email verification system
- [ ] Password reset flow
- [ ] Account activation
- [ ] Terms of service acceptance

### User Profile 🟡
- [ ] Profile page
- [ ] Avatar upload
- [ ] Password change
- [ ] Email change with verification
- [ ] Account deletion
- [ ] Two-factor authentication (2FA)

### Admin Dashboard 🟡
- [ ] User statistics
- [ ] Graph generation analytics
- [ ] System health monitoring
- [ ] Database size tracking
- [ ] API usage metrics
- [ ] Recent activity log
- [ ] User search and filtering

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
None currently reported.

### Technical Debt
- [ ] Remove canvas/pdfkit from dependencies (causing build issues)
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

## Last Updated

2025-10-28 - Version 1.0.0 release
