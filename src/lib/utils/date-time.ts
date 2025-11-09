import { format as dateFnsFormat, formatDistanceToNow } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import type { Locale as DateFnsLocale } from 'date-fns';

export type DateFormat = 'MM/DD/YYYY' | 'DD.MM.YYYY' | 'YYYY-MM-DD';
export type TimeFormat = '12h' | '24h';

export interface DateTimeConfig {
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  timezone: string;
  locale?: DateFnsLocale; // Optional date-fns locale for localized formatting
}

/**
 * Common timezones with their display names
 */
export const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (UTC+0)' },
  { value: 'Europe/Moscow', label: 'Moscow (UTC+3)' },
  { value: 'Europe/London', label: 'London (UTC+0/+1)' },
  { value: 'Europe/Berlin', label: 'Berlin (UTC+1/+2)' },
  { value: 'America/New_York', label: 'New York (UTC-5/-4)' },
  { value: 'America/Chicago', label: 'Chicago (UTC-6/-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8/-7)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (UTC+8)' },
  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
  { value: 'Australia/Sydney', label: 'Sydney (UTC+10/+11)' },
] as const;

/**
 * Default date/time configuration
 */
export const DEFAULT_DATETIME_CONFIG: DateTimeConfig = {
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  timezone: 'UTC',
};

/**
 * Convert DateFormat to date-fns format string
 */
function getDateFormatString(dateFormat: DateFormat): string {
  switch (dateFormat) {
    case 'MM/DD/YYYY':
      return 'MM/dd/yyyy';
    case 'DD.MM.YYYY':
      return 'dd.MM.yyyy';
    case 'YYYY-MM-DD':
      return 'yyyy-MM-dd';
    default:
      return 'yyyy-MM-dd';
  }
}

/**
 * Get time format string based on TimeFormat
 */
function getTimeFormatString(timeFormat: TimeFormat): string {
  return timeFormat === '12h' ? 'hh:mm a' : 'HH:mm';
}

/**
 * Format a date according to user preferences
 *
 * @param date - Date to format
 * @param config - Optional configuration including dateFormat and locale
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  config: Partial<DateTimeConfig> = {}
): string {
  const { dateFormat = DEFAULT_DATETIME_CONFIG.dateFormat, locale } = config;

  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  return dateFnsFormat(dateObj, getDateFormatString(dateFormat), {
    locale,
  });
}

/**
 * Format a time according to user preferences
 *
 * @param date - Date to format
 * @param config - Optional configuration including timeFormat and locale
 * @returns Formatted time string
 */
export function formatTime(
  date: Date | string | number,
  config: Partial<DateTimeConfig> = {}
): string {
  const { timeFormat = DEFAULT_DATETIME_CONFIG.timeFormat, locale } = config;

  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  return dateFnsFormat(dateObj, getTimeFormatString(timeFormat), {
    locale,
  });
}

/**
 * Format date and time according to user preferences with timezone and locale
 *
 * @param date - Date to format
 * @param config - Optional configuration including dateFormat, timeFormat, timezone, and locale
 * @returns Formatted date and time string with timezone
 */
export function formatDateTime(
  date: Date | string | number,
  config: Partial<DateTimeConfig> = {}
): string {
  const {
    dateFormat = DEFAULT_DATETIME_CONFIG.dateFormat,
    timeFormat = DEFAULT_DATETIME_CONFIG.timeFormat,
    timezone = DEFAULT_DATETIME_CONFIG.timezone,
    locale,
  } = config;

  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const formatString = `${getDateFormatString(dateFormat)} ${getTimeFormatString(timeFormat)}`;

  try {
    return formatInTimeZone(dateObj, timezone, formatString, { locale });
  } catch (error) {
    console.error('Error formatting date with timezone:', error);
    return dateFnsFormat(dateObj, formatString, { locale });
  }
}

/**
 * Convert date to user's timezone
 */
export function toUserTimezone(
  date: Date | string | number,
  timezone: string = DEFAULT_DATETIME_CONFIG.timezone
): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  try {
    return toZonedTime(dateObj, timezone);
  } catch (error) {
    console.error('Error converting to timezone:', error);
    return dateObj;
  }
}

/**
 * Format relative time using date-fns with locale support
 *
 * @param date - Date to format
 * @param locale - Optional date-fns locale for localized output
 * @returns Localized relative time string (e.g., "2 hours ago", "2 часа назад")
 *
 * @example
 * ```ts
 * import { ru } from 'date-fns/locale';
 * formatRelativeTime(new Date('2025-11-06'), ru);
 * // Output: "1 день назад"
 * ```
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale?: DateFnsLocale
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale,
  });
}

/**
 * Get user's date/time configuration from localStorage (client-side only)
 * Note: Server-side components should fetch from database via getUserPreferences action
 *
 * @deprecated Use getUserPreferences server action for database-backed preferences
 */
export function getUserDateTimeConfig(): DateTimeConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_DATETIME_CONFIG;
  }

  try {
    const stored = localStorage.getItem('dateTimeConfig');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading date/time config:', error);
  }

  return DEFAULT_DATETIME_CONFIG;
}

/**
 * Save user's date/time configuration to localStorage (client-side only)
 *
 * @deprecated Use updateTimezone, updateDateFormat, updateTimeFormat server actions
 * for persistent storage in database
 */
export function setUserDateTimeConfig(config: Partial<DateTimeConfig>): void {
  if (typeof window === 'undefined') return;

  try {
    const currentConfig = getUserDateTimeConfig();
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem('dateTimeConfig', JSON.stringify(newConfig));
  } catch (error) {
    console.error('Error saving date/time config:', error);
  }
}
