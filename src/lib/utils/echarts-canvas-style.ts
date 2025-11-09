/**
 * ECharts Canvas Style Configuration
 *
 * Matches the original Pressograph v1.0 Canvas implementation styling
 * for consistency across graph rendering methods.
 *
 * Based on /opt/backup/pressograph-20251103-051742/src/utils/canvasRenderer.ts
 *
 * @module lib/utils/echarts-canvas-style
 */

import type { LineSeriesOption } from 'echarts/charts';
import type {
  GridComponentOption,
  TitleComponentOption,
} from 'echarts/components';

/**
 * Theme colors matching Canvas implementation
 */
export interface CanvasThemeColors {
  /** Background color */
  bg: string;
  /** Text color */
  text: string;
  /** Primary grid line color */
  grid: string;
  /** Light grid line color */
  gridLight: string;
  /** Info box background */
  infoBoxBg: string;
  /** Info box border */
  infoBoxBorder: string;
  /** Pressure line color (main data) */
  pressureLine: string;
  /** Pressure area fill color */
  pressureArea: string;
}

/**
 * Get theme colors for light mode (matches Canvas)
 */
export function getLightThemeColors(): CanvasThemeColors {
  return {
    bg: '#ffffff',
    text: '#000000',
    grid: '#d0d0d0',
    gridLight: '#f0f0f0',
    infoBoxBg: 'rgba(255, 248, 220, 0.9)',
    infoBoxBorder: '#dddddd',
    pressureLine: '#0066cc', // Canvas blue
    pressureArea: 'rgba(173, 216, 230, 0.3)', // Light sky blue
  };
}

/**
 * Get theme colors for dark mode (matches Canvas)
 */
export function getDarkThemeColors(): CanvasThemeColors {
  return {
    bg: '#2d2d2d',
    text: '#e0e0e0',
    grid: '#444444',
    gridLight: '#383838',
    infoBoxBg: 'rgba(56, 56, 56, 0.9)',
    infoBoxBorder: '#555555',
    pressureLine: '#0066cc', // Same blue as light mode
    pressureArea: 'rgba(173, 216, 230, 0.3)', // Same area color
  };
}

/**
 * Canvas-style grid configuration for ECharts
 */
export function getCanvasGridStyle(): GridComponentOption {
  return {
    left: 80, // Matches Canvas margin.left
    right: 50, // Matches Canvas margin.right
    top: 80, // Matches Canvas margin.top
    bottom: 120, // Matches Canvas margin.bottom
    containLabel: false,
    borderWidth: 0,
  };
}

/**
 * Canvas-style title configuration for ECharts
 */
export function getCanvasTitleStyle(
  title: string,
  theme: 'light' | 'dark' = 'light'
): TitleComponentOption {
  const colors = theme === 'dark' ? getDarkThemeColors() : getLightThemeColors();

  return {
    text: title,
    left: 'center',
    top: 40, // Matches Canvas title position
    textStyle: {
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif',
      color: colors.text,
    },
  };
}

/**
 * Canvas-style axis configuration for ECharts
 */
export function getCanvasAxisStyle(theme: 'light' | 'dark' = 'light') {
  const colors = theme === 'dark' ? getDarkThemeColors() : getLightThemeColors();

  return {
    axisLine: {
      show: true,
      lineStyle: {
        color: colors.text,
        width: 2,
      },
    },
    axisLabel: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      color: colors.text,
      fontWeight: 'normal',
    },
    axisTick: {
      show: true,
      length: 8,
      lineStyle: {
        color: colors.text,
        width: 1,
      },
    },
    minorTick: {
      show: true,
      length: 4,
      lineStyle: {
        color: colors.text,
        width: 0.5,
      },
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: colors.gridLight,
        width: 1,
        type: 'solid',
      },
    },
    minorSplitLine: {
      show: false, // Canvas doesn't show minor split lines
    },
  };
}

/**
 * Canvas-style line series configuration for ECharts
 */
export function getCanvasLineStyle(theme: 'light' | 'dark' = 'light'): Partial<LineSeriesOption> {
  const colors = theme === 'dark' ? getDarkThemeColors() : getLightThemeColors();

  return {
    type: 'line',
    smooth: false, // Sharp corners like Canvas
    symbol: 'none', // No markers like Canvas
    sampling: 'lttb', // Optimize for many points
    lineStyle: {
      color: colors.pressureLine,
      width: 2,
      type: 'solid',
    },
    areaStyle: {
      color: colors.pressureArea,
    },
    emphasis: {
      disabled: false,
      lineStyle: {
        width: 3,
      },
    },
  };
}

/**
 * Complete Canvas-matched ECharts option template
 */
export function getCanvasStyleOption(
  title: string,
  theme: 'light' | 'dark' = 'light'
) {
  const colors = theme === 'dark' ? getDarkThemeColors() : getLightThemeColors();
  const axisStyle = getCanvasAxisStyle(theme);

  return {
    backgroundColor: colors.bg,
    title: getCanvasTitleStyle(title, theme),
    grid: getCanvasGridStyle(),
    xAxis: {
      ...axisStyle,
      type: 'value' as const,
      nameLocation: 'middle' as const,
      nameGap: 35,
      nameTextStyle: {
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        color: colors.text,
      },
    },
    yAxis: {
      ...axisStyle,
      type: 'value' as const,
      nameLocation: 'middle' as const,
      nameGap: 45,
      nameTextStyle: {
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        color: colors.text,
      },
      position: 'left' as const,
      onZero: false,
    },
    animation: false, // Match Canvas static rendering
  };
}

/**
 * Apply Canvas styling to existing ECharts option
 * Merges Canvas styles with user-provided options
 */
export function applyCanvasStyle<T extends Record<string, any>>(
  option: T,
  theme: 'light' | 'dark' = 'light'
): T {
  const colors = theme === 'dark' ? getDarkThemeColors() : getLightThemeColors();
  const canvasStyle = getCanvasStyleOption('', theme);

  return {
    ...option,
    backgroundColor: colors.bg,
    grid: {
      ...canvasStyle.grid,
      ...option.grid,
    },
    xAxis: {
      ...canvasStyle.xAxis,
      ...option.xAxis,
      axisLine: {
        ...canvasStyle.xAxis.axisLine,
        ...(option.xAxis?.axisLine || {}),
      },
      axisLabel: {
        ...canvasStyle.xAxis.axisLabel,
        ...(option.xAxis?.axisLabel || {}),
      },
      axisTick: {
        ...canvasStyle.xAxis.axisTick,
        ...(option.xAxis?.axisTick || {}),
      },
      splitLine: {
        ...canvasStyle.xAxis.splitLine,
        ...(option.xAxis?.splitLine || {}),
      },
    },
    yAxis: {
      ...canvasStyle.yAxis,
      ...option.yAxis,
      axisLine: {
        ...canvasStyle.yAxis.axisLine,
        ...(option.yAxis?.axisLine || {}),
      },
      axisLabel: {
        ...canvasStyle.yAxis.axisLabel,
        ...(option.yAxis?.axisLabel || {}),
      },
      axisTick: {
        ...canvasStyle.yAxis.axisTick,
        ...(option.yAxis?.axisTick || {}),
      },
      splitLine: {
        ...canvasStyle.yAxis.splitLine,
        ...(option.yAxis?.splitLine || {}),
      },
    },
    series: Array.isArray(option.series)
      ? option.series.map((s: any) => {
          if (s.type === 'line') {
            const canvasLine = getCanvasLineStyle(theme);
            return {
              ...s,
              smooth: canvasLine.smooth,
              symbol: canvasLine.symbol,
              sampling: canvasLine.sampling,
              lineStyle: {
                ...canvasLine.lineStyle,
                ...s.lineStyle,
              },
              areaStyle: {
                ...canvasLine.areaStyle,
                ...s.areaStyle,
              },
            };
          }
          return s;
        })
      : option.series,
  };
}
