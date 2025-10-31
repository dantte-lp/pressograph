# Current Technical Stack - Pressograph v1.2.0

**Last Updated:** 2025-10-31
**Project:** Pressograph - Pressure Test Graph Generation System
**Repository:** https://github.com/dantte-lp/pressograph

---

## Table of Contents

- [Frontend Stack](#frontend-stack)
- [Backend Stack](#backend-stack)
- [Infrastructure](#infrastructure)
- [Development Environment](#development-environment)
- [Build Process](#build-process)
- [Version Management](#version-management)
- [Testing Status](#testing-status)
- [CI/CD Status](#cicd-status)
- [Documentation](#documentation)
- [Known Technical Debt](#known-technical-debt)

---

## Frontend Stack

### Core Framework

| Technology     | Version | Purpose     | Notes                                   |
| -------------- | ------- | ----------- | --------------------------------------- |
| **React**      | 19.2.0  | UI Library  | Latest stable release, REQUIRED version |
| **TypeScript** | 5.9.3   | Type Safety | Latest stable, REQUIRED version         |
| **Vite**       | 7.1.12  | Build Tool  | Latest, fast HMR, REQUIRED version      |

**React 19 Key Features:**

- Server Components support (not used in current SPA architecture)
- Automatic batching improvements
- Enhanced hooks performance
- Better SSR support (potential for future migration)

### UI Framework & Styling

| Technology        | Version | Purpose              | Notes                                                   |
| ----------------- | ------- | -------------------- | ------------------------------------------------------- |
| **HeroUI**        | 2.8.5   | Component Library    | React UI components, REQUIRED version, DO NOT downgrade |
| **HeroUI Theme**  | 2.4.23  | Theme System         | Customizable design tokens                              |
| **Tailwind CSS**  | 4.1.16  | Utility CSS          | Latest v4.x, REQUIRED, DO NOT use v3.x                  |
| **Framer Motion** | 11.16.0 | Animations           | Smooth transitions, theme switching                     |
| **PostCSS**       | 8.4.49  | CSS Processing       | Tailwind CSS compilation                                |
| **Autoprefixer**  | 10.4.20 | CSS Vendor Prefixing | Browser compatibility                                   |

**HeroUI 2.8.5 Components in Use:**

- `Card`, `CardHeader`, `CardBody`, `CardFooter` - Main content containers
- `Button`, `ButtonGroup` - Interactive actions
- `Input`, `Select`, `Switch` - Form controls
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` - Data display
- `Modal`, `ModalContent`, `ModalHeader`, `ModalBody`, `ModalFooter` - Dialogs
- `Pagination` - List navigation
- `Tabs`, `Tab` - Tabbed interfaces
- `Skeleton` - Loading states
- `Dropdown`, `DropdownTrigger`, `DropdownMenu`, `DropdownItem` - Menus

**Tailwind 4.1.16 Key Features:**

- New CSS-first configuration
- Improved performance and smaller bundle size
- Enhanced dark mode support
- Better container queries

### State Management

| Technology  | Version | Pattern      | Notes                                    |
| ----------- | ------- | ------------ | ---------------------------------------- |
| **Zustand** | 5.0.8   | Global State | Lightweight, performant state management |

**Zustand Implementation:**

- **Store Location:** `/src/store/useStore.ts`
- **Pattern:** MUST use `useShallow` from `zustand/react/shallow` to prevent unnecessary re-renders
- **Storage:** Persistent state via `localStorage`
- **State Managed:**
  - User authentication (`user`, `isAuthenticated`, `login`, `logout`)
  - Theme settings (`theme`, `setTheme`) - dark/light mode
  - Application settings and preferences
  - Graph data and test configurations (temporary state)

**Performance Optimization (CRITICAL):**

```typescript
// ALWAYS use this pattern:
import { useShallow } from 'zustand/react/shallow';

const { user, theme } = useStore(useShallow((state) => ({ user: state.user, theme: state.theme })));
```

**Known Issue:** Theme switching lag - requires optimization with debouncing and memoization.

### Routing

| Technology           | Version | Purpose             | Notes                                |
| -------------------- | ------- | ------------------- | ------------------------------------ |
| **React Router DOM** | 7.9.4   | Client-side Routing | Latest v7 with enhanced data loading |

**Routes:**

- `/` - HomePage (graph generation)
- `/login` - Authentication
- `/setup` - Initial setup wizard
- `/history` - Graph history management
- `/admin` - Admin dashboard
- `/help` - User documentation
- `/profile` - User profile settings

**Protected Routes:** Handled via custom `ProtectedRoute` component with auth state from Zustand.

### Internationalization (i18n)

| Technology      | Implementation | Languages                  | Keys                  |
| --------------- | -------------- | -------------------------- | --------------------- |
| **Custom i18n** | React Context  | English (en), Russian (ru) | 372+ translation keys |

**Implementation Details:**

- **Location:** `/src/contexts/I18nContext.tsx`
- **Translations:** `/src/locales/en.json`, `/src/locales/ru.json`
- **Pattern:** React Context-based, no external library dependency
- **Features:**
  - Language switching (React state + localStorage persistence)
  - Fallback to English for missing keys
  - Support for Cyrillic characters in graphs and PDFs

**Usage Pattern:**

```typescript
import { useI18n } from '@/contexts/I18nContext';

const { t, language, setLanguage } = useI18n();

// Usage:
<h1>{t('navigation.home', 'Home')}</h1>
<p>{t('graph.workingPressure', 'Working Pressure')}: {pressure} MPa</p>
```

### Data Fetching & API Integration

| Technology           | Pattern        | Authentication | Notes                                          |
| -------------------- | -------------- | -------------- | ---------------------------------------------- |
| **Native Fetch API** | Custom Service | JWT Tokens     | No external library (no Axios, no React Query) |

**API Service:**

- **Location:** `/src/services/api.service.ts`
- **Base URL:** Configured via environment variable (`VITE_API_URL`)
- **Authentication:** JWT tokens in `Authorization: Bearer <token>` headers
- **Token Storage:** LocalStorage (`authToken`)
- **Error Handling:** Custom error responses, toast notifications via `react-hot-toast`

**Endpoints:**

- `POST /auth/login` - User authentication
- `GET /graphs` - Fetch graph history
- `POST /graphs` - Save graph
- `DELETE /graphs/:id` - Delete graph
- `GET /admin/users` - Admin user management
- Additional endpoints documented in `/openapi.yaml`

### Form Management

| Technology          | Version       | Validation | Notes                                         |
| ------------------- | ------------- | ---------- | --------------------------------------------- |
| **React Hook Form** | Not installed | Manual     | Custom form components with manual validation |

**Current Implementation:**

- Custom form components in `/src/components/forms/`
- Manual validation logic in component state
- Validation messages via i18n
- Error states handled via HeroUI `Input` component props

**Forms:**

- `TestParametersForm.tsx` - Main test configuration
- `IntermediateTestForm.tsx` - Multi-stage test configuration
- `LoginForm.tsx` - User authentication
- `TemplateButtons.tsx` - Quick presets

### Graph Rendering

| Technology          | API    | Export Formats | Notes                                          |
| ------------------- | ------ | -------------- | ---------------------------------------------- |
| **HTML Canvas API** | Native | PNG, PDF, JSON | Custom canvas renderer, high-resolution output |

**Canvas Rendering:**

- **Location:** `/src/components/graph/GraphCanvas.tsx`, `/src/utils/canvasRenderer.ts`
- **Resolution:** 2x-4x scale factor for high-DPI displays
- **Theme Support:** Dark/light mode with theme-aware colors
- **Fonts:** DejaVu Sans (Cyrillic support)
- **Features:**
  - Grid lines with MPa markings
  - Axes labels (Russian/English)
  - Time-based X-axis (hours)
  - Pressure-based Y-axis (MPa)
  - Multi-stage pressure test visualization
  - Professional styling (engineering blueprint style)

**Export Formats:**

- **PNG:** High-resolution image export (2x-4x scale)
- **PDF:** Generated via `jspdf` library with Canvas2Image
- **JSON:** Raw test data export for archival/import

### Notifications & User Feedback

| Technology          | Version | Pattern             | Notes                          |
| ------------------- | ------- | ------------------- | ------------------------------ |
| **react-hot-toast** | 2.6.0   | Toast Notifications | Success, error, loading states |

**Usage:**

- Success messages (green)
- Error messages (red)
- Loading indicators
- Custom duration and positioning
- Theme-aware styling

### Utility Libraries

| Technology   | Version | Purpose           | Notes                             |
| ------------ | ------- | ----------------- | --------------------------------- |
| **date-fns** | 4.1.0   | Date Manipulation | Formatting, parsing, calculations |
| **jspdf**    | 2.5.2   | PDF Generation    | Export graphs to PDF format       |

**date-fns Usage:**

- Graph timestamp formatting
- Test duration calculations
- History page date displays
- Locale support (en-US, ru-RU)

---

## Backend Stack

### Core Framework

| Technology     | Version  | Purpose       | Notes                        |
| -------------- | -------- | ------------- | ---------------------------- |
| **Node.js**    | 22 (LTS) | Runtime       | REQUIRED version, latest LTS |
| **Express**    | 4.18.2   | Web Framework | RESTful API server           |
| **TypeScript** | 5.3.3    | Type Safety   | Backend type safety          |

**Express Middleware Stack:**

- `helmet` - Security headers
- `cors` - Cross-Origin Resource Sharing
- `morgan` - HTTP request logging
- `express-rate-limit` - Rate limiting
- `express-validator` - Input validation

### Database

| Technology             | Version | Features      | Notes                 |
| ---------------------- | ------- | ------------- | --------------------- |
| **PostgreSQL**         | 18      | Relational DB | Latest stable release |
| **node-postgres (pg)** | 8.11.3  | Client Driver | Connection pooling    |

**Database Features:**

- **Full-text Search:** `pg_trgm` extension for fuzzy search
- **JSON Indexing:** `btree_gin` extension for JSONB fields
- **Connection Pooling:** Built-in pool management
- **Migrations:** `node-pg-migrate` for schema versioning

**Database Schema:**

- `users` - User accounts and authentication
- `pressure_tests` - Test metadata and configurations
- `graphs` - Generated graph data and exports
- `audit_logs` - User activity tracking (admin feature)

**Database Configuration:**

- **Location:** `/postgres.conf` (custom tuning)
- **Shared Buffers:** 256MB
- **Effective Cache Size:** 1GB
- **Max Connections:** 100
- **Work Memory:** 4MB

### Authentication & Security

| Technology | Version            | Method           | Notes                   |
| ---------- | ------------------ | ---------------- | ----------------------- |
| **JWT**    | jsonwebtoken 9.0.2 | Token-based Auth | Access + Refresh tokens |
| **bcrypt** | 5.1.1              | Password Hashing | Secure password storage |

**Authentication Flow:**

1. User submits credentials to `POST /auth/login`
2. Server validates against PostgreSQL `users` table
3. JWT token generated with user ID, role, expiration
4. Token stored in frontend localStorage
5. Token sent in `Authorization` header for protected routes
6. Server middleware validates token on each request

**Security Features:**

- Password hashing with bcrypt (10 rounds)
- JWT expiration (configurable, default 24h)
- Refresh token support (future enhancement)
- Rate limiting on auth endpoints
- Helmet.js security headers
- CORS configuration for trusted origins

### Graph Generation (Server-side)

| Technology      | Version | Purpose            | Notes                              |
| --------------- | ------- | ------------------ | ---------------------------------- |
| **node-canvas** | 3.2.0   | Server-side Canvas | PNG generation on backend          |
| **pdfkit**      | 0.17.2  | PDF Creation       | PDF export with Canvas integration |

**Server-side Graph Generation:**

- **Location:** `/server/src/services/graph.service.ts`
- **Fonts:** DejaVu Sans bundled for Cyrillic support
- **Use Case:** Backend can generate graphs for automated reports, webhooks, scheduled tasks
- **Format:** Same visual output as frontend Canvas API

### File Storage

| Technology           | Pattern          | Organization     | Notes                         |
| -------------------- | ---------------- | ---------------- | ----------------------------- |
| **Local Filesystem** | Direct FS Access | Date/Test Number | No S3/cloud storage currently |

**Storage Structure:**

```
/var/lib/pressograph/
├── graphs/
│   ├── 2025-10/
│   │   ├── test-001.png
│   │   ├── test-001.pdf
│   │   └── test-001.json
│   └── 2025-11/
└── backups/
```

**File Naming Convention:** `test-{number}.{ext}` organized by year-month directories.

### Logging

| Technology  | Version | Levels                   | Output          |
| ----------- | ------- | ------------------------ | --------------- |
| **winston** | 3.11.0  | error, warn, info, debug | Console + File  |
| **morgan**  | 1.10.0  | HTTP Requests            | Combined format |

**Logging Configuration:**

- **Location:** `/server/src/utils/logger.ts`
- **Log Files:** `/var/log/pressograph/`
  - `error.log` - Error-level logs
  - `combined.log` - All logs
  - `http.log` - HTTP access logs
- **Rotation:** Not implemented (manual cleanup)
- **Format:** JSON for structured logging

### API Documentation

| Technology             | Version | Standard         | Endpoint    |
| ---------------------- | ------- | ---------------- | ----------- |
| **Swagger JSDoc**      | 6.2.8   | OpenAPI 3.0      | `/api-docs` |
| **Swagger UI Express** | 5.0.0   | Interactive Docs | Web UI      |

**API Documentation:**

- **OpenAPI Spec:** `/openapi.yaml`
- **Auto-generated:** Via JSDoc comments in route files
- **Endpoint:** `http://localhost:3001/api-docs` (dev)
- **Features:**
  - Interactive API testing
  - Schema validation
  - Example requests/responses
  - Authentication token support

---

## Infrastructure

### Container Runtime

| Technology         | Version | Purpose                       | Notes                                  |
| ------------------ | ------- | ----------------------------- | -------------------------------------- |
| **Podman**         | Latest  | Container Runtime             | Rootless containers, Docker-compatible |
| **Buildah**        | Latest  | Image Building                | OCI-compliant builds                   |
| **podman-compose** | Latest  | Multi-container Orchestration | Docker Compose compatibility           |

**Why Podman?**

- Rootless execution (no daemon, better security)
- Drop-in Docker replacement
- Native systemd integration
- Better for production deployments

### Container Configuration

**Compose Spec Version:** 2025 (latest)

**Services:**

1. **frontend** - React app (Vite dev server or nginx for prod)
2. **backend** - Express API server
3. **postgres** - PostgreSQL database
4. **traefik** - Reverse proxy and load balancer

**Container Features:**

- **Multi-stage Builds:** Separate build and runtime stages
- **Health Checks:** Endpoint monitoring for all services
- **Resource Limits:** CPU and memory constraints
- **Security Hardening:**
  - Non-root user execution
  - Read-only root filesystem where possible
  - Dropped capabilities
  - AppArmor/SELinux profiles

**Compose File:** `/deploy/docker-compose.yml`

### Reverse Proxy & SSL

| Technology  | Version | Features      | Notes                                 |
| ----------- | ------- | ------------- | ------------------------------------- |
| **Traefik** | 2.x     | Reverse Proxy | Auto-discovery, HTTPS, load balancing |

**Traefik Features:**

- **Automatic HTTPS:** Let's Encrypt integration
- **Container Discovery:** Podman label-based routing
- **Load Balancing:** Round-robin for backend replicas
- **Dashboard:** Web UI for monitoring
- **Configuration:** Labels in `docker-compose.yml`

**Domains:**

- **Dev:** https://dev-pressograph.infra4.dev
- **Prod:** https://pressograph.infra4.dev

**SSL Certificates:**

- Let's Encrypt automatic renewal
- HTTP to HTTPS redirect
- TLS 1.2+ enforcement

### Database Optimization

**PostgreSQL Tuning (`/postgres.conf`):**

```ini
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
max_connections = 100
```

**Connection Pooling:**

- Implemented in backend via `pg.Pool`
- Max connections: 20 per backend instance
- Idle timeout: 30s
- Connection recycling on error

---

## Development Environment

### Hot Module Replacement (HMR)

| Service      | Technology | Reload Time | Notes                            |
| ------------ | ---------- | ----------- | -------------------------------- |
| **Frontend** | Vite HMR   | <200ms      | React Fast Refresh               |
| **Backend**  | tsx watch  | ~1-2s       | TypeScript compilation + restart |

**Frontend HMR:**

- Near-instant updates for CSS, component changes
- State preservation during updates
- Error overlay for build errors

**Backend Hot Reload:**

- File watching via `tsx` (faster than `ts-node`)
- Automatic restart on `.ts` file changes
- Source map support for debugging

### Volume Mounts (Development)

**No Rebuild Required:**

```yaml
volumes:
  - ./src:/app/src:ro # Frontend source (read-only)
  - ./server/src:/app/src:ro # Backend source (read-only)
  - ./dist:/app/dist # Build output
```

**Benefits:**

- Code changes reflected immediately
- No container rebuild for development
- Faster iteration cycle

### Development Domains

| Environment     | Domain                             | Purpose                |
| --------------- | ---------------------------------- | ---------------------- |
| **Local**       | http://localhost:5173              | Vite dev server        |
| **Local API**   | http://localhost:3001              | Express dev server     |
| **Dev Staging** | https://dev-pressograph.infra4.dev | Pre-production testing |
| **Production**  | https://pressograph.infra4.dev     | Live deployment        |

### Environment Variables

**Frontend (`.env`):**

```bash
VITE_API_URL=http://localhost:3001
VITE_APP_VERSION=1.2.0
```

**Backend (`.env`):**

```bash
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/pressograph
JWT_SECRET=<random-secret>
NODE_ENV=development
```

**Configuration Files:**

- `.env` - Local development (gitignored)
- `.env.example` - Template for setup
- Environment-specific overrides in deployment

---

## Build Process

### Frontend Build

| Tool     | Output  | Optimization                               | Size                   |
| -------- | ------- | ------------------------------------------ | ---------------------- |
| **Vite** | `/dist` | Code splitting, tree shaking, minification | ~1.5MB (465KB gzipped) |

**Build Process:**

1. TypeScript compilation (`tsc`)
2. Vite bundling (`vite build`)
3. Asset optimization (images, fonts)
4. CSS extraction and minification
5. Chunk splitting for optimal loading

**Build Optimizations:**

- **Code Splitting:** Route-based lazy loading
- **Tree Shaking:** Unused code removal
- **Minification:** Terser for JS, cssnano for CSS
- **Asset Hashing:** Cache busting for static files
- **Bundle Analysis:** Available via `--analyze` flag

**Build Command:**

```bash
npm run build
# Output: dist/ directory ready for nginx
```

**Bundle Breakdown:**

- Main chunk: ~800KB (React, HeroUI, core app)
- Route chunks: ~50-200KB each (lazy loaded)
- Vendor chunk: ~300KB (third-party libraries)
- CSS: ~150KB (Tailwind utilities used)

### Backend Build

| Tool    | Output  | Target   | Size |
| ------- | ------- | -------- | ---- |
| **tsc** | `/dist` | CommonJS | ~2MB |

**Build Process:**

1. TypeScript compilation to JavaScript
2. Source map generation
3. Declaration file generation (`.d.ts`)
4. Copy static assets (fonts, configs)

**Multi-stage Docker Build:**

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
CMD ["node", "dist/index.js"]
```

**Production Dependencies Only:**

- Dev dependencies excluded from final image
- Reduces image size by ~60%
- Faster container startup

---

## Version Management

### Versioning Strategy

| Standard                         | Current Version | Format            | Notes             |
| -------------------------------- | --------------- | ----------------- | ----------------- |
| **Semantic Versioning (SemVer)** | v1.2.0          | MAJOR.MINOR.PATCH | See VERSIONING.md |

**Version Scheme:**

- **MAJOR** (1.x.x): Breaking changes, major features
- **MINOR** (x.2.x): New features, backwards-compatible
- **PATCH** (x.x.0): Bug fixes, minor improvements

**Version Sources:**

- `package.json`: `"version": "1.2.0"`
- `VERSION` file: `1.2.0`
- Git tags: `v1.2.0`

**Development Builds:**

- Format: `1.2.0-dev.{git-sha}`
- Example: `1.2.0-dev.87cf014`
- Generated from Git commit hash

**Version Display:**

- Footer component: `Version.tsx`
- Shows version + environment (dev/prod)
- Git hash in dev mode for debugging

**Release Process:**

1. Update `VERSION` file
2. Update `package.json` version
3. Update `CHANGELOG.md`
4. Git commit: `chore: bump version to 1.2.0`
5. Git tag: `git tag v1.2.0`
6. Push tags: `git push --tags`

---

## Testing Status

### Current State: NO AUTOMATED TESTING

| Test Type             | Status             | Coverage | Tools     |
| --------------------- | ------------------ | -------- | --------- |
| **Unit Tests**        | ❌ Not Implemented | 0%       | None      |
| **Integration Tests** | ❌ Not Implemented | 0%       | None      |
| **E2E Tests**         | ❌ Not Implemented | 0%       | None      |
| **Manual Testing**    | ✅ Active          | N/A      | Manual QA |

**Testing Gaps:**

- No test infrastructure installed
- No test files in codebase
- No CI/CD test pipeline
- Reliance on manual testing only

**Risk Assessment:**

- **High Risk:** Refactoring without tests
- **Regression Risk:** Changes may break existing features
- **Deployment Risk:** No automated validation before production

**Immediate Need:** Testing infrastructure setup (Phase 1 priority)

---

## CI/CD Status

### Current State: NO AUTOMATED CI/CD

| Pipeline Stage | Status      | Automation    | Notes                   |
| -------------- | ----------- | ------------- | ----------------------- |
| **Build**      | ❌ Manual   | Makefile      | `make build` locally    |
| **Test**       | ❌ No Tests | N/A           | No tests to run         |
| **Lint**       | ⚠️ Manual   | ESLint        | `npm run lint` manually |
| **Deployment** | ❌ Manual   | Shell Scripts | SSH + rsync             |
| **Rollback**   | ❌ Manual   | Git + Rebuild | No automated rollback   |

**Current Deployment Process:**

1. Manual `git pull` on server
2. Manual `make build`
3. Manual `make deploy`
4. Manual verification
5. Manual rollback if issues found

**Issues:**

- No automated builds on push/PR
- No automated tests before merge
- No staging environment validation
- No deployment automation
- No rollback mechanism

**Immediate Need:** GitHub Actions CI/CD pipeline (Phase 1 priority)

---

## Documentation

### Existing Documentation

| Document                          | Location                              | Status     | Content                            |
| --------------------------------- | ------------------------------------- | ---------- | ---------------------------------- |
| **README.md**                     | `/README.md`                          | ✅ Current | Basic setup, features, quick start |
| **DEPLOYMENT.md**                 | `/DEPLOYMENT.md`                      | ✅ Current | Deployment guide, server setup     |
| **VERSIONING.md**                 | `/VERSIONING.md`                      | ⚠️ Exists  | Version strategy (needs update)    |
| **I18N_AUDIT.md**                 | `/docs/I18N_AUDIT.md`                 | ✅ Current | Translation audit, 372 keys        |
| **PACKAGE_MANAGER_EVALUATION.md** | `/docs/PACKAGE_MANAGER_EVALUATION.md` | ✅ Current | pnpm analysis                      |
| **CHANGELOG.md**                  | `/CHANGELOG.md`                       | ✅ Current | Release history                    |
| **OpenAPI Spec**                  | `/openapi.yaml`                       | ✅ Current | API documentation                  |
| **Scrum Report**                  | `/SCRUM_IMPLEMENTATION_REPORT.md`     | ✅ Current | Sprint progress                    |

### Documentation Gaps

**Missing Documentation:**

- Architecture diagrams
- Component library documentation
- State management guide
- Testing strategy
- Contribution guidelines
- Code style guide
- Security best practices
- Performance optimization guide
- Database schema documentation
- API integration examples

**User Documentation:**

- Help page exists in app (`/help` route)
- User manual in Russian
- No video tutorials
- No interactive onboarding

---

## Known Technical Debt

### High Priority Issues

1. **No Automated Testing**
   - **Impact:** High risk of regressions
   - **Effort:** High (requires full test suite)
   - **Priority:** Critical - Sprint 2

2. **No CI/CD Pipeline**
   - **Impact:** Manual deployments, human error risk
   - **Effort:** Medium (GitHub Actions setup)
   - **Priority:** Critical - Sprint 2

3. **Theme Switching Performance Lag**
   - **Impact:** Poor UX, UI freezes on rapid toggling
   - **Effort:** Medium (React optimization, debouncing)
   - **Priority:** High - Sprint 3

4. **Manual Deployment Process**
   - **Impact:** Slow, error-prone releases
   - **Effort:** Medium (CI/CD integration)
   - **Priority:** High - Sprint 2

### Medium Priority Issues

5. **No Monitoring/Observability**
   - **Impact:** Cannot detect production issues proactively
   - **Effort:** Medium (integrate Sentry, Grafana)
   - **Priority:** Medium - Sprint 4

6. **No Error Tracking**
   - **Impact:** User errors go unreported
   - **Effort:** Low (Sentry integration)
   - **Priority:** Medium - Sprint 4

7. **Limited Logging**
   - **Impact:** Difficult to debug production issues
   - **Effort:** Medium (structured logging, log aggregation)
   - **Priority:** Medium - Sprint 3

8. **No Performance Monitoring**
   - **Impact:** Cannot identify bottlenecks
   - **Effort:** Medium (React DevTools Profiler, Lighthouse CI)
   - **Priority:** Medium - Sprint 3

9. **No Backup Automation**
   - **Impact:** Manual backups, potential data loss
   - **Effort:** Low (cron job + pg_dump)
   - **Priority:** Medium - Sprint 3

### Low Priority Issues

10. **Local File Storage (No Cloud)**
    - **Impact:** Limited scalability, no redundancy
    - **Effort:** High (S3/MinIO integration)
    - **Priority:** Low - Future

11. **Single Database Instance**
    - **Impact:** No high availability, no read replicas
    - **Effort:** High (PostgreSQL replication)
    - **Priority:** Low - Future

12. **No Rate Limiting on Frontend**
    - **Impact:** Potential abuse of export endpoints
    - **Effort:** Low (backend already has rate limiting)
    - **Priority:** Low - Sprint 4

13. **Custom i18n Implementation**
    - **Impact:** Limited features vs. libraries like i18next
    - **Effort:** Medium (migration to i18next)
    - **Priority:** Low - Future (if needed)

14. **No Component Library Documentation**
    - **Impact:** Harder for new developers to contribute
    - **Effort:** High (Storybook setup)
    - **Priority:** Low - Sprint 4

### Code Quality Issues

15. **Manual Form Validation**
    - **Impact:** Inconsistent validation logic
    - **Effort:** Medium (React Hook Form + Zod)
    - **Priority:** Medium - Sprint 3

16. **TypeScript Strict Mode Not Enabled**
    - **Impact:** Potential type safety gaps
    - **Effort:** Low (enable + fix errors)
    - **Priority:** High - Sprint 2

17. **No Pre-commit Hooks**
    - **Impact:** Inconsistent code formatting
    - **Effort:** Low (husky + lint-staged)
    - **Priority:** High - Sprint 2

18. **Large Component Files (>300 lines)**
    - **Impact:** Harder to maintain
    - **Effort:** Medium (refactoring)
    - **Priority:** Low - Sprint 4

19. **Mixed Error Handling Patterns**
    - **Impact:** Inconsistent error UX
    - **Effort:** Medium (standardize error boundaries)
    - **Priority:** Medium - Sprint 3

---

## Summary

### Strengths

✅ **Modern Tech Stack:** React 19, Vite 7, TypeScript 5.9, HeroUI 2.8.5, Tailwind 4.1.16
✅ **Strong Type Safety:** TypeScript across frontend and backend
✅ **Production-Ready Infrastructure:** Podman, Traefik, PostgreSQL 18
✅ **Bilingual Support:** Full Russian/English localization (372 keys)
✅ **Custom Canvas Rendering:** High-quality graph exports (PNG/PDF)
✅ **Secure Authentication:** JWT + bcrypt
✅ **Well-Documented:** Comprehensive README, deployment guides, API docs

### Critical Gaps

❌ **No Automated Testing:** 0% coverage, high regression risk
❌ **No CI/CD:** Manual builds and deployments
❌ **No Monitoring:** No error tracking, no performance metrics
❌ **Performance Issues:** Theme switching lag
❌ **Manual Processes:** Backups, deployments, quality checks

### Immediate Actions (Sprint 2)

1. Setup testing infrastructure (Vitest + React Testing Library + Playwright)
2. Create CI/CD pipeline (GitHub Actions)
3. Configure code quality tools (ESLint strict + Prettier + Husky)
4. Enable TypeScript strict mode
5. Add performance optimizations (React.memo, useCallback, useMemo)

---

**Document Maintenance:**

- This document should be updated with each major version release
- Review quarterly for accuracy
- Link from main README.md

**Next Steps:**

- See `REFACTORING_PLAN.md` for detailed roadmap
- See Sprint 2 GitHub Issues for actionable tasks
