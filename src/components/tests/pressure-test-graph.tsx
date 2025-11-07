'use client';

import { useMemo } from 'react';
import EChartsReact from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface Measurement {
  timestamp: Date;
  pressure: number;
  temperature?: number;
}

interface PressureTestGraphProps {
  measurements: Measurement[];
  targetPressure: number;
  maxPressure: number;
  pressureUnit: string;
}

export function PressureTestGraph({
  measurements,
  targetPressure,
  maxPressure,
  pressureUnit,
}: PressureTestGraphProps) {
  const option = useMemo<EChartsOption>(() => {
    // Prepare data for chart
    const timestamps = measurements.map(m => m.timestamp.toLocaleTimeString());
    const pressureData = measurements.map(m => m.pressure);

    return {
      title: {
        text: 'Real-Time Pressure Monitoring',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: (params: any) => {
          const dataPoint = params[0];
          return `
            <div style="padding: 4px;">
              <strong>${dataPoint.name}</strong><br/>
              Pressure: ${dataPoint.value} ${pressureUnit}
            </div>
          `;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        boundaryGap: false,
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: `Pressure (${pressureUnit})`,
        axisLabel: {
          formatter: '{value}',
        },
        min: 0,
        max: maxPressure * 1.1, // 10% above max for better visualization
      },
      series: [
        {
          name: 'Measured Pressure',
          type: 'line',
          data: pressureData,
          smooth: true,
          lineStyle: {
            width: 2,
            color: '#3b82f6',
          },
          itemStyle: {
            color: '#3b82f6',
          },
          areaStyle: {
            opacity: 0.2,
            color: '#3b82f6',
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              type: 'dashed',
            },
            data: [
              {
                name: 'Working Pressure',
                yAxis: targetPressure,
                label: {
                  formatter: 'Working: {c}',
                  position: 'insideEndTop',
                },
                lineStyle: {
                  color: '#22c55e',
                  width: 2,
                },
              },
              {
                name: 'Max Pressure',
                yAxis: maxPressure,
                label: {
                  formatter: 'Max: {c}',
                  position: 'insideEndTop',
                },
                lineStyle: {
                  color: '#ef4444',
                  width: 2,
                },
              },
            ],
          },
        },
      ],
    };
  }, [measurements, targetPressure, maxPressure, pressureUnit]);

  if (measurements.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg border border-dashed">
        <p className="text-muted-foreground">
          No measurements recorded yet. Start recording to see the graph.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <EChartsReact
        option={option}
        style={{ height: '400px' }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
}
