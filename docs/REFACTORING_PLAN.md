# Refactoring Plan - Pressograph

**Version:** 1.0
**Created:** 2025-10-31
**Status:** Active Planning
**Target Completion:** Q2 2026

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Refactoring Goals](#refactoring-goals)
- [Phased Roadmap](#phased-roadmap)
  - [Phase 1: Foundation (Sprint 2)](#phase-1-foundation-sprint-2)
  - [Phase 2: Performance & UX (Sprint 3)](#phase-2-performance--ux-sprint-3)
  - [Phase 3: Architecture (Sprint 4)](#phase-3-architecture-sprint-4)
  - [Phase 4: Next.js Migration (Sprint 5-6)](#phase-4-nextjs-migration-sprint-5-6)
  - [Phase 5: Advanced Features (Sprint 7+)](#phase-5-advanced-features-sprint-7)
- [Migration Strategy](#migration-strategy)
- [Risk Mitigation](#risk-mitigation)
- [Success Metrics](#success-metrics)
- [Decision: Next.js Migration Analysis](#decision-nextjs-migration-analysis)

---

## Executive Summary

### Current Situation

Pressograph v1.2.0 is a functional pressure test visualization system with:

- **Strengths:** Modern stack (React 19, Vite 7, HeroUI 2.8.5), bilingual support, secure auth, high-quality graph rendering
- **Weaknesses:** No automated testing (0% coverage), no CI/CD, manual deployments, theme switching lag, limited observability
- **User Feedback:** "Неудобный интерфейс" (inconvenient interface) - UX improvements needed

### Refactoring Proposals

Two comprehensive refactoring documents have been analyzed:

1. **Technical Upgrade Manifesto** (UI/UX Focus)
   - Improve usability with guided 4-step workflow
   - Enhanced industrial UI design (color scheme, typography, accessibility)
   - Progressive disclosure for complex settings
   - Touch-friendly design for tablets
   - Maintain current Vite/React architecture

2. **Next.js Migration Plan** (Framework Migration)
   - Replace Vite with Next.js 13+ App Router
   - Add SSR/ISR for login and shareable reports
   - File-based routing instead of React Router
   - Middleware-based authentication
   - Preserve Zustand state management (client-side only)

### Strategic Decision

**RECOMMENDATION: Phased Approach - Foundation First, Migration Later**

**Rationale:**

- **Risk Mitigation:** Establish testing and CI/CD before major framework change
- **Incremental Value:** Deliver UX improvements without migration overhead
- **Validation:** Prove architecture patterns work before committing to Next.js
- **Team Capacity:** Avoid overwhelming team with simultaneous changes

**Approach:**

1. **Sprint 2:** Foundation (testing, CI/CD, code quality) - CRITICAL
2. **Sprint 3:** Performance & UX improvements (current stack)
3. **Sprint 4:** Architecture refinements (current stack)
4. **Sprint 5-6:** Next.js migration (if validated as beneficial)
5. **Sprint 7+:** Advanced features

---

## Refactoring Goals

### Primary Goals

1. **Establish Testing Foundation**
   - Achieve 60%+ code coverage
   - Prevent regressions during refactoring
   - Enable confident code changes

2. **Automate Quality & Deployment**
   - CI/CD pipeline for automated builds, tests, deployments
   - Pre-commit hooks for code quality
   - Automated rollback capabilities

3. **Improve User Experience**
   - Simplify interface with guided workflows
   - Enhance visual design (industrial UI best practices)
   - Eliminate performance bottlenecks (theme switching lag)
   - Touch-friendly design for field use

4. **Modernize Architecture**
   - Optimize React component performance
   - Improve state management patterns
   - Standardize error handling
   - Enhanced API documentation

5. **Evaluate Framework Migration**
   - Validate Next.js benefits for Pressograph use case
   - Prototype SSR for shareable reports
   - Assess SEO/performance gains vs. complexity

### Secondary Goals

6. **Enhance Observability**
   - Error tracking (Sentry)
   - Performance monitoring
   - User analytics
   - Structured logging

7. **Improve Developer Experience**
   - Component library documentation (Storybook)
   - Contribution guidelines
   - Faster local development setup

8. **Prepare for Scale**
   - Database optimization and indexing
   - Caching strategies
   - Load testing and capacity planning

---

## Phased Roadmap

---

## Phase 1: Foundation (Sprint 2)

**Duration:** 3 weeks
**Priority:** CRITICAL
**Goal:** Establish testing, CI/CD, and code quality infrastructure before any major refactoring

### Why This Phase Comes First

- **Safety Net:** Cannot refactor safely without tests
- **Automation:** Manual processes block rapid iteration
- **Quality Baseline:** Need consistent code standards before migration
- **Risk Reduction:** Detect issues early, not during Next.js migration

### 1.1 Testing Infrastructure

**Objective:** Setup automated testing with 60% code coverage target

**Tasks:**

1. **Install Testing Dependencies**

   ```bash
   npm install -D vitest @vitest/ui @vitest/coverage-v8
   npm install -D @testing-library/react @testing-library/jest-dom
   npm install -D @testing-library/user-event jsdom
   npm install -D happy-dom  # Alternative to jsdom, faster
   ```

2. **Create Vitest Configuration** (`vitest.config.ts`)
   - Setup jsdom/happy-dom environment
   - Configure coverage thresholds (60% minimum)
   - Setup test file patterns (`**/*.test.{ts,tsx}`)
   - Configure path aliases (`@/` for `/src`)

3. **Create Test Setup File** (`src/test/setup.ts`)
   - Import `@testing-library/jest-dom`
   - Setup global test utilities
   - Mock common dependencies (localStorage, fetch)
   - Configure cleanup after each test

4. **Write Initial Tests**
   - **Priority:** Core utilities first (low-hanging fruit)
     - `/src/utils/graphGenerator.ts` - Pure functions, easy to test
     - `/src/utils/helpers.ts` - Date formatting, calculations
   - **Priority:** Component tests for critical paths
     - `Version.tsx` - Simple component for learning
     - `GraphCanvas.tsx` - Critical rendering logic
     - `TestParametersForm.tsx` - Complex form validation
   - **Priority:** Integration tests
     - Login flow (E2E with Playwright later)
     - Graph generation workflow

5. **Backend Testing Setup**

   ```bash
   cd server
   npm install -D vitest @types/supertest supertest
   ```

   - Test API endpoints
   - Test authentication middleware
   - Test database queries (with test database)

6. **Add Test Scripts to package.json**
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:ui": "vitest --ui",
       "test:coverage": "vitest --coverage",
       "test:watch": "vitest --watch"
     }
   }
   ```

**Acceptance Criteria:**

- ✅ Vitest and React Testing Library installed and configured
- ✅ At least 20 unit tests written for utilities
- ✅ At least 10 component tests for critical components
- ✅ Coverage report shows 60%+ overall coverage
- ✅ CI runs tests automatically on every PR
- ✅ Tests pass consistently (no flaky tests)

**Estimated Effort:** 40 hours

---

### 1.2 CI/CD Pipeline

**Objective:** Automate builds, tests, and deployments with GitHub Actions

**Tasks:**

1. **Create GitHub Actions Workflow** (`.github/workflows/ci.yml`)
   - Trigger on push to `master`, `develop`, and all PRs
   - Run linting (ESLint)
   - Run tests (Vitest)
   - Generate coverage report
   - Upload coverage to Codecov
   - Build frontend and backend
   - Upload build artifacts

2. **Create Deployment Workflow** (`.github/workflows/deploy.yml`)
   - Trigger on push to `master` (production)
   - Trigger on push to `develop` (staging)
   - Build Docker images
   - Push to container registry (GitHub Container Registry)
   - Deploy to server via SSH
   - Run health checks
   - Rollback on failure

3. **Setup Staging Environment**
   - Clone production infrastructure
   - Separate domain: `https://dev-pressograph.infra4.dev`
   - Separate database
   - Automated deployment on `develop` branch merge

4. **Configure Secrets**
   - GitHub Secrets for:
     - `SSH_PRIVATE_KEY` - Deploy to servers
     - `JWT_SECRET` - Backend auth
     - `DATABASE_URL` - Production database
     - `CODECOV_TOKEN` - Coverage reporting

5. **Add Status Badges to README**
   - Build status
   - Test coverage
   - Deployment status

**Acceptance Criteria:**

- ✅ CI runs on every PR (lint + test + build)
- ✅ PRs cannot merge if CI fails
- ✅ Automated deployment to staging on `develop` merge
- ✅ Automated deployment to production on `master` merge
- ✅ Health checks verify deployment success
- ✅ Rollback mechanism in place
- ✅ Deployment takes <5 minutes

**Estimated Effort:** 24 hours

---

### 1.3 Code Quality Tools

**Objective:** Enforce consistent code style and catch issues pre-commit

**Tasks:**

1. **Configure Prettier**
   - Create `.prettierrc.json`

   ```json
   {
     "semi": true,
     "trailingComma": "es5",
     "singleQuote": true,
     "printWidth": 100,
     "tabWidth": 2,
     "arrowParens": "always"
   }
   ```

   - Add `.prettierignore`
   - Install: `npm install -D prettier`

2. **Update ESLint Configuration**
   - Enable stricter rules
   - Add `eslint-plugin-jsx-a11y` for accessibility
   - Add `eslint-plugin-import` for import order
   - Configure `eslint-config-prettier` to avoid conflicts

3. **Setup Husky Pre-commit Hooks**

   ```bash
   npm install -D husky lint-staged
   npx husky init
   ```

   - Create `.husky/pre-commit`:

   ```bash
   #!/bin/sh
   npx lint-staged
   ```

4. **Configure lint-staged** (`package.json`)

   ```json
   {
     "lint-staged": {
       "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
       "*.{json,css,md}": ["prettier --write"]
     }
   }
   ```

5. **Enable TypeScript Strict Mode**
   - Update `tsconfig.json`:

   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitOverride": true
     }
   }
   ```

   - Fix all resulting type errors (estimated ~50 errors)

6. **Fix Existing Linting Errors**
   - Run `npm run lint -- --fix`
   - Manually fix remaining errors
   - Document any intentional rule overrides

**Acceptance Criteria:**

- ✅ Prettier formats all code consistently
- ✅ ESLint passes with 0 errors
- ✅ Pre-commit hooks block commits with linting/formatting issues
- ✅ TypeScript strict mode enabled with 0 errors
- ✅ All team members have hooks installed

**Estimated Effort:** 16 hours

---

### 1.4 Documentation Updates

**Objective:** Document new processes and infrastructure

**Tasks:**

1. **Update README.md**
   - Add testing section (how to run tests)
   - Add CI/CD badges
   - Document pre-commit hooks setup

2. **Create CONTRIBUTING.md**
   - Code style guide
   - Commit message format
   - PR process
   - Testing requirements

3. **Update DEPLOYMENT.md**
   - Document automated deployment process
   - Manual deployment as fallback
   - Rollback procedures

**Acceptance Criteria:**

- ✅ New developers can setup environment from docs
- ✅ CI/CD process is clearly documented
- ✅ Testing guidelines are clear

**Estimated Effort:** 8 hours

---

### Phase 1 Summary

**Total Effort:** 88 hours (~3 weeks for 1 developer, or 1.5 weeks for 2 developers)

**Deliverables:**

- ✅ Testing infrastructure with 60%+ coverage
- ✅ Automated CI/CD pipeline
- ✅ Pre-commit hooks for code quality
- ✅ TypeScript strict mode enabled
- ✅ Updated documentation

**Risk:** Medium - Requires learning new tools, but well-documented ecosystem

**Dependencies:** None - can start immediately

**Blocker Resolution:** This phase unblocks all future refactoring by providing safety net

---

## Phase 2: Performance & UX (Sprint 3)

**Duration:** 4 weeks
**Priority:** HIGH
**Goal:** Improve user experience and eliminate performance bottlenecks (current Vite/React stack)

### 2.1 React Performance Optimization

**Objective:** Eliminate theme switching lag and reduce unnecessary re-renders

**Tasks:**

1. **Profile with React DevTools Profiler**
   - Record theme toggle action
   - Identify components with excessive re-renders
   - Document bottlenecks (expected: GraphCanvas, ExportButtons, large forms)

2. **Apply React.memo to Pure Components**
   - `GraphCanvas.tsx` - Expensive canvas rendering
   - `ExportButtons.tsx` - Button group
   - `Version.tsx` - Footer component
   - Add custom comparison functions where needed

3. **Memoize Expensive Computations**
   - `useMemo` for graph data generation
   - `useMemo` for computed colors based on theme
   - `useMemo` for filtered/sorted lists (history page)

4. **Memoize Callbacks**
   - `useCallback` for all event handlers passed to children
   - `useCallback` for Zustand state updaters
   - Example:

   ```typescript
   const handleThemeToggle = useCallback(() => {
     setTheme(theme === 'dark' ? 'light' : 'dark');
   }, [theme, setTheme]);
   ```

5. **Debounce Theme Switching**
   - Add 150ms debounce to rapid theme toggles
   - Prevent multiple state updates within short period
   - Use `useDebouncedCallback` from `use-debounce` library

6. **Optimize Zustand Selectors**
   - Audit all `useStore` calls
   - Ensure `useShallow` is used everywhere
   - Split large state slices for granular subscriptions

7. **Code Splitting with React.lazy**
   - Lazy load route components:

   ```typescript
   const Admin = React.lazy(() => import('./pages/Admin'));
   const History = React.lazy(() => import('./pages/History'));
   ```

   - Add Suspense boundaries with Skeleton loading states

8. **Virtualization for Long Lists**
   - Add `react-window` or `@tanstack/react-virtual` for history page
   - Only render visible table rows (important if >100 tests)

**Acceptance Criteria:**

- ✅ Theme toggle response time <100ms (down from ~500ms)
- ✅ No UI freeze on rapid theme switching
- ✅ GraphCanvas re-renders only when data changes
- ✅ React DevTools Profiler shows 50%+ reduction in render time
- ✅ Lighthouse Performance score >90

**Estimated Effort:** 32 hours

---

### 2.2 UI/UX Redesign (Industrial UI Best Practices)

**Objective:** Implement guided workflow and improve visual clarity per Technical Upgrade Manifesto

**Tasks:**

1. **Design 4-Step Guided Workflow**
   - **Step 1:** Select Template (with descriptions)
   - **Step 2:** Set Parameters (collapsible, progressive disclosure)
   - **Step 3:** Add Intermediate Stages (optional, expandable)
   - **Step 4:** Export/View Results (action buttons)
   - Each step numbered, clearly labeled, with contextual help

2. **Progressive Disclosure**
   - Collapse advanced settings by default
   - Add "Advanced Mode" toggle for power users
   - Show only relevant fields based on template selection
   - Example: Hide intermediate tests section if template doesn't require them

3. **Update Color Scheme**
   - Define new color palette (industrial theme):
     - Primary: Deep blue (#006FEE) - trust, technology
     - Secondary: Steel gray (#64748B) - neutral, professional
     - Success: Green (#17C964) - pass/safe
     - Warning: Orange (#F5A524) - caution
     - Danger: Red (#F31260) - fail/critical
   - Update HeroUI theme configuration (`hero.ts`)
   - Ensure WCAG AA contrast compliance (light + dark modes)

4. **Typography Improvements**
   - Continue using Inter font (already Cyrillic-compatible)
   - Standardize font sizes:
     - Headings: 24px (h1), 20px (h2), 16px (h3)
     - Body: 14px
     - Small: 12px
   - Bold weights (600-700) for emphasis
   - Ensure consistent spacing (Tailwind utilities)

5. **Touch-Friendly Design**
   - Increase button min-height to 44px (iOS guideline)
   - Add adequate spacing between interactive elements (min 8px)
   - Larger tap targets for mobile/tablet (test on iPad)
   - Touch-friendly sliders for numeric inputs (where appropriate)

6. **Contextual Help & Tooltips**
   - Add "?" icons next to complex fields
   - Tooltips with explanations (bilingual)
   - Link to Help page sections for detailed guidance
   - Example: "Intermediate tests are additional pressure hold points..."

7. **Improve Form Validation UX**
   - Inline validation with immediate feedback
   - Clear error messages near fields (not just at top)
   - Visual indicators: red outline + error message
   - Success indicators: green checkmark (where appropriate)

8. **Graph Visualization Enhancement**
   - High-contrast colors for better readability
   - Theme-aware graph rendering (update canvasRenderer.ts)
   - Clearer grid lines and axis labels
   - Legend for multi-stage tests
   - Print-friendly (ensure colors work in grayscale)

9. **Update i18n Translations**
   - Add new UI strings for guided workflow
   - Update Russian translations for clarity
   - Ensure all tooltips/help text are translated
   - Proofread Russian terms with bilingual team member

**Acceptance Criteria:**

- ✅ 4-step workflow implemented and tested with users
- ✅ Advanced settings hidden by default (progressive disclosure)
- ✅ New color scheme applied consistently (light + dark modes)
- ✅ WCAG AA contrast compliance verified
- ✅ All interactive elements are touch-friendly (44px+)
- ✅ Contextual help available for complex features
- ✅ Form validation provides clear, immediate feedback
- ✅ Graphs readable in bright light and dark mode
- ✅ All new UI text translated to Russian and English

**Estimated Effort:** 64 hours

---

### 2.3 Accessibility Improvements

**Objective:** Ensure WCAG 2.1 AA compliance and keyboard navigation

**Tasks:**

1. **Keyboard Navigation Audit**
   - Test all forms with keyboard only (Tab, Shift+Tab)
   - Ensure logical tab order (top-to-bottom, left-to-right)
   - Visible focus indicators on all interactive elements
   - Add `tabIndex` where needed

2. **ARIA Attributes**
   - Add `aria-label` to icon-only buttons
   - Use `aria-describedby` for error messages
   - Add `role="alert"` for validation errors
   - Use semantic HTML (`<button>`, `<nav>`, `<main>`)

3. **Screen Reader Testing**
   - Test with NVDA (Windows) or VoiceOver (macOS)
   - Ensure form labels are announced
   - Error messages are announced when shown
   - Graph has alt text describing data

4. **Color Contrast Verification**
   - Use WebAIM Contrast Checker
   - Ensure all text meets WCAG AA (4.5:1 for normal, 3:1 for large)
   - Test in both light and dark modes

5. **Add Skip Links**
   - "Skip to main content" link for keyboard users
   - Hidden until focused (accessibility best practice)

**Acceptance Criteria:**

- ✅ All forms navigable via keyboard only
- ✅ Focus indicators visible on all interactive elements
- ✅ ARIA attributes added where needed
- ✅ Screen reader announces form labels and errors
- ✅ WCAG AA contrast compliance in both themes
- ✅ Skip links functional

**Estimated Effort:** 16 hours

---

### 2.4 Bundle Optimization

**Objective:** Reduce bundle size and improve load times

**Tasks:**

1. **Bundle Analysis**
   - Run `vite build --analyze` (or use `rollup-plugin-visualizer`)
   - Identify large dependencies
   - Document bundle breakdown

2. **Dynamic Imports**
   - Lazy load heavy dependencies (jspdf, canvas utilities)
   - Code split by route (already in 2.1)

3. **Tree Shaking Verification**
   - Ensure HeroUI is tree-shakable (import only used components)
   - Check for side effects in dependencies

4. **Image Optimization**
   - Optimize static assets (logos, icons)
   - Use WebP where supported
   - Lazy load images below fold

5. **Lighthouse CI Integration**
   - Add Lighthouse CI to GitHub Actions
   - Set performance budget: >90 score
   - Block PRs that significantly degrade performance

**Acceptance Criteria:**

- ✅ Bundle size reduced by 15%+ (from ~1.5MB to ~1.3MB)
- ✅ Lighthouse Performance score >90
- ✅ First Contentful Paint <1.5s
- ✅ Time to Interactive <3.5s

**Estimated Effort:** 16 hours

---

### Phase 2 Summary

**Total Effort:** 128 hours (~4 weeks for 1 developer, or 2 weeks for 2 developers)

**Deliverables:**

- ✅ 50%+ faster React performance (theme switching, re-renders)
- ✅ 4-step guided workflow (improved UX)
- ✅ Industrial UI design (colors, typography, touch-friendly)
- ✅ WCAG AA accessibility compliance
- ✅ 15%+ smaller bundle size

**Risk:** Medium - UX changes require user validation, accessibility testing may reveal edge cases

**Dependencies:** Phase 1 complete (testing infrastructure to catch regressions)

---

## Phase 3: Architecture (Sprint 4)

**Duration:** 4 weeks
**Priority:** MEDIUM
**Goal:** Refine architecture for scalability and maintainability (still on Vite/React)

### 3.1 State Management Refactor

**Objective:** Evaluate and potentially integrate TanStack Query for server state

**Tasks:**

1. **Server State Analysis**
   - Identify all API calls in current codebase
   - Document current fetch patterns in components
   - Identify issues: no caching, no background refetch, manual loading states

2. **Install TanStack Query (React Query)**

   ```bash
   npm install @tanstack/react-query @tanstack/react-query-devtools
   ```

3. **Setup Query Client**
   - Create `src/lib/queryClient.ts`
   - Configure defaults (staleTime, cacheTime, retry logic)
   - Add QueryClientProvider to App.tsx

4. **Migrate API Calls to Queries**
   - **Priority:** Frequently accessed data (graph history, user profile)
   - Convert `useEffect` + `fetch` to `useQuery`
   - Example:

   ```typescript
   const {
     data: graphs,
     isLoading,
     error,
   } = useQuery({
     queryKey: ['graphs'],
     queryFn: () => apiService.getGraphs(),
     staleTime: 5 * 60 * 1000, // 5 minutes
   });
   ```

5. **Implement Mutations**
   - `useMutation` for create/update/delete operations
   - Optimistic updates for better UX
   - Cache invalidation on success

6. **Separate Client State (Zustand) from Server State (TanStack Query)**
   - **Zustand:** UI state (theme, language, form drafts)
   - **TanStack Query:** Server data (graphs, users, settings)

7. **Add React Query DevTools**
   - Enable in development for debugging
   - Monitor cache, queries, mutations

**Acceptance Criteria:**

- ✅ TanStack Query installed and configured
- ✅ All graph history fetching uses `useQuery`
- ✅ All create/update/delete operations use `useMutation`
- ✅ Automatic background refetch configured
- ✅ Optimistic updates for better UX
- ✅ Cache invalidation works correctly
- ✅ No unnecessary re-fetches

**Estimated Effort:** 32 hours

---

### 3.2 API Layer Standardization

**Objective:** Improve API documentation and error handling

**Tasks:**

1. **OpenAPI/Swagger Documentation**
   - Complete `openapi.yaml` for all endpoints
   - Add request/response schemas
   - Add authentication requirements
   - Generate TypeScript types from OpenAPI spec (optional: `openapi-typescript`)

2. **API Versioning**
   - Implement `/api/v1/` prefix for all endpoints
   - Plan for future v2 migrations

3. **Standardize Error Responses**
   - Consistent error format:

   ```json
   {
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Working pressure must be less than max pressure",
       "field": "workingPressure"
     }
   }
   ```

   - Document all error codes

4. **Rate Limiting (already exists, verify configuration)**
   - Review current rate limits
   - Add rate limit headers to responses

5. **Request/Response Logging**
   - Structured logs for all API requests
   - Include request ID for tracing

**Acceptance Criteria:**

- ✅ OpenAPI spec complete and accurate
- ✅ Swagger UI accessible at `/api-docs`
- ✅ API versioning implemented (/api/v1/)
- ✅ Error responses standardized
- ✅ Rate limiting configured appropriately

**Estimated Effort:** 24 hours

---

### 3.3 Component Architecture Refinement

**Objective:** Establish atomic design principles and component library

**Tasks:**

1. **Audit Existing Components**
   - Categorize: Atoms, Molecules, Organisms, Templates, Pages
   - Identify reusable patterns
   - Document component dependencies

2. **Create Shared Component Library**
   - Move common components to `/src/components/common/`
   - Examples: Button variants, Card variants, Input wrappers
   - Ensure all use HeroUI base components

3. **Component Documentation (Optional: Storybook)**
   - If time permits, setup Storybook
   - Document props, variants, examples
   - Interactive component playground
   - Alternative: Simple README per component

4. **Refactor Large Components**
   - Break down components >250 lines
   - Extract sub-components
   - Example: `TestParametersForm.tsx` → split into smaller form sections

5. **Prop Types Standardization**
   - Use TypeScript interfaces for all props
   - Export prop types for reuse
   - Document required vs. optional props

**Acceptance Criteria:**

- ✅ Component library structure established
- ✅ Common components extracted and reusable
- ✅ All components <250 lines (or justified if larger)
- ✅ Prop types documented and exported
- ✅ (Optional) Storybook setup with 10+ component stories

**Estimated Effort:** 32 hours (or 48 hours if including Storybook)

---

### 3.4 Database Optimization

**Objective:** Improve query performance and indexing

**Tasks:**

1. **Query Performance Audit**
   - Enable PostgreSQL slow query log
   - Identify slow queries (>100ms)
   - Use `EXPLAIN ANALYZE` for query plans

2. **Add Missing Indexes**
   - Index foreign keys
   - Index frequently queried columns (user_id, created_at)
   - Composite indexes for common query patterns

3. **Optimize Queries**
   - Replace N+1 queries with JOINs
   - Use pagination for large result sets
   - Add database-level filtering instead of app-level

4. **Connection Pool Tuning**
   - Review current pool size (max 20)
   - Adjust based on load testing
   - Add connection pool monitoring

5. **Caching Strategy**
   - Identify cacheable queries (rarely change)
   - Implement Redis caching (optional, future)
   - Or use TanStack Query cache for now

**Acceptance Criteria:**

- ✅ All queries <50ms (excluding complex reports)
- ✅ Proper indexes on all foreign keys
- ✅ No N+1 queries
- ✅ Connection pool optimized
- ✅ Slow query log monitored

**Estimated Effort:** 24 hours

---

### Phase 3 Summary

**Total Effort:** 112 hours (~4 weeks for 1 developer, or 2 weeks for 2 developers)

**Deliverables:**

- ✅ TanStack Query integrated for server state management
- ✅ API documentation complete (OpenAPI/Swagger)
- ✅ Component library established (atomic design)
- ✅ Database queries optimized (<50ms)
- ✅ (Optional) Storybook for component documentation

**Risk:** Low-Medium - Architectural changes, but with testing safety net from Phase 1

**Dependencies:** Phase 1 complete (testing prevents regressions during refactor)

---

## Phase 4: Next.js Migration (Sprint 5-6)

**Duration:** 6-8 weeks
**Priority:** EVALUATE FIRST
**Goal:** Migrate from Vite/React to Next.js 13+ App Router (if benefits validated)

### Decision Point: Next.js Migration Evaluation

**BEFORE starting Phase 4, evaluate:**

1. **Benefits vs. Complexity Trade-off**
   - **Pros:** SSR for shareable reports (better previews), file-based routing (simpler structure), potential SEO
   - **Cons:** Migration effort (6-8 weeks), Zustand client-only complexity, testing re-work, team learning curve

2. **Pressograph Use Case Analysis**
   - **Question:** Do we need SSR? Most users are authenticated (SPA is fine for dashboard)
   - **Question:** Do shareable reports need SEO? (If shared via direct links, maybe not critical)
   - **Question:** Is performance actually better with SSR? (Current Vite setup is very fast)

3. **Alternative: Partial SSR with Current Stack**
   - **Option:** Add separate Next.js app ONLY for public shareable report pages
   - **Keep:** Main Vite/React app for authenticated dashboard
   - **Benefit:** Best of both worlds, no full migration

**RECOMMENDATION:** Conduct 2-week prototype before committing to full migration

### 4.1 Next.js Prototype (2 weeks)

**Objective:** Validate benefits before full migration commitment

**Tasks:**

1. **Create Minimal Next.js App**
   - Setup Next.js 13+ with App Router in `/next-prototype` directory
   - Migrate ONE page (e.g., Login or Shareable Report)
   - Test SSR performance vs. Vite SPA

2. **Zustand Integration Test**
   - Verify Zustand works client-side only in Next.js
   - Test for hydration errors
   - Document required patterns (`'use client'` directives)

3. **Middleware Authentication Test**
   - Implement JWT token verification in `middleware.ts`
   - Test protected route redirects
   - Compare complexity vs. current React Router approach

4. **Performance Benchmark**
   - Lighthouse comparison: Next.js SSR vs. Vite SPA
   - Measure First Contentful Paint, Time to Interactive
   - Real-world load testing

5. **Team Evaluation**
   - Gather developer feedback on DX (Developer Experience)
   - Assess learning curve
   - Estimate migration effort

**Decision Criteria:**

- **GO:** If SSR shows >20% performance improvement AND team is comfortable with Next.js
- **NO-GO:** If benefits are marginal (<10% improvement) OR migration effort too high
- **ALTERNATIVE:** If partial SSR (separate Next.js app for public pages) makes more sense

**Estimated Effort:** 80 hours (2 weeks prototype + evaluation)

---

### 4.2 Full Next.js Migration (If GO Decision)

**Duration:** 4-6 weeks (after prototype)

**Tasks:**

1. **App Router Structure Setup**
   - Create `/app` directory with layouts
   - Implement file-based routing for all pages:
     - `/app/page.tsx` (HomePage)
     - `/app/login/page.tsx`
     - `/app/history/page.tsx`
     - `/app/admin/page.tsx`
     - `/app/help/page.tsx`
     - `/app/profile/page.tsx`

2. **Authentication Middleware**
   - Implement `middleware.ts` for route protection
   - JWT token verification from cookies
   - Redirect unauthenticated users to `/login`

3. **Zustand Client-Side Integration**
   - Mark all Zustand usage with `'use client'`
   - Ensure no SSR hydration errors
   - Document patterns for team

4. **SSR for Shareable Reports**
   - Create `/app/share/[token]/page.tsx` (dynamic route)
   - Fetch test data on server side
   - Pre-render graph HTML for fast previews

5. **API Route Proxy (Optional)**
   - Create Next.js API routes in `/app/api/` to proxy to Express backend
   - Or keep direct fetch to Express (simpler, recommended)

6. **Migrate Components**
   - Move all components from `/src/components` to `/app/components`
   - Add `'use client'` where needed (interactive components)
   - Test for hydration errors

7. **Update Build Process**
   - Replace Vite config with `next.config.js`
   - Update Docker build to use Next.js standalone output
   - Test production builds

8. **Update i18n**
   - Migrate custom i18n to `next-i18next` (or keep custom if it works)
   - Test server-side translations for SSR pages

9. **Testing Updates**
   - Update tests for Next.js (may need new testing patterns)
   - Ensure all tests pass

10. **Documentation Updates**
    - Update all dev docs for Next.js workflow
    - Team training on App Router patterns

**Acceptance Criteria:**

- ✅ All routes migrated to Next.js App Router
- ✅ Authentication middleware working (protected routes)
- ✅ Zustand state management preserved (client-side)
- ✅ SSR functional for Login and Shareable Report pages
- ✅ No hydration errors
- ✅ All existing features work identically
- ✅ Tests updated and passing
- ✅ Performance equal or better than Vite (Lighthouse)
- ✅ Docker deployment works with Next.js
- ✅ Team trained on Next.js patterns

**Estimated Effort:** 200 hours (5-6 weeks for 1 developer, or 3 weeks for 2 developers)

---

### Phase 4 Summary

**Total Effort:** 280 hours (2 weeks prototype + 5-6 weeks migration)

**Deliverables:**

- ✅ Next.js prototype evaluated
- ✅ GO/NO-GO decision documented
- ✅ (If GO) Full Next.js migration complete
- ✅ (If NO-GO) Alternative SSR solution or remain on Vite

**Risk:** HIGH - Major framework migration, potential for bugs and delays

**Dependencies:**

- Phase 1 complete (testing to catch regressions)
- Phase 2 complete (avoid migrating unoptimized code)
- Prototype evaluation shows clear benefits

**CRITICAL:** Do NOT proceed with full migration without prototype validation

---

## Phase 5: Advanced Features (Sprint 7+)

**Duration:** Ongoing
**Priority:** LOW-MEDIUM
**Goal:** Add new capabilities and enhanced user features

### 5.1 User Management Enhancements

**Tasks:**

1. **Multi-User Support**
   - User roles (admin, engineer, viewer)
   - Role-based permissions
   - User CRUD operations in admin panel

2. **User Profiles**
   - Customizable user settings
   - Preferences (default language, theme, export format)
   - Avatar upload (optional)

3. **Audit Logs**
   - Track all user actions (create, edit, delete graphs)
   - Admin dashboard for audit review

**Estimated Effort:** 40 hours

---

### 5.2 Advanced Graph Features

**Tasks:**

1. **Batch Operations**
   - Export multiple graphs at once
   - Bulk delete
   - Compare multiple tests (overlay graphs)

2. **Export Templates**
   - Save custom export settings (logo, colors, layout)
   - Reusable templates for different clients

3. **Custom Themes**
   - User-customizable color schemes
   - Company branding (logo, colors)

4. **Data Import/Export**
   - Import test data from CSV/Excel
   - Export to Excel with charts

**Estimated Effort:** 64 hours

---

### 5.3 Analytics & Monitoring

**Tasks:**

1. **Error Tracking**
   - Integrate Sentry for frontend and backend
   - Automatic error reporting
   - Source maps for debugging

2. **User Analytics**
   - Track feature usage
   - Identify pain points
   - A/B testing framework (optional)

3. **Performance Monitoring**
   - Real User Monitoring (RUM)
   - Backend APM (Application Performance Monitoring)
   - Alerts for slow queries or errors

4. **Logging Improvements**
   - Structured JSON logging
   - Log aggregation (ELK stack or Grafana Loki)
   - Centralized log search

**Estimated Effort:** 48 hours

---

### 5.4 Infrastructure Enhancements

**Tasks:**

1. **Cloud Storage**
   - Migrate from local filesystem to S3/MinIO
   - Automatic backups
   - CDN for faster graph delivery

2. **Database High Availability**
   - PostgreSQL replication (primary + replica)
   - Automatic failover
   - Read replicas for scaling

3. **Backup Automation**
   - Automated daily database backups
   - Retention policy (30 days)
   - Offsite backup storage

4. **Load Testing**
   - Define load test scenarios
   - Run with k6 or Artillery
   - Capacity planning

**Estimated Effort:** 80 hours

---

### Phase 5 Summary

**Total Effort:** 232 hours (can be spread across multiple sprints)

**Deliverables:**

- ✅ Multi-user support with roles
- ✅ Advanced graph features (batch, templates, custom themes)
- ✅ Error tracking and analytics
- ✅ Infrastructure improvements (cloud storage, HA database)

**Risk:** Low - Features are additive, not replacing existing functionality

**Dependencies:** Phase 1 complete (testing for new features)

---

## Migration Strategy

### Backward Compatibility

1. **API Compatibility**
   - Maintain existing API endpoints during migration
   - Use API versioning (`/api/v1/` → `/api/v2/`) for breaking changes
   - Deprecation warnings for old endpoints

2. **Database Migration Scripts**
   - Use `node-pg-migrate` for all schema changes
   - Test migrations on staging before production
   - Rollback scripts for every migration

3. **Feature Flags**
   - Use feature flags for gradual rollout
   - Enable new features for subset of users first
   - Easy rollback if issues found

### Incremental Rollout

1. **Staging Environment**
   - Deploy all changes to staging first
   - Test thoroughly before production
   - Smoke tests + manual QA

2. **Canary Deployment (Optional)**
   - Deploy to 10% of users first
   - Monitor metrics (errors, performance)
   - Gradual rollout to 50%, then 100%

3. **Blue-Green Deployment**
   - Maintain two production environments (blue = old, green = new)
   - Switch traffic to green after validation
   - Keep blue as instant rollback option

### Data Migration

1. **Graph Data**
   - No schema changes expected (JSON storage is flexible)
   - If needed, write migration scripts to transform old JSON to new format
   - Test with production data clone

2. **User Data**
   - Preserve all user accounts and authentication
   - Hash password migration if auth changes (unlikely)

---

## Risk Mitigation

### High-Risk Areas

1. **Next.js Migration (Phase 4)**
   - **Risk:** Framework migration breaks features, delays timeline
   - **Mitigation:** 2-week prototype BEFORE full commitment, comprehensive testing, gradual rollout
   - **Rollback:** Keep Vite build as fallback, deploy side-by-side initially

2. **Theme Switching Performance (Phase 2)**
   - **Risk:** Optimization efforts don't solve lag
   - **Mitigation:** Profile before coding, measure after each change, consider CSS variables instead of React re-renders
   - **Fallback:** If unsolvable, disable rapid theme toggling (debounce to 500ms)

3. **Testing Infrastructure (Phase 1)**
   - **Risk:** Tests are flaky or hard to maintain
   - **Mitigation:** Start with simple unit tests, use well-documented libraries (Vitest, RTL), dedicate time to learning
   - **Fallback:** Lower coverage target (40% instead of 60%) if quality is better

### Medium-Risk Areas

4. **TanStack Query Integration (Phase 3)**
   - **Risk:** Cache invalidation issues, over-fetching
   - **Mitigation:** Prototype on ONE feature first (graph history), monitor with DevTools, document patterns
   - **Fallback:** Keep simple fetch if TanStack Query adds complexity without benefit

5. **UX Redesign (Phase 2)**
   - **Risk:** Users dislike new workflow, find it confusing
   - **Mitigation:** User testing with 3-5 real users before final rollout, A/B test if possible
   - **Fallback:** Feature flag to toggle between old and new UI

### Rollback Procedures

1. **Code Rollback**
   - All changes via Git with clear commit messages
   - Git tags for each release (`v1.2.0`, `v1.3.0`)
   - Instant rollback: `git checkout v1.2.0 && make deploy`

2. **Database Rollback**
   - Every migration has a `down` script
   - Test rollback on staging before production migration
   - Backup database before any schema change

3. **Container Rollback**
   - Tag all Docker images with version + Git hash
   - Keep previous 3 images in registry
   - Rollback: Update `docker-compose.yml` to previous tag, redeploy

---

## Success Metrics

### Phase 1: Foundation

- ✅ **Test Coverage:** 60%+ overall, 80%+ for critical paths
- ✅ **CI/CD Speed:** PR feedback in <5 minutes, deployment in <10 minutes
- ✅ **Code Quality:** 0 ESLint errors, 0 TypeScript errors (strict mode)
- ✅ **Developer Satisfaction:** 4/5+ on DX survey (faster, safer deployments)

### Phase 2: Performance & UX

- ✅ **Performance:**
  - Theme toggle <100ms (down from ~500ms)
  - Lighthouse score >90 (up from ~75)
  - First Contentful Paint <1.5s
- ✅ **UX:**
  - 4-step workflow tested with 5+ users (4/5+ satisfaction)
  - WCAG AA compliance verified
  - Touch targets 44px+ on all interactive elements
- ✅ **Bundle Size:** 15%+ reduction (1.5MB → 1.3MB)

### Phase 3: Architecture

- ✅ **API:** 100% OpenAPI documentation coverage
- ✅ **Database:** All queries <50ms
- ✅ **State Management:** Server state separated from client state
- ✅ **Component Library:** 10+ reusable components documented

### Phase 4: Next.js Migration (If Executed)

- ✅ **Performance:** Equal or better than Vite (Lighthouse score maintained or improved)
- ✅ **SSR:** Login and shareable reports render server-side (<1s TTFB)
- ✅ **Functionality:** 100% feature parity with Vite version
- ✅ **Stability:** 0 critical bugs in first 2 weeks post-launch

### Phase 5: Advanced Features

- ✅ **User Management:** Multi-user support with role-based access
- ✅ **Features:** 5+ new features shipped (batch export, templates, analytics)
- ✅ **Monitoring:** Error tracking active, <5% error rate
- ✅ **Infrastructure:** Database backups automated, 99.9% uptime

---

## Decision: Next.js Migration Analysis

### Current Recommendation: DEFER to Phase 4, Prototype First

**Rationale:**

1. **Vite is Already Modern**
   - React 19 + Vite 7 is state-of-the-art SPA stack
   - HMR is faster than Next.js in development
   - Bundle size is smaller than typical Next.js app

2. **SSR Benefits Are Limited for Pressograph**
   - **90%+ of usage is authenticated dashboard** (SPA is ideal here)
   - **Shareable reports:** Nice to have SSR, but not critical (can be added later)
   - **SEO:** Not a major concern (not a public-facing site)

3. **Migration Risks Are High**
   - 6-8 weeks of effort (200+ hours)
   - Zustand complexity with Next.js client-side requirements
   - Testing infrastructure would need updates
   - Team learning curve

4. **Alternative: Hybrid Approach**
   - **Keep Vite/React for main dashboard** (fast, proven, team knows it)
   - **Add Next.js ONLY for public pages** (shareable reports, public docs)
   - **Best of both worlds:** Fast SPA for users, SEO for public content

### Next.js Migration Decision Tree

```
Should we migrate to Next.js?
│
├─ Does Pressograph need SEO for most pages?
│  ├─ NO → Don't migrate (current SPA is fine)
│  └─ YES → Consider migration
│
├─ Do we need SSR for authenticated pages?
│  ├─ NO → Don't migrate (SPA is faster for dashboards)
│  └─ YES → Consider migration
│
├─ Is team comfortable with Next.js?
│  ├─ NO → Training required, factor into timeline
│  └─ YES → Proceed
│
├─ Can we afford 6-8 weeks of migration effort?
│  ├─ NO → Don't migrate or use hybrid approach
│  └─ YES → Proceed with prototype
│
└─ Does prototype show >20% performance improvement?
   ├─ NO → Don't migrate (not worth the effort)
   └─ YES → Proceed with full migration
```

### Recommendation for Pressograph

**Phase 1-3: Stay on Vite/React**

- Deliver UX improvements faster
- Lower risk, proven stack
- Focus on testing and CI/CD first

**Phase 4: Evaluate with Prototype**

- Build 2-week proof-of-concept
- Measure actual benefits (performance, DX, UX)
- Make data-driven decision

**Alternative: Hybrid Approach (Recommended if SSR needed)**

- Main app stays Vite/React
- Separate Next.js app for `/share/[token]` shareable reports
- Deploy both apps behind Traefik reverse proxy
- Minimal migration effort, maximum benefit

---

## Conclusion

This refactoring plan provides a **phased, incremental approach** to modernizing Pressograph while managing risk and delivering value at each stage.

**Key Principles:**

1. **Safety First:** Establish testing and CI/CD before major changes (Phase 1)
2. **Incremental Value:** Each phase delivers tangible improvements
3. **Validate Assumptions:** Prototype before committing to big migrations (Next.js)
4. **User-Centric:** UX improvements based on real feedback, tested with users
5. **Pragmatic:** Choose tools/frameworks that solve actual problems, not for hype

**Timeline Summary:**

- **Sprint 2 (Phase 1):** 3 weeks - Foundation (CRITICAL)
- **Sprint 3 (Phase 2):** 4 weeks - Performance & UX (HIGH PRIORITY)
- **Sprint 4 (Phase 3):** 4 weeks - Architecture (MEDIUM PRIORITY)
- **Sprint 5-6 (Phase 4):** 6-8 weeks - Next.js Migration (EVALUATE FIRST)
- **Sprint 7+ (Phase 5):** Ongoing - Advanced Features

**Total Effort:** ~800 hours (20 weeks) for full plan execution

**Recommended Approach:**

1. Execute Phase 1 immediately (cannot refactor safely without tests)
2. Execute Phase 2 (UX improvements deliver visible value)
3. Execute Phase 3 (architecture refinements)
4. Prototype Next.js in Phase 4, make GO/NO-GO decision
5. If NO-GO on Next.js, continue with Phase 5 advanced features on Vite
6. If GO on Next.js, complete migration before Phase 5

**Next Steps:**

1. Review and approve this plan with team
2. Create GitHub milestones for Sprints 2-6
3. Create GitHub issues for Phase 1 tasks
4. Begin Phase 1 execution immediately

---

**Document Maintenance:**

- Update after each phase completion
- Adjust timelines based on actual effort
- Document decisions (GO/NO-GO for Next.js)

**References:**

- See `CURRENT_STACK.md` for current technical details
- See `/docs/refac/*.md` for original refactoring proposals
- See GitHub Issues for task tracking
