import { format as dateFnsFormat } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export type DateFormat = 'MM/DD/YYYY' | 'DD.MM.YYYY' | 'YYYY-MM-DD';
export type TimeFormat = '12h' | '24h';

export interface DateTimeConfig {
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  timezone: string;
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
 */
export function formatDate(
  date: Date | string | number,
  config: Partial<DateTimeConfig> = {}
): string {
  const { dateFormat = DEFAULT_DATETIME_CONFIG.dateFormat } = config;

  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  return dateFnsFormat(dateObj, getDateFormatString(dateFormat));
}

/**
 * Format a time according to user preferences
 */
export function formatTime(
  date: Date | string | number,
  config: Partial<DateTimeConfig> = {}
): string {
  const { timeFormat = DEFAULT_DATETIME_CONFIG.timeFormat } = config;

  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  return dateFnsFormat(dateObj, getTimeFormatString(timeFormat));
}

/**
 * Format date and time according to user preferences with timezone
 */
export function formatDateTime(
  date: Date | string | number,
  config: Partial<DateTimeConfig> = {}
): string {
  const {
    dateFormat = DEFAULT_DATETIME_CONFIG.dateFormat,
    timeFormat = DEFAULT_DATETIME_CONFIG.timeFormat,
    timezone = DEFAULT_DATETIME_CONFIG.timezone,
  } = config;

  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const formatString = `${getDateFormatString(dateFormat)} ${getTimeFormatString(timeFormat)}`;

  try {
    return formatInTimeZone(dateObj, timezone, formatString);
  } catch (error) {
    console.error('Error formatting date with timezone:', error);
    return dateFnsFormat(dateObj, formatString);
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
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string | number, locale: string = 'en'): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (Math.abs(diffInSeconds) < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (Math.abs(diffInSeconds) < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (Math.abs(diffInSeconds) < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (Math.abs(diffInSeconds) < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}

/**
 * Get user's date/time configuration from cookies or localStorage
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
 * Save user's date/time configuration
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
