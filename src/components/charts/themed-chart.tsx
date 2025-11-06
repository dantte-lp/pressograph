'use client';

/**
 * Themed Chart Component
 *
 * ECharts wrapper that automatically applies the current theme (dark/light mode).
 * Integrates with next-themes for seamless theme switching.
 */

import { useTheme } from 'next-themes';
import { EChartsWrapper, type EChartsWrapperProps } from './echarts-wrapper';
import type { EChartsOption } from 'echarts';

export interface ThemedChartProps extends Omit<EChartsWrapperProps, 'theme'> {
  /** Override automatic theme detection */
  forceTheme?: 'light' | 'dark';
}

/**
 * Chart component with automatic theme detection
 *
 * Uses next-themes to detect the current theme and applies it to ECharts.
 * Also applies theme-specific styling to chart options.
 */
export function ThemedChart({
  option,
  forceTheme,
  ...props
}: ThemedChartProps) {
  const { theme, systemTheme } = useTheme();

  // Determine the current theme
  const currentTheme = forceTheme || (theme === 'system' ? systemTheme : theme) || 'light';
  const isDark = currentTheme === 'dark';

  // Apply theme-specific styles to the chart option
  const themedOption: EChartsOption = {
    ...option,
    backgroundColor: 'transparent', // Let parent control background
    textStyle: {
      color: isDark ? '#F3F4F6' : '#1F2937', // Gray-100 : Gray-800
      fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
  };

  return (
    <EChartsWrapper
      option={themedOption}
      theme={currentTheme}
      {...props}
    />
  );
}

/**
 * Hook to get theme-aware colors for chart configuration
 *
 * Returns a palette of colors that work well in both light and dark modes.
 */
export function useChartColors() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  return {
    // Primary colors
    primary: isDark ? '#60A5FA' : '#3B82F6', // Blue-400 : Blue-600
    secondary: isDark ? '#A78BFA' : '#8B5CF6', // Violet-400 : Violet-600
    success: isDark ? '#34D399' : '#10B981', // Emerald-400 : Emerald-600
    warning: isDark ? '#FBBF24' : '#F59E0B', // Amber-400 : Amber-600
    danger: isDark ? '#F87171' : '#EF4444', // Red-400 : Red-600
    info: isDark ? '#38BDF8' : '#0EA5E9', // Sky-400 : Sky-600

    // Chart-specific colors
    pressure: isDark ? '#60A5FA' : '#3B82F6', // Blue
    temperature: isDark ? '#F87171' : '#EF4444', // Red
    threshold: isDark ? '#FBBF24' : '#F59E0B', // Amber
    safe: isDark ? '#34D399' : '#10B981', // Emerald

    // UI colors
    grid: isDark ? '#374151' : '#E5E7EB', // Gray-700 : Gray-200
    text: isDark ? '#F3F4F6' : '#1F2937', // Gray-100 : Gray-800
    textMuted: isDark ? '#9CA3AF' : '#6B7280', // Gray-400 : Gray-500
    border: isDark ? '#4B5563' : '#D1D5DB', // Gray-600 : Gray-300
    background: isDark ? '#1F2937' : '#FFFFFF', // Gray-800 : White
    backgroundCard: isDark ? '#374151' : '#F9FAFB', // Gray-700 : Gray-50

    // Utility
    isDark,
    theme: currentTheme,
  };
}
