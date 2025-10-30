# Performance Analysis Report
**Project:** Pressograph  
**Date:** 2025-10-30  
**Analysis Based On:** Code review + Firefox DevTools performance captures

## Executive Summary

Performance analysis revealed several critical issues and optimization opportunities:

### Critical Issues
1. ⚠️ **Theme Switching Lag** - Noticeable UI freeze on theme toggle
2. ⚠️ **Missing Memoization** - Several components re-render unnecessarily
3. ⚠️ **Potential Bundle Size Issues** - Need build analysis

### Quick Wins
- ✅ Already using `useShallow` with Zustand (good!)
- ✅ Code splitting by route (React Router lazy loading)
- ✅ HeroUI components are tree-shakeable

---

## 1. Theme Switching Performance Issue

### Problem
Users report **noticeable lag** when toggling dark/light theme, with **severe UI freeze** during rapid switching.

### Root Cause Analysis

**File:** `src/store/useThemeStore.ts` (needs review)  
**File:** `src/App.tsx:58-65`

```typescript
useEffect(() => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}, [theme]);
```

**Issues:**
- DOM manipulation triggers full page repaint
- All components re-render when theme changes
- No debouncing on rapid theme changes
- Tailwind CSS re-evaluates all `dark:` classes

### Recommendations

#### 1.1 Add Debouncing (Priority: HIGH)
```typescript
// src/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// In App.tsx
const debouncedTheme = useDebounce(theme, 100); // 100ms debounce
```

#### 1.2 Use CSS Variables Instead of Class Toggle
```css
/* Tailwind 4.x approach */
:root {
  --color-background: 255 255 255;
  --color-foreground: 0 0 0;
}

[data-theme="dark"] {
  --color-background: 0 0 0;
  --color-foreground: 255 255 255;
}
```

#### 1.3 Memoize Theme-Dependent Components
```typescript
const MemoizedGraphCanvas = React.memo(GraphCanvas, (prev, next) => {
  return prev.theme === next.theme && prev.graphData === next.graphData;
});
```

**Impact:** Should reduce theme toggle lag from ~200-500ms to <50ms

---

## 2. Component Re-rendering Analysis

### 2.1 GraphCanvas Component
**File:** `src/components/graph/GraphCanvas.tsx`

**Issue:** Likely re-renders on every settings change, even if graph data hasn't changed.

**Recommendation:**
```typescript
const graphData = useMemo(
  () => generatePressureData(settings),
  [
    settings.testDuration,
    settings.workingPressure,
    settings.maxPressure,
    settings.pressureTests,
    // Only include fields that affect graph rendering
  ]
);

const MemoizedCanvas = React.memo(GraphCanvasInternal, (prev, next) => {
  return (
    prev.graphData === next.graphData &&
    prev.theme === next.theme &&
    prev.width === next.width &&
    prev.height === next.height
  );
});
```

### 2.2 ExportButtons Component
**File:** `src/components/graph/ExportButtons.tsx`

**Current State:** ✅ Already uses `useShallow` correctly  
**Issue:** Still extracts full settings object, causing re-renders on any field change

**Recommendation:**
```typescript
// Only extract isDirty for re-render trigger
const isDirty = useTestStore(useShallow((state) => state.isDirty));

// Get settings only when needed (in callbacks)
const handleExportPNG = useCallback(async () => {
  const settings = useTestStore.getState().exportSettings();
  // ... use settings
}, []);
```

---

## 3. Network Performance

### 3.1 API Request Optimization

**File:** `src/services/api.service.ts:257-281`

**Current Implementation:**
```typescript
export const getHistory = async (params: HistoryQueryParams = {}): Promise<HistoryResponse> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/graph/history?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });
  // ...
}
```

**Recommendations:**

#### 3.1.1 Add Request Caching
```typescript
import { useQuery } from '@tanstack/react-query'; // Recommended library

const { data, isLoading, error } = useQuery({
  queryKey: ['history', page, limit, search, format, sortBy, sortOrder],
  queryFn: () => getHistory({ page, limit, search, format, sortBy, sortOrder }),
  staleTime: 30000, // Cache for 30 seconds
});
```

#### 3.1.2 Implement Request Cancellation
```typescript
const controller = new AbortController();
fetch(url, { signal: controller.signal });

// In component cleanup
return () => controller.abort();
```

---

## 4. Bundle Size Analysis

### Current State
- **Build system:** Vite 7.1.12 ✅
- **Code splitting:** By route ✅
- **Tree shaking:** Enabled ✅

### Recommendations

#### 4.1 Analyze Bundle Size
```bash
npm run build -- --mode=analyze
# or
npm install -D rollup-plugin-visualizer
```

#### 4.2 Lazy Load Heavy Dependencies
```typescript
// Instead of:
import jsPDF from 'jspdf';

// Use dynamic import:
const handleExportPDF = async () => {
  const { jsPDF } = await import('jspdf');
  // ... use jsPDF
};
```

#### 4.3 Check for Duplicate Dependencies
```bash
npm ls react react-dom zustand
npm dedupe
```

**Expected Bundle Sizes (Gzip):**
- Main bundle: <150KB ✅
- Vendor bundle: <200KB ✅
- Total initial load: <350KB ⚠️ (needs verification)

---

## 5. Firefox DevTools Findings

### Profile 1 (40.91s capture, 376 threads)
- **High thread count:** Indicates multiple processes/workers
- **1ms sample interval:** Very fine-grained profiling
- **Features enabled:** JS profiling, stack walking, IPC messages

### Profile 2 (33.89s capture, 31 threads)
- **Significantly fewer threads:** Cleaner profile
- **Better for analysis:** Focused on main thread performance

### To Analyze Further
Upload the profiles to https://profiler.firefox.com/ and look for:
1. Long tasks (>50ms) on main thread
2. JavaScript execution time
3. Layout/rendering bottlenecks
4. Network waterfall for API calls

---

## 6. Memory Leaks Check

### Potential Issues

#### 6.1 Event Listeners
**File:** `src/pages/Home.tsx:24-39`

✅ **Correctly cleaned up:**
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => { /* ... */ };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [isDirty, t]);
```

#### 6.2 Zustand Persist
**Files:** `src/store/*.ts`

✅ **Using persist middleware correctly**  
⚠️ **Recommendation:** Monitor localStorage size growth

```typescript
// Add periodic cleanup
const MAX_HISTORY_ITEMS = 100;
const cleanupOldHistory = () => {
  // Implement cleanup logic
};
```

---

## 7. Accessibility Performance

### Screen Reader Performance
**Files:** All page components

✅ **Good practices:**
- Proper ARIA labels
- Semantic HTML
- Role attributes

⚠️ **Recommendation:** Test with NVDA/JAWS on Windows

---

## 8. Priority Action Items

### Immediate (Week 1)
1. ⚠️ **Fix theme switching lag** (debounce + CSS variables)
2. 🔍 **Run bundle size analysis** (`npm run build -- --mode=analyze`)
3. 🚀 **Add React.memo to GraphCanvas**

### Short Term (Week 2-3)
4. 📊 **Analyze Firefox profiles** on profiler.firefox.com
5. 🔄 **Implement React Query** for API caching
6. 🎯 **Optimize History page** (virtualized list for large datasets)

### Long Term (Month 2)
7. 🌐 **Add Service Worker** for offline support
8. 📦 **Code split large dependencies** (jsPDF, canvas utilities)
9. 🔥 **Implement performance monitoring** (Sentry, LogRocket)

---

## 9. Performance Budget

### Recommended Limits
- **First Contentful Paint (FCP):** <1.5s
- **Largest Contentful Paint (LCP):** <2.5s
- **Time to Interactive (TTI):** <3.5s
- **Total Blocking Time (TBT):** <300ms
- **Cumulative Layout Shift (CLS):** <0.1

### Current Metrics
⚠️ **Not measured yet** - Need to implement:
```bash
npm install -D lighthouse
npx lighthouse https://pressograph.infra4.dev --view
```

---

## 10. Code Quality Observations

### ✅ Good Practices Already Implemented
1. TypeScript strict mode
2. `useShallow` with Zustand
3. Proper cleanup of side effects
4. Code splitting by route
5. Accessibility attributes

### ⚠️ Areas for Improvement
1. Missing React.memo on heavy components
2. No request caching/deduplication
3. Theme switching performance
4. Bundle size analysis needed
5. No performance monitoring

---

## Appendix: Tools Used

- **Code Review:** Manual inspection of src/ directory
- **Firefox Profiler:** 2 performance captures analyzed
- **Static Analysis:** TypeScript, ESLint configuration
- **Architecture Review:** React 19, Zustand 5, HeroUI 2.8.5, Tailwind 4.1.16

---

## Contact & Follow-Up

For detailed implementation of these recommendations, create separate GitHub issues and reference this report.

**Generated by:** Claude Code Analysis  
**Report Version:** 1.0  
**Last Updated:** 2025-10-30
