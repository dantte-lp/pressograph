/**
 * Pressure Test Data Generator
 *
 * Generates realistic simulated pressure test data for visualization and export
 * without actually running the test. This is useful for:
 * - Previewing test configurations
 * - Generating example graphs for documentation
 * - Creating template exports
 *
 * Based on v1 implementation from graphGenerator.ts
 */

import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';

/**
 * Data point representing pressure at a specific time
 */
export interface PressureDataPoint {
  time: Date;
  pressure: number; // MPa
  temperature?: number; // °C (optional)
  isSimulated: true; // Always true for emulated data
}

/**
 * Complete emulated test data
 */
export interface EmulatedTestData {
  points: PressureDataPoint[];
  startDateTime: Date;
  endDateTime: Date;
  config: PressureTestConfig;
  metadata: {
    generatedAt: Date;
    isEmulation: true;
    generatorVersion: string;
  };
}

/**
 * Add realistic noise to pressure values
 *
 * @param pressure - Base pressure value
 * @param maxNoise - Maximum noise amplitude (default: 0.5 MPa)
 * @returns Pressure with added noise
 */
function addNoise(pressure: number, maxNoise: number = 0.5): number {
  if (pressure === 0) return 0;
  return pressure + (Math.random() - 0.5) * maxNoise;
}

/**
 * Generate intermediate points with noise between two time points
 *
 * @param startTime - Start timestamp
 * @param endTime - End timestamp
 * @param pressure - Target pressure to maintain
 * @param pointsCount - Number of points to generate
 * @returns Array of pressure data points
 */
function generateIntermediatePoints(
  startTime: Date,
  endTime: Date,
  pressure: number,
  temperature: number | undefined,
  pointsCount: number = 10
): PressureDataPoint[] {
  const result: PressureDataPoint[] = [];
  const timeStep = (endTime.getTime() - startTime.getTime()) / pointsCount;

  for (let i = 0; i <= pointsCount; i++) {
    const time = new Date(startTime.getTime() + timeStep * i);
    const noisyPressure = addNoise(pressure);
    result.push({
      time,
      pressure: Math.max(0, noisyPressure),
      temperature,
      isSimulated: true,
    });
  }

  return result;
}

/**
 * Generate points with controlled pressure drift (rise or drop)
 *
 * @param startTime - Start timestamp
 * @param endTime - End timestamp
 * @param startPressure - Initial pressure
 * @param endPressure - Final pressure
 * @param pointsCount - Number of points to generate
 * @returns Array of pressure data points with drift
 */
function generateDriftPoints(
  startTime: Date,
  endTime: Date,
  startPressure: number,
  endPressure: number,
  temperature: number | undefined,
  pointsCount: number = 20
): PressureDataPoint[] {
  const result: PressureDataPoint[] = [];
  const timeStep = (endTime.getTime() - startTime.getTime()) / pointsCount;
  const pressureStep = (endPressure - startPressure) / pointsCount;

  for (let i = 0; i <= pointsCount; i++) {
    const time = new Date(startTime.getTime() + timeStep * i);
    const basePressure = startPressure + pressureStep * i;
    const noisyPressure = addNoise(basePressure);
    result.push({
      time,
      pressure: Math.max(0, noisyPressure),
      temperature,
      isSimulated: true,
    });
  }

  return result;
}

/**
 * Generate simulated pressure test data based on configuration
 *
 * This creates a realistic pressure profile following industry standards:
 * 1. Initial rise to working pressure (30 seconds)
 * 2. Hold at working pressure (with small fluctuations)
 * 3. Intermediate stages if configured
 * 4. Pressure drop phases
 * 5. Final return to zero
 *
 * @param config - Test configuration
 * @param startDate - Test start date/time (defaults to now)
 * @returns Complete emulated test data
 */
export function generateEmulatedTestData(
  config: PressureTestConfig,
  startDate: Date = new Date()
): EmulatedTestData {
  const points: PressureDataPoint[] = [];
  const { workingPressure, testDuration, temperature, intermediateStages } = config;

  // Calculate end time based on test duration
  const startDateTime = new Date(startDate);
  const endDateTime = new Date(startDateTime.getTime() + testDuration * 60 * 60 * 1000);

  // Starting point at zero pressure
  points.push({
    time: new Date(startDateTime),
    pressure: 0,
    temperature,
    isSimulated: true,
  });

  // Phase 1: Initial pressure rise (30 seconds to working pressure)
  const riseTime = new Date(startDateTime.getTime() + 30 * 1000);
  const risePoints = generateDriftPoints(
    startDateTime,
    riseTime,
    0,
    workingPressure,
    temperature,
    5
  );
  points.push(...risePoints.slice(1)); // Skip first point (already added)

  let currentTime = riseTime;
  let currentPressure = workingPressure;

  // Phase 2: Hold at working pressure with intermediate stages
  if (intermediateStages && intermediateStages.length > 0) {
    // Sort stages by time
    const sortedStages = [...intermediateStages].sort((a, b) => a.time - b.time);

    for (const stage of sortedStages) {
      const stageStartTime = new Date(startDateTime.getTime() + stage.time * 60 * 1000);

      // Hold current pressure until stage starts
      if (stageStartTime.getTime() > currentTime.getTime()) {
        const holdDuration = stageStartTime.getTime() - currentTime.getTime();
        const holdPointsCount = Math.max(5, Math.floor(holdDuration / (60 * 1000))); // At least 5 points
        const holdPoints = generateIntermediatePoints(
          currentTime,
          stageStartTime,
          currentPressure,
          temperature,
          holdPointsCount
        );
        points.push(...holdPoints.slice(1));
      }

      // Rise/drop to stage pressure (30 seconds)
      const stageRiseEnd = new Date(stageStartTime.getTime() + 30 * 1000);
      const stageRisePoints = generateDriftPoints(
        stageStartTime,
        stageRiseEnd,
        currentPressure,
        stage.pressure,
        temperature,
        5
      );
      points.push(...stageRisePoints.slice(1));

      // Hold at stage pressure
      const stageHoldEnd = new Date(stageRiseEnd.getTime() + stage.duration * 60 * 1000);
      const stageHoldPoints = generateIntermediatePoints(
        stageRiseEnd,
        stageHoldEnd,
        stage.pressure,
        temperature,
        Math.max(10, Math.floor(stage.duration / 2))
      );
      points.push(...stageHoldPoints.slice(1));

      currentTime = stageHoldEnd;
      currentPressure = stage.pressure;
    }
  }

  // Phase 3: Final hold at current pressure until end (minus drop time)
  const dropStartTime = new Date(endDateTime.getTime() - 30 * 1000);
  if (dropStartTime.getTime() > currentTime.getTime()) {
    const finalHoldDuration = dropStartTime.getTime() - currentTime.getTime();
    const finalHoldPointsCount = Math.max(10, Math.floor(finalHoldDuration / (60 * 60 * 1000)) * 2);
    const finalHoldPoints = generateIntermediatePoints(
      currentTime,
      dropStartTime,
      currentPressure,
      temperature,
      finalHoldPointsCount
    );
    points.push(...finalHoldPoints.slice(1));
  }

  // Phase 4: Final pressure drop to zero (30 seconds)
  const finalDropPoints = generateDriftPoints(
    dropStartTime,
    endDateTime,
    currentPressure,
    0,
    temperature,
    5
  );
  points.push(...finalDropPoints.slice(1));

  // Ensure final point is exactly at end time with zero pressure
  points.push({
    time: endDateTime,
    pressure: 0,
    temperature,
    isSimulated: true,
  });

  // Sort points by time and remove duplicates
  points.sort((a, b) => a.time.getTime() - b.time.getTime());
  const uniquePoints: PressureDataPoint[] = [];
  let lastTime: number | null = null;

  for (const point of points) {
    const pointTime = point.time.getTime();
    if (lastTime === null || pointTime !== lastTime) {
      uniquePoints.push(point);
      lastTime = pointTime;
    }
  }

  return {
    points: uniquePoints,
    startDateTime,
    endDateTime,
    config,
    metadata: {
      generatedAt: new Date(),
      isEmulation: true,
      generatorVersion: '2.0.0',
    },
  };
}

/**
 * Convert emulated data to CSV format
 *
 * @param data - Emulated test data
 * @returns CSV string
 */
export function emulatedDataToCSV(data: EmulatedTestData): string {
  const lines: string[] = [];

  // Header with metadata
  lines.push('# Pressograph 2.0 - Emulated Test Data');
  lines.push(`# Generated: ${data.metadata.generatedAt.toISOString()}`);
  lines.push(`# Test Duration: ${data.config.testDuration} hours`);
  lines.push(`# Working Pressure: ${data.config.workingPressure} ${data.config.pressureUnit}`);
  lines.push(`# Max Pressure: ${data.config.maxPressure} ${data.config.pressureUnit}`);
  lines.push(`# Temperature: ${data.config.temperature}°${data.config.temperatureUnit}`);
  lines.push('# WARNING: This is SIMULATED data, not from an actual test run');
  lines.push('');

  // CSV header
  const hasTemperature = data.points.some(p => p.temperature !== undefined);
  if (hasTemperature) {
    lines.push('Timestamp,Pressure (MPa),Temperature (°C),Simulated');
  } else {
    lines.push('Timestamp,Pressure (MPa),Simulated');
  }

  // Data rows
  for (const point of data.points) {
    const timestamp = point.time.toISOString();
    const pressure = point.pressure.toFixed(3);
    if (hasTemperature && point.temperature !== undefined) {
      const temp = point.temperature.toFixed(1);
      lines.push(`${timestamp},${pressure},${temp},true`);
    } else {
      lines.push(`${timestamp},${pressure},true`);
    }
  }

  return lines.join('\n');
}

/**
 * Convert emulated data to JSON format
 *
 * @param data - Emulated test data
 * @returns JSON string
 */
export function emulatedDataToJSON(data: EmulatedTestData): string {
  return JSON.stringify(
    {
      ...data,
      points: data.points.map(p => ({
        ...p,
        time: p.time.toISOString(),
      })),
      startDateTime: data.startDateTime.toISOString(),
      endDateTime: data.endDateTime.toISOString(),
      metadata: {
        ...data.metadata,
        generatedAt: data.metadata.generatedAt.toISOString(),
      },
    },
    null,
    2
  );
}
