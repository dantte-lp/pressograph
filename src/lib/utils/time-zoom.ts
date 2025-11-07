/**
 * Time Zoom Utility
 *
 * Provides time scale zoom functionality for pressure test graphs.
 * Allows users to focus on specific time periods of tests for detailed analysis.
 *
 * @module lib/utils/time-zoom
 */

/**
 * Time scale zoom level for detailed viewing
 */
export type TimeScale = 'auto' | '1x' | '2x' | '4x' | '10x';

/**
 * Custom time window for zoomed view (in minutes from test start)
 */
export interface TimeWindow {
  /** Start time in minutes from test start */
  start: number;
  /** End time in minutes from test start */
  end: number;
}

/**
 * Result of time zoom calculation
 */
export interface ZoomedTimeWindow {
  /** Minimum time value in minutes */
  min: number;
  /** Maximum time value in minutes */
  max: number;
  /** Duration in minutes */
  duration: number;
  /** Duration in hours */
  durationHours: number;
  /** Whether zoom is active */
  isZoomed: boolean;
  /** Zoom factor (1 = no zoom, 2 = 2x zoom, etc.) */
  zoomFactor: number;
}

/**
 * Calculate zoomed time window based on timeScale or custom timeWindow
 *
 * @param testDurationHours - Total test duration in hours
 * @param timeScale - Preset zoom level ('auto', '1x', '2x', '4x', '10x')
 * @param timeWindow - Custom time window (overrides timeScale)
 * @returns Zoomed time window with min, max, duration, and metadata
 *
 * @example
 * ```typescript
 * // 2x zoom of a 24-hour test (shows first 12 hours)
 * const zoomed = calculateZoomedTimeWindow(24, '2x');
 * // { min: 0, max: 720, duration: 720, durationHours: 12, isZoomed: true, zoomFactor: 2 }
 *
 * // Custom window: minutes 60-90
 * const custom = calculateZoomedTimeWindow(24, 'auto', { start: 60, end: 90 });
 * // { min: 60, max: 90, duration: 30, durationHours: 0.5, isZoomed: true, zoomFactor: 48 }
 * ```
 */
export function calculateZoomedTimeWindow(
  testDurationHours: number,
  timeScale: TimeScale = 'auto',
  timeWindow?: TimeWindow
): ZoomedTimeWindow {
  const totalMinutes = testDurationHours * 60;

  // Custom time window overrides timeScale
  if (timeWindow) {
    const min = Math.max(0, timeWindow.start);
    const max = Math.min(totalMinutes, timeWindow.end);
    const duration = max - min;
    return {
      min,
      max,
      duration,
      durationHours: duration / 60,
      isZoomed: true,
      zoomFactor: totalMinutes / duration,
    };
  }

  // Calculate based on timeScale preset
  let max: number;
  let zoomFactor: number;

  switch (timeScale) {
    case '2x':
      max = totalMinutes / 2;
      zoomFactor = 2;
      break;
    case '4x':
      max = totalMinutes / 4;
      zoomFactor = 4;
      break;
    case '10x':
      max = totalMinutes / 10;
      zoomFactor = 10;
      break;
    case '1x':
      max = totalMinutes;
      zoomFactor = 1;
      break;
    case 'auto':
    default:
      max = totalMinutes;
      zoomFactor = 1;
      break;
  }

  const duration = max;
  return {
    min: 0,
    max,
    duration,
    durationHours: duration / 60,
    isZoomed: timeScale !== 'auto' && timeScale !== '1x',
    zoomFactor,
  };
}

/**
 * Get appropriate X-axis interval for zoomed view
 *
 * Algorithm:
 * - Aims for 8-15 tick marks on the axis for optimal readability
 * - Uses common interval values: 1h, 2h, 3h, 4h, 6h, 12h, 24h for large ranges
 * - Uses smaller intervals (5min, 10min, 15min, 30min, 1h) for zoomed views
 * - Prefers smaller intervals when multiple options are valid (better granularity)
 *
 * @param displayHours - Hours displayed on axis
 * @returns Interval in minutes
 *
 * @example
 * ```typescript
 * // Full 24-hour test
 * getZoomInterval(24); // 120 (2 hours)
 *
 * // 2x zoom (12 hours)
 * getZoomInterval(12); // 60 (1 hour)
 *
 * // 10x zoom (2.4 hours)
 * getZoomInterval(2.4); // 15 (15 minutes)
 * ```
 */
export function getZoomInterval(displayHours: number): number {
  // Target tick count: aim for 10-12 ticks (comfortable range: 8-15)
  const targetTicks = 10;

  // Common interval values in minutes (ordered from smallest to largest)
  // For zoomed views, include smaller intervals
  const commonIntervals =
    displayHours < 2
      ? [5, 10, 15, 30, 60] // Very zoomed: 5min, 10min, 15min, 30min, 1h
      : displayHours < 6
        ? [10, 15, 30, 60, 120] // Moderately zoomed: 10min, 15min, 30min, 1h, 2h
        : [60, 120, 180, 240, 360, 720, 1440]; // Normal: 1h, 2h, 3h, 4h, 6h, 12h, 24h

  // Find all intervals that provide 8-15 ticks
  const validIntervals: Array<{ interval: number; tickCount: number }> = [];

  for (const interval of commonIntervals) {
    const intervalHours = interval / 60;
    const tickCount = displayHours / intervalHours;

    // Check if tick count is in acceptable range (8-15 ticks)
    if (tickCount >= 8 && tickCount <= 15) {
      validIntervals.push({ interval, tickCount });
    }
  }

  // If we have valid intervals, prefer smaller ones (better granularity)
  if (validIntervals.length > 0) {
    // Sort by interval size (prefer smaller for better granularity)
    validIntervals.sort((a, b) => a.interval - b.interval);
    return validIntervals[0].interval;
  }

  // Fallback: If no interval gives 8-15 ticks, find the one closest to target
  let bestInterval = commonIntervals[0];
  let bestDiff = Infinity;

  for (const interval of commonIntervals) {
    const intervalHours = interval / 60;
    const tickCount = displayHours / intervalHours;
    const diff = Math.abs(tickCount - targetTicks);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestInterval = interval;
    }
  }

  return bestInterval;
}

/**
 * Format time window description for display
 *
 * @param zoomedWindow - Zoomed time window result
 * @param includeZoomFactor - Include zoom factor in description
 * @returns Human-readable description
 *
 * @example
 * ```typescript
 * const zoomed = calculateZoomedTimeWindow(24, '2x');
 * formatTimeWindowDescription(zoomed);
 * // "0-720 min (2x zoom)"
 *
 * const custom = calculateZoomedTimeWindow(24, 'auto', { start: 60, end: 90 });
 * formatTimeWindowDescription(custom);
 * // "60-90 min (48.0x zoom)"
 * ```
 */
export function formatTimeWindowDescription(
  zoomedWindow: ZoomedTimeWindow,
  includeZoomFactor = true
): string {
  const { min, max, isZoomed, zoomFactor } = zoomedWindow;

  if (!isZoomed) {
    return 'Full test duration';
  }

  const description = `${min}-${max} min`;

  if (includeZoomFactor) {
    return `${description} (${zoomFactor.toFixed(zoomFactor >= 10 ? 0 : 1)}x zoom)`;
  }

  return description;
}
