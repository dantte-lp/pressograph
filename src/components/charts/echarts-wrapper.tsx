'use client';

/**
 * ECharts Wrapper Component
 *
 * Provides a simplified interface for using ECharts in React components.
 * Features:
 * - Type-safe ECharts options using tree-shaken centralized config
 * - Automatic responsive behavior with ResizeObserver
 * - SVG/Canvas rendering support
 * - Theme support (light/dark)
 * - Optimized for performance (lazy updates, no merge)
 * - Automatic cleanup on unmount
 *
 * @see /src/lib/echarts-config.ts - Centralized ECharts configuration
 * @see /docs/development/ECHARTS6_INTEGRATION_ANALYSIS.md - Integration guide
 */

import React, { useEffect, useRef } from 'react';
import { echarts, type PressureChartOption } from '@/lib/echarts-config';
import type { ECharts, SetOptionOpts } from 'echarts/core';

export interface EChartsWrapperProps {
  /** ECharts option configuration (use PressureChartOption for type safety) */
  option: PressureChartOption;

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

  /** Whether to merge options (default: false for better performance) */
  notMerge?: boolean;

  /** Whether to update lazily (default: true for better performance) */
  lazyUpdate?: boolean;
}

/**
 * ECharts Wrapper Component
 *
 * Direct ECharts integration with React 19 patterns (no echarts-for-react dependency).
 * Uses centralized tree-shaken configuration for optimal bundle size.
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
  notMerge = true,
  lazyUpdate = true,
}: EChartsWrapperProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<ECharts | null>(null);

  // Initialize chart instance
  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize ECharts instance with theme and renderer
    const chartInstance = echarts.init(chartRef.current, theme, {
      renderer: opts.renderer || 'svg',
      width: opts.width || undefined,
      height: opts.height || undefined,
      locale: opts.locale || 'EN',
    });

    chartInstanceRef.current = chartInstance;

    // Call onChartReady callback
    if (onChartReady) {
      onChartReady(chartInstance);
    }

    // Register event handlers
    if (onEvents) {
      Object.entries(onEvents).forEach(([eventName, handler]) => {
        chartInstance.on(eventName, handler);
      });
    }

    // Handle resize with ResizeObserver for better performance
    const resizeObserver = new ResizeObserver(() => {
      chartInstance.resize();
    });

    resizeObserver.observe(chartRef.current);

    // Cleanup
    return () => {
      resizeObserver.disconnect();

      // Unregister event handlers
      if (onEvents) {
        Object.entries(onEvents).forEach(([eventName, handler]) => {
          chartInstance.off(eventName, handler);
        });
      }

      chartInstance.dispose();
      chartInstanceRef.current = null;
    };
  }, [theme, opts.renderer, opts.width, opts.height, opts.locale, onChartReady, onEvents]);

  // Update chart option when it changes
  useEffect(() => {
    const chartInstance = chartInstanceRef.current;
    if (!chartInstance) return;

    const setOptionOpts: SetOptionOpts = {
      notMerge,
      lazyUpdate,
    };

    chartInstance.setOption(option, setOptionOpts);
  }, [option, notMerge, lazyUpdate]);

  // Handle loading state
  useEffect(() => {
    const chartInstance = chartInstanceRef.current;
    if (!chartInstance) return;

    if (showLoading || loading) {
      chartInstance.showLoading('default', loadingOption);
    } else {
      chartInstance.hideLoading();
    }
  }, [loading, showLoading, loadingOption]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{
        width: '100%',
        height: '400px',
        ...style,
      }}
    />
  );
}

/**
 * Re-export ECharts types for convenience
 */
export type { PressureChartOption as EChartsOption, ECharts } from '@/lib/echarts-config';
