'use client';

import { useMemo } from 'react';
import { EChartsWrapper } from '@/components/charts';
import type { PressureChartOption } from '@/lib/echarts-config';

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
  const option = useMemo<PressureChartOption>(() => {
    // Prepare data for chart
    const timestamps = measurements.map(m => m.timestamp.toLocaleTimeString());
    const pressureData = measurements.map(m => m.pressure);

    // V1 STYLING: Calculate Y-axis max (same as v1: Math.ceil(maxPressure * 1.1 / 5) * 5)
    const pressureMaxRaw = maxPressure * 1.1;
    const yAxisMax = Math.ceil(pressureMaxRaw / 5) * 5;

    return {
      title: {
        text: 'Real-Time Pressure Monitoring',
        left: 'center',
        textStyle: {
          fontSize: 20,
          fontWeight: 'bold',
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
        left: '10%',
        right: '5%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        boundaryGap: false,
        name: 'Time',
        nameLocation: 'middle',
        nameGap: 25,
        nameTextStyle: {
          fontSize: 14,
          fontWeight: 'bold',
        },
        axisLabel: {
          rotate: 45,
          fontSize: 11,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#d0d0d0',
            width: 1,
          },
        },
      },
      yAxis: {
        type: 'value',
        name: `Pressure, ${pressureUnit}`,
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: {
          fontSize: 14,
          fontWeight: 'normal',
        },
        axisLabel: {
          formatter: '{value}',
          fontSize: 12,
        },
        min: 0,
        max: yAxisMax,
        splitLine: {
          show: true,
          lineStyle: {
            color: '#f0f0f0',
            width: 1,
          },
        },
      },
      series: [
        {
          name: 'Measured Pressure',
          type: 'line',
          data: pressureData,
          smooth: false,
          lineStyle: {
            width: 2,
            color: '#0066cc', // V1 STYLING: Match v1 color
          },
          itemStyle: {
            color: '#0066cc',
          },
          areaStyle: {
            color: 'rgba(173, 216, 230, 0.3)', // V1 STYLING: Match v1 area fill
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
      <EChartsWrapper
        option={option}
        style={{ height: '400px' }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
}
