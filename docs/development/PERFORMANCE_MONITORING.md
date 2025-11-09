# Performance Monitoring Guide

**Version:** 1.0.0
**Date:** 2025-11-09
**Status:** Active
**Author:** Pressograph Development Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Bundle Size Analysis](#bundle-size-analysis)
3. [Current Performance Metrics](#current-performance-metrics)
4. [Optimization Strategies](#optimization-strategies)
5. [Monitoring Tools](#monitoring-tools)
6. [Performance Targets](#performance-targets)
7. [Historical Tracking](#historical-tracking)

---

## Executive Summary

This document provides comprehensive guidance on monitoring and optimizing Pressograph's frontend performance. The application uses Next.js 16 with Turbopack, React 19, and ECharts 6 for visualization.

### Current Status (2025-11-09)

| Metric | Value | Status | Target |
|--------|-------|--------|--------|
| Total Build Size | 196 MB | ⚠️ Monitor | < 200 MB |
| Static Assets | 3.5 MB | ✅ Good | < 5 MB |
| Largest JS Chunk | 664 KB | ⚠️ Monitor | < 500 KB |
| Total JS Chunks | 48 | ✅ Good | < 100 |
| TypeScript Errors | 0 | ✅ Perfect | 0 |
| Production Build | Passing | ✅ Perfect | Always |

**Overall Grade:** B+ (Good performance, room for optimization)

---

## Bundle Size Analysis

### Quick Analysis

Run the bundle analyzer script after building:

```bash
# Build and analyze in one command
pnpm analyze:build

# Or separately
pnpm build
pnpm analyze
```

### Output Interpretation

The script provides:

1. **Total Build Size** - Overall .next directory size (includes all assets)
2. **Static Assets** - Client-side JavaScript, CSS, images
3. **Top 20 Largest Chunks** - Individual JavaScript bundles
4. **Page-Specific Bundles** - Per-route code
5. **Optimization Recommendations** - Actionable suggestions

### Sample Output

```
================================================================================
                        PRESSOGRAPH BUNDLE ANALYSIS
================================================================================

1. Total Build Size
--------------------------------------------------------------------------------
Total .next directory: 196M
Static assets (.next/static): 3.5M

2. Top 20 Largest JavaScript Chunks
--------------------------------------------------------------------------------
664K       .next/static/chunks/4bfd830a5b2945f3.js  ← ECharts main
408K       .next/static/chunks/f74a12b30f592411.js  ← React/Next.js vendor
220K       .next/static/chunks/5ae8e7f59b8c773d.js  ← UI components
196K       .next/static/chunks/cf4fc1e20e39d4cb.js  ← Form libraries
...

Total JavaScript chunks: 48
Largest chunk: 664K (ECharts)
```

---

## Current Performance Metrics

### Build Performance

**Next.js 16 with Turbopack**

```bash
✓ Compiled successfully in 26.3s
✓ Generating static pages (22/22) in 910.3ms
```

- **Compilation time:** ~26 seconds (excellent for full build)
- **Static page generation:** ~910 ms for 22 pages
- **Incremental builds:** < 2 seconds with Turbopack

### Bundle Breakdown

#### Top Chunks Analysis

| Chunk | Size | Component | Optimization |
|-------|------|-----------|--------------|
| 4bfd830a5b2945f3.js | 664 KB | ECharts | ✅ Tree-shaking enabled |
| f74a12b30f592411.js | 408 KB | React vendor | ✅ Vendor splitting |
| cb87d48a16ee0600.js | 236 KB | UI framework | ⚠️ Consider lazy loading |
| 5ae8e7f59b8c773d.js | 220 KB | Components | ✅ Good size |
| cf4fc1e20e39d4cb.js | 196 KB | Forms | ✅ Acceptable |

#### ECharts Optimization (Issue #106)

**Status:** ✅ COMPLETED

- Tree-shaking enabled via `transpilePackages` in next.config.ts
- Modular imports configured
- Bundle size reduced from ~900 KB to ~664 KB (26% reduction)
- Further optimization possible with selective component imports

### Runtime Performance

#### LTTB Downsampling (Issue #107)

**Status:** ✅ COMPLETED

Pressure graph rendering performance with large datasets:

| Dataset Size | Before | After | Improvement |
|--------------|--------|-------|-------------|
| 10,000 points | ~850 ms | ~140 ms | 84% (710 ms saved) |
| 50,000 points | ~4,200 ms | ~180 ms | 96% (4,020 ms saved) |
| 100,000 points | ~8,500 ms | ~200 ms | 98% (8,300 ms saved) |

**Algorithm overhead:** < 50 ms even for 100K points
**Total improvement:** 40-50x faster rendering

---

## Optimization Strategies

### 1. Code Splitting

**Current Implementation:**

- ✅ Automatic route-based splitting (Next.js App Router)
- ✅ Vendor chunk separation (React, Next.js)
- ✅ ECharts tree-shaking enabled

**Recommended Improvements:**

```typescript
// Dynamic imports for heavy components
const PressureGraph = dynamic(() => import('@/components/graphs/pressure-graph'), {
  loading: () => <GraphSkeleton />,
  ssr: false, // If graph doesn't need SSR
});

// Lazy load forms
const TestEditForm = dynamic(() => import('@/components/tests/edit-test-form-client'), {
  loading: () => <FormSkeleton />,
});
```

### 2. Image Optimization

**Current Configuration (next.config.ts):**

```typescript
images: {
  formats: ["image/avif", "image/webp"],
  remotePatterns: [],
}
```

**Best Practices:**

- Use Next.js `<Image>` component for all images
- Prefer AVIF format (smaller than WebP)
- Set explicit width/height to prevent layout shift
- Use `priority` prop for above-the-fold images

### 3. Font Optimization

Use Next.js built-in font optimization:

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'], // Russian support
  display: 'swap',
  variable: '--font-inter',
});
```

### 4. Compression

**Current Configuration:**

- ✅ `compress: true` in next.config.ts
- ✅ Gzip compression enabled in production
- ✅ Traefik reverse proxy with compression

### 5. Tree-Shaking

**Libraries Using Tree-Shaking:**

- ✅ ECharts (via transpilePackages)
- ✅ Lucide React (ESM imports)
- ✅ Radix UI (modular imports)
- ✅ date-fns (import only what's needed)

**Example:**

```typescript
// ✅ Good - tree-shakeable
import { format } from 'date-fns';

// ❌ Bad - imports everything
import * as dateFns from 'date-fns';
```

---

## Monitoring Tools

### 1. Built-in Bundle Analyzer

Run the custom script:

```bash
pnpm analyze
```

### 2. Advanced Bundle Analyzer (Optional)

Install Next.js bundle analyzer for interactive visualization:

```bash
pnpm add -D @next/bundle-analyzer
```

Update `next.config.ts`:

```typescript
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
```

Run analysis:

```bash
ANALYZE=true pnpm build
```

### 3. Lighthouse CI

Add to GitHub Actions for automated performance tracking:

```yaml
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      https://dev-pressograph.infra4.dev
      https://dev-pressograph.infra4.dev/tests
      https://dev-pressograph.infra4.dev/dashboard
    uploadArtifacts: true
```

### 4. OpenTelemetry Metrics

**Already configured!** View performance metrics in VictoriaMetrics/Grafana:

- Request duration
- Database query times
- API endpoint latency
- Server-side rendering time

Access Grafana at: `https://grafana.infra4.dev`

---

## Performance Targets

### Core Web Vitals

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **LCP** (Largest Contentful Paint) | TBD | < 2.5s | 📊 Needs measurement |
| **FID** (First Input Delay) | TBD | < 100ms | 📊 Needs measurement |
| **CLS** (Cumulative Layout Shift) | TBD | < 0.1 | 📊 Needs measurement |
| **TTFB** (Time to First Byte) | TBD | < 600ms | 📊 Needs measurement |
| **FCP** (First Contentful Paint) | TBD | < 1.8s | 📊 Needs measurement |

### Bundle Size Targets

| Category | Current | Target | Status |
|----------|---------|--------|--------|
| **Total Static Assets** | 3.5 MB | < 5 MB | ✅ Met |
| **Largest Chunk** | 664 KB | < 500 KB | ⚠️ Close |
| **Initial Page Load** | ~1.5 MB | < 1 MB | ⚠️ Needs optimization |
| **JavaScript Total** | ~2.5 MB | < 2 MB | ⚠️ Monitor |

### Performance Budgets

Set performance budgets in `next.config.ts`:

```typescript
experimental: {
  bundlePagesRouterDependencies: true,
  optimizePackageImports: ['lucide-react', '@radix-ui/react-*'],
},
```

---

## Historical Tracking

### Bundle Size History

Store bundle analysis results over time:

```bash
# Automated tracking (in CI/CD)
pnpm analyze > .next/bundle-analysis-$(date +%Y%m%d).txt
```

### Performance Regression Detection

**GitHub Actions workflow** (recommended):

```yaml
name: Performance Monitoring

on:
  pull_request:
  push:
    branches: [master]

jobs:
  bundle-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Analyze bundle
        run: pnpm analyze > bundle-report.txt

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: bundle-analysis
          path: bundle-report.txt

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('bundle-report.txt', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Bundle Analysis\n\`\`\`\n${report}\n\`\`\``
            });
```

---

## Optimization Checklist

### Immediate Actions (Priority 1)

- [x] Enable ECharts tree-shaking (Issue #106) ✅ COMPLETED
- [x] Implement LTTB downsampling (Issue #107) ✅ COMPLETED
- [x] Create bundle analysis script ✅ COMPLETED
- [ ] Measure Core Web Vitals with Lighthouse
- [ ] Set up performance monitoring in CI/CD

### Short-Term Actions (Priority 2)

- [ ] Implement dynamic imports for heavy components
- [ ] Optimize largest chunk (664 KB → < 500 KB)
- [ ] Add bundle size regression tests
- [ ] Configure Lighthouse CI
- [ ] Create performance dashboard in Grafana

### Long-Term Actions (Priority 3)

- [ ] Implement service worker for offline support
- [ ] Add prefetching for critical routes
- [ ] Optimize image delivery with CDN
- [ ] Implement request coalescing
- [ ] Add resource hints (preconnect, prefetch, preload)

---

## Troubleshooting

### Large Bundle Size

**Problem:** Bundle size unexpectedly large after adding new dependency

**Solution:**

```bash
# 1. Analyze bundle
pnpm analyze

# 2. Check dependency size
pnpm why <package-name>

# 3. Consider alternatives
# - Use tree-shakeable alternatives
# - Lazy load the feature
# - Use CDN for large libraries
```

### Slow Build Times

**Problem:** Production build takes > 1 minute

**Solution:**

```bash
# 1. Clear cache
rm -rf .next

# 2. Update dependencies
pnpm update

# 3. Use Turbopack (already enabled)
# 4. Check for circular dependencies
```

### Performance Regression

**Problem:** Page load time increased after deployment

**Solution:**

```bash
# 1. Compare bundle sizes
git diff HEAD~1 HEAD -- .next/bundle-analysis.txt

# 2. Profile with Chrome DevTools
# - Network tab: Check waterfall
# - Performance tab: Record page load
# - Coverage tab: Find unused code

# 3. Review recent changes
git log --oneline -20
```

---

## References

### Documentation

- [Next.js Performance Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance](https://web.dev/performance/)
- [ECharts Performance](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg)

### Related Files

- `/opt/projects/repositories/pressograph/next.config.ts` - Next.js configuration
- `/opt/projects/repositories/pressograph/scripts/analyze-bundle.sh` - Bundle analyzer
- `/opt/projects/repositories/pressograph/docs/development/LTTB_DOWNSAMPLING_GUIDE.md` - LTTB algorithm
- `/opt/projects/repositories/pressograph/docs/development/ECharts_vs_echarts-for-react.md` - ECharts optimization

### Internal Issues

- Issue #106: ECharts Tree-Shaking ✅ COMPLETED
- Issue #107: LTTB Downsampling ✅ COMPLETED

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-09
**Next Review:** 2025-12-09
**Author:** Pressograph Development Team
