'use client';

/**
 * A4 Landscape Preview Graph Component
 *
 * Specialized component for rendering pressure test graphs in A4 landscape format
 * with tick marks on the X-axis. Optimized for printing.
 *
 * Critical Features:
 * - A4 landscape dimensions (297mm × 210mm)
 * - Tick marks on X-axis for professional appearance
 * - High-resolution rendering
 * - Print-optimized styling
 * - Professional appearance for reports
 *
 * X-Axis Interval Configuration:
 * - Dynamic intervals based on test duration
 * - Clear tick marks at each interval
 * - Time labels formatted appropriately
 * - Works for all test durations (1h, 24h, etc.)
 *
 * @module components/tests/a4-preview-graph
 */

import { useEffect, useRef, useMemo } from 'react';
import { useTheme } from 'next-themes';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  DataZoomComponent,
  ToolboxComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECharts, ComposeOption } from 'echarts/core';
import type { LineSeriesOption } from 'echarts/charts';
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  LegendComponentOption,
  DataZoomComponentOption,
  ToolboxComponentOption,
} from 'echarts/components';
import {
  generateRealisticTestData,
  convertToMinutes,
} from '@/lib/utils/pressure-drift-simulator';
import { applyCanvasStyle } from '@/lib/utils/echarts-canvas-style';

// Register ECharts components
echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  DataZoomComponent,
  ToolboxComponent,
  CanvasRenderer,
]);

type ECOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | DataZoomComponentOption
  | ToolboxComponentOption
>;

interface IntermediateStage {
  time: number;
  pressure: number;
  duration: number;
}

/**
 * Time scale zoom level for detailed viewing
 */
type TimeScale = 'auto' | '1x' | '2x' | '4x' | '10x';

/**
 * Custom time window for zoomed view (in minutes from test start)
 */
interface TimeWindow {
  /** Start time in minutes from test start */
  start: number;
  /** End time in minutes from test start */
  end: number;
}

interface A4PreviewGraphProps {
  workingPressure: number;
  maxPressure: number;
  testDuration: number;
  intermediateStages?: IntermediateStage[];
  pressureUnit?: 'MPa' | 'Bar' | 'PSI';
  temperatureUnit?: 'C' | 'F';
  startDateTime?: string;
  endDateTime?: string;
  paddingHours?: number;
  showWorkingLine?: boolean;
  showMaxLine?: boolean;
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

type ChartDataPoint = [number, number];

/**
 * A4PreviewGraph Component
 *
 * Renders pressure test graph with tick marks on X-axis
 * in A4 landscape format for professional printing.
 */
export function A4PreviewGraph({
  workingPressure,
  maxPressure,
  testDuration,
  intermediateStages = [],
  pressureUnit = 'MPa',
  startDateTime,
  endDateTime,
  paddingHours = 0,
  showWorkingLine = true,
  showMaxLine = true,
  enableDrift = false,
  enableCanvasStyle = false,
  canvasTheme = 'light',
}: A4PreviewGraphProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);

  // Theme for ECharts initialization (built-in dark theme support)
  const { theme } = useTheme();

  // Sanitize duration
  const sanitizedDuration = useMemo(() => {
    return typeof testDuration === 'number' && testDuration > 0 ? testDuration : 24;
  }, [testDuration]);

  // Determine display mode
  const useTimeBased = useMemo(() => {
    return Boolean(startDateTime && endDateTime);
  }, [startDateTime, endDateTime]);

  // Calculate time bounds (ACTUAL test times, not padded)
  const startTime = useMemo(() => {
    return useTimeBased && startDateTime ? new Date(startDateTime).getTime() : 0;
  }, [useTimeBased, startDateTime]);

  // Calculate end time for time-based display
  const endTime = useMemo(() => {
    return useTimeBased && endDateTime ? new Date(endDateTime).getTime() : 0;
  }, [useTimeBased, endDateTime]);

  /**
   * Dynamic interval configuration
   * Calculates optimal interval based on test duration
   */
  const calculateOptimalInterval = (durationHours: number): number => {
    // Target 10-15 tick marks on the axis
    const targetTicks = 12;
    const commonIntervals = [5, 10, 15, 30, 60, 120, 180, 240, 360, 720, 1440]; // minutes

    let bestInterval = commonIntervals[0];
    let bestDiff = Infinity;

    for (const interval of commonIntervals) {
      const tickCount = (durationHours * 60) / interval;
      const diff = Math.abs(tickCount - targetTicks);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestInterval = interval;
      }
    }

    return bestInterval;
  };

  const xAxisInterval = calculateOptimalInterval(sanitizedDuration);

  /**
   * Calculate pressure profile data points with optional drift simulation
   */
  const profileData = useMemo(() => {
    const totalMinutes = sanitizedDuration * 60;
    const rampUpDuration = 0.5;
    const depressurizeDuration = 0.5;

    let dataPoints: ChartDataPoint[] = [];

    // Helper: Convert minutes to X-axis value
    const minutesToX = (minutes: number): number => minutes;

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
    } else {
      // Original simplified logic (no drift)
      // Start: 0 pressure at time 0
      dataPoints.push([minutesToX(0), 0]);

      // Ramp up to working pressure (30 seconds)
      dataPoints.push([minutesToX(rampUpDuration), workingPressure]);

      let currentTime = rampUpDuration;

      // Add intermediate stages
      if (intermediateStages && intermediateStages.length > 0) {
        intermediateStages.forEach((stage) => {
          currentTime += stage.time;
          const stageStartMinutes = currentTime;

          // Ramp up to stage pressure
          dataPoints.push([minutesToX(stageStartMinutes), stage.pressure]);

          // Hold at stage pressure
          const stageEndMinutes = stageStartMinutes + stage.duration;
          if (stageEndMinutes < totalMinutes - depressurizeDuration) {
            dataPoints.push([minutesToX(stageEndMinutes), stage.pressure]);

            // Drop back to working pressure
            dataPoints.push([minutesToX(stageEndMinutes + 0.5), workingPressure]);
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
      }

      // Depressurize to 0
      dataPoints.push([minutesToX(totalMinutes), 0]);
    }

    return dataPoints;
  }, [workingPressure, sanitizedDuration, intermediateStages, enableDrift]);

  /**
   * Generate chart configuration with 30-minute intervals
   * Optionally applies Canvas-style configuration for v1.0 visual compatibility.
   */
  const chartOption = useMemo((): ECOption => {
    const baseOption = {
      title: {
        text: 'График испытания давлением',
        subtext: `Интервалы: ${xAxisInterval} минут | Формат: A4 Landscape (297×210 мм)`,
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 18,
          fontWeight: 700,
          color: '#1f2937',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        subtextStyle: {
          fontSize: 12,
          color: '#6b7280',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
      },

      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#d1d5db',
        borderWidth: 2,
        padding: 16,
        textStyle: {
          color: '#1f2937',
          fontSize: 14,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        formatter: (params: any) => {
          const point = params[0];
          const minutes = point.data[0];
          const pressure = point.data[1];

          let timeStr: string;

          if (useTimeBased) {
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
            const hours = Math.floor(minutes / 60);
            const mins = Math.round(minutes % 60);
            timeStr = hours > 0 ? `${hours}ч ${mins}мин` : `${mins}мин`;
          }

          return `
            <div style="min-width: 200px;">
              <div style="font-weight: 700; margin-bottom: 10px; color: #1f2937; font-size: 15px;">
                ${timeStr}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280;">Давление:</span>
                <span style="font-weight: 700; color: #3b82f6; margin-left: 20px; font-size: 16px;">
                  ${pressure.toFixed(2)} ${pressureUnit}
                </span>
              </div>
            </div>
          `;
        },
      },

      legend: {
        show: false,
      },

      grid: {
        left: '15%',
        right: '10%',
        bottom: '25%', // Increased to make room for X-axis + spacing + slider
        top: '25%',
        containLabel: true, // Changed to true to include axis labels in grid
      },

      /**
       * X-AXIS CONFIGURATION WITH TICK MARKS
       * Professional appearance with major and minor tick marks
       *
       * CRITICAL FIX FOR ISSUES 7.1, 7.2, 7.3:
       * - Axis range includes padding (shows empty space before/after test)
       * - Data points start at paddingHours offset (actual test start time)
       * - Y-axis is positioned at the LEFT edge (axis min), not at time 0
       */
      xAxis: {
        type: 'value' as const,
        name: useTimeBased ? 'Дата и время' : 'Время (часы)',
        nameLocation: 'middle' as const,
        nameGap: 35,
        nameTextStyle: {
          fontSize: 13,
          fontWeight: 600,
          color: '#374151',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        // Axis range: From padded start to padded end
        // This creates empty space before/after the actual test data
        min: useTimeBased ? -paddingHours * 60 : 0,
        max: useTimeBased
          ? (endTime - startTime) / (60 * 1000) + paddingHours * 60 // Total range with padding
          : sanitizedDuration * 60,
        // Major tick intervals (with labels)
        interval: xAxisInterval,
        minInterval: xAxisInterval,
        maxInterval: xAxisInterval,
        axisLabel: {
          formatter: (value: number) => {
            if (useTimeBased) {
              // Convert minutes offset to actual timestamp
              // Note: value can be negative (before test start) due to padding
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
              // Show time in hours:minutes format
              const hours = Math.floor(value / 60);
              const mins = value % 60;

              if (value === 0) return '0:00';
              if (mins === 0) return `${hours}:00`;
              return `${hours}:${mins.toString().padStart(2, '0')}`;
            }
          },
          fontSize: useTimeBased ? 10 : 11,
          fontWeight: 500,
          color: '#4b5563',
          rotate: 0,
          margin: 12,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#9ca3af',
            width: 1.5,
          },
        },
        // Major tick marks (at labels)
        axisTick: {
          show: true,
          length: 8,
          lineStyle: {
            color: '#9ca3af',
            width: 1.5,
          },
        },
        // Minor tick marks (between labels) - CRITICAL FOR ISSUE #8
        minorTick: {
          show: true,
          splitNumber: 3, // 3 minor ticks between major ticks (divides interval into 4 parts)
          length: 5,
          lineStyle: {
            color: '#d1d5db',
            width: 1,
          },
        },
        // Grid lines at major points
        splitLine: {
          show: true,
          lineStyle: {
            type: 'solid' as const,
            color: '#e5e7eb',
            width: 1,
          },
        },
        // Minor grid lines (subtle)
        minorSplitLine: {
          show: true,
          lineStyle: {
            type: 'dashed' as const,
            color: '#f3f4f6',
            width: 0.5,
          },
        },
      },

      yAxis: {
        type: 'value' as const,
        name: `Давление (${pressureUnit})`,
        nameLocation: 'middle' as const,
        nameGap: 45,
        nameTextStyle: {
          fontSize: 13,
          fontWeight: 600,
          color: '#374151',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        position: 'left', // Explicitly position at left edge
        min: 0,
        max: Math.ceil((maxPressure * 1.2) / 5) * 5,
        interval: 5,
        axisLabel: {
          formatter: '{value}',
          fontSize: 11,
          fontWeight: 500,
          color: '#4b5563',
          margin: 8,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        axisLine: {
          show: true,
          onZero: false, // CRITICAL: Don't align to X-axis zero, align to chart left edge
          lineStyle: {
            color: '#9ca3af',
            width: 1.5,
          },
        },
        // Major tick marks
        axisTick: {
          show: true,
          length: 6,
          lineStyle: {
            color: '#9ca3af',
            width: 1.5,
          },
        },
        // Minor tick marks on Y-axis
        minorTick: {
          show: true,
          splitNumber: 5, // 5 minor ticks between major ticks
          length: 4,
          lineStyle: {
            color: '#d1d5db',
            width: 1,
          },
        },
        // Grid lines at major points
        splitLine: {
          show: true,
          lineStyle: {
            type: 'solid' as const,
            color: '#e5e7eb',
            width: 1,
          },
        },
        // Minor grid lines
        minorSplitLine: {
          show: true,
          lineStyle: {
            type: 'dashed' as const,
            color: '#f3f4f6',
            width: 0.5,
          },
        },
      },

      // Interactive DataZoom configuration
      dataZoom: [
        // Slider at bottom
        {
          type: 'slider',
          xAxisIndex: 0,
          filterMode: 'none',
          start: 0,
          end: 100,
          handleSize: 8,
          height: 25,
          bottom: 10, // Changed to 10 - now correctly at bottom with spacing
          // Let ECharts built-in theme handle colors for consistency
          borderRadius: 4,
        },
        // Inside zoom (mouse wheel + drag)
        {
          type: 'inside',
          xAxisIndex: 0,
          filterMode: 'none',
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: false,
        },
      ],

      // Toolbox with zoom controls (saveAsImage removed - use dedicated export dialog)
      toolbox: {
        show: true,
        feature: {
          dataZoom: {
            title: {
              zoom: 'Zoom area',
              back: 'Reset zoom',
            },
          },
          restore: {
            title: 'Restore',
          },
        },
        right: 20,
        top: 20,
      },

      series: [
        {
          name: 'Профиль давления',
          type: 'line' as const,
          data: profileData,
          smooth: enableDrift, // Smooth for realistic drift, sharp for idealized
          // Enable LTTB downsampling for high-frequency data
          sampling: enableDrift ? 'lttb' : undefined,
          symbol: 'circle',
          symbolSize: 5,
          showSymbol: !enableDrift, // Hide symbols for high-frequency data
          lineStyle: {
            width: enableDrift ? 2 : 3, // Thinner line for high-frequency data
            color: '#3b82f6',
          },
          itemStyle: {
            color: '#3b82f6',
            borderWidth: 2,
            borderColor: '#ffffff',
          },
          // Area fill with solid color (no gradient)
          areaStyle: {
            color: 'rgba(59, 130, 246, 0.15)', // Solid semi-transparent blue
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              type: 'solid',
              width: 2,
            },
            label: {
              position: 'end',
              fontSize: 11,
              fontWeight: 600,
            },
            data: [
              ...(showWorkingLine
                ? [
                    {
                      name: 'Рабочее давление',
                      yAxis: workingPressure,
                      lineStyle: {
                        color: '#10b981',
                        type: 'dashed',
                        width: 2,
                      },
                      label: {
                        formatter: `Рабочее: ${workingPressure} ${pressureUnit}`,
                        color: '#10b981',
                      },
                    },
                  ]
                : []),
              ...(showMaxLine
                ? [
                    {
                      name: 'Максимальное давление',
                      yAxis: maxPressure,
                      lineStyle: {
                        color: '#ef4444',
                        type: 'dashed',
                        width: 2,
                      },
                      label: {
                        formatter: `Макс: ${maxPressure} ${pressureUnit}`,
                        color: '#ef4444',
                      },
                    },
                  ]
                : []),
            ],
          },
        },
      ],

      animation: false, // Disable animation for print
    };

    // Apply Canvas-style configuration if enabled
    if (enableCanvasStyle) {
      return applyCanvasStyle(baseOption, canvasTheme) as ECOption;
    }

    return baseOption as ECOption;
  }, [
    profileData,
    workingPressure,
    maxPressure,
    pressureUnit,
    useTimeBased,
    startTime,
    endTime,
    sanitizedDuration,
    xAxisInterval,
    paddingHours,
    enableDrift,
    showWorkingLine,
    showMaxLine,
    enableCanvasStyle,
    canvasTheme,
    // Note: isDark removed - ECharts theme handles color automatically
  ]);

  /**
   * Initialize and update chart with theme support
   * Re-initializes when theme changes (required for ECharts theme switching)
   */
  useEffect(() => {
    if (!chartRef.current) return;

    // Dispose existing instance if it exists (for theme switching)
    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }

    // Initialize with ECharts built-in theme
    chartInstance.current = echarts.init(
      chartRef.current,
      theme === 'dark' ? 'dark' : undefined,
      {
        renderer: 'canvas',
        locale: 'RU',
      }
    );

    const chart = chartInstance.current;
    chart.setOption(chartOption, { notMerge: true });

    // Setup automatic time scale adaptation based on zoom level
    // Listen to dataZoom changes and adjust axis formatting dynamically
    if (useTimeBased) {
      chart.on('dataZoom', (_params: any) => {
        // Get current zoom range from dataZoom state
        const option = chart.getOption() as any;
        const dataZoom = option.dataZoom?.[0];
        if (!dataZoom) return;

        const start = dataZoom.start || 0;
        const end = dataZoom.end || 100;

        // Calculate visible time range in hours
        const totalMinutes = (endTime - startTime) / (60 * 1000);
        const visibleMinutes = ((end - start) / 100) * totalMinutes;
        const visibleHours = visibleMinutes / 60;

        // Determine appropriate interval and formatter based on zoom level
        let newInterval: number;
        let newFormatter: (value: number) => string;
        let minorSplitNumber: number;

        if (visibleHours > 48) {
          // Wide view: Daily marks
          newInterval = 24 * 60; // 24 hours
          minorSplitNumber = 4; // 6h minor ticks
          newFormatter = (value: number) => {
            const timestamp = startTime + value * 60 * 1000;
            const date = new Date(timestamp);
            return date.toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: 'short',
            });
          };
        } else if (visibleHours > 6) {
          // Medium view: Hourly marks
          newInterval = 60; // 1 hour
          minorSplitNumber = 6; // 10min minor ticks
          newFormatter = (value: number) => {
            const timestamp = startTime + value * 60 * 1000;
            const date = new Date(timestamp);
            return date.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            });
          };
        } else {
          // Close view: 15-30 minute marks
          newInterval = visibleHours > 3 ? 30 : 15; // 30min or 15min
          minorSplitNumber = 3; // 5min or 10min minor ticks
          newFormatter = (value: number) => {
            const timestamp = startTime + value * 60 * 1000;
            const date = new Date(timestamp);
            return date.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            });
          };
        }

        // Update chart with new axis configuration
        chart.setOption({
          xAxis: {
            interval: newInterval,
            minInterval: newInterval,
            maxInterval: newInterval,
            minorTick: {
              show: true,
              splitNumber: minorSplitNumber,
            },
            axisLabel: {
              formatter: newFormatter,
              fontSize: visibleHours > 48 ? 11 : 10,
            },
          },
        });
      });
    }

    // Cleanup
    return () => {
      if (chartInstance.current) {
        if (useTimeBased) {
          chartInstance.current.off('dataZoom');
        }
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [chartOption, theme, useTimeBased, startTime, endTime]); // Re-run when theme changes

  return (
    <div className="w-full h-full p-8 print:p-6" style={{ minHeight: '210mm' }}>
      {/* Chart Container - ONLY THE GRAPH, NO TEXT SUMMARY */}
      <div
        ref={chartRef}
        role="img"
        aria-label={`Pressure test graph showing ${sanitizedDuration} hours test in landscape format`}
        className="w-full"
        style={{ height: '100%', minHeight: '600px' }}
      />
    </div>
  );
}
