# Dependency Audit & Turbopack Integration Analysis

**Date:** 2025-10-31
**Status:** Critical Findings Requiring Architectural Decision

## Executive Summary

### CRITICAL: Turbopack Integration Requires Next.js Migration

**Finding:** Turbopack is **NOT** available as a standalone bundler. It is exclusively integrated with Next.js.

**Options:**

1. **Migrate to Next.js 16** (brings Turbopack by default)
2. **Continue with Vite** (current, stable, performant for React SPAs)

**Recommendation:** **Accelerate Next.js migration from Phase 4 to Phase 2** (Sprint 2-3)

---

## Turbopack Research Findings

### What is Turbopack?

- Rust-based bundler by Vercel (Webpack successor)
- Became **stable in Next.js 16** (early 2025)
- Default bundler for `next dev` and `next build` in Next.js 16+
- **NOT available as standalone CLI** (no `turbopack` npm package to replace Vite)

### Performance Characteristics

- **Cold boot (5,000 modules):** Turbopack 4s, Vite+SWC 16.6s
- **HMR:** Both extremely fast (sub-second)
- **Production builds:** Comparable optimization levels

### Ecosystem Status (2025)

- **Next.js:** Turbopack is default and stable
- **Standalone React/Vue/Svelte:** Vite remains recommended choice
- **Plugin ecosystem:** Turbopack still maturing (Vite more mature)

### Migration Path to Turbopack

```bash
# REQUIRES Next.js migration
npx create-next-app@latest --turbopack

# Current Vite project → Next.js 16 with Turbopack
# 1. Install Next.js 16
# 2. Migrate file structure (pages/ or app/ directory)
# 3. Convert routing from react-router to Next.js routing
# 4. Adapt build configuration
# 5. Update environment variables
# 6. Migrate API routes to Next.js API routes or Route Handlers
```

**Estimated effort:** 80-120 hours (2-3 weeks for 2 developers)

---

## Current Stack Versions vs Latest Stable

### Frontend (`/package.json`)

| Package                     | Current | Latest       | Update Type | Breaking Changes           | Priority   |
| --------------------------- | ------- | ------------ | ----------- | -------------------------- | ---------- |
| **Build Tools**             |
| `vite`                      | 7.1.12  | 7.1.12       | ✅ Latest   | N/A                        | -          |
| `@vitejs/plugin-react`      | 4.7.0   | **5.1.0**    | Major       | Yes - Plugin API changes   | **HIGH**   |
| `typescript`                | 5.9.3   | 5.9.3        | ✅ Latest   | N/A                        | -          |
| **React Ecosystem**         |
| `react`                     | 19.2.0  | 19.2.0       | ✅ Latest   | N/A                        | -          |
| `react-dom`                 | 19.2.0  | 19.2.0       | ✅ Latest   | N/A                        | -          |
| `@types/react`              | 19.0.6  | 19.0.6       | ✅ Latest   | N/A                        | -          |
| `@types/react-dom`          | 19.0.2  | 19.0.2       | ✅ Latest   | N/A                        | -          |
| **UI Libraries**            |
| `@heroui/react`             | 2.8.5   | 2.8.5        | ✅ Latest   | N/A                        | -          |
| `@heroui/theme`             | 2.4.23  | 2.4.23       | ✅ Latest   | N/A                        | -          |
| `tailwindcss`               | 4.1.16  | 4.1.16       | ✅ Latest   | N/A                        | -          |
| `framer-motion`             | 11.18.2 | **12.23.24** | Major       | Possible - Check changelog | **MEDIUM** |
| **Routing & State**         |
| `react-router-dom`          | 7.9.4   | **7.9.5**    | Patch       | No                         | LOW        |
| `zustand`                   | 5.0.8   | 5.0.8        | ✅ Latest   | N/A                        | -          |
| **Utilities**               |
| `jspdf`                     | 2.5.2   | **3.0.3**    | Major       | Yes - API changes          | **HIGH**   |
| `date-fns`                  | 4.1.0   | 4.1.0        | ✅ Latest   | N/A                        | -          |
| **Testing**                 |
| `vitest`                    | 4.0.5   | 4.0.5        | ✅ Latest   | N/A                        | -          |
| `@testing-library/react`    | 16.3.0  | 16.3.0       | ✅ Latest   | N/A                        | -          |
| **Linting**                 |
| `eslint`                    | 9.18.0  | 9.18.0       | ✅ Latest   | N/A                        | -          |
| `eslint-plugin-react-hooks` | 5.2.0   | **7.0.1**    | Major       | Possible                   | **MEDIUM** |
| `prettier`                  | 3.6.2   | 3.6.2        | ✅ Latest   | N/A                        | -          |

### Backend (`/server/package.json`)

| Package               | Current  | Latest     | Update Type | Breaking Changes          | Priority   |
| --------------------- | -------- | ---------- | ----------- | ------------------------- | ---------- |
| **Runtime**           |
| `@types/node`         | 20.19.23 | **24.9.2** | Major       | Node.js 22 types          | **HIGH**   |
| `typescript`          | 5.3.3    | **5.9.3**  | Minor       | No (safe)                 | **HIGH**   |
| **Core Dependencies** |
| `express`             | 4.21.2   | **5.1.0**  | Major       | Yes - Middleware API      | **HIGH**   |
| `@types/express`      | 4.17.25  | **5.0.5**  | Major       | Depends on Express v5     | **HIGH**   |
| `bcrypt`              | 5.1.1    | **6.0.0**  | Major       | Possible                  | **MEDIUM** |
| `@types/bcrypt`       | 5.0.2    | **6.0.0**  | Major       | Type changes              | **MEDIUM** |
| **Utilities**         |
| `dotenv`              | 16.6.1   | **17.2.3** | Major       | Check migration guide     | **MEDIUM** |
| `express-rate-limit`  | 7.5.1    | **8.2.0**  | Major       | Possible                  | **MEDIUM** |
| `helmet`              | 7.2.0    | **8.1.0**  | Major       | Security defaults changed | **HIGH**   |
| **Database**          |
| `pg`                  | 8.11.3   | 8.11.3     | ✅ Latest   | N/A                       | -          |
| `@types/pg`           | 8.10.9   | 8.10.9     | ✅ Latest   | N/A                       | -          |
| `node-pg-migrate`     | 6.2.2    | **8.0.3**  | Major       | Migration file format     | **MEDIUM** |
| **PDF/Canvas**        |
| `pdfkit`              | 0.17.2   | 0.17.2     | ✅ Latest   | N/A                       | -          |
| `@types/pdfkit`       | 0.13.9   | **0.17.3** | Minor       | Type improvements         | LOW        |
| `canvas`              | 3.2.0    | 3.2.0      | ✅ Latest   | N/A                       | -          |

---

## Upgrade Strategy

### Phase 1: Safe Updates (Sprint 2 - Week 1)

**Goal:** Update packages without breaking changes

```bash
# Frontend
npm install react-router-dom@latest

# Backend
npm install @types/pdfkit@latest
npm install typescript@5.9.3
```

**Estimated effort:** 2 hours
**Risk:** Low
**Testing required:** Regression tests

### Phase 2: Medium-Risk Updates (Sprint 2 - Week 2)

**Goal:** Update packages with minor breaking changes

```bash
# Frontend
npm install framer-motion@latest  # Check animation API changes
npm install eslint-plugin-react-hooks@latest  # Review new rules

# Backend
npm install @types/node@24.9.2  # Node 22 type improvements
npm install dotenv@latest
npm install bcrypt@latest @types/bcrypt@latest
npm install express-rate-limit@latest
npm install node-pg-migrate@latest  # Review migration changes
```

**Estimated effort:** 8-16 hours
**Risk:** Medium
**Testing required:** Full integration tests, API tests

### Phase 3: High-Risk Updates (Sprint 2 - Week 3-4)

**Goal:** Major version upgrades with breaking changes

```bash
# Frontend
npm install @vitejs/plugin-react@latest  # Check Vite config changes
npm install jspdf@latest  # MAJOR: Review API changes for PDF generation

# Backend
npm install express@5.1.0 @types/express@5.0.5  # MAJOR: Middleware changes
npm install helmet@latest  # Review security policy changes
```

**Estimated effort:** 16-24 hours
**Risk:** High
**Testing required:** Full E2E tests, PDF export tests, security audit

### Phase 4: Next.js + Turbopack Migration (Sprint 2-3)

**Goal:** Migrate from Vite to Next.js 16 (brings Turbopack)

#### Prerequisites

- ✅ All tests passing (60% coverage minimum)
- ✅ Current dependencies updated
- ✅ API contracts documented
- ✅ Deployment pipeline tested

#### Migration Tasks

**1. Next.js Setup (Week 1)**

```bash
npm install next@latest react@latest react-dom@latest
```

**Changes required:**

- Move `/src` to `/app` (App Router) or `/pages` (Pages Router)
- Convert `react-router-dom` routes to Next.js file-based routing
- Update `vite.config.ts` → `next.config.js` with Turbopack config
- Migrate environment variables to `.env.local`
- Update CSS imports (Tailwind already compatible)

**2. API Migration (Week 1-2)**

```bash
# Option A: Keep separate Express backend (current architecture)
# Option B: Migrate to Next.js API Routes/Route Handlers
```

**Recommended:** Keep Express backend separate (microservices architecture)

**3. Build Configuration (Week 2)**

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack enabled by default in Next.js 16
  reactStrictMode: true,

  // Proxy API requests to Express backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:3001/api/:path*',
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.VITE_API_URL,
  },
};

export default nextConfig;
```

**4. Component Migration (Week 2-3)**

- Update imports: `vite` → `next`
- Add `'use client'` to components using hooks
- Convert `<Link>` from react-router to `next/link`
- Update image imports to `next/image` for optimization

**5. Testing & Deployment (Week 3-4)**

- Update Vitest config for Next.js
- Update Containerfile for Next.js build
- Test production build with Turbopack
- Deploy to dev environment
- Performance testing
- Production deployment

**Estimated total effort:** 80-120 hours (2-3 weeks, 2 developers)
**Risk:** Very High
**Benefits:**

- ✅ Turbopack bundler (4x faster cold starts)
- ✅ Built-in optimizations (image, font, script)
- ✅ Server Components (future-proof)
- ✅ Better SEO (SSR/SSG capabilities)
- ✅ Edge runtime support
- ✅ Official Vercel support

**Concerns:**

- ❌ Large architectural change
- ❌ Learning curve for team
- ❌ Potential bugs during migration
- ❌ HeroUI compatibility with Next.js (verify)

---

## Decision Matrix

| Option                                                 | Pros                                                                      | Cons                                                       | Effort    | Risk          |
| ------------------------------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------- | --------- | ------------- |
| **A. Update dependencies only (keep Vite)**            | ✅ Low risk<br>✅ Fast (2-4 weeks)<br>✅ Known stack                      | ❌ No Turbopack<br>❌ Doesn't meet "Turbopack" requirement | 40-60h    | Low           |
| **B. Migrate to Next.js 16 now**                       | ✅ Turbopack included<br>✅ Future-proof<br>✅ Better DX                  | ❌ High effort<br>❌ High risk<br>❌ Team training needed  | 80-120h   | Very High     |
| **C. Hybrid: Update deps + Plan Next.js for Sprint 3** | ✅ Balanced approach<br>✅ Build safety net first<br>✅ Gradual migration | ❌ Delayed Turbopack<br>❌ Longer timeline                 | 40h + 80h | Medium → High |

---

## Recommended Action Plan

### RECOMMENDED: **Option C - Hybrid Approach**

**Rationale:**

1. **Safety First:** Current stack is modern (React 19, Vite 7, TypeScript 5.9)
2. **Testing Infrastructure:** Phase 1 testing just set up - need to validate before major migration
3. **Risk Mitigation:** Update dependencies first, then migrate with confidence
4. **Team Readiness:** Allows time for Next.js training/research

**Timeline:**

**Sprint 2 (Current):**

- ✅ Week 1-2: Update all dependencies to latest stable (Phase 1-3 above)
- ✅ Week 3-4: Reach 60% test coverage
- ✅ Week 4: Create Next.js migration plan + prototype

**Sprint 3:**

- Week 1-2: Next.js 16 migration (App Router + Turbopack)
- Week 3: Testing & bug fixes
- Week 4: Production deployment with Turbopack

**Total Timeline:** 8 weeks to production with Turbopack

---

## Breaking Changes Summary

### Frontend High-Priority Updates

#### 1. jspdf 2.5.2 → 3.0.3

**Breaking changes:**

- API method signatures changed
- Font handling updated
- Need to review `/server/src/controllers/graph.controller.ts` PDF generation

**Migration:**

```bash
# Check changelog
npm view jspdf@3.0.3 changelog
```

#### 2. @vitejs/plugin-react 4.7.0 → 5.1.0

**Breaking changes:**

- Plugin configuration options changed
- React Fast Refresh updates

**Files to review:**

- `vite.config.ts`

#### 3. framer-motion 11.18.2 → 12.23.24

**Breaking changes:**

- Animation API improvements
- Potential prop changes

**Files to review:**

- All components using `motion.*` (search codebase)

### Backend High-Priority Updates

#### 1. Express 4.21.2 → 5.1.0

**MAJOR breaking changes:**

- Middleware signature changes: `(err, req, res, next)` → new pattern
- Router behavior changes
- Error handling updates

**Files to review:**

- `/server/src/index.ts`
- `/server/src/middleware/*`
- All route handlers

**Migration guide:** https://expressjs.com/en/guide/migrating-5.html

#### 2. Helmet 7.2.0 → 8.1.0

**Breaking changes:**

- Default security policies stricter
- CSP configuration changes

**Impact:**

- May break frontend if CSP too strict
- Review CORS/CSP settings

#### 3. @types/node 20.x → 24.x

**Changes:**

- Node.js 22 LTS type definitions
- New APIs available

**Benefit:**

- Better type safety
- Access to Node 22 features

---

## Action Items

### Immediate (This Sprint)

- [ ] **DECISION REQUIRED:** Approve Option C (Hybrid Approach)
- [ ] Create GitHub issues for dependency updates
- [ ] Create GitHub milestone "Next.js + Turbopack Migration" (Sprint 3)
- [ ] Begin Phase 1 updates (safe updates)

### Next Week

- [ ] Complete Phase 2 updates (medium-risk)
- [ ] Reach 30% test coverage
- [ ] Research HeroUI compatibility with Next.js

### Sprint 3 Preparation

- [ ] Complete Phase 3 updates (high-risk)
- [ ] Reach 60% test coverage
- [ ] Create Next.js migration prototype
- [ ] Team training on Next.js App Router

---

## References

### Official Documentation

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Turbopack Documentation](https://nextjs.org/docs/app/api-reference/turbopack)
- [Next.js Migration Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html)

### Package Changelogs

- [jspdf v3.0.0 changelog](https://github.com/parallax/jsPDF/releases/tag/v3.0.0)
- [framer-motion v12 changelog](https://github.com/motiondivision/motion/releases)
- [Helmet v8 changelog](https://github.com/helmetjs/helmet/releases)

---

**Generated:** 2025-10-31
**Author:** Claude Code
**Status:** Awaiting approval for Option C implementation
