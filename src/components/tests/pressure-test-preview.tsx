'use client';

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
  time: number; // minutes
  pressure: number;
  duration: number; // minutes
}

interface PressureTestPreviewProps {
  workingPressure: number;
  maxPressure: number;
  testDuration: number; // hours
  intermediateStages?: IntermediateStage[];
  pressureUnit?: 'MPa' | 'Bar' | 'PSI';
  className?: string;
  startDateTime?: string; // ISO 8601 format
  endDateTime?: string; // ISO 8601 format
}

/**
 * PressureTestPreview Component
 *
 * Displays a real-time graph preview of the pressure test profile using ECharts.
 * Shows pressure over time with intermediate stages and reference lines.
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
}: PressureTestPreviewProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);

  // Determine if we're using time-based axis
  const useTimeBased = Boolean(startDateTime && endDateTime);
  const startTime = useTimeBased ? new Date(startDateTime!).getTime() : 0;
  const endTime = useTimeBased ? new Date(endDateTime!).getTime() : testDuration * 60;

  // Calculate optimal X-axis interval based on test duration
  const calculateXAxisInterval = (durationHours: number): number => {
    if (durationHours <= 6) {
      return 1 * 60; // 1 hour intervals for short tests
    } else if (durationHours <= 24) {
      return 2 * 60; // 2 hour intervals for daily tests
    } else if (durationHours <= 72) {
      return 4 * 60; // 4 hour intervals for 1-3 day tests
    } else {
      return 6 * 60; // 6 hour intervals for extended tests
    }
  };

  // Calculate pressure profile data points
  const profileData = useMemo(() => {
    const totalMinutes = testDuration * 60;
    const rampUpDuration = 0.5; // 30 seconds to ramp up (matching v1)
    const depressurizeDuration = 0.5; // 30 seconds to depressurize (matching v1)

    const dataPoints: [number, number][] = [];
    const timeLabels: string[] = [];

    // Helper to convert minutes to X value (timestamp or minutes)
    const minutesToX = (minutes: number): number => {
      if (useTimeBased) {
        return startTime + minutes * 60 * 1000;
      }
      return minutes;
    };

    // Helper to format time
    const formatTime = (minutes: number): string => {
      if (minutes === 0) return '0';
      if (minutes < 60) return `${Math.round(minutes)}m`;
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    // Start: 0 pressure at time 0
    dataPoints.push([minutesToX(0), 0]);
    timeLabels.push('0');

    // Ramp up to working pressure (30 seconds)
    dataPoints.push([minutesToX(rampUpDuration), workingPressure]);
    timeLabels.push(formatTime(rampUpDuration));

    let currentTime = rampUpDuration;

    // Add intermediate stages (stage.time is ABSOLUTE hours from test start, matching v1)
    if (intermediateStages && intermediateStages.length > 0) {
      // Sort by time to ensure correct order
      const sortedStages = [...intermediateStages].sort((a, b) => a.time - b.time);

      sortedStages.forEach((stage) => {
        // stage.time is in HOURS from test start (matching v1 logic)
        const stageStartMinutes = stage.time * 60;

        // If there's a gap, drop to working pressure first
        if (stageStartMinutes > currentTime + 0.5) {
          dataPoints.push([minutesToX(stageStartMinutes - 0.5), workingPressure]);
          timeLabels.push(formatTime(stageStartMinutes - 0.5));
        }

        // Ramp up to stage pressure (30 seconds)
        dataPoints.push([minutesToX(stageStartMinutes), stage.pressure]);
        timeLabels.push(formatTime(stageStartMinutes));

        // Hold at stage pressure for specified duration (minutes)
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

    return { dataPoints, timeLabels };
  }, [workingPressure, testDuration, intermediateStages, useTimeBased, startTime]);

  // Initialize and update chart
  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart if not exists
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, {
        renderer: 'canvas',
      });
    }

    const chart = chartInstance.current;

    // Configure chart options (Russian labels matching export)
    const option: ECOption = {
      title: {
        text: 'Предварительный просмотр испытания',
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const point = params[0];
          let minutes: number;

          // Handle both time-based and value-based axes
          if (useTimeBased) {
            const timestamp = point.data[0];
            minutes = (timestamp - startTime) / (60 * 1000);
          } else {
            minutes = point.data[0];
          }

          const pressure = point.data[1];

          const hours = Math.floor(minutes / 60);
          const mins = Math.round(minutes % 60);
          const timeStr = hours > 0
            ? `${hours}h ${mins}m`
            : `${mins}m`;

          return `
            <div style="padding: 4px;">
              <strong>Time:</strong> ${timeStr}<br/>
              <strong>Pressure:</strong> ${pressure.toFixed(2)} ${pressureUnit}
            </div>
          `;
        },
      },
      legend: {
        show: false, // Disabled to avoid series name mismatch errors
      },
      grid: {
        left: '12%',
        right: '8%',
        bottom: '18%',
        top: '22%',
      },
      xAxis: useTimeBased ? {
        type: 'time',
        name: 'Дата и время',
        nameLocation: 'middle',
        nameGap: 25,
        nameTextStyle: {
          fontSize: 11,
        },
        min: startTime,
        max: endTime,
        axisLabel: {
          formatter: (value: number) => {
            const date = new Date(value);
            const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
            const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            return `${dateStr}\n${timeStr}`;
          },
          fontSize: 9,
          rotate: 0,
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: '#f0f0f0',
          },
        },
        // Major ticks every 2 hours
        interval: 2 * 60 * 60 * 1000,
        minorTick: {
          show: true,
          splitNumber: 4, // Creates minor ticks (every 30 minutes for 2-hour intervals)
        },
        minorSplitLine: {
          show: true,
          lineStyle: {
            type: 'dotted',
            color: '#f5f5f5',
          },
        },
      } : {
        type: 'value',
        name: 'Время',
        nameLocation: 'middle',
        nameGap: 25,
        nameTextStyle: {
          fontSize: 11,
        },
        min: 0,
        max: testDuration * 60, // Explicit max based on test duration in minutes
        interval: calculateXAxisInterval(testDuration), // Dynamic interval based on duration
        minInterval: 30, // Minimum 30 minutes
        axisLabel: {
          formatter: (value: number) => {
            if (value === 0) return '0';
            const hours = Math.floor(value / 60);
            const mins = Math.round(value % 60);
            if (hours === 0) return `${mins}m`;
            if (mins === 0) return `${hours}h`;
            return `${hours}h ${mins}m`;
          },
          fontSize: 10,
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: '#f0f0f0',
          },
        },
      },
      yAxis: {
        type: 'value',
        name: `Давление, ${pressureUnit}`,
        nameLocation: 'middle',
        nameGap: 35,
        nameTextStyle: {
          fontSize: 11,
        },
        min: 0,
        max: Math.ceil(maxPressure * 1.1 / 5) * 5, // Round up to nearest 5 MPa
        interval: 5, // Show grid lines every 5 MPa
        axisLabel: {
          formatter: '{value}',
          fontSize: 10,
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'solid',
            color: '#f0f0f0',
          },
        },
      },
      series: [
        {
          name: 'Pressure Profile',
          type: 'line',
          data: profileData.dataPoints,
          smooth: false,
          lineStyle: {
            width: 2,
            color: '#3b82f6',
          },
          itemStyle: {
            color: '#3b82f6',
          },
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
              {
                name: 'Working Pressure',
                yAxis: workingPressure,
                lineStyle: {
                  color: '#10b981',
                  type: 'dashed',
                },
                label: {
                  formatter: `Working: ${workingPressure} ${pressureUnit}`,
                  color: '#10b981',
                },
              },
              {
                name: 'Max Pressure',
                yAxis: maxPressure,
                lineStyle: {
                  color: '#ef4444',
                  type: 'dashed',
                },
                label: {
                  formatter: `Max: ${maxPressure} ${pressureUnit}`,
                  color: '#ef4444',
                },
              },
            ],
          },
        },
      ],
    };

    chart.setOption(option, { notMerge: true });

    // Handle resize
    const handleResize = () => {
      chart?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [workingPressure, maxPressure, testDuration, intermediateStages, pressureUnit, profileData, useTimeBased, startTime, endTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={chartRef}
        className="w-full"
        style={{ height: '400px', minHeight: '300px' }}
      />
      {/* Parameters Summary */}
      <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Working Pressure:</span>
          <span className="font-medium">{workingPressure} {pressureUnit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Max Pressure:</span>
          <span className="font-medium">{maxPressure} {pressureUnit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Test Duration:</span>
          <span className="font-medium">{testDuration} hours</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Intermediate Stages:</span>
          <span className="font-medium">{intermediateStages?.length || 0}</span>
        </div>
      </div>
    </div>
  );
}
