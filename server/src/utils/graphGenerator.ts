// ═══════════════════════════════════════════════════════════════════
// Graph Data Generation Logic
// ═══════════════════════════════════════════════════════════════════

import type { DataPoint, GraphData, PressureTest, TestSettings } from '../types';
import { AppError } from '../middleware/errorHandler';
import { parseDateTime, addNoise } from './helpers';

/**
 * Generate intermediate data points with noise simulation
 * Creates realistic pressure fluctuations during stable hold periods
 *
 * @param startTime - Start timestamp of the period
 * @param endTime - End timestamp of the period
 * @param pressure - Target pressure in MPa
 * @param pointsCount - Number of points to generate (default: 10)
 * @returns Array of data points with noise-adjusted pressures
 */
const generateIntermediatePoints = (
  startTime: Date,
  endTime: Date,
  pressure: number,
  pointsCount: number = 10
): DataPoint[] => {
  const result: DataPoint[] = [];
  const timeStep = (endTime.getTime() - startTime.getTime()) / pointsCount;

  for (let i = 0; i <= pointsCount; i++) {
    const time = new Date(startTime.getTime() + timeStep * i);
    const noisyPressure = addNoise(pressure);
    result.push({ time, pressure: noisyPressure });
  }

  return result;
};

/**
 * Generate data points with controlled pressure drift
 * Used for simulating gradual pressure changes over time
 *
 * @param startTime - Start timestamp of drift period
 * @param endTime - End timestamp of drift period
 * @param startPressure - Initial pressure in MPa
 * @param endPressure - Final pressure in MPa
 * @param pointsCount - Number of points to generate (default: 20)
 * @returns Array of data points showing gradual pressure drift
 */
const generateDriftPoints = (
  startTime: Date,
  endTime: Date,
  startPressure: number,
  endPressure: number,
  pointsCount: number = 20
): DataPoint[] => {
  const result: DataPoint[] = [];
  const timeStep = (endTime.getTime() - startTime.getTime()) / pointsCount;
  const pressureStep = (endPressure - startPressure) / pointsCount;

  for (let i = 0; i <= pointsCount; i++) {
    const time = new Date(startTime.getTime() + timeStep * i);
    const basePressure = startPressure + pressureStep * i;
    const noisyPressure = addNoise(basePressure);
    result.push({ time, pressure: noisyPressure });
  }

  return result;
};

/**
 * Generate complete pressure test graph data
 * Main function that orchestrates the entire pressure test simulation
 *
 * Algorithm:
 * 1. Validate date ranges
 * 2. Generate initial pressure rise (30 seconds)
 * 3. Hold working pressure with fluctuations
 * 4. Process intermediate pressure tests with drift support
 * 5. Generate depressurization phases
 * 6. Remove duplicate timestamps
 *
 * @param settings - Complete test configuration
 * @returns Graph data with all calculated data points
 * @throws AppError if end date/time is before start date/time
 */
export const generatePressureData = (settings: TestSettings): GraphData => {
  const {
    startDate,
    startTime,
    endDate,
    endTime,
    workingPressure,
    pressureDuration,
    pressureTests,
  } = settings;

  const startDateTime = parseDateTime(startDate, startTime);
  const endDateTime = parseDateTime(endDate, endTime);

  const points: DataPoint[] = [];

  // Validate date range
  if (endDateTime <= startDateTime) {
    throw new AppError('End date/time must be after start date/time', 400);
  }

  // Initial point at zero pressure
  points.push({ time: new Date(startDateTime), pressure: 0 });

  // Initial pressure rise (30 seconds to reach working pressure)
  const riseTime = new Date(startDateTime.getTime() + 30 * 1000);
  for (let i = 0; i <= 5; i++) {
    const t = startDateTime.getTime() + (30 * 1000 * i) / 5;
    const p = (workingPressure * i) / 5 + (i > 0 ? (Math.random() - 0.5) * 2 : 0);
    points.push({ time: new Date(t), pressure: Math.max(0, p) });
  }

  // Hold working pressure with fluctuations
  const holdEnd = new Date(riseTime.getTime() + pressureDuration * 60 * 1000);
  const holdPoints = generateIntermediatePoints(riseTime, holdEnd, workingPressure, 20);
  points.push(...holdPoints);

  // Depressurization (30 seconds) - default to 0
  const dropTime = new Date(holdEnd.getTime() + 30 * 1000);
  for (let i = 0; i <= 5; i++) {
    const t = holdEnd.getTime() + (30 * 1000 * i) / 5;
    const p = workingPressure * (1 - i / 5) + (i < 5 ? (Math.random() - 0.5) * 2 : 0);
    points.push({ time: new Date(t), pressure: Math.max(0, p) });
  }

  let lastDropTime = dropTime;
  let lastDropPressure = 0;

  // Process intermediate pressure tests
  const sortedTests = [...pressureTests].sort((a, b) => a.time - b.time);

  sortedTests.forEach((test: PressureTest, index: number) => {
    const testStart = new Date(startDateTime.getTime() + test.time * 60 * 60 * 1000);
    const testPressure = test.pressure ?? workingPressure;
    const dropTarget = test.targetPressure ?? 0;

    // Calculate end pressure for hold period (with drift if specified)
    const holdEndPressure = lastDropPressure + (test.holdDrift ?? 0);

    // Hold period before test (with drift if specified)
    const holdDuration = testStart.getTime() - lastDropTime.getTime();
    if (holdDuration > 60 * 1000) { // More than 1 minute
      const pointsCount = Math.max(10, Math.floor(holdDuration / (60 * 60 * 1000)) * 2);

      if (test.holdDrift !== undefined && test.holdDrift !== 0) {
        // Controlled drift
        const driftPoints = generateDriftPoints(
          lastDropTime,
          new Date(testStart.getTime() - 30 * 1000),
          lastDropPressure,
          holdEndPressure,
          pointsCount
        );
        points.push(...driftPoints);
      } else {
        // Stable hold with minor noise
        const lowPressurePoints = generateIntermediatePoints(
          lastDropTime,
          new Date(testStart.getTime() - 30 * 1000),
          lastDropPressure,
          pointsCount
        );
        points.push(...lowPressurePoints);
      }
    }

    // Pressure rise (30 seconds)
    const currentPressure = test.holdDrift !== undefined ? holdEndPressure : lastDropPressure;
    for (let i = 0; i <= 5; i++) {
      const t = testStart.getTime() - 30 * 1000 + (30 * 1000 * i) / 5;
      const p = currentPressure + ((testPressure - currentPressure) * i) / 5 + (i > 0 ? (Math.random() - 0.5) * 2 : 0);
      points.push({ time: new Date(t), pressure: Math.max(0, p) });
    }

    // Hold test pressure with controlled drift
    const testHold = new Date(testStart.getTime() + test.duration * 60 * 1000);

    if (test.minPressure !== undefined || test.maxPressure !== undefined) {
      // Drift during hold
      const targetHoldPressure = test.minPressure ?? test.maxPressure ?? testPressure;
      const testHoldPoints = generateDriftPoints(testStart, testHold, testPressure, targetHoldPressure, 15);
      points.push(...testHoldPoints);
    } else {
      // Stable hold
      const testHoldPoints = generateIntermediatePoints(testStart, testHold, testPressure, 15);
      points.push(...testHoldPoints);
    }

    // Depressurization (30 seconds) to target pressure
    const testDropTime = new Date(testHold.getTime() + 30 * 1000);
    const finalHoldPressure = test.minPressure ?? test.maxPressure ?? testPressure;

    for (let i = 0; i <= 5; i++) {
      const t = testHold.getTime() + (30 * 1000 * i) / 5;
      const p = finalHoldPressure * (1 - i / 5) + dropTarget * (i / 5) + (i < 5 ? (Math.random() - 0.5) * 2 : 0);
      points.push({ time: new Date(t), pressure: Math.max(0, p) });
    }

    lastDropTime = testDropTime;
    lastDropPressure = dropTarget;
  });

  // Final low pressure period
  const finalDuration = endDateTime.getTime() - lastDropTime.getTime();
  if (finalDuration > 60 * 1000) { // More than 1 minute
    const finalPointsCount = Math.max(10, Math.floor(finalDuration / (60 * 60 * 1000)) * 2);
    const finalLowPressurePoints = generateIntermediatePoints(
      lastDropTime,
      endDateTime,
      lastDropPressure,
      finalPointsCount
    );
    points.push(...finalLowPressurePoints);
  }

  // Final depressurization to zero
  if (lastDropPressure > 0) {
    // Final drop to 0 (30 seconds)
    const finalDropTime = new Date(endDateTime.getTime() - 30 * 1000);
    for (let i = 0; i <= 5; i++) {
      const t = finalDropTime.getTime() + (30 * 1000 * i) / 5;
      const p = lastDropPressure * (1 - i / 5) + (i < 5 ? (Math.random() - 0.5) * 0.5 : 0);
      points.push({ time: new Date(t), pressure: Math.max(0, p) });
    }
  }

  points.push({ time: endDateTime, pressure: 0 });

  // Sort and remove duplicates
  points.sort((a, b) => a.time.getTime() - b.time.getTime());

  const uniquePoints: DataPoint[] = [];
  let lastTime: Date | null = null;

  for (const point of points) {
    if (!lastTime || point.time.getTime() !== lastTime.getTime()) {
      uniquePoints.push(point);
      lastTime = point.time;
    }
  }

  return { points: uniquePoints, startDateTime, endDateTime };
};
