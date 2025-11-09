'use client';

/**
 * ECharts Configuration Module
 *
 * Centralized ECharts setup with tree-shaking optimization.
 * This module registers only the components we actually use, reducing bundle size by ~400KB.
 *
 * Benefits:
 * - Reduced bundle size (from ~900KB to ~400-500KB)
 * - Single source of truth for ECharts configuration
 * - Type-safe exports with TypeScript
 * - Proper tree-shaking with modular imports
 *
 * Usage:
 * ```tsx
 * import { echarts, type PressureChartOption } from '@/lib/echarts-config'
 *
 * const option: PressureChartOption = {
 *   // Your chart configuration
 * }
 *
 * const chart = echarts.init(containerRef.current)
 * chart.setOption(option)
 * ```
 *
 * @see /docs/development/ECHARTS6_INTEGRATION_ANALYSIS.md
 * @see https://echarts.apache.org/handbook/en/basics/import/#shrinking-bundle-size
 */

import * as echarts from 'echarts/core';

// Import only the chart types we use
import { LineChart } from 'echarts/charts';
import type { LineSeriesOption } from 'echarts/charts';

// Import only the components we use
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  DataZoomComponent,
  ToolboxComponent,
  GraphicComponent,
} from 'echarts/components';
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  LegendComponentOption,
  MarkLineComponentOption,
  DataZoomComponentOption,
  ToolboxComponentOption,
  GraphicComponentOption,
} from 'echarts/components';

// Import renderers
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';

// Import core types
import type { ComposeOption } from 'echarts/core';

/**
 * Register ECharts components globally (only once)
 *
 * This registration happens at module load time and is shared
 * across all components that import from this module.
 */
echarts.use([
  // Charts
  LineChart,

  // Components
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  DataZoomComponent,
  ToolboxComponent,
  GraphicComponent,

  // Renderers
  CanvasRenderer,
  SVGRenderer,
]);

/**
 * Type-safe ECharts option for pressure test charts
 *
 * Compose only the option types we actually use to maintain strict typing
 */
export type PressureChartOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | MarkLineComponentOption
  | DataZoomComponentOption
  | ToolboxComponentOption
  | GraphicComponentOption
>;

/**
 * Export the configured ECharts instance
 *
 * Use this instead of importing echarts directly to ensure
 * you're using the tree-shaken version with registered components
 */
export { echarts };

/**
 * Re-export commonly used ECharts types for convenience
 */
export type { ECharts, EChartsCoreOption, SetOptionOpts } from 'echarts/core';
export type { LineSeriesOption } from 'echarts/charts';

// For backward compatibility - map EChartsOption to EChartsCoreOption
export type { EChartsCoreOption as EChartsOption } from 'echarts/core';
