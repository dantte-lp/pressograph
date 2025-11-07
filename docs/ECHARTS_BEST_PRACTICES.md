# ECharts Best Practices for Pressograph 2.0

**Version**: 1.0.0
**Last Updated**: November 7, 2025
**ECharts Version**: 6.0.0
**echarts-for-react**: 3.0.5

This document provides comprehensive best practices for implementing ECharts visualizations in the Pressograph 2.0 application, optimized for Next.js 15, React 19, and TypeScript 5.7.

---

## Table of Contents

1. [Architecture & Integration](#architecture--integration)
2. [Performance Optimization](#performance-optimization)
3. [Memory Management](#memory-management)
4. [Type Safety](#type-safety)
5. [Data Management](#data-management)
6. [Responsive Design](#responsive-design)
7. [Accessibility](#accessibility)
8. [Server-Side Rendering](#server-side-rendering)
9. [Error Handling](#error-handling)
10. [Testing Strategies](#testing-strategies)
11. [Animation & Interaction](#animation--interaction)
12. [Code Organization](#code-organization)

---

## 1. Architecture & Integration

### 1.1 Component Registration

**Use Tree-Shaking for Optimal Bundle Size**

Import only the components you need rather than the entire ECharts library:

```typescript
// ✅ GOOD: Tree-shaking enabled
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register only what you need
echarts.use([
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
]);

// ❌ BAD: Imports entire library
import * as echarts from 'echarts';
```

**Benefits:**
- Reduces bundle size by 40-60%
- Faster initial page load
- Better tree-shaking in production builds

### 1.2 Client vs Server Components

**Always Use Client Components for ECharts**

ECharts requires DOM APIs and must run on the client:

```typescript
// ✅ GOOD: Explicit client component
'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';

export function PressureGraph() {
  // Chart implementation
}

// ❌ BAD: Server component (will fail)
// No 'use client' directive with ECharts
```

**Pattern for Next.js App Router:**

```typescript
// app/dashboard/page.tsx (Server Component)
import { Suspense } from 'react';
import { PressureGraphSkeleton } from '@/components/skeletons';
import { PressureGraph } from '@/components/charts/pressure-graph';

export default async function DashboardPage() {
  const data = await fetchData(); // Server-side data fetching

  return (
    <Suspense fallback={<PressureGraphSkeleton />}>
      <PressureGraph data={data} />
    </Suspense>
  );
}
```

### 1.3 Component Composition

**Separation of Concerns**

```typescript
// ✅ GOOD: Separated concerns
// components/charts/pressure-graph/index.tsx
export { PressureGraph } from './pressure-graph';

// components/charts/pressure-graph/pressure-graph.tsx
'use client';

export function PressureGraph({ data }: Props) {
  const option = usePressureGraphOption(data);
  return <ReactECharts option={option} />;
}

// components/charts/pressure-graph/use-pressure-graph-option.ts
export function usePressureGraphOption(data: Data): ECOption {
  return useMemo(() => ({
    // Configuration
  }), [data]);
}

// components/charts/pressure-graph/types.ts
export interface PressureGraphProps {
  // Type definitions
}
```

---

## 2. Performance Optimization

### 2.1 Memoization Strategy

**Memoize Chart Options**

Chart options should be memoized to prevent unnecessary re-renders:

```typescript
// ✅ GOOD: Memoized options
const option = useMemo((): ECOption => ({
  title: { text: 'Pressure Test' },
  xAxis: { type: 'value', data: xAxisData },
  yAxis: { type: 'value' },
  series: [{ type: 'line', data: seriesData }],
}), [xAxisData, seriesData]); // Only recompute when dependencies change

// ❌ BAD: Options recreated on every render
const option = {
  title: { text: 'Pressure Test' },
  series: [{ type: 'line', data: props.data }],
};
```

**Memoize Complex Calculations**

```typescript
// ✅ GOOD: Memoized data transformations
const processedData = useMemo(() => {
  return rawData.map((point) => ({
    time: point.timestamp / 1000,
    pressure: convertPressure(point.value, unit),
  }));
}, [rawData, unit]);

const chartData = useMemo(() => {
  return processedData.map(point => [point.time, point.pressure]);
}, [processedData]);
```

### 2.2 Rendering Performance

**Use Canvas Renderer for Large Datasets**

```typescript
// ✅ GOOD: Canvas for >1000 data points
echarts.init(chartRef.current, undefined, {
  renderer: 'canvas', // Better for large datasets
});

// For smaller datasets (<1000 points), SVG may offer benefits:
echarts.init(chartRef.current, undefined, {
  renderer: 'svg', // Better for crisp visuals, animations
});
```

**Performance Benchmarks:**
- Canvas: Optimal for >1000 data points
- SVG: Optimal for <1000 data points, better for animations
- Canvas: Lower memory usage for complex charts
- SVG: Better for printing and scaling

### 2.3 Update Strategy

**Use setOption Efficiently**

```typescript
// ✅ GOOD: Incremental updates
chart.setOption({
  series: [{ data: newData }],
}, { notMerge: false }); // Merge with existing options

// ✅ GOOD: Complete replacement when needed
chart.setOption(completeOption, {
  notMerge: true, // Replace entire option
  replaceMerge: ['series'] // Or replace specific components
});

// ❌ BAD: Unnecessary complete replacements
useEffect(() => {
  chart.setOption(option, { notMerge: true }); // Every render
}, [data]); // Triggers on every data change
```

**Update Patterns:**

```typescript
// Pattern 1: Real-time data updates (partial)
const updateData = (newPoint: DataPoint) => {
  chart.setOption({
    series: [{
      data: [...currentData, newPoint].slice(-100) // Keep last 100 points
    }]
  });
};

// Pattern 2: Configuration changes (merge)
const updateTheme = (theme: 'light' | 'dark') => {
  chart.setOption({
    backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
    textStyle: { color: theme === 'dark' ? '#fff' : '#000' }
  }, { notMerge: false });
};

// Pattern 3: Complete rebuild (replace)
const rebuildChart = (newConfig: CompleteConfig) => {
  chart.setOption(newConfig, { notMerge: true });
};
```

### 2.4 Lazy Loading

**Code Splitting for Charts**

```typescript
// ✅ GOOD: Lazy load chart components
const PressureGraph = dynamic(
  () => import('@/components/charts/pressure-graph'),
  {
    ssr: false, // Disable SSR for client-only charts
    loading: () => <ChartSkeleton />
  }
);

// Usage
export default function Dashboard() {
  return (
    <div>
      <PressureGraph data={data} />
    </div>
  );
}
```

---

## 3. Memory Management

### 3.1 Chart Disposal

**Always Dispose Charts on Unmount**

```typescript
// ✅ GOOD: Proper cleanup
useEffect(() => {
  const chart = echarts.init(chartRef.current);

  return () => {
    chart.dispose(); // Free memory
    chartInstance.current = null; // Clear reference
  };
}, []);

// ❌ BAD: Memory leak
useEffect(() => {
  const chart = echarts.init(chartRef.current);
  // No cleanup - chart persists in memory
}, []);
```

### 3.2 Event Listener Cleanup

**Remove Event Listeners**

```typescript
// ✅ GOOD: Cleanup event listeners
useEffect(() => {
  const chart = chartInstance.current;
  if (!chart) return;

  const handleResize = () => chart.resize();
  const handleClick = (params: any) => console.log(params);

  window.addEventListener('resize', handleResize);
  chart.on('click', handleClick);

  return () => {
    window.removeEventListener('resize', handleResize);
    chart.off('click', handleClick);
  };
}, []);
```

### 3.3 Large Dataset Handling

**Data Sampling for Performance**

```typescript
// ✅ GOOD: Sample large datasets
const sampledData = useMemo(() => {
  if (rawData.length <= 1000) return rawData;

  const sampleRate = Math.ceil(rawData.length / 1000);
  return rawData.filter((_, index) => index % sampleRate === 0);
}, [rawData]);

// Alternative: Use ECharts built-in sampling
const option: ECOption = {
  series: [{
    type: 'line',
    data: largeDataset,
    sampling: 'average', // 'average', 'max', 'min', 'sum', 'lttb'
    large: true, // Enable optimization for large data
    largeThreshold: 2000, // Threshold for large data optimization
  }]
};
```

### 3.4 Memory Monitoring

**Monitor Chart Memory Usage**

```typescript
// Development helper for memory monitoring
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('Memory Usage:', {
          used: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
          total: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
          limit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
        });
      }
    };

    const interval = setInterval(checkMemory, 5000);
    return () => clearInterval(interval);
  }
}, []);
```

---

## 4. Type Safety

### 4.1 TypeScript Configuration

**Use Strict Type Definitions**

```typescript
import type { ECharts, ComposeOption } from 'echarts/core';
import type { LineSeriesOption } from 'echarts/charts';
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  LegendComponentOption,
} from 'echarts/components';

// ✅ GOOD: Compose option type
type ECOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
>;

// ✅ GOOD: Typed chart instance
const chartInstance = useRef<ECharts | null>(null);

// ✅ GOOD: Typed option
const option: ECOption = {
  title: { text: 'Chart' },
  series: [{ type: 'line', data: [] }],
};
```

### 4.2 Props Interface Design

**Comprehensive Props Types**

```typescript
// ✅ GOOD: Well-typed props
interface PressureGraphProps {
  /** Pressure data points */
  data: Array<{ timestamp: number; pressure: number }>;

  /** Pressure unit for display */
  pressureUnit?: 'MPa' | 'Bar' | 'PSI';

  /** Chart height in pixels */
  height?: number;

  /** Optional CSS class name */
  className?: string;

  /** Callback when data point is clicked */
  onPointClick?: (dataPoint: { timestamp: number; pressure: number }) => void;

  /** Loading state */
  isLoading?: boolean;

  /** Error message */
  error?: string | null;
}

// ✅ GOOD: Default props with type safety
const defaultProps: Partial<PressureGraphProps> = {
  pressureUnit: 'MPa',
  height: 400,
  isLoading: false,
  error: null,
};
```

### 4.3 Event Handler Types

**Type-Safe Event Handlers**

```typescript
// ✅ GOOD: Typed event handlers
import type { ECElementEvent } from 'echarts/types/dist/echarts';

const handleChartClick = (params: ECElementEvent) => {
  if (params.componentType === 'series') {
    const dataIndex = params.dataIndex;
    const value = params.value as [number, number];

    console.log('Clicked:', {
      index: dataIndex,
      timestamp: value[0],
      pressure: value[1],
    });
  }
};

chart.on('click', handleChartClick);
```

---

## 5. Data Management

### 5.1 Data Structure Patterns

**Consistent Data Formats**

```typescript
// ✅ GOOD: Structured data format
interface DataPoint {
  timestamp: number; // Unix timestamp in milliseconds
  pressure: number; // Pressure value
  temperature?: number; // Optional additional data
}

interface ChartData {
  points: DataPoint[];
  metadata: {
    unit: 'MPa' | 'Bar' | 'PSI';
    testId: string;
    startTime: number;
    endTime: number;
  };
}

// Transform to ECharts format
const chartData = useMemo(() => {
  return data.points.map(point => [
    point.timestamp,
    point.pressure,
  ]);
}, [data.points]);
```

### 5.2 Dynamic Data Updates

**Real-Time Data Pattern**

```typescript
// ✅ GOOD: Efficient real-time updates
const useRealtimeData = (testId: string) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://api/tests/${testId}`);

    ws.onmessage = (event) => {
      const newPoint: DataPoint = JSON.parse(event.data);

      setData(prev => {
        const updated = [...prev, newPoint];

        // Keep only last 1000 points for performance
        if (updated.length > 1000) {
          return updated.slice(-1000);
        }
        return updated;
      });

      // Update chart directly for better performance
      if (chartRef.current) {
        chartRef.current.setOption({
          series: [{
            data: [...data, newPoint].slice(-1000).map(p => [p.timestamp, p.pressure])
          }]
        });
      }
    };

    return () => ws.close();
  }, [testId]);

  return { data, chartRef };
};
```

### 5.3 Data Validation

**Validate Data Before Rendering**

```typescript
// ✅ GOOD: Data validation with Zod
import { z } from 'zod';

const DataPointSchema = z.object({
  timestamp: z.number().positive(),
  pressure: z.number().nonnegative(),
  temperature: z.number().optional(),
});

const ChartDataSchema = z.object({
  points: z.array(DataPointSchema),
  metadata: z.object({
    unit: z.enum(['MPa', 'Bar', 'PSI']),
    testId: z.string(),
    startTime: z.number(),
    endTime: z.number(),
  }),
});

type ChartData = z.infer<typeof ChartDataSchema>;

// Validate before using
const validateChartData = (data: unknown): ChartData => {
  return ChartDataSchema.parse(data);
};
```

### 5.4 Null and Missing Data Handling

**Handle Missing Data Gracefully**

```typescript
// ✅ GOOD: Proper null handling
const processData = (rawData: Array<DataPoint | null>): Array<[number, number | null]> => {
  return rawData.map(point => {
    if (!point) return [0, null]; // Use null for missing data
    return [point.timestamp, point.pressure];
  });
};

// ECharts configuration
const option: ECOption = {
  series: [{
    type: 'line',
    data: processData(rawData),
    connectNulls: false, // Show gaps in data (default)
    // or connectNulls: true, // Connect across gaps
  }]
};
```

---

## 6. Responsive Design

### 6.1 Resize Handling

**Proper Chart Resizing**

```typescript
// ✅ GOOD: Debounced resize handling
import { debounce } from 'lodash-es';

useEffect(() => {
  const chart = chartInstance.current;
  if (!chart) return;

  // Debounce resize for better performance
  const handleResize = debounce(() => {
    chart.resize();
  }, 250);

  window.addEventListener('resize', handleResize);

  return () => {
    handleResize.cancel(); // Cancel pending debounced calls
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### 6.2 Responsive Grid Configuration

**Adaptive Grid Spacing**

```typescript
// ✅ GOOD: Responsive grid configuration
const useResponsiveGrid = () => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return useMemo(() => {
    // Mobile: <640px
    if (windowWidth < 640) {
      return {
        left: '15%',
        right: '5%',
        top: '25%',
        bottom: '20%',
      };
    }

    // Tablet: 640-1024px
    if (windowWidth < 1024) {
      return {
        left: '12%',
        right: '6%',
        top: '22%',
        bottom: '18%',
      };
    }

    // Desktop: >1024px
    return {
      left: '10%',
      right: '8%',
      top: '20%',
      bottom: '15%',
    };
  }, [windowWidth]);
};

// Usage
const grid = useResponsiveGrid();
const option: ECOption = {
  grid,
  // ... rest of config
};
```

### 6.3 Font Scaling

**Responsive Typography**

```typescript
// ✅ GOOD: Responsive font sizes
const useResponsiveFontSizes = () => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  return {
    title: isMobile ? 12 : isTablet ? 14 : 16,
    axisLabel: isMobile ? 9 : isTablet ? 10 : 11,
    axisName: isMobile ? 10 : isTablet ? 11 : 12,
    legend: isMobile ? 10 : isTablet ? 11 : 12,
    tooltip: isMobile ? 11 : isTablet ? 12 : 13,
  };
};
```

---

## 7. Accessibility

### 7.1 ARIA Labels

**Provide Meaningful Labels**

```typescript
// ✅ GOOD: Accessible chart container
<div
  ref={chartRef}
  role="img"
  aria-label="Pressure test graph showing pressure over time"
  aria-describedby="chart-description"
  className="w-full"
  style={{ height: '400px' }}
/>
<div id="chart-description" className="sr-only">
  Line chart displaying pressure measurements from {startTime} to {endTime}.
  Current pressure: {currentPressure} {unit}.
  Maximum pressure: {maxPressure} {unit}.
</div>
```

### 7.2 Keyboard Navigation

**Enable Keyboard Interactions**

```typescript
// ✅ GOOD: Keyboard navigation support
useEffect(() => {
  const chart = chartInstance.current;
  if (!chart) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      // Navigate to previous data point
    } else if (e.key === 'ArrowRight') {
      // Navigate to next data point
    } else if (e.key === 'Escape') {
      // Clear selection
      chart.dispatchAction({ type: 'hideTip' });
    }
  };

  const chartContainer = chartRef.current;
  chartContainer?.addEventListener('keydown', handleKeyDown);

  return () => {
    chartContainer?.removeEventListener('keydown', handleKeyDown);
  };
}, []);
```

### 7.3 High Contrast Mode

**Support High Contrast Themes**

```typescript
// ✅ GOOD: High contrast theme detection
const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isHighContrast;
};

// Apply high contrast colors
const colors = useHighContrast() ? {
  line: '#000000',
  area: '#0000FF',
  background: '#FFFFFF',
} : {
  line: '#3b82f6',
  area: 'rgba(59, 130, 246, 0.3)',
  background: 'transparent',
};
```

### 7.4 Screen Reader Support

**Provide Data Tables for Screen Readers**

```typescript
// ✅ GOOD: Accessible data table alternative
<div>
  <div aria-hidden="true">
    <div ref={chartRef} style={{ height: '400px' }} />
  </div>

  <table className="sr-only">
    <caption>Pressure Test Data</caption>
    <thead>
      <tr>
        <th>Time</th>
        <th>Pressure ({unit})</th>
      </tr>
    </thead>
    <tbody>
      {data.map((point, index) => (
        <tr key={index}>
          <td>{formatTime(point.timestamp)}</td>
          <td>{point.pressure.toFixed(2)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## 8. Server-Side Rendering

### 8.1 Next.js Integration

**Disable SSR for ECharts Components**

```typescript
// ✅ GOOD: Dynamic import with SSR disabled
// app/dashboard/page.tsx
import dynamic from 'next/dynamic';

const PressureGraph = dynamic(
  () => import('@/components/charts/pressure-graph'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

export default function Dashboard() {
  return <PressureGraph data={data} />;
}
```

### 8.2 SSR for Static Charts (Advanced)

**Server-Side Chart Rendering**

```typescript
// ✅ GOOD: SSR with echarts (Node.js environment)
// This requires server-side setup with node-canvas or SVG rendering
import * as echarts from 'echarts';

export async function generateChartSVG(data: ChartData): Promise<string> {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 800,
    height: 400,
  });

  chart.setOption({
    // Chart configuration
  });

  const svgString = chart.renderToSVGString();
  chart.dispose(); // Critical: prevent memory leaks

  return svgString;
}

// Usage in Server Component
export default async function ReportPage({ testId }: Props) {
  const data = await fetchTestData(testId);
  const chartSVG = await generateChartSVG(data);

  return (
    <div dangerouslySetInnerHTML={{ __html: chartSVG }} />
  );
}
```

### 8.3 Hydration Strategy

**Prevent Hydration Mismatches**

```typescript
// ✅ GOOD: Safe client-only rendering
'use client';

import { useEffect, useState } from 'react';

export function PressureGraph({ data }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <ChartSkeleton />; // Prevent hydration mismatch
  }

  return <EChartsComponent data={data} />;
}
```

---

## 9. Error Handling

### 9.1 Error Boundaries

**Wrap Charts in Error Boundaries**

```typescript
// ✅ GOOD: Chart error boundary
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Chart error:', error, errorInfo);
    // Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 font-medium">Chart Error</h3>
          <p className="text-red-600 text-sm mt-2">
            Failed to render chart. Please try refreshing the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ChartErrorBoundary>
  <PressureGraph data={data} />
</ChartErrorBoundary>
```

### 9.2 Graceful Degradation

**Handle Missing Data**

```typescript
// ✅ GOOD: Graceful handling of empty data
export function PressureGraph({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded border">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
          <p className="text-sm text-gray-400 mt-1">
            Start a test to see pressure data
          </p>
        </div>
      </div>
    );
  }

  return <ChartComponent data={data} />;
}
```

### 9.3 Loading States

**Provide Clear Loading Indicators**

```typescript
// ✅ GOOD: Loading states
export function PressureGraph({ data, isLoading, error }: Props) {
  if (error) {
    return <ErrorState message={error} />;
  }

  if (isLoading) {
    return <ChartSkeleton />;
  }

  return <ChartComponent data={data} />;
}

// Skeleton component
function ChartSkeleton() {
  return (
    <div className="w-full h-96 bg-gray-100 rounded animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mt-4" />
      <div className="mt-8 px-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded mb-2" />
        ))}
      </div>
    </div>
  );
}
```

---

## 10. Testing Strategies

### 10.1 Unit Testing

**Test Chart Logic Separately**

```typescript
// ✅ GOOD: Test data transformations
import { describe, it, expect } from 'vitest';
import { transformChartData, calculateInterval } from './chart-utils';

describe('transformChartData', () => {
  it('should transform data points correctly', () => {
    const input = [
      { timestamp: 1000, pressure: 10 },
      { timestamp: 2000, pressure: 20 },
    ];

    const result = transformChartData(input);

    expect(result).toEqual([
      [1000, 10],
      [2000, 20],
    ]);
  });

  it('should handle null values', () => {
    const input = [
      { timestamp: 1000, pressure: 10 },
      null,
      { timestamp: 3000, pressure: 30 },
    ];

    const result = transformChartData(input);

    expect(result).toEqual([
      [1000, 10],
      [0, null],
      [3000, 30],
    ]);
  });
});
```

### 10.2 Integration Testing

**Test Chart Rendering**

```typescript
// ✅ GOOD: Integration test with React Testing Library
import { render, screen, waitFor } from '@testing-library/react';
import { PressureGraph } from './pressure-graph';

describe('PressureGraph', () => {
  it('should render chart with data', async () => {
    const data = [
      { timestamp: 1000, pressure: 10 },
      { timestamp: 2000, pressure: 20 },
    ];

    render(<PressureGraph data={data} />);

    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  it('should show empty state when no data', () => {
    render(<PressureGraph data={[]} />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});
```

### 10.3 Visual Regression Testing

**Snapshot Testing**

```typescript
// ✅ GOOD: Visual regression with Playwright
import { test, expect } from '@playwright/test';

test('pressure graph renders correctly', async ({ page }) => {
  await page.goto('/dashboard');

  const chart = page.locator('[role="img"][aria-label*="Pressure test"]');
  await expect(chart).toBeVisible();

  // Take screenshot for visual comparison
  await expect(page).toHaveScreenshot('pressure-graph.png', {
    mask: [page.locator('.dynamic-timestamp')], // Mask dynamic content
  });
});
```

---

## 11. Animation & Interaction

### 11.1 Animation Configuration

**Optimize Animations for Performance**

```typescript
// ✅ GOOD: Optimized animations
const option: ECOption = {
  animation: true,
  animationDuration: 300, // Faster for better UX
  animationEasing: 'cubicOut',
  animationDelay: 0,
  animationDurationUpdate: 300,
  animationEasingUpdate: 'cubicOut',

  series: [{
    type: 'line',
    data: chartData,
    // Disable animation for real-time data
    animation: isRealtime ? false : true,
  }]
};

// ❌ BAD: Slow animations that hurt UX
const option: ECOption = {
  animationDuration: 2000, // Too slow
  animationEasing: 'elasticOut', // Too bouncy
};
```

### 11.2 Smooth Line Interpolation

**When to Use Smooth Lines**

```typescript
// ✅ GOOD: Smooth for continuous data (temperature, flow rate)
series: [{
  type: 'line',
  smooth: true, // Use smooth curves
  smoothMonotone: 'x', // Maintain monotonicity
  data: temperatureData,
}]

// ✅ GOOD: Not smooth for discrete events (pressure stages)
series: [{
  type: 'line',
  smooth: false, // Keep sharp transitions
  step: false, // Or use 'start', 'middle', 'end' for step line
  data: pressureStages,
}]
```

### 11.3 Tooltip Optimization

**Rich Tooltip Content**

```typescript
// ✅ GOOD: Informative tooltip
tooltip: {
  trigger: 'axis',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderColor: '#ddd',
  borderWidth: 1,
  padding: 12,
  textStyle: {
    color: '#333',
    fontSize: 13,
  },
  formatter: (params: any) => {
    const point = params[0];
    const timestamp = point.data[0];
    const pressure = point.data[1];

    return `
      <div style="min-width: 200px;">
        <div style="font-weight: 600; margin-bottom: 8px;">
          ${formatTime(timestamp)}
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Pressure:</span>
          <span style="font-weight: 600; color: #3b82f6;">
            ${pressure.toFixed(2)} MPa
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 4px;">
          <span>Status:</span>
          <span style="color: ${getStatusColor(pressure)};">
            ${getStatus(pressure)}
          </span>
        </div>
      </div>
    `;
  },
}
```

### 11.4 Interactive Events

**Handle User Interactions**

```typescript
// ✅ GOOD: Comprehensive event handling
useEffect(() => {
  const chart = chartInstance.current;
  if (!chart) return;

  const handleClick = (params: ECElementEvent) => {
    if (params.componentType === 'series') {
      const dataPoint = params.data as [number, number];
      onPointClick?.({
        timestamp: dataPoint[0],
        pressure: dataPoint[1],
      });
    }
  };

  const handleMouseOver = (params: ECElementEvent) => {
    chart.dispatchAction({
      type: 'highlight',
      seriesIndex: params.seriesIndex,
      dataIndex: params.dataIndex,
    });
  };

  const handleMouseOut = (params: ECElementEvent) => {
    chart.dispatchAction({
      type: 'downplay',
      seriesIndex: params.seriesIndex,
      dataIndex: params.dataIndex,
    });
  };

  chart.on('click', handleClick);
  chart.on('mouseover', handleMouseOver);
  chart.on('mouseout', handleMouseOut);

  return () => {
    chart.off('click', handleClick);
    chart.off('mouseover', handleMouseOver);
    chart.off('mouseout', handleMouseOut);
  };
}, [onPointClick]);
```

---

## 12. Code Organization

### 12.1 File Structure

```
src/components/charts/
├── pressure-graph/
│   ├── index.ts                    # Public exports
│   ├── pressure-graph.tsx          # Main component
│   ├── use-pressure-graph-option.ts # Chart option hook
│   ├── use-pressure-graph-data.ts   # Data transformation hook
│   ├── pressure-graph.types.ts      # Type definitions
│   ├── pressure-graph.utils.ts      # Utility functions
│   ├── pressure-graph.test.tsx      # Component tests
│   └── __snapshots__/               # Visual snapshots
├── shared/
│   ├── chart-error-boundary.tsx
│   ├── chart-skeleton.tsx
│   └── use-chart-resize.ts
└── index.ts                         # Barrel exports
```

### 12.2 Reusable Hooks

**Extract Common Logic**

```typescript
// ✅ GOOD: Reusable chart hooks
// hooks/use-chart-instance.ts
export function useChartInstance(
  chartRef: RefObject<HTMLDivElement>,
  options?: EChartsCoreOption
) {
  const instanceRef = useRef<ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    instanceRef.current = echarts.init(chartRef.current, undefined, options);

    return () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, [chartRef, options]);

  return instanceRef;
}

// hooks/use-chart-resize.ts
export function useChartResize(chartRef: RefObject<ECharts | null>) {
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handleResize = debounce(() => chart.resize(), 250);
    window.addEventListener('resize', handleResize);

    return () => {
      handleResize.cancel();
      window.removeEventListener('resize', handleResize);
    };
  }, [chartRef]);
}
```

### 12.3 Configuration Management

**Centralize Chart Configurations**

```typescript
// ✅ GOOD: Shared chart configuration
// config/chart-themes.ts
export const chartThemes = {
  light: {
    backgroundColor: '#ffffff',
    textStyle: { color: '#333333' },
    axisLine: { lineStyle: { color: '#cccccc' } },
    splitLine: { lineStyle: { color: '#f0f0f0' } },
  },
  dark: {
    backgroundColor: '#1a1a1a',
    textStyle: { color: '#e5e5e5' },
    axisLine: { lineStyle: { color: '#444444' } },
    splitLine: { lineStyle: { color: '#2a2a2a' } },
  },
} as const;

// config/chart-defaults.ts
export const chartDefaults = {
  grid: {
    left: '10%',
    right: '8%',
    bottom: '15%',
    top: '20%',
  },
  tooltip: {
    trigger: 'axis' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 12,
  },
  animation: {
    duration: 300,
    easing: 'cubicOut' as const,
  },
} as const;
```

---

## Summary Checklist

### Performance
- [ ] Use tree-shaking (import from 'echarts/core')
- [ ] Memoize chart options with useMemo
- [ ] Choose appropriate renderer (Canvas vs SVG)
- [ ] Implement data sampling for large datasets
- [ ] Debounce resize handlers

### Memory
- [ ] Always call chart.dispose() on unmount
- [ ] Remove all event listeners in cleanup
- [ ] Clear chart instance references (set to null)
- [ ] Limit data points for real-time charts

### Type Safety
- [ ] Use ComposeOption for chart options
- [ ] Type all props and event handlers
- [ ] Validate data with Zod schemas

### Accessibility
- [ ] Add ARIA labels and roles
- [ ] Provide alternative data table
- [ ] Support keyboard navigation
- [ ] Test with screen readers

### Error Handling
- [ ] Wrap charts in Error Boundaries
- [ ] Handle empty data states
- [ ] Show loading indicators
- [ ] Validate data before rendering

### Testing
- [ ] Unit test data transformations
- [ ] Integration test rendering
- [ ] Visual regression tests
- [ ] Test error states

---

## Additional Resources

- [ECharts Official Documentation](https://echarts.apache.org/en/index.html)
- [ECharts Examples](https://echarts.apache.org/examples/en/index.html)
- [echarts-for-react](https://github.com/hustcc/echarts-for-react)
- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [React 19 Documentation](https://react.dev/)

---

**Document Version**: 1.0.0
**Last Updated**: November 7, 2025
**Maintained by**: Pressograph Development Team
