'use client';

/**
 * A4 Preview Graph Component
 *
 * Specialized component for rendering pressure test graphs in A4 format with
 * 30-minute interval tick marks on the X-axis. Optimized for printing.
 *
 * Critical Features:
 * - A4 portrait dimensions (210mm × 297mm)
 * - 30-minute intervals on X-axis (MANDATORY)
 * - High-resolution rendering
 * - Print-optimized styling
 * - Professional appearance for reports
 *
 * X-Axis Interval Configuration:
 * - Fixed 30-minute intervals (0.5 hours)
 * - Clear tick marks at each interval
 * - Time labels formatted appropriately
 * - Works for all test durations (1h, 24h, etc.)
 *
 * @module components/tests/a4-preview-graph
 */

import { useEffect, useRef, useMemo } from 'react';
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

// Register ECharts components
echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

type ECOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
>;

interface IntermediateStage {
  time: number;
  pressure: number;
  duration: number;
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
}

type ChartDataPoint = [number, number];

/**
 * A4PreviewGraph Component
 *
 * Renders pressure test graph with mandatory 30-minute X-axis intervals
 * in A4 portrait format for professional printing.
 */
export function A4PreviewGraph({
  workingPressure,
  maxPressure,
  testDuration,
  intermediateStages = [],
  pressureUnit = 'MPa',
  startDateTime,
  endDateTime,
}: A4PreviewGraphProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);

  // Sanitize duration
  const sanitizedDuration = useMemo(() => {
    return typeof testDuration === 'number' && testDuration > 0 ? testDuration : 24;
  }, [testDuration]);

  // Determine display mode
  const useTimeBased = useMemo(() => {
    return Boolean(startDateTime && endDateTime);
  }, [startDateTime, endDateTime]);

  // Calculate time bounds
  const startTime = useMemo(() => {
    return useTimeBased && startDateTime ? new Date(startDateTime).getTime() : 0;
  }, [useTimeBased, startDateTime]);

  /**
   * CRITICAL: 30-minute interval configuration
   * This is a mandatory requirement for professional reports
   */
  const INTERVAL_MINUTES = 30; // 30 minutes (0.5 hours)
  const xAxisInterval = INTERVAL_MINUTES;

  /**
   * Calculate pressure profile data points
   */
  const profileData = useMemo(() => {
    const totalMinutes = sanitizedDuration * 60;
    const rampUpDuration = 0.5;
    const depressurizeDuration = 0.5;

    const dataPoints: ChartDataPoint[] = [];

    // Helper: Convert minutes to X-axis value
    const minutesToX = (minutes: number): number => minutes;

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

    return dataPoints;
  }, [workingPressure, sanitizedDuration, intermediateStages]);

  /**
   * Generate chart configuration with 30-minute intervals
   */
  const chartOption = useMemo((): ECOption => {
    return {
      title: {
        text: 'График испытания давлением',
        subtext: `Интервалы: ${INTERVAL_MINUTES} минут | Формат: A4 (210×297 мм)`,
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 18,
          fontWeight: 700,
          color: '#1f2937',
        },
        subtextStyle: {
          fontSize: 12,
          color: '#6b7280',
        },
      },

      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#d1d5db',
        borderWidth: 2,
        padding: 16,
        textStyle: {
          color: '#1f2937',
          fontSize: 14,
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
        bottom: '20%',
        top: '25%',
        containLabel: false,
      },

      /**
       * X-AXIS CONFIGURATION WITH 30-MINUTE INTERVALS
       * This is the critical requirement for professional reports
       */
      xAxis: {
        type: 'value',
        name: useTimeBased ? 'Дата и время' : 'Время (часы)',
        nameLocation: 'middle',
        nameGap: 35,
        nameTextStyle: {
          fontSize: 13,
          fontWeight: 600,
          color: '#374151',
        },
        min: 0,
        max: sanitizedDuration * 60,
        // CRITICAL: Fixed 30-minute intervals
        interval: xAxisInterval,
        minInterval: xAxisInterval,
        maxInterval: xAxisInterval,
        axisLabel: {
          formatter: (value: number) => {
            if (useTimeBased) {
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
        },
        axisLine: {
          lineStyle: {
            color: '#9ca3af',
            width: 1.5,
          },
        },
        axisTick: {
          show: true,
          length: 8,
          lineStyle: {
            color: '#9ca3af',
            width: 1.5,
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: '#e5e7eb',
            width: 1,
          },
        },
      },

      yAxis: {
        type: 'value',
        name: `Давление (${pressureUnit})`,
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          fontSize: 13,
          fontWeight: 600,
          color: '#374151',
        },
        min: 0,
        max: Math.ceil((maxPressure * 1.2) / 5) * 5,
        interval: 5,
        axisLabel: {
          formatter: '{value}',
          fontSize: 11,
          fontWeight: 500,
          color: '#4b5563',
        },
        axisLine: {
          lineStyle: {
            color: '#9ca3af',
            width: 1.5,
          },
        },
        axisTick: {
          show: true,
          length: 6,
          lineStyle: {
            color: '#9ca3af',
            width: 1.5,
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'solid',
            color: '#e5e7eb',
            width: 1,
          },
        },
      },

      series: [
        {
          name: 'Профиль давления',
          type: 'line',
          data: profileData,
          smooth: false,
          symbol: 'circle',
          symbolSize: 5,
          showSymbol: true,
          lineStyle: {
            width: 3,
            color: '#3b82f6',
          },
          itemStyle: {
            color: '#3b82f6',
            borderWidth: 2,
            borderColor: '#ffffff',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.35)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
              ],
            },
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
            ],
          },
        },
      ],

      animation: false, // Disable animation for print
    };
  }, [
    profileData,
    workingPressure,
    maxPressure,
    pressureUnit,
    useTimeBased,
    startTime,
    sanitizedDuration,
    xAxisInterval,
  ]);

  /**
   * Initialize and update chart
   */
  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
        locale: 'RU',
      });
    }

    const chart = chartInstance.current;
    chart.setOption(chartOption, { notMerge: true });

    // Cleanup
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [chartOption]);

  return (
    <div className="w-full h-full p-8 print:p-6" style={{ minHeight: '297mm' }}>
      {/* Chart Container */}
      <div
        ref={chartRef}
        role="img"
        aria-label={`Pressure test graph with 30-minute intervals showing ${sanitizedDuration} hours test`}
        className="w-full"
        style={{ height: 'calc(297mm - 100px)', minHeight: '800px' }}
      />

      {/* Test Parameters Summary */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm border-t-2 pt-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground font-medium">Рабочее давление:</span>
            <span className="font-bold">
              {workingPressure} {pressureUnit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-medium">Макс. давление:</span>
            <span className="font-bold">
              {maxPressure} {pressureUnit}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground font-medium">Продолжительность:</span>
            <span className="font-bold">{sanitizedDuration} часов</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-medium">Промежуточные этапы:</span>
            <span className="font-bold">{intermediateStages?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* 30-minute interval notice */}
      <div className="mt-4 text-center text-xs text-muted-foreground italic">
        График с интервалами 30 минут для профессиональной документации
      </div>
    </div>
  );
}
