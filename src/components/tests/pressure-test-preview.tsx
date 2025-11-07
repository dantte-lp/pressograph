'use client';

/**
 * Pressure Test Preview Component
 *
 * Displays a real-time graph preview of the pressure test profile using ECharts.
 * Shows pressure over time with intermediate stages and reference lines.
 *
 * @module components/tests/pressure-test-preview
 *
 * Best Practices Applied:
 * - Tree-shaking: Imports only required ECharts components
 * - Type Safety: Full TypeScript coverage with ComposeOption
 * - Performance: Memoized data transformations and chart options
 * - Memory: Proper disposal and event listener cleanup
 * - Accessibility: ARIA labels and screen reader support
 * - Responsive: Debounced resize handling
 * - Error Handling: Graceful degradation for invalid data
 *
 * @see /docs/ECHARTS_BEST_PRACTICES.md
 */

import { useEffect, useRef, useMemo, useCallback } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECharts, ComposeOption } from 'echarts/core';
import type { LineSeriesOption } from 'echarts/charts';
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  LegendComponentOption,
} from 'echarts/components';
import {
  generateRealisticTestData,
  convertToMinutes,
  type DriftConfig
} from '@/lib/utils/pressure-drift-simulator';
import { applyCanvasStyle } from '@/lib/utils/echarts-canvas-style';
import {
  calculateZoomedTimeWindow,
  getZoomInterval,
  type TimeScale,
  type TimeWindow,
} from '@/lib/utils/time-zoom';

// Register ECharts components (tree-shaking optimization)
echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

// Type-safe chart option composition
type ECOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
>;

/**
 * Represents an intermediate pressure stage in the test profile
 */
interface IntermediateStage {
  /** Minutes after previous stage's hold ends (relative time) */
  time: number;
  /** Target pressure for this stage */
  pressure: number;
  /** Duration to hold at this pressure (minutes) */
  duration: number;
}

/**
 * Props for the PressureTestPreview component
 */
interface PressureTestPreviewProps {
  /** Working (baseline) pressure for the test */
  workingPressure: number;
  /** Maximum pressure limit */
  maxPressure: number;
  /** Total test duration in hours */
  testDuration: number;
  /** Optional intermediate pressure stages */
  intermediateStages?: IntermediateStage[];
  /** Unit of measurement for pressure display */
  pressureUnit?: 'MPa' | 'Bar' | 'PSI';
  /** Optional CSS class name for styling */
  className?: string;
  /** ISO 8601 format start date/time (enables time-based axis) */
  startDateTime?: string;
  /** ISO 8601 format end date/time (enables time-based axis) */
  endDateTime?: string;
  /** Show/hide working pressure reference line */
  showWorkingLine?: boolean;
  /** Show/hide max pressure reference line */
  showMaxLine?: boolean;
  /** Enable realistic pressure drift simulation */
  enableDrift?: boolean;
  /** Apply Canvas-style configuration (v1.0 visual compatibility) */
  enableCanvasStyle?: boolean;
  /** Theme for Canvas style (light or dark) */
  canvasTheme?: 'light' | 'dark';
  /** Time scale zoom level (default: 'auto' - full test duration) */
  timeScale?: TimeScale;
  /** Custom time window (overrides timeScale if provided) */
  timeWindow?: TimeWindow;
}

/**
 * Data point in [x, y] format for ECharts
 */
type ChartDataPoint = [number, number];

/**
 * Processed chart data structure
 */
interface ProcessedChartData {
  dataPoints: ChartDataPoint[];
  timeLabels: string[];
}

/**
 * Utility function to debounce callback execution
 * Prevents excessive calls during rapid events (e.g., window resize)
 *
 * @param func - Function to debounce
 * @param wait - Delay in milliseconds
 * @returns Debounced function with cancel method
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };

  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
  };

  return debounced as T & { cancel: () => void };
}

/**
 * PressureTestPreview Component
 *
 * Renders an interactive line chart showing pressure variations over time during a test.
 * Supports both duration-based (hours) and calendar-based (date/time) X-axis displays.
 *
 * Performance Optimizations:
 * - Memoized data calculations
 * - Memoized chart options
 * - Debounced resize handler
 * - Canvas renderer for better performance with line charts
 *
 * @example
 * ```tsx
 * <PressureTestPreview
 *   workingPressure={10}
 *   maxPressure={15}
 *   testDuration={24}
 *   pressureUnit="MPa"
 *   intermediateStages={[
 *     { time: 1, pressure: 12, duration: 30 }
 *   ]}
 * />
 * ```
 */
export function PressureTestPreview({
  workingPressure,
  maxPressure,
  testDuration,
  intermediateStages = [],
  pressureUnit = 'MPa',
  className = '',
  startDateTime,
  endDateTime,
  showWorkingLine = true,
  showMaxLine = true,
  enableDrift = false,
  enableCanvasStyle = false,
  canvasTheme = 'light',
  timeScale = 'auto',
  timeWindow,
}: PressureTestPreviewProps) {
  // Refs for DOM element and chart instance
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);

  // Data validation: Sanitize testDuration to prevent division by zero or negative intervals
  // Defaults to 24 hours if invalid
  const sanitizedDuration = useMemo(() => {
    return typeof testDuration === 'number' && testDuration > 0 ? testDuration : 24;
  }, [testDuration]);

  // Determine display mode: time-based (calendar) vs value-based (duration)
  const useTimeBased = useMemo(() => {
    return Boolean(startDateTime && endDateTime);
  }, [startDateTime, endDateTime]);

  // Calculate time bounds for the chart
  const { startTime, endTime, paddingHours } = useMemo(() => {
    const start = useTimeBased && startDateTime ? new Date(startDateTime).getTime() : 0;
    const end = useTimeBased && endDateTime
      ? new Date(endDateTime).getTime()
      : start + (sanitizedDuration * 60 * 60 * 1000);

    // Add 1 hour padding (±1 hour) for time-based axis to show context
    const padding = 60 * 60 * 1000; // 1 hour in milliseconds
    const hours = 1; // Padding hours for calculation: 1 hour before and 1 hour after

    return {
      startTime: start,
      endTime: end,
      paddingMs: padding,
      paddingHours: hours,
    };
  }, [useTimeBased, startDateTime, endDateTime, sanitizedDuration]);

  /**
   * Calculate optimal X-axis interval based on display range
   *
   * Algorithm:
   * - Aims for 8-15 tick marks on the axis for optimal readability
   * - Uses common interval values: 1h, 2h, 3h, 4h, 6h, 12h, 24h
   * - Prefers smaller intervals when multiple options are valid (better granularity)
   *
   * @param displayHours - Total hours displayed on axis
   * @returns Interval in minutes
   */
  const calculateXAxisInterval = useCallback((displayHours: number): number => {
    // Target tick count: aim for 10-12 ticks (comfortable range: 8-15)
    const targetTicks = 10;

    // Common interval values in hours (ordered from smallest to largest)
    const commonIntervals = [1, 2, 3, 4, 6, 12, 24];

    // Find all intervals that provide 8-15 ticks
    const validIntervals: Array<{ interval: number; tickCount: number }> = [];

    for (const interval of commonIntervals) {
      const tickCount = displayHours / interval;

      // Check if tick count is in acceptable range (8-15 ticks)
      if (tickCount >= 8 && tickCount <= 15) {
        validIntervals.push({ interval, tickCount });
      }
    }

    // If we have valid intervals, prefer smaller ones (better granularity)
    if (validIntervals.length > 0) {
      // Sort by interval size (prefer smaller for better granularity)
      validIntervals.sort((a, b) => a.interval - b.interval);
      return validIntervals[0].interval * 60; // Convert hours to minutes
    }

    // Fallback: If no interval gives 8-15 ticks, find the one closest to target
    let bestInterval = commonIntervals[0];
    let bestDiff = Infinity;

    for (const interval of commonIntervals) {
      const tickCount = displayHours / interval;
      const diff = Math.abs(tickCount - targetTicks);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestInterval = interval;
      }
    }

    return bestInterval * 60; // Convert hours to minutes
  }, []);

  // Calculate display range in hours
  // Time-based axis: includes ±1 hour padding (total: duration + 2 hours)
  // Value-based axis: no padding (total: duration only)
  const totalDisplayHours = useMemo(() => {
    if (useTimeBased && endTime && startTime) {
      // Calculate actual duration from timestamps and add padding
      const actualDurationHours = (endTime - startTime) / (60 * 60 * 1000);
      return actualDurationHours + (paddingHours * 2); // Add both before and after padding
    }
    return sanitizedDuration;
  }, [useTimeBased, startTime, endTime, sanitizedDuration, paddingHours]);

  /**
   * Calculate zoomed time window using utility function
   */
  const zoomedTimeWindow = useMemo(() => {
    return calculateZoomedTimeWindow(sanitizedDuration, timeScale, timeWindow);
  }, [sanitizedDuration, timeScale, timeWindow]);

  // Memoize the calculated interval to avoid excessive recalculations
  // Use zoomed display hours if zoom is active, otherwise use full display hours
  const xAxisInterval = useMemo(() => {
    const displayHours = zoomedTimeWindow.isZoomed
      ? zoomedTimeWindow.durationHours
      : totalDisplayHours;
    // Use optimized zoom interval calculation
    return zoomedTimeWindow.isZoomed
      ? getZoomInterval(displayHours)
      : calculateXAxisInterval(displayHours);
  }, [calculateXAxisInterval, zoomedTimeWindow, totalDisplayHours]);

  /**
   * Calculate pressure profile data points
   *
   * Generates the complete pressure curve including:
   * - Initial ramp-up (30 seconds)
   * - Intermediate stages with holds
   * - Final depressurization (30 seconds)
   * - Optional padding points for time-based display
   * - Realistic drift and noise simulation (when enabled)
   *
   * @returns Processed chart data with points and labels
   */
  const profileData = useMemo((): ProcessedChartData => {
    const totalMinutes = sanitizedDuration * 60;
    const rampUpDuration = 0.5; // 30 seconds to ramp up
    const depressurizeDuration = 0.5; // 30 seconds to depressurize

    let dataPoints: ChartDataPoint[] = [];
    const timeLabels: string[] = [];

    // Helper: Convert minutes to X-axis value (always use minutes for full control)
    const minutesToX = (minutes: number): number => minutes;

    // Helper: Format time for display
    const formatTime = (minutes: number): string => {
      if (minutes === 0) return '0';
      if (minutes < 60) return `${Math.round(minutes)}m`;
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    // Use realistic drift simulation if enabled
    if (enableDrift) {
      // Convert test parameters to milliseconds for drift simulator
      const startTimeMs = 0;
      const endTimeMs = totalMinutes * 60 * 1000;
      const rampDuration = 30 * 1000; // 30 seconds in milliseconds

      // Convert intermediate stages to absolute time format
      const stages: Array<{ startTime: number; endTime: number; pressure: number }> = [];
      let currentTimeMs = rampUpDuration * 60 * 1000; // After initial ramp-up

      if (intermediateStages && intermediateStages.length > 0) {
        intermediateStages.forEach((stage) => {
          // Add wait time after previous stage
          currentTimeMs += stage.time * 60 * 1000;
          const stageStartMs = currentTimeMs;
          const stageEndMs = stageStartMs + stage.duration * 60 * 1000;

          stages.push({
            startTime: stageStartMs,
            endTime: stageEndMs,
            pressure: stage.pressure,
          });

          currentTimeMs = stageEndMs + rampDuration; // Account for ramp down
        });
      }

      // Generate realistic data with drift and noise
      const realisticData = generateRealisticTestData(
        {
          startTime: startTimeMs,
          endTime: endTimeMs,
          workingPressure,
          intermediateStages: stages,
        },
        {
          driftMagnitude: 0.002, // ±0.2% drift
          noiseMagnitude: 0.001, // ±0.1% noise
          samplingRate: 1, // 1 second intervals
          seed: Date.now(),
        }
      );

      // Convert milliseconds to minutes for chart display
      dataPoints = convertToMinutes(realisticData, startTimeMs);

      // Generate sparse time labels for major points
      // (Too many labels would clutter the UI)
      const labelCount = Math.min(10, dataPoints.length);
      const labelInterval = Math.floor(dataPoints.length / labelCount);
      for (let i = 0; i < dataPoints.length; i += labelInterval) {
        const minutes = dataPoints[i][0];
        timeLabels.push(formatTime(minutes));
      }
    } else {
      // Original simplified logic (no drift)
      // Start: 0 pressure at time 0
      dataPoints.push([minutesToX(0), 0]);
      timeLabels.push('0');

      // Ramp up to working pressure (30 seconds)
      dataPoints.push([minutesToX(rampUpDuration), workingPressure]);
      timeLabels.push(formatTime(rampUpDuration));

      let currentTime = rampUpDuration;

      // Add intermediate stages (stage.time is RELATIVE minutes after previous stage)
      if (intermediateStages && intermediateStages.length > 0) {
        intermediateStages.forEach((stage) => {
          // Calculate cumulative time for this stage
          currentTime += stage.time; // Add wait time after previous stage
          const stageStartMinutes = currentTime;

          // Ramp up to stage pressure (30 seconds)
          dataPoints.push([minutesToX(stageStartMinutes), stage.pressure]);
          timeLabels.push(formatTime(stageStartMinutes));

          // Hold at stage pressure for specified duration
          const stageEndMinutes = stageStartMinutes + stage.duration;
          if (stageEndMinutes < totalMinutes - depressurizeDuration) {
            dataPoints.push([minutesToX(stageEndMinutes), stage.pressure]);
            timeLabels.push(formatTime(stageEndMinutes));

            // Drop back to working pressure after stage (30 seconds)
            dataPoints.push([minutesToX(stageEndMinutes + 0.5), workingPressure]);
            timeLabels.push(formatTime(stageEndMinutes + 0.5));

            currentTime = stageEndMinutes + 0.5;
          } else {
            currentTime = stageEndMinutes;
          }
        });
      }

      // Hold at working pressure until near end
      const depressurizeStartTime = totalMinutes - depressurizeDuration;
      if (currentTime < depressurizeStartTime) {
        dataPoints.push([minutesToX(depressurizeStartTime), workingPressure]);
        timeLabels.push(formatTime(depressurizeStartTime));
      }

      // Depressurize to 0 (30 seconds)
      dataPoints.push([minutesToX(totalMinutes), 0]);
      timeLabels.push(formatTime(totalMinutes));
    }

    return { dataPoints, timeLabels };
  }, [
    workingPressure,
    sanitizedDuration,
    intermediateStages,
    enableDrift,
  ]);

  /**
   * Generate complete ECharts configuration
   *
   * Memoized to prevent unnecessary recalculations on re-renders.
   * Includes all chart styling, axes configuration, and data series.
   * Optionally applies Canvas-style configuration for v1.0 visual compatibility.
   */
  const chartOption = useMemo((): ECOption => {
    const baseOption = {
      // Chart title (Russian labels for consistency with export)
      title: {
        text: 'Предварительный просмотр испытания',
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 600,
        },
      },

      // Interactive tooltip
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
          const minutes = point.data[0]; // Always in minutes (value-based axis)
          const pressure = point.data[1];

          // Format time display based on mode
          let timeStr: string;

          if (useTimeBased) {
            // Convert minutes offset to actual date/time
            const timestamp = startTime + minutes * 60 * 1000;
            const date = new Date(timestamp);
            const dateStr = date.toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            const timeOnlyStr = date.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            });
            timeStr = `${dateStr} ${timeOnlyStr}`;
          } else {
            // Format as duration (handle negative values for padding)
            const absMinutes = Math.abs(minutes);
            const hours = Math.floor(absMinutes / 60);
            const mins = Math.round(absMinutes % 60);
            const sign = minutes < 0 ? '-' : '';
            timeStr = hours > 0 ? `${sign}${hours}h ${mins}m` : `${sign}${mins}m`;
          }

          return `
            <div style="min-width: 180px;">
              <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">
                ${timeStr}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280;">Pressure:</span>
                <span style="font-weight: 600; color: #3b82f6; margin-left: 16px;">
                  ${pressure.toFixed(2)} ${pressureUnit}
                </span>
              </div>
            </div>
          `;
        },
      },

      // Legend (disabled to avoid series name mismatch errors)
      legend: {
        show: false,
      },

      // Grid configuration for chart positioning
      grid: {
        left: '12%',
        right: '8%',
        bottom: '18%',
        top: '22%',
        containLabel: false,
      },

      // X-axis configuration with tick marks
      xAxis: {
        type: 'value', // Value-based for full interval control
        name: useTimeBased ? 'Дата и время' : 'Время',
        nameLocation: 'middle',
        nameGap: 25,
        nameTextStyle: {
          fontSize: 11,
          color: '#4b5563',
        },
        min: useTimeBased ? -paddingHours * 60 : zoomedTimeWindow.min,
        max: useTimeBased
          ? (endTime - startTime) / (60 * 1000) + paddingHours * 60 // Total range with padding
          : zoomedTimeWindow.max,
        interval: xAxisInterval,
        minInterval: xAxisInterval,
        maxInterval: xAxisInterval,
        axisLabel: {
          formatter: (value: number) => {
            if (useTimeBased) {
              // Convert minutes offset to actual date/time
              const timestamp = startTime + value * 60 * 1000;
              const date = new Date(timestamp);
              const dateStr = date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
              });
              const timeStr = date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return `${dateStr}\n${timeStr}`;
            } else {
              // Show duration format
              if (value === 0) return '0';
              const hours = Math.floor(value / 60);
              const mins = Math.round(value % 60);
              if (hours === 0) return `${mins}m`;
              if (mins === 0) return `${hours}h`;
              return `${hours}h ${mins}m`;
            }
          },
          fontSize: useTimeBased ? 9 : 10,
          rotate: 0,
          color: '#6b7280',
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#d1d5db',
            width: 1.5,
          },
        },
        // Major tick marks
        axisTick: {
          show: true,
          alignWithLabel: true,
          length: 6,
          lineStyle: {
            color: '#d1d5db',
            width: 1.5,
          },
        },
        // Minor tick marks between labels - CRITICAL
        minorTick: {
          show: true,
          splitNumber: 2, // 2 minor ticks between major ticks
          length: 4,
          lineStyle: {
            color: '#e5e7eb',
            width: 1,
          },
        },
        // Major grid lines
        splitLine: {
          show: true,
          lineStyle: {
            type: 'solid',
            color: '#f0f0f0',
            width: 1,
          },
        },
        // Minor grid lines
        minorSplitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: '#f9fafb',
            width: 0.5,
          },
        },
      },

      // Y-axis configuration with tick marks
      yAxis: {
        type: 'value',
        name: `Давление, ${pressureUnit}`,
        nameLocation: 'middle',
        nameGap: 35,
        nameTextStyle: {
          fontSize: 11,
          color: '#4b5563',
        },
        position: 'left', // Explicitly position at left edge
        min: 0,
        max: Math.ceil((maxPressure * 1.1) / 5) * 5, // Round up to nearest 5
        interval: 5, // Show grid lines every 5 units
        axisLabel: {
          formatter: '{value}',
          fontSize: 10,
          color: '#6b7280',
        },
        axisLine: {
          show: true,
          onZero: false, // CRITICAL: Don't align to X-axis zero, align to chart left edge
          lineStyle: {
            color: '#d1d5db',
            width: 1.5,
          },
        },
        // Major tick marks
        axisTick: {
          show: true,
          alignWithLabel: true,
          length: 5,
          lineStyle: {
            color: '#d1d5db',
            width: 1.5,
          },
        },
        // Minor tick marks on Y-axis
        minorTick: {
          show: true,
          splitNumber: 5,
          length: 3,
          lineStyle: {
            color: '#e5e7eb',
            width: 1,
          },
        },
        // Major grid lines
        splitLine: {
          show: true,
          lineStyle: {
            type: 'solid',
            color: '#f0f0f0',
            width: 1,
          },
        },
        // Minor grid lines
        minorSplitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: '#f9fafb',
            width: 0.5,
          },
        },
      },

      // Data series configuration
      series: [
        {
          name: 'Pressure Profile',
          type: 'line',
          data: profileData.dataPoints,
          smooth: enableDrift, // Smooth for realistic drift, sharp for idealized
          // Enable LTTB (Largest-Triangle-Three-Buckets) downsampling for high-frequency data
          // This provides excellent visual quality while maintaining performance
          sampling: enableDrift ? 'lttb' : undefined,
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false, // Hide symbols by default (too many with drift)
          lineStyle: {
            width: enableDrift ? 1.5 : 2, // Thinner line for high-frequency data
            color: '#3b82f6',
          },
          itemStyle: {
            color: '#3b82f6',
          },
          // Area fill with gradient
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
              ],
            },
          },
          // Emphasis (hover) state
          emphasis: {
            focus: 'series',
            itemStyle: {
              borderColor: '#3b82f6',
              borderWidth: 2,
            },
            lineStyle: {
              width: 3,
            },
          },
          // Reference lines for working and max pressure
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              type: 'solid',
              width: 1,
            },
            label: {
              position: 'end',
              fontSize: 10,
            },
            data: [
              ...(showWorkingLine
                ? [
                    {
                      name: 'Working Pressure',
                      yAxis: workingPressure,
                      lineStyle: {
                        color: '#10b981',
                        type: 'dashed',
                        width: 1.5,
                      },
                      label: {
                        formatter: `Working: ${workingPressure} ${pressureUnit}`,
                        color: '#10b981',
                        fontWeight: 500,
                      },
                    },
                  ]
                : []),
              ...(showMaxLine
                ? [
                    {
                      name: 'Max Pressure',
                      yAxis: maxPressure,
                      lineStyle: {
                        color: '#ef4444',
                        type: 'dashed',
                        width: 1.5,
                      },
                      label: {
                        formatter: `Max: ${maxPressure} ${pressureUnit}`,
                        color: '#ef4444',
                        fontWeight: 500,
                      },
                    },
                  ]
                : []),
            ],
          },
        },
      ],

      // Animation configuration (optimized for performance)
      animation: true,
      animationDuration: 300,
      animationEasing: 'cubicOut',
    };

    // Apply Canvas-style configuration if enabled
    if (enableCanvasStyle) {
      return applyCanvasStyle(baseOption, canvasTheme);
    }

    return baseOption;
  }, [
    profileData,
    workingPressure,
    maxPressure,
    pressureUnit,
    useTimeBased,
    startTime,
    sanitizedDuration,
    paddingHours,
    xAxisInterval,
    enableDrift,
    showWorkingLine,
    showMaxLine,
    endTime,
    enableCanvasStyle,
    canvasTheme,
  ]);

  /**
   * Initialize chart and handle updates
   *
   * Effect manages chart lifecycle:
   * - Initializes chart on mount
   * - Updates chart when options change
   * - Sets up resize handler
   * - Cleans up on unmount
   */
  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart instance if not exists
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas', // Canvas renderer for better performance
        locale: 'RU', // Russian locale for consistency
      });
    }

    const chart = chartInstance.current;

    // Update chart with new options
    // notMerge: true ensures complete replacement for clean updates
    chart.setOption(chartOption, { notMerge: true });

    // Debounced resize handler (250ms delay)
    const handleResize = debounce(() => {
      chart?.resize();
    }, 250);

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      handleResize.cancel(); // Cancel pending debounced calls
      window.removeEventListener('resize', handleResize);
    };
  }, [chartOption]);

  /**
   * Cleanup on unmount
   *
   * Critical for memory management:
   * - Disposes chart instance to free memory
   * - Clears reference to allow garbage collection
   */
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  // Render chart with accessibility features
  return (
    <div className={`w-full ${className}`}>
      {/* Chart container with ARIA labels for accessibility */}
      <div
        ref={chartRef}
        role="img"
        aria-label={`Pressure test graph from ${useTimeBased ? new Date(startTime).toLocaleDateString('ru-RU') : '0'} showing pressure variations over ${sanitizedDuration} hours`}
        aria-describedby="pressure-chart-description"
        className="w-full"
        style={{ height: '400px', minHeight: '300px' }}
      />

      {/* Screen reader description */}
      <div id="pressure-chart-description" className="sr-only">
        Line chart displaying pressure measurements during a {sanitizedDuration}-hour test.
        Working pressure: {workingPressure} {pressureUnit}.
        Maximum pressure: {maxPressure} {pressureUnit}.
        {intermediateStages.length > 0 &&
          ` Includes ${intermediateStages.length} intermediate pressure stage${intermediateStages.length > 1 ? 's' : ''}.`}
      </div>

      {/* Parameters Summary */}
      <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Working Pressure:</span>
          <span className="font-medium">
            {workingPressure} {pressureUnit}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Max Pressure:</span>
          <span className="font-medium">
            {maxPressure} {pressureUnit}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Test Duration:</span>
          <span className="font-medium">{sanitizedDuration} hours</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Intermediate Stages:</span>
          <span className="font-medium">{intermediateStages?.length || 0}</span>
        </div>
      </div>
    </div>
  );
}
