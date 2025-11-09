'use client';

/**
 * Pressure Graph Component
 *
 * Interactive pressure test visualization using ECharts
 * Features:
 * - Real-time data plotting (pressure vs time)
 * - Multi-stage test visualization
 * - Threshold lines (working pressure, max pressure)
 * - Responsive design
 * - Dark/light theme support
 * - Touch-friendly tooltips
 * - Export-ready (SVG)
 */

import { useMemo } from 'react';
import { ThemedChart, useChartColors } from '@/components/charts';
import type { PressureChartOption } from '@/lib/echarts-config';
import { type PressureTestConfig } from '@/lib/db/schema/pressure-tests';

/**
 * Measurement data structure for graph visualization
 */
export interface GraphMeasurementData {
  measurements: Array<{
    timestamp: number; // epoch ms
    pressure: number; // MPa
    temperature?: number; // °C
  }>;
  // Optional calculated metrics
  finalPressure?: number;
  pressureDrop?: number;
  averagePressure?: number;
  passed?: boolean;
}

interface PressureGraphProps {
  /** Test configuration (defines parameters and stages) */
  config: PressureTestConfig;

  /** Measurement data for visualization */
  results?: GraphMeasurementData;

  /** Height of the graph container (default: 400px) */
  height?: number;

  /** Show temperature line (default: true) */
  showTemperature?: boolean;

  /** Show threshold lines (working/max pressure) (default: true) */
  showThresholds?: boolean;

  /** Enable animation (default: true) */
  animate?: boolean;
}

/**
 * Format timestamp to HH:MM:SS
 */
function formatTime(timestamp: number, startTime: number): string {
  const seconds = Math.floor((timestamp - startTime) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function PressureGraph({
  config,
  results,
  height = 400,
  showTemperature = true,
  showThresholds = true,
  animate = true,
}: PressureGraphProps) {
  const colors = useChartColors();

  // Transform measurement data for ECharts
  const chartData = useMemo(() => {
    if (!results?.measurements || results.measurements.length === 0) {
      // Generate ideal curve from config for preview
      const duration = config.testDuration * 60; // convert hours to minutes
      const points: any[] = [];
      const startTime = Date.now();

      // Initial ramp-up (0-15 minutes to working pressure)
      for (let i = 0; i <= 15; i++) {
        points.push({
          time: formatTime(startTime + i * 60 * 1000, startTime),
          pressure: (config.workingPressure / 15) * i,
          temperature: config.temperature,
          timestamp: startTime + i * 60 * 1000,
        });
      }

      // Add intermediate stages
      config.intermediateStages.forEach((stage) => {
        points.push({
          time: formatTime(startTime + stage.time * 60 * 1000, startTime),
          pressure: stage.pressure,
          temperature: config.temperature,
          timestamp: startTime + stage.time * 60 * 1000,
        });
      });

      // Hold at working pressure until end
      points.push({
        time: formatTime(startTime + duration * 60 * 1000, startTime),
        pressure: config.workingPressure,
        temperature: config.temperature,
        timestamp: startTime + duration * 60 * 1000,
      });

      return points;
    }

    // Use actual measurement data
    const startTime = results.measurements[0].timestamp;
    return results.measurements.map((m) => ({
      time: formatTime(m.timestamp, startTime),
      pressure: m.pressure,
      temperature: m.temperature,
      timestamp: m.timestamp,
    }));
  }, [config, results]);

  // Determine Y-axis domain (pressure)
  const pressureDomain = useMemo(() => {
    const max = Math.max(config.maxPressure, config.workingPressure) * 1.1;
    return [0, Math.ceil(max * 10) / 10]; // Round up to nearest 0.1
  }, [config]);

  // Determine Y-axis domain (temperature)
  const temperatureDomain = useMemo(() => {
    const target = config.temperature;
    return [target - 10, target + 10];
  }, [config]);

  // Build ECharts option
  const option: PressureChartOption = useMemo(() => {
    const series: any[] = [];
    const yAxis: any[] = [];
    const markLines: any[] = [];

    // Pressure Y-axis (left)
    yAxis.push({
      type: 'value',
      name: `Pressure (${config.pressureUnit})`,
      position: 'left',
      min: pressureDomain[0],
      max: pressureDomain[1],
      axisLine: {
        show: true,
        lineStyle: { color: colors.pressure },
      },
      axisLabel: {
        color: colors.pressure,
        formatter: (value: number) => value.toFixed(1),
      },
      splitLine: {
        lineStyle: { color: colors.grid, type: 'dashed' },
      },
    });

    // Temperature Y-axis (right)
    if (showTemperature) {
      yAxis.push({
        type: 'value',
        name: `Temperature (°${config.temperatureUnit})`,
        position: 'right',
        min: temperatureDomain[0],
        max: temperatureDomain[1],
        axisLine: {
          show: true,
          lineStyle: { color: colors.temperature },
        },
        axisLabel: {
          color: colors.temperature,
          formatter: (value: number) => value.toFixed(1),
        },
        splitLine: {
          show: false,
        },
      });
    }

    // Pressure area series
    series.push({
      name: 'Pressure',
      type: 'line',
      yAxisIndex: 0,
      data: chartData.map((d) => d.pressure),
      smooth: true,
      showSymbol: false,
      lineStyle: {
        color: colors.pressure,
        width: 3,
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${colors.pressure}33` }, // 20% opacity
            { offset: 1, color: `${colors.pressure}00` }, // 0% opacity
          ],
        },
      },
      emphasis: {
        focus: 'series',
      },
      animation: animate,
    });

    // Temperature line series
    if (showTemperature) {
      series.push({
        name: 'Temperature',
        type: 'line',
        yAxisIndex: 1,
        data: chartData.map((d) => d.temperature),
        smooth: true,
        showSymbol: false,
        lineStyle: {
          color: colors.temperature,
          width: 2,
          type: 'dashed',
        },
        emphasis: {
          focus: 'series',
        },
        animation: animate,
      });
    }

    // Add threshold mark lines to pressure series
    if (showThresholds) {
      markLines.push(
        {
          name: 'Working Pressure',
          yAxis: config.workingPressure,
          lineStyle: {
            color: colors.safe,
            type: 'dashed',
            width: 2,
          },
          label: {
            formatter: `Working: ${config.workingPressure} ${config.pressureUnit}`,
            color: colors.safe,
            fontSize: 12,
          },
        },
        {
          name: 'Max Pressure',
          yAxis: config.maxPressure,
          lineStyle: {
            color: colors.warning,
            type: 'dashed',
            width: 2,
          },
          label: {
            formatter: `Max: ${config.maxPressure} ${config.pressureUnit}`,
            color: colors.warning,
            fontSize: 12,
          },
        }
      );

      // Add markLine to pressure series
      series[0].markLine = {
        silent: true,
        symbol: 'none',
        data: markLines,
      };
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: colors.textMuted,
          },
        },
        backgroundColor: colors.backgroundCard,
        borderColor: colors.border,
        textStyle: {
          color: colors.text,
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';

          const timeIndex = params[0].dataIndex;
          const time = chartData[timeIndex]?.time || '';

          let html = `<div style="font-weight: 600; margin-bottom: 8px;">${time}</div>`;

          params.forEach((param: any) => {
            const value = param.value.toFixed(2);
            let unit = '';

            if (param.seriesName === 'Pressure') {
              unit = config.pressureUnit;
            } else if (param.seriesName === 'Temperature') {
              unit = `°${config.temperatureUnit}`;
            }

            html += `
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${param.color};"></div>
                <span style="color: ${colors.textMuted};">${param.seriesName}:</span>
                <span style="font-weight: 600;">${value} ${unit}</span>
              </div>
            `;
          });

          return html;
        },
      },
      legend: {
        data: showTemperature ? ['Pressure', 'Temperature'] : ['Pressure'],
        top: 10,
        textStyle: {
          color: colors.text,
        },
      },
      grid: {
        left: 60,
        right: showTemperature ? 80 : 40,
        bottom: 60,
        top: 60,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: chartData.map((d) => d.time),
        boundaryGap: false,
        axisLine: {
          lineStyle: { color: colors.text },
        },
        axisLabel: {
          color: colors.text,
          rotate: 45,
          fontSize: 11,
        },
        name: 'Time (HH:MM:SS)',
        nameLocation: 'middle',
        nameGap: 45,
        nameTextStyle: {
          color: colors.text,
          fontSize: 12,
        },
      },
      yAxis,
      series,
      animation: animate,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    };
  }, [
    chartData,
    config,
    colors,
    pressureDomain,
    temperatureDomain,
    showTemperature,
    showThresholds,
    animate,
  ]);

  return (
    <div className="w-full">
      <ThemedChart
        option={option}
        style={{ height: `${height}px`, width: '100%' }}
        className="pressure-graph"
      />

      {/* Graph statistics */}
      {results && (results.finalPressure !== undefined || results.pressureDrop !== undefined || results.averagePressure !== undefined || results.passed !== undefined) && (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {results.finalPressure !== undefined && (
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm text-muted-foreground">Final Pressure</p>
              <p className="text-lg font-semibold text-foreground">
                {results.finalPressure.toFixed(2)} {config.pressureUnit}
              </p>
            </div>
          )}

          {results.pressureDrop !== undefined && (
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm text-muted-foreground">Pressure Drop</p>
              <p className="text-lg font-semibold text-foreground">
                {results.pressureDrop.toFixed(2)} {config.pressureUnit}
              </p>
            </div>
          )}

          {results.averagePressure !== undefined && (
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm text-muted-foreground">Average Pressure</p>
              <p className="text-lg font-semibold text-foreground">
                {results.averagePressure.toFixed(2)} {config.pressureUnit}
              </p>
            </div>
          )}

          {results.passed !== undefined && (
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm text-muted-foreground">Test Status</p>
              <p
                className={`text-lg font-semibold ${
                  results.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {results.passed ? 'PASSED' : 'FAILED'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
