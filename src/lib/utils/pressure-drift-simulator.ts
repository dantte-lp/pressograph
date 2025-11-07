/**
 * Pressure Drift Simulator
 *
 * Generates realistic pressure data with high-frequency sampling,
 * Brownian motion drift, and Gaussian noise to simulate real-world
 * high-precision pressure sensor behavior.
 *
 * Based on the original Pressograph v1.0 Canvas implementation
 * with enhanced precision and configurable parameters.
 *
 * Key Features:
 * - High-frequency sampling (1 second intervals or custom)
 * - Brownian motion for realistic pressure drift
 * - Gaussian noise for sensor measurement variations
 * - Bounded drift to stay within realistic tolerances
 * - Smooth transitions during ramp-up/down periods
 *
 * @module lib/utils/pressure-drift-simulator
 */

/**
 * Configuration for drift simulation
 */
export interface DriftConfig {
  /** Magnitude of drift (±% as decimal, e.g., 0.002 = ±0.2%) */
  driftMagnitude?: number;
  /** Magnitude of noise (±% as decimal, e.g., 0.001 = ±0.1%) */
  noiseMagnitude?: number;
  /** Sampling rate in seconds (default: 1 second) */
  samplingRate?: number;
  /** Random seed for reproducible results (optional) */
  seed?: number;
}

/**
 * Default drift configuration matching original implementation
 */
const DEFAULT_CONFIG: Required<DriftConfig> = {
  driftMagnitude: 0.002, // ±0.2% drift
  noiseMagnitude: 0.001, // ±0.1% noise
  samplingRate: 1, // 1 second intervals
  seed: Date.now(),
};

/**
 * Seeded random number generator (LCG algorithm)
 * Provides reproducible pseudo-random numbers for testing
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate next pseudo-random number in [0, 1)
   */
  next(): number {
    // Linear Congruential Generator
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Generate random number in range [min, max)
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

/**
 * Generate Gaussian (normal) distributed random number
 * Uses Box-Muller transform for conversion from uniform to Gaussian
 *
 * @param mean - Mean of distribution
 * @param stdDev - Standard deviation
 * @param random - Random number generator
 * @returns Gaussian-distributed random value
 */
function generateGaussian(
  mean: number = 0,
  stdDev: number = 1,
  random: SeededRandom
): number {
  // Box-Muller transform
  const u1 = random.next();
  const u2 = random.next();

  // Avoid log(0)
  const u1Safe = u1 === 0 ? 0.0000001 : u1;

  const z0 = Math.sqrt(-2.0 * Math.log(u1Safe)) * Math.cos(2.0 * Math.PI * u2);

  return mean + z0 * stdDev;
}

/**
 * Brownian motion accumulator for drift simulation
 */
class BrownianMotion {
  private value: number = 0;
  private magnitude: number;
  private random: SeededRandom;

  constructor(magnitude: number, random: SeededRandom) {
    this.magnitude = magnitude;
    this.random = random;
  }

  /**
   * Get current drift value
   */
  getValue(): number {
    return this.value;
  }

  /**
   * Step forward with random walk
   * Bounded to stay within ±magnitude range
   */
  step(): void {
    // Random walk with small steps
    const step = generateGaussian(0, this.magnitude * 0.1, this.random);
    this.value += step;

    // Soft boundaries - apply restoring force when approaching limits
    if (Math.abs(this.value) > this.magnitude) {
      // Apply dampening force proportional to distance from boundary
      const overshoot = Math.abs(this.value) - this.magnitude;
      const damping = -Math.sign(this.value) * overshoot * 0.5;
      this.value += damping;
    }

    // Hard clamp as safety
    this.value = Math.max(-this.magnitude, Math.min(this.magnitude, this.value));
  }

  /**
   * Reset drift to zero (for new test segments)
   */
  reset(): void {
    this.value = 0;
  }
}

/**
 * Add realistic noise to a single pressure value
 *
 * @param basePressure - Base pressure value
 * @param noiseMagnitude - Noise magnitude (±% as decimal)
 * @param random - Random number generator
 * @returns Pressure with added noise
 */
export function addPressureNoise(
  basePressure: number,
  noiseMagnitude: number,
  random: SeededRandom
): number {
  if (basePressure === 0) return 0;

  // Gaussian noise proportional to pressure value
  const noise = generateGaussian(0, noiseMagnitude, random);
  const noisyPressure = basePressure * (1 + noise);

  // Ensure non-negative
  return Math.max(0, noisyPressure);
}

/**
 * Generate realistic intermediate points with drift and noise
 * Simulates high-precision sensor readings during steady-state hold
 *
 * @param startTime - Start time in milliseconds
 * @param endTime - End time in milliseconds
 * @param basePressure - Base pressure to maintain
 * @param config - Drift configuration
 * @returns Array of [time, pressure] data points
 */
export function generateDriftPoints(
  startTime: number,
  endTime: number,
  basePressure: number,
  config: DriftConfig = {}
): Array<[number, number]> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const {
    driftMagnitude,
    noiseMagnitude,
    samplingRate,
    seed,
  } = mergedConfig;

  const random = new SeededRandom(seed);
  const brownian = new BrownianMotion(driftMagnitude, random);

  const duration = endTime - startTime;
  const samplingMs = samplingRate * 1000;
  const numSamples = Math.max(2, Math.floor(duration / samplingMs) + 1);

  const dataPoints: Array<[number, number]> = [];

  for (let i = 0; i < numSamples; i++) {
    const time = startTime + (duration * i) / (numSamples - 1);

    // Step Brownian motion
    brownian.step();

    // Calculate realistic pressure with drift and noise
    const drift = brownian.getValue();
    const pressureWithDrift = basePressure * (1 + drift);
    const noisyPressure = addPressureNoise(pressureWithDrift, noiseMagnitude, random);

    dataPoints.push([time, noisyPressure]);
  }

  return dataPoints;
}

/**
 * Generate realistic ramp transition points (pressure increase/decrease)
 * Simulates smooth pressure changes with natural variations
 *
 * @param startTime - Start time in milliseconds
 * @param endTime - End time in milliseconds
 * @param startPressure - Starting pressure
 * @param endPressure - Target pressure
 * @param config - Drift configuration
 * @returns Array of [time, pressure] data points
 */
export function generateRampPoints(
  startTime: number,
  endTime: number,
  startPressure: number,
  endPressure: number,
  config: DriftConfig = {}
): Array<[number, number]> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { noiseMagnitude, samplingRate, seed } = mergedConfig;

  const random = new SeededRandom(seed);

  const duration = endTime - startTime;
  const samplingMs = samplingRate * 1000;
  const numSamples = Math.max(2, Math.floor(duration / samplingMs) + 1);

  const dataPoints: Array<[number, number]> = [];
  const pressureDelta = endPressure - startPressure;

  for (let i = 0; i < numSamples; i++) {
    const time = startTime + (duration * i) / (numSamples - 1);
    const progress = i / (numSamples - 1);

    // Linear ramp with slight S-curve for natural acceleration/deceleration
    const smoothProgress = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    const basePressure = startPressure + pressureDelta * smoothProgress;

    // Add measurement noise (smaller during transitions)
    const noisyPressure = addPressureNoise(
      basePressure,
      noiseMagnitude * 0.5, // Reduced noise during transitions
      random
    );

    dataPoints.push([time, noisyPressure]);
  }

  return dataPoints;
}

/**
 * Generate complete realistic pressure test data
 * Combines ramp-up, hold periods, intermediate stages, and ramp-down
 *
 * @param testConfig - Test configuration
 * @param driftConfig - Drift simulation configuration
 * @returns Array of [time, pressure] data points
 */
export interface TestDataConfig {
  startTime: number; // milliseconds
  endTime: number; // milliseconds
  workingPressure: number;
  intermediateStages?: Array<{
    startTime: number; // milliseconds (absolute)
    endTime: number; // milliseconds (absolute)
    pressure: number;
  }>;
}

export function generateRealisticTestData(
  testConfig: TestDataConfig,
  driftConfig: DriftConfig = {}
): Array<[number, number]> {
  const dataPoints: Array<[number, number]> = [];
  const rampDuration = 30 * 1000; // 30 seconds in milliseconds

  const { startTime, endTime, workingPressure, intermediateStages = [] } = testConfig;

  // 1. Initial point: 0 pressure
  dataPoints.push([startTime, 0]);

  // 2. Ramp up to working pressure (30 seconds)
  const rampUpEnd = startTime + rampDuration;
  const rampUpPoints = generateRampPoints(
    startTime,
    rampUpEnd,
    0,
    workingPressure,
    driftConfig
  );
  dataPoints.push(...rampUpPoints.slice(1)); // Skip first point (duplicate)

  // 3. Hold at working pressure with drift
  let currentTime = rampUpEnd;

  if (intermediateStages.length > 0) {
    // Hold until first intermediate stage
    const firstStageStart = intermediateStages[0].startTime;
    if (firstStageStart > currentTime) {
      const holdPoints = generateDriftPoints(
        currentTime,
        firstStageStart,
        workingPressure,
        driftConfig
      );
      dataPoints.push(...holdPoints.slice(1)); // Skip first point
      currentTime = firstStageStart;
    }

    // Process intermediate stages
    for (let i = 0; i < intermediateStages.length; i++) {
      const stage = intermediateStages[i];

      // Ramp to stage pressure
      const stageRampEnd = stage.startTime + rampDuration;
      const stageRampPoints = generateRampPoints(
        stage.startTime,
        stageRampEnd,
        workingPressure,
        stage.pressure,
        driftConfig
      );
      dataPoints.push(...stageRampPoints.slice(1));

      // Hold at stage pressure
      const stageHoldEnd = stage.endTime - rampDuration;
      if (stageHoldEnd > stageRampEnd) {
        const stageHoldPoints = generateDriftPoints(
          stageRampEnd,
          stageHoldEnd,
          stage.pressure,
          driftConfig
        );
        dataPoints.push(...stageHoldPoints.slice(1));
      }

      // Ramp down to working pressure
      const stageRampDownPoints = generateRampPoints(
        stageHoldEnd,
        stage.endTime,
        stage.pressure,
        workingPressure,
        driftConfig
      );
      dataPoints.push(...stageRampDownPoints.slice(1));

      currentTime = stage.endTime;

      // Hold at working pressure until next stage or end
      const nextStageStart = i < intermediateStages.length - 1
        ? intermediateStages[i + 1].startTime
        : endTime - rampDuration;

      if (nextStageStart > currentTime) {
        const holdPoints = generateDriftPoints(
          currentTime,
          nextStageStart,
          workingPressure,
          driftConfig
        );
        dataPoints.push(...holdPoints.slice(1));
        currentTime = nextStageStart;
      }
    }
  } else {
    // No intermediate stages - hold at working pressure until end
    const finalHoldEnd = endTime - rampDuration;
    if (finalHoldEnd > currentTime) {
      const holdPoints = generateDriftPoints(
        currentTime,
        finalHoldEnd,
        workingPressure,
        driftConfig
      );
      dataPoints.push(...holdPoints.slice(1));
      currentTime = finalHoldEnd;
    }
  }

  // 4. Final ramp down to 0
  const rampDownPoints = generateRampPoints(
    currentTime,
    endTime,
    workingPressure,
    0,
    driftConfig
  );
  dataPoints.push(...rampDownPoints.slice(1));

  // 5. Final point: 0 pressure
  dataPoints.push([endTime, 0]);

  return dataPoints;
}

/**
 * Convert time-based data points to minutes-based for ECharts
 *
 * @param dataPoints - Array of [timestamp, pressure] points
 * @param startTime - Reference start time in milliseconds
 * @returns Array of [minutes, pressure] points
 */
export function convertToMinutes(
  dataPoints: Array<[number, number]>,
  startTime: number
): Array<[number, number]> {
  return dataPoints.map(([time, pressure]) => {
    const minutes = (time - startTime) / (60 * 1000);
    return [minutes, pressure];
  });
}

/**
 * Simplified interface for backward compatibility with existing code
 * Adds noise to a single pressure value
 *
 * @param pressure - Base pressure value
 * @param maxNoise - Maximum noise magnitude (absolute value)
 * @returns Pressure with added noise
 */
export function addNoise(pressure: number, maxNoise: number = 0.5): number {
  if (pressure === 0) return 0;

  // Simple uniform noise for compatibility
  const noise = (Math.random() - 0.5) * maxNoise;
  return Math.max(0, pressure + noise);
}
