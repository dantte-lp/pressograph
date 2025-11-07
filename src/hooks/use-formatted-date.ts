/**
 * Custom hooks for localized date formatting
 *
 * These hooks integrate next-intl locale with date-fns for consistent,
 * localized date formatting across client components.
 */

'use client';

import { useLocale } from 'next-intl';
import { formatInTimeZone } from 'date-fns-tz';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/utils/get-date-locale';
import { getUserDateTimeConfig } from '@/lib/utils/date-time';
import type { Locale } from '@/i18n';

/**
 * Hook for formatting dates with user's locale and timezone
 *
 * @returns Function to format dates with current locale and timezone
 *
 * @example
 * ```tsx
 * function TestCard({ test }) {
 *   const formatDate = useFormattedDate();
 *
 *   return (
 *     <div>
 *       <p>Created: {formatDate(test.createdAt)}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFormattedDate() {
  const locale = useLocale() as Locale;
  const dateLocale = getDateLocale(locale);
  const config = getUserDateTimeConfig();

  return (date: Date | string, pattern: string = 'PPPPpp') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return formatInTimeZone(dateObj, config.timezone, pattern, {
      locale: dateLocale,
    });
  };
}

/**
 * Hook for formatting relative time with user's locale
 *
 * @returns Function to format relative time with current locale
 *
 * @example
 * ```tsx
 * function ActivityFeed({ activities }) {
 *   const formatRelative = useRelativeTime();
 *
 *   return (
 *     <ul>
 *       {activities.map(activity => (
 *         <li key={activity.id}>
 *           {activity.message} - {formatRelative(activity.timestamp)}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useRelativeTime() {
  const locale = useLocale() as Locale;
  const dateLocale = getDateLocale(locale);

  return (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale: dateLocale,
    });
  };
}

/**
 * Hook for formatting short dates (e.g., "Nov 7, 2025")
 *
 * @returns Function to format dates in short format with current locale
 *
 * @example
 * ```tsx
 * function TestList({ tests }) {
 *   const formatShortDate = useShortDate();
 *
 *   return (
 *     <table>
 *       <tbody>
 *         {tests.map(test => (
 *           <tr key={test.id}>
 *             <td>{test.name}</td>
 *             <td>{formatShortDate(test.createdAt)}</td>
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *   );
 * }
 * ```
 */
export function useShortDate() {
  const locale = useLocale() as Locale;
  const dateLocale = getDateLocale(locale);

  return (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const config = getUserDateTimeConfig();

    return formatInTimeZone(dateObj, config.timezone, 'PPP', {
      locale: dateLocale,
    });
  };
}
