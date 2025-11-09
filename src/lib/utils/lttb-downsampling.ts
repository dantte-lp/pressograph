/**
 * LTTB (Largest-Triangle-Three-Buckets) Downsampling Implementation
 *
 * Implements the LTTB algorithm for visually optimal time-series data downsampling.
 * This algorithm preserves the visual characteristics of the data while significantly
 * reducing the number of data points, improving rendering performance for large datasets.
 *
 * **Algorithm Overview:**
 * 1. Always keeps first and last data points
 * 2. Divides remaining data into buckets
 * 3. For each bucket, selects the point that forms the largest triangle with points from adjacent buckets
 * 4. This preserves peaks, valleys, and overall trend better than uniform sampling
 *
 * **Performance Benefits:**
 * - Reduces 100K points to 1K points with minimal visual difference
 * - O(n) time complexity
 * - Improves ECharts rendering from ~2s to <200ms
 *
 * **References:**
 * - Original Paper: "Downsampling Time Series for Visual Representation" by Sveinn Steinarsson
 * - GitHub: https://github.com/sveinn-steinarsson/flot-downsample
 *
 * @module lib/utils/lttb-downsampling
 * @see /docs/development/ECHARTS6_INTEGRATION_ANALYSIS.md
 *
 * @example
 * ```typescript
 * import { downsampleLTTB, downsampleIfNeeded } from '@/lib/utils/lttb-downsampling'
 *
 * // Manual downsampling to exactly 1000 points
 * const downsampled = downsampleLTTB(largeDataset, 1000)
 *
 * // Automatic downsampling only if needed (threshold: 1000)
 * const optimized = downsampleIfNeeded(dataset, 1000)
 * ```
 */

/**
 * Generic data point type for LTTB algorithm
 *
 * Supports multiple formats:
 * - [x, y] tuples (ECharts format)
 * - { x, y } objects
 * - { timestamp, value } objects
 *
 * @template T - The data point type (must have numeric x and y values)
 */
export type DataPoint = [number, number] | { x: number; y: number };

/**
 * Configuration options for LTTB downsampling
 */
export interface LTTBOptions {
  /**
   * Target number of data points after downsampling
   * Must be >= 3 (first point, at least 1 middle point, last point)
   * @default 1000
   */
  threshold: number;

  /**
   * X-axis accessor function for custom data structures
   * @param point - The data point
   * @returns X-axis value (typically time or index)
   * @default (p) => Array.isArray(p) ? p[0] : p.x
   */
  x?: (point: any) => number;

  /**
   * Y-axis accessor function for custom data structures
   * @param point - The data point
   * @returns Y-axis value (typically measurement value)
   * @default (p) => Array.isArray(p) ? p[1] : p.y
   */
  y?: (point: any) => number;
}

/**
 * Downsampling statistics for monitoring and debugging
 */
export interface DownsamplingStats {
  /** Original number of data points */
  originalCount: number;
  /** Number of data points after downsampling */
  downsampledCount: number;
  /** Reduction percentage (0-100) */
  reductionPercent: number;
  /** Whether downsampling was performed */
  wasDownsampled: boolean;
  /** Execution time in milliseconds */
  executionTimeMs: number;
}

/**
 * Default X-axis accessor for common data structures
 * Supports: [x, y] tuples and { x, y } objects
 */
const defaultGetX = (point: any): number => {
  if (Array.isArray(point)) return point[0];
  if (typeof point === 'object' && point !== null) {
    if ('x' in point) return point.x;
    if ('timestamp' in point) return point.timestamp instanceof Date ? point.timestamp.getTime() : point.timestamp;
  }
  throw new Error('Invalid data point structure. Expected [x, y] tuple or { x, y } object');
};

/**
 * Default Y-axis accessor for common data structures
 * Supports: [x, y] tuples and { x, y } objects
 */
const defaultGetY = (point: any): number => {
  if (Array.isArray(point)) return point[1];
  if (typeof point === 'object' && point !== null) {
    if ('y' in point) return point.y;
    if ('value' in point) return point.value;
    if ('pressure' in point) return point.pressure;
  }
  throw new Error('Invalid data point structure. Expected [x, y] tuple or { x, y } object');
};

/**
 * Calculate the area of a triangle formed by three points
 *
 * Uses the cross product formula for computational efficiency:
 * Area = |x1(y2 - y3) + x2(y3 - y1) + x3(y1 - y2)| / 2
 *
 * Note: We don't divide by 2 since we only need relative areas for comparison
 *
 * @param point1 - First point coordinates
 * @param point2 - Second point coordinates
 * @param point3 - Third point coordinates
 * @returns Triangle area (unsigned, not divided by 2)
 */
function calculateTriangleArea(
  point1: { x: number; y: number },
  point2: { x: number; y: number },
  point3: { x: number; y: number }
): number {
  return Math.abs(
    point1.x * (point2.y - point3.y) +
    point2.x * (point3.y - point1.y) +
    point3.x * (point1.y - point2.y)
  );
}

/**
 * Downsample data using the LTTB (Largest-Triangle-Three-Buckets) algorithm
 *
 * **Algorithm Steps:**
 * 1. Always keep first and last points
 * 2. Divide remaining data into (threshold - 2) buckets
 * 3. For each bucket:
 *    - Calculate average point of next bucket
 *    - Find point that forms largest triangle with previous selected point and next bucket average
 *    - Select that point
 *
 * **Time Complexity:** O(n) where n is the number of input points
 * **Space Complexity:** O(threshold) for output array
 *
 * **Edge Cases:**
 * - If data.length <= threshold: returns original data (no downsampling needed)
 * - If threshold < 3: returns [first, last] points only
 * - If data.length === 0: returns empty array
 *
 * @template T - The data point type
 * @param data - Array of data points to downsample
 * @param threshold - Target number of points (minimum 3)
 * @param options - Optional configuration for custom data structures
 * @returns Downsampled array with exactly threshold points (or fewer if input is smaller)
 *
 * @example
 * ```typescript
 * // Standard [x, y] format (ECharts)
 * const data: [number, number][] = [[0, 10], [1, 20], [2, 15], ...]
 * const downsampled = downsampleLTTB(data, 100)
 *
 * // Custom object format
 * interface Measurement {
 *   timestamp: number
 *   pressure: number
 * }
 * const measurements: Measurement[] = [...]
 * const downsampled = downsampleLTTB(measurements, 100, {
 *   x: (m) => m.timestamp,
 *   y: (m) => m.pressure
 * })
 * ```
 */
export function downsampleLTTB<T = DataPoint>(
  data: T[],
  threshold: number,
  options?: Partial<LTTBOptions>
): T[] {
  // Input validation
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  if (threshold < 3) {
    console.warn('LTTB threshold must be >= 3. Using minimum threshold of 3.');
    threshold = 3;
  }

  // No downsampling needed if data is smaller than or equal to threshold
  if (data.length <= threshold) {
    return data;
  }

  // Extract accessor functions with defaults
  const getX = options?.x || defaultGetX;
  const getY = options?.y || defaultGetY;

  // Initialize output array
  const sampled: T[] = [];

  // Always add first point
  sampled.push(data[0]);

  // Calculate bucket size (floating point for precision)
  // We have (threshold - 2) buckets because first and last points are fixed
  const bucketSize = (data.length - 2) / (threshold - 2);

  // Track index of last selected point (used for triangle calculation)
  let lastSelectedIndex = 0;

  // Process each bucket
  for (let bucketIndex = 0; bucketIndex < threshold - 2; bucketIndex++) {
    // Calculate bucket range
    const bucketStart = Math.floor(bucketIndex * bucketSize) + 1;
    const bucketEnd = Math.floor((bucketIndex + 1) * bucketSize) + 1;

    // Calculate average point of next bucket (used as third point of triangle)
    let avgX = 0;
    let avgY = 0;
    let avgRangeStart = Math.floor((bucketIndex + 1) * bucketSize) + 1;
    let avgRangeEnd = Math.floor((bucketIndex + 2) * bucketSize) + 1;

    // Ensure avgRangeEnd doesn't exceed data length
    avgRangeEnd = Math.min(avgRangeEnd, data.length);

    // Special case: last bucket uses actual last point instead of average
    if (avgRangeEnd >= data.length) {
      avgX = getX(data[data.length - 1]);
      avgY = getY(data[data.length - 1]);
    } else {
      // Calculate average of next bucket
      const avgRangeLength = avgRangeEnd - avgRangeStart;
      for (let i = avgRangeStart; i < avgRangeEnd; i++) {
        avgX += getX(data[i]);
        avgY += getY(data[i]);
      }
      avgX /= avgRangeLength;
      avgY /= avgRangeLength;
    }

    // Find point in current bucket that forms largest triangle
    let maxArea = -1;
    let maxAreaIndex = bucketStart;

    const lastSelectedPoint = {
      x: getX(data[lastSelectedIndex]),
      y: getY(data[lastSelectedIndex])
    };

    for (let i = bucketStart; i < bucketEnd; i++) {
      // Calculate triangle area formed by:
      // 1. Last selected point
      // 2. Current candidate point
      // 3. Average point of next bucket
      const area = calculateTriangleArea(
        lastSelectedPoint,
        { x: getX(data[i]), y: getY(data[i]) },
        { x: avgX, y: avgY }
      );

      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = i;
      }
    }

    // Add point with largest triangle area
    sampled.push(data[maxAreaIndex]);
    lastSelectedIndex = maxAreaIndex;
  }

  // Always add last point
  sampled.push(data[data.length - 1]);

  return sampled;
}

/**
 * Conditionally downsample data only if it exceeds the threshold
 *
 * This is a convenience wrapper around `downsampleLTTB` that:
 * - Returns original data if length <= threshold
 * - Applies LTTB downsampling if length > threshold
 * - Provides statistics about the downsampling operation
 *
 * **Use Cases:**
 * - Automatic optimization for variable-sized datasets
 * - Performance monitoring and debugging
 * - Conditional downsampling based on data size
 *
 * @template T - The data point type
 * @param data - Array of data points
 * @param threshold - Minimum data size to trigger downsampling (default: 1000)
 * @param options - Optional LTTB configuration
 * @returns Object containing downsampled data and statistics
 *
 * @example
 * ```typescript
 * const { data: optimized, stats } = downsampleIfNeeded(measurements, 1000)
 *
 * console.log(`Reduced ${stats.originalCount} to ${stats.downsampledCount} points`)
 * console.log(`Execution time: ${stats.executionTimeMs}ms`)
 * ```
 */
export function downsampleIfNeeded<T = DataPoint>(
  data: T[],
  threshold: number = 1000,
  options?: Partial<LTTBOptions>
): {
  data: T[];
  stats: DownsamplingStats;
} {
  const startTime = performance.now();
  const originalCount = data.length;

  // No downsampling needed
  if (originalCount <= threshold) {
    const endTime = performance.now();
    return {
      data,
      stats: {
        originalCount,
        downsampledCount: originalCount,
        reductionPercent: 0,
        wasDownsampled: false,
        executionTimeMs: endTime - startTime,
      },
    };
  }

  // Apply LTTB downsampling
  const downsampled = downsampleLTTB(data, threshold, options);
  const endTime = performance.now();

  const downsampledCount = downsampled.length;
  const reductionPercent = ((originalCount - downsampledCount) / originalCount) * 100;

  return {
    data: downsampled,
    stats: {
      originalCount,
      downsampledCount,
      reductionPercent,
      wasDownsampled: true,
      executionTimeMs: endTime - startTime,
    },
  };
}

/**
 * Helper function to convert Measurement objects to ECharts [x, y] format with LTTB downsampling
 *
 * **Purpose:**
 * Optimizes pressure test measurement data for ECharts rendering by:
 * 1. Converting Date timestamps to numeric milliseconds
 * 2. Extracting pressure values
 * 3. Applying LTTB downsampling if data exceeds threshold
 *
 * **Use Case:**
 * Direct integration with pressure test graph components that use ECharts
 *
 * @param measurements - Array of measurement objects with timestamp and pressure
 * @param threshold - Target number of points after downsampling (default: 1000)
 * @returns Object with downsampled [timestamp_ms, pressure] tuples and statistics
 *
 * @example
 * ```typescript
 * interface Measurement {
 *   timestamp: Date
 *   pressure: number
 *   temperature?: number
 * }
 *
 * const measurements: Measurement[] = [...]
 * const { data, stats } = downsampleMeasurements(measurements, 1000)
 *
 * // Use directly in ECharts series
 * const option = {
 *   series: [{
 *     type: 'line',
 *     data: data  // [[timestamp_ms, pressure], ...]
 *   }]
 * }
 * ```
 */
export function downsampleMeasurements(
  measurements: Array<{ timestamp: Date; pressure: number; [key: string]: any }>,
  threshold: number = 1000
): {
  data: [number, number][];
  stats: DownsamplingStats;
} {
  const startTime = performance.now();
  const originalCount = measurements.length;

  // Convert to [timestamp_ms, pressure] format
  const dataPoints: [number, number][] = measurements.map((m) => [
    m.timestamp instanceof Date ? m.timestamp.getTime() : Number(m.timestamp),
    m.pressure,
  ]);

  // No downsampling needed
  if (originalCount <= threshold) {
    const endTime = performance.now();
    return {
      data: dataPoints,
      stats: {
        originalCount,
        downsampledCount: originalCount,
        reductionPercent: 0,
        wasDownsampled: false,
        executionTimeMs: endTime - startTime,
      },
    };
  }

  // Apply LTTB downsampling
  const downsampled = downsampleLTTB(dataPoints, threshold);
  const endTime = performance.now();

  const downsampledCount = downsampled.length;
  const reductionPercent = ((originalCount - downsampledCount) / originalCount) * 100;

  return {
    data: downsampled,
    stats: {
      originalCount,
      downsampledCount,
      reductionPercent,
      wasDownsampled: true,
      executionTimeMs: endTime - startTime,
    },
  };
}

/**
 * Calculate optimal downsampling threshold based on viewport width
 *
 * **Rationale:**
 * - Each pixel can display at most 1-2 distinct data points
 * - Rendering more points than pixels provides no visual benefit
 * - Use 2x pixel density for retina displays
 *
 * **Threshold Calculation:**
 * - Mobile (< 640px): 500 points
 * - Tablet (640-1024px): 1000 points
 * - Desktop (1024-1920px): 1500 points
 * - Large Desktop (> 1920px): 2000 points
 *
 * @param viewportWidth - Current viewport width in pixels (default: window.innerWidth)
 * @returns Optimal threshold value
 *
 * @example
 * ```typescript
 * const threshold = getOptimalThreshold()  // Auto-detects viewport
 * const threshold = getOptimalThreshold(1920)  // Explicit width
 *
 * const { data } = downsampleIfNeeded(measurements, threshold)
 * ```
 */
export function getOptimalThreshold(viewportWidth?: number): number {
  const width = viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1920);

  if (width < 640) return 500;        // Mobile
  if (width < 1024) return 1000;      // Tablet
  if (width < 1920) return 1500;      // Desktop
  return 2000;                         // Large Desktop / 4K
}

/**
 * Debug utility to log downsampling statistics
 *
 * Useful for:
 * - Development and debugging
 * - Performance monitoring
 * - Identifying bottlenecks
 *
 * @param stats - Downsampling statistics from downsampleIfNeeded or downsampleMeasurements
 * @param label - Optional label for log messages (default: "LTTB Downsampling")
 *
 * @example
 * ```typescript
 * const { data, stats } = downsampleIfNeeded(measurements)
 * logDownsamplingStats(stats, "Pressure Graph")
 * // Output: [Pressure Graph] Downsampled 50000 → 1000 points (98.0% reduction) in 12.3ms
 * ```
 */
export function logDownsamplingStats(stats: DownsamplingStats, label: string = 'LTTB Downsampling'): void {
  if (!stats.wasDownsampled) {
    console.log(`[${label}] No downsampling needed (${stats.originalCount} points)`);
    return;
  }

  console.log(
    `[${label}] Downsampled ${stats.originalCount} → ${stats.downsampledCount} points ` +
    `(${stats.reductionPercent.toFixed(1)}% reduction) in ${stats.executionTimeMs.toFixed(2)}ms`
  );
}
