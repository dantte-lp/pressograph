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
}: PressureTestPreviewProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);

  // Calculate pressure profile data points
  const profileData = useMemo(() => {
    const totalMinutes = testDuration * 60;
    const rampUpDuration = totalMinutes * 0.1; // 10% of total time for ramp up
    const depressurizeDuration = totalMinutes * 0.05; // 5% of total time for depressurization

    const dataPoints: [number, number][] = [];
    const timeLabels: string[] = [];

    // Helper to format time
    const formatTime = (minutes: number): string => {
      if (minutes === 0) return '0';
      if (minutes < 60) return `${Math.round(minutes)}m`;
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    // Start: 0 pressure at time 0
    dataPoints.push([0, 0]);
    timeLabels.push('0');

    // Ramp up to working pressure
    dataPoints.push([rampUpDuration, workingPressure]);
    timeLabels.push(formatTime(rampUpDuration));

    let currentTime = rampUpDuration;

    // Add intermediate stages
    if (intermediateStages && intermediateStages.length > 0) {
      intermediateStages.forEach((stage, index) => {
        // Transition to stage pressure
        const stageStartTime = Math.min(stage.time, totalMinutes - depressurizeDuration);
        if (stageStartTime > currentTime) {
          dataPoints.push([stageStartTime, stage.pressure]);
          timeLabels.push(formatTime(stageStartTime));
        }

        // Hold at stage pressure
        const stageEndTime = Math.min(stageStartTime + stage.duration, totalMinutes - depressurizeDuration);
        if (stageEndTime > stageStartTime) {
          dataPoints.push([stageEndTime, stage.pressure]);
          timeLabels.push(formatTime(stageEndTime));
        }

        currentTime = stageEndTime;
      });
    }

    // Hold at working pressure until near end
    const depressurizeStartTime = totalMinutes - depressurizeDuration;
    if (currentTime < depressurizeStartTime) {
      dataPoints.push([depressurizeStartTime, workingPressure]);
      timeLabels.push(formatTime(depressurizeStartTime));
    }

    // Depressurize to 0
    dataPoints.push([totalMinutes, 0]);
    timeLabels.push(formatTime(totalMinutes));

    return { dataPoints, timeLabels };
  }, [workingPressure, testDuration, intermediateStages]);

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

    // Configure chart options
    const option: ECOption = {
      title: {
        text: 'Pressure Test Profile Preview',
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
          const minutes = point.data[0];
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
        data: ['Pressure Profile', 'Working Pressure', 'Max Pressure'],
        top: 30,
        textStyle: {
          fontSize: 11,
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '20%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: 'Time',
        nameLocation: 'middle',
        nameGap: 25,
        nameTextStyle: {
          fontSize: 11,
        },
        axisLabel: {
          formatter: (value: number) => {
            if (value === 0) return '0';
            const hours = Math.floor(value / 60);
            const mins = Math.round(value % 60);
            if (hours === 0) return `${mins}m`;
            if (mins === 0) return `${hours}h`;
            return `${hours}h${mins}m`;
          },
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        name: `Pressure (${pressureUnit})`,
        nameLocation: 'middle',
        nameGap: 35,
        nameTextStyle: {
          fontSize: 11,
        },
        axisLabel: {
          formatter: '{value}',
          fontSize: 10,
        },
        max: Math.ceil(maxPressure * 1.1), // 10% above max pressure
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
  }, [workingPressure, maxPressure, testDuration, intermediateStages, pressureUnit, profileData]);

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
