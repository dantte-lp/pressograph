'use client';

/**
 * ECharts Wrapper Component
 *
 * Provides a simplified interface for using ECharts in React components.
 * Features:
 * - Type-safe ECharts options
 * - Automatic responsive behavior
 * - SVG rendering for better quality
 * - Theme support (light/dark)
 * - Optimized for performance (lazy updates, no merge)
 */

import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption, ECharts } from 'echarts';

export interface EChartsWrapperProps {
  /** ECharts option configuration */
  option: EChartsOption;

  /** Custom inline styles for the chart container */
  style?: React.CSSProperties;

  /** CSS class name for the chart container */
  className?: string;

  /** Theme name ('light' | 'dark' or custom theme) */
  theme?: string | object;

  /** Loading state */
  loading?: boolean;

  /** Loading options */
  loadingOption?: object;

  /** Event handlers */
  onChartReady?: (chart: ECharts) => void;
  onEvents?: Record<string, (params: any) => void>;

  /** Whether to show loading animation (default: false) */
  showLoading?: boolean;

  /** Chart instance options */
  opts?: {
    renderer?: 'canvas' | 'svg';
    width?: number | 'auto' | null;
    height?: number | 'auto' | null;
    locale?: string;
  };
}

/**
 * ECharts Wrapper Component
 *
 * Wraps echarts-for-react with sensible defaults and type safety.
 */
export function EChartsWrapper({
  option,
  style,
  className,
  theme = 'light',
  loading = false,
  loadingOption,
  onChartReady,
  onEvents,
  showLoading = false,
  opts = { renderer: 'svg' },
}: EChartsWrapperProps) {
  return (
    <ReactECharts
      option={option}
      style={style}
      className={className}
      theme={theme}
      showLoading={showLoading || loading}
      loadingOption={loadingOption}
      onChartReady={onChartReady}
      onEvents={onEvents}
      notMerge={true}
      lazyUpdate={true}
      opts={opts}
    />
  );
}

/**
 * Re-export ECharts types for convenience
 */
export type { EChartsOption, ECharts };
