/**
 * Formatting utilities for the application
 */

import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format bytes to human-readable string
 *
 * @param bytes - Number of bytes to format
 * @returns Formatted string like "1.5 MB"
 *
 * @example
 * ```ts
 * formatBytes(0) // "0 Bytes"
 * formatBytes(1024) // "1 KB"
 * formatBytes(1536) // "1.5 KB"
 * formatBytes(1048576) // "1 MB"
 * ```
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format a number with thousand separators
 *
 * @param num - Number to format
 * @returns Formatted string like "1,234,567"
 *
 * @example
 * ```ts
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1000) // "1,000"
 * ```
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format a percentage value
 *
 * @param value - Decimal value (0-1)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 *
 * @example
 * ```ts
 * formatPercentage(0.125) // "12.5%"
 * formatPercentage(0.125, 0) // "13%"
 * formatPercentage(1) // "100%"
 * ```
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a duration in milliseconds to human-readable string
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 *
 * @example
 * ```ts
 * formatDuration(1000) // "1s"
 * formatDuration(60000) // "1m"
 * formatDuration(3661000) // "1h 1m 1s"
 * ```
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  return `${seconds}s`;
}

/**
 * Format pressure value with unit
 *
 * @param pressure - Pressure value
 * @param unit - Pressure unit (default: 'bar')
 * @returns Formatted pressure string
 *
 * @example
 * ```ts
 * formatPressure(150) // "150 bar"
 * formatPressure(2000, 'psi') // "2,000 psi"
 * ```
 */
export function formatPressure(pressure: number, unit: string = 'bar'): string {
  return `${formatNumber(pressure)} ${unit}`;
}

/**
 * Format date to short format (e.g., "Jan 15, 2025")
 *
 * This function prevents hydration mismatches by using consistent
 * formatting on both server and client sides via date-fns.
 *
 * @param date - Date to format (Date object or string)
 * @returns Formatted date string
 *
 * @example
 * ```ts
 * formatDate(new Date('2025-01-15')) // "Jan 15, 2025"
 * formatDate('2025-01-15T10:30:00Z') // "Jan 15, 2025"
 * ```
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM dd, yyyy');
}

/**
 * Format date and time to readable format (e.g., "Jan 15, 2025 at 10:30 AM")
 *
 * This function prevents hydration mismatches by using consistent
 * formatting on both server and client sides via date-fns.
 *
 * @param date - Date to format (Date object or string)
 * @returns Formatted date and time string
 *
 * @example
 * ```ts
 * formatDateTime(new Date('2025-01-15T10:30:00')) // "Jan 15, 2025 at 10:30 AM"
 * formatDateTime('2025-01-15T14:45:00Z') // "Jan 15, 2025 at 2:45 PM"
 * ```
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM dd, yyyy \'at\' h:mm a');
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 *
 * @param date - Date to format (Date object or string)
 * @returns Relative time string
 *
 * @example
 * ```ts
 * formatRelativeTime(new Date(Date.now() - 3600000)) // "about 1 hour ago"
 * formatRelativeTime('2025-01-15T10:30:00Z') // "2 days ago"
 * ```
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}
