'use client';

/**
 * Pressure Graph Component
 *
 * Interactive pressure test visualization using Recharts
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
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { type TestRunResults } from '@/lib/db/schema/test-runs';
import { type PressureTestConfig } from '@/lib/db/schema/pressure-tests';
import { useTheme } from 'next-themes';

interface PressureGraphProps {
  /** Test configuration (defines parameters and stages) */
  config: PressureTestConfig;

  /** Measurement data from test execution */
  results?: TestRunResults;

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

/**
 * Custom Tooltip Component
 */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">
            {entry.value.toFixed(2)} {entry.unit || ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PressureGraph({
  config,
  results,
  height = 400,
  showTemperature = true,
  showThresholds = true,
  animate = true,
}: PressureGraphProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme colors (Industrial Blue/Gray palette)
  const colors = {
    pressure: isDark ? '#60A5FA' : '#3B82F6', // Blue
    temperature: isDark ? '#F87171' : '#EF4444', // Red
    threshold: isDark ? '#FBBF24' : '#F59E0B', // Amber
    safe: isDark ? '#34D399' : '#10B981', // Green
    grid: isDark ? '#374151' : '#E5E7EB', // Gray
    text: isDark ? '#F3F4F6' : '#1F2937',
  };

  // Transform measurement data for Recharts
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

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="pressureGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.pressure} stopOpacity={0.2} />
              <stop offset="95%" stopColor={colors.pressure} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.grid}
            opacity={0.3}
          />

          <XAxis
            dataKey="time"
            stroke={colors.text}
            style={{ fontSize: '12px' }}
            label={{
              value: 'Time (HH:MM:SS)',
              position: 'insideBottom',
              offset: -5,
              style: { fill: colors.text },
            }}
          />

          <YAxis
            yAxisId="pressure"
            domain={pressureDomain}
            stroke={colors.pressure}
            style={{ fontSize: '12px' }}
            label={{
              value: `Pressure (${config.pressureUnit})`,
              angle: -90,
              position: 'insideLeft',
              style: { fill: colors.pressure },
            }}
          />

          {showTemperature && (
            <YAxis
              yAxisId="temperature"
              orientation="right"
              domain={temperatureDomain}
              stroke={colors.temperature}
              style={{ fontSize: '12px' }}
              label={{
                value: `Temperature (°${config.temperatureUnit})`,
                angle: 90,
                position: 'insideRight',
                style: { fill: colors.temperature },
              }}
            />
          )}

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '14px',
            }}
          />

          {/* Threshold lines */}
          {showThresholds && (
            <>
              <ReferenceLine
                yAxisId="pressure"
                y={config.workingPressure}
                stroke={colors.safe}
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{
                  value: `Working Pressure (${config.workingPressure} ${config.pressureUnit})`,
                  position: 'insideTopLeft',
                  style: { fill: colors.safe, fontSize: '12px' },
                }}
              />

              <ReferenceLine
                yAxisId="pressure"
                y={config.maxPressure}
                stroke={colors.threshold}
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{
                  value: `Max Pressure (${config.maxPressure} ${config.pressureUnit})`,
                  position: 'insideTopLeft',
                  style: { fill: colors.threshold, fontSize: '12px' },
                }}
              />
            </>
          )}

          {/* Pressure area */}
          <Area
            yAxisId="pressure"
            type="monotone"
            dataKey="pressure"
            stroke="none"
            fill="url(#pressureGradient)"
            isAnimationActive={animate}
          />

          {/* Pressure line */}
          <Line
            yAxisId="pressure"
            type="monotone"
            dataKey="pressure"
            stroke={colors.pressure}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
            name="Pressure"
            unit={config.pressureUnit}
            isAnimationActive={animate}
          />

          {/* Temperature line */}
          {showTemperature && (
            <Line
              yAxisId="temperature"
              type="monotone"
              dataKey="temperature"
              stroke={colors.temperature}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4 }}
              name="Temperature"
              unit={`°${config.temperatureUnit}`}
              isAnimationActive={animate}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Graph statistics */}
      {results && (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-sm text-muted-foreground">Final Pressure</p>
            <p className="text-lg font-semibold text-foreground">
              {results.finalPressure.toFixed(2)} {config.pressureUnit}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-sm text-muted-foreground">Pressure Drop</p>
            <p className="text-lg font-semibold text-foreground">
              {results.pressureDrop.toFixed(2)} {config.pressureUnit}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-sm text-muted-foreground">Average Pressure</p>
            <p className="text-lg font-semibold text-foreground">
              {results.averagePressure?.toFixed(2) ?? 'N/A'}{' '}
              {config.pressureUnit}
            </p>
          </div>

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
        </div>
      )}
    </div>
  );
}
