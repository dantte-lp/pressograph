# ECharts 6 Integration Analysis for Pressograph 2.0

**Date:** 2025-01-08
**Based On:** compass_artifact_wf-88aa813c-ea23-48f1-9056-bbb9613cf622_text_markdown.md
**Status:** Implementation Guidance
**Author:** Development Team

## Executive Summary

This document synthesizes critical findings from the comprehensive ECharts 6 integration guide and provides actionable recommendations for Pressograph 2.0. The analysis focuses on performance optimization, Next.js 16 compatibility, and production-ready patterns.

## Key Findings from Compass Documentation

### 1. ECharts 6 + Next.js 16 + React 19 Compatibility

**CRITICAL: All ECharts components MUST be Client Components**

```typescript
// ✅ CORRECT - Every chart component needs this
'use client'

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
// ... rest of imports
```

**Why:** Next.js 16 uses Server Components by default. ECharts requires browser APIs (`window`, `document`) that aren't available on the server.

### 2. Tree-Shaking is MANDATORY for Production

**Impact:** Can reduce bundle size by 50-60% (~400KB savings)

```typescript
// ❌ BAD - Full import (900KB bundle)
import * as echarts from 'echarts'

// ✅ GOOD - Tree-shaken imports (150-200KB bundle)
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer])
```

### 3. Next.js Configuration Requirements

**File:** `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // CRITICAL: Transpile ESM modules
  transpilePackages: ['echarts', 'zrender'],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
```

**Why:** ECharts uses ESM modules that need transpilation for Next.js compatibility.

### 4. Custom Hook Pattern (RECOMMENDED for Production)

```typescript
// hooks/useECharts.ts
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { init, getInstanceByDom } from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'

export function useECharts(option: EChartsOption) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Initialize only on client
    instanceRef.current = init(chartRef.current)
    instanceRef.current.setOption(option)

    // Handle resize
    const handleResize = () => {
      instanceRef.current?.resize()
    }

    window.addEventListener('resize', handleResize)

    // ResizeObserver for container changes
    const resizeObserver = new ResizeObserver(() => {
      instanceRef.current?.resize()
    })

    if (chartRef.current) {
      resizeObserver.observe(chartRef.current)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      instanceRef.current?.dispose()
    }
  }, [option])

  return { chartRef, instance: instanceRef.current }
}
```

### 5. Performance Optimization Patterns

#### LTTB Downsampling (99.5% Compression)

**For time-series data with hundreds of thousands of points:**

```typescript
// lib/lttb.ts - Largest-Triangle-Three-Buckets algorithm
export function downsampleLTTB(
  data: Array<[number, number]>,
  threshold: number
): Array<[number, number]> {
  if (threshold >= data.length || threshold === 0) {
    return data
  }

  const sampled: Array<[number, number]> = []
  sampled[0] = data[0]  // Always include first point

  const bucketSize = (data.length - 2) / (threshold - 2)
  let a = 0

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate average point of next bucket
    let avgX = 0, avgY = 0
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1
    const avgRangeEnd = Math.min(
      Math.floor((i + 2) * bucketSize) + 1,
      data.length
    )

    const avgRangeLength = avgRangeEnd - avgRangeStart

    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += data[j][0]
      avgY += data[j][1]
    }
    avgX /= avgRangeLength
    avgY /= avgRangeLength

    // Find point with maximum triangle area
    const rangeOffs = Math.floor(i * bucketSize) + 1
    const rangeTo = Math.floor((i + 1) * bucketSize) + 1

    const pointAX = data[a][0]
    const pointAY = data[a][1]

    let maxArea = -1
    let maxAreaPoint = rangeOffs

    for (let j = rangeOffs; j < rangeTo; j++) {
      const area = Math.abs(
        (pointAX - avgX) * (data[j][1] - pointAY) -
        (pointAX - data[j][0]) * (avgY - pointAY)
      ) * 0.5

      if (area > maxArea) {
        maxArea = area
        maxAreaPoint = j
      }
    }

    sampled.push(data[maxAreaPoint])
    a = maxAreaPoint
  }

  sampled.push(data[data.length - 1])  // Always include last point

  return sampled
}
```

**Result:** 130,000 points → 500 points with preserved visual fidelity

#### Progressive Rendering

```typescript
const performanceOption: ECOption = {
  series: [{
    type: 'line',
    data: largeDataset,

    // Critical optimizations
    sampling: 'lttb',              // Built-in LTTB sampling
    symbol: 'none',                // Disable markers (huge performance gain)

    // Progressive rendering
    progressive: 2000,             // Render 2000 points per frame
    progressiveThreshold: 3000,    // Enable for datasets > 3000 points
    progressiveChunkMode: 'sequential',

    // Disable animations for large data
    animation: false,

    // Optimize lines
    lineStyle: { width: 1 },

    // Large mode for very large datasets
    large: true,
    largeThreshold: 2000,
  }],
}
```

### 6. Bucket Caching Pattern (Valkey/Redis)

**Three-tier caching architecture:**

1. **Cookie** (immediate)
2. **Valkey** (1-5ms response)
3. **Database** (50-200ms response)

```typescript
// lib/caching.ts
class WeeklyBucket {
  start: Date
  end: Date

  constructor(date: Date) {
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const aligned = Math.floor(date.getTime() / weekMs) * weekMs
    this.start = new Date(aligned)
    this.end = new Date(aligned + weekMs)
  }

  cacheKey(testId: number): string {
    return `timeseries:${testId}:${this.start.toISOString()}`
  }

  getTTL(): number {
    const now = Date.now()
    if (this.end.getTime() > now) return 300        // 5 min (current)
    if (this.end.getTime() > now - 86400000) return 3600  // 1 hour (recent)
    return 604800  // 7 days (historical)
  }
}
```

### 7. TypeScript Strict Typing

```typescript
import type { ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  DataZoomComponentOption
} from 'echarts/components'

// Compose ONLY used types
export type PressureChartOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | DataZoomComponentOption
>

const option: PressureChartOption = {
  // Fully type-safe configuration
}
```

## Current Pressograph 2.0 Implementation Status

### What We're Doing Right

✅ Using Client Components (`'use client'`)
✅ Using ECharts 6.0.0
✅ Implementing custom hooks (`useECharts` in components)
✅ TypeScript strict mode enabled
✅ Canvas renderer for performance

### What Needs Improvement

❌ **NOT using tree-shaking** - Importing full ECharts library
❌ **Missing `transpilePackages` in next.config.js**
❌ **No LTTB downsampling for large datasets**
❌ **No caching layer (Valkey/Redis not configured)**
❌ **Not using `ComposeOption` for strict typing**
❌ **Missing progressive rendering for large data**

## Recommended Implementation Plan

### Phase 1: Critical Fixes (Sprint 2)

#### 1.1 Update next.config.js

```javascript
// next.config.js
const nextConfig = {
  transpilePackages: ['echarts', 'zrender'],
  // ... rest of config
}
```

#### 1.2 Implement Tree-Shaking

Create a shared ECharts configuration:

```typescript
// lib/echarts-config.ts
'use client'

import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LegendComponent,
  ToolboxComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Register components ONCE
echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LegendComponent,
  ToolboxComponent,
  CanvasRenderer
])

export { echarts }
```

Then update all components:

```typescript
// Before
import * as echarts from 'echarts'

// After
import { echarts } from '@/lib/echarts-config'
```

**Expected Impact:** ~400KB bundle size reduction

### Phase 2: Performance Optimization (Sprint 3)

#### 2.1 Implement LTTB Downsampling

```typescript
// lib/utils/lttb.ts
export function downsampleLTTB(/* ... implementation from above ... */) {}
```

#### 2.2 Add Progressive Rendering

Update all chart configurations:

```typescript
const option: PressureChartOption = {
  series: [{
    type: 'line',
    sampling: 'lttb',
    progressive: 2000,
    progressiveThreshold: 3000,
    symbol: 'none', // Disable markers for performance
    // ... rest of config
  }]
}
```

### Phase 3: Strict TypeScript (Sprint 3)

#### 3.1 Create Typed Options

```typescript
// types/echarts.ts
import type { ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  DataZoomComponentOption,
  LegendComponentOption,
  ToolboxComponentOption
} from 'echarts/components'

export type PressureChartOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | DataZoomComponentOption
  | LegendComponentOption
  | ToolboxComponentOption
>
```

#### 3.2 Update All Chart Components

```typescript
import type { PressureChartOption } from '@/types/echarts'

const option: PressureChartOption = {
  // Type-safe configuration
}
```

### Phase 4: Caching Layer (Sprint 4 - Optional)

Only if we implement real-time pressure monitoring:

- Set up Valkey (Redis-compatible)
- Implement bucket caching pattern
- Add API routes with caching middleware

## Performance Targets

Based on compass documentation benchmarks:

| Metric | Current (Estimated) | Target (After Optimization) |
|--------|--------------------|-----------------------------|
| Bundle Size (Charts) | ~900KB | ~400KB (55% reduction) |
| Initial Load Time | ~2-3s | ~1-1.5s (50% faster) |
| Chart Render Time | 200-500ms | 50-200ms (60% faster) |
| Memory Usage | 200-500MB | 50-100MB (75% reduction) |

## Testing Checklist

- [ ] Verify tree-shaking reduces bundle size (use `webpack-bundle-analyzer`)
- [ ] Test chart rendering with 10K+ points (should be smooth)
- [ ] Test chart rendering with 100K+ points (progressive rendering should kick in)
- [ ] Verify type safety (no TypeScript errors)
- [ ] Test on mobile devices (should remain responsive)
- [ ] Test theme switching (charts should reinitialize correctly)
- [ ] Verify exports still work (PNG/PDF generation)

## Migration Strategy

### Backward Compatibility

All changes are backward compatible:
- Existing chart configurations will continue to work
- No breaking API changes
- Progressive enhancement approach

### Rollout Plan

1. **Week 1:** Implement tree-shaking and next.config updates
2. **Week 2:** Add TypeScript strict typing
3. **Week 3:** Implement performance optimizations (LTTB, progressive)
4. **Week 4:** Testing, refinement, documentation
5. **Week 5:** Production deployment

## References

- **Compass Documentation:** `/docs/development/compass_artifact_wf-88aa813c-ea23-48f1-9056-bbb9613cf622_text_markdown.md`
- **ECharts 6 Official Docs:** https://echarts.apache.org/en/index.html
- **Next.js 16 App Router:** https://nextjs.org/docs/app
- **React 19 Migration:** https://react.dev/blog/2024/04/25/react-19

## Conclusion

The compass documentation provides a comprehensive roadmap for optimizing ECharts 6 integration. By implementing tree-shaking, progressive rendering, and strict typing, we can achieve:

- 50-60% smaller bundle sizes
- 2-3x faster rendering
- Better TypeScript DX
- Production-ready performance

All recommendations align with modern web development best practices and Next.js 16 patterns.

## Next Steps

1. ✅ Document findings (this document)
2. ⏳ Implement Phase 1 (tree-shaking) in Sprint 2
3. ⏳ Update GitHub issues with optimization tasks
4. ⏳ Schedule performance testing sessions

---

**Document Status:** Final
**Implementation Priority:** High
**Expected ROI:** Significant performance improvements with minimal development time
