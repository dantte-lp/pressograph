/**
 * date-fns locale integration with next-intl
 *
 * Maps application locales to date-fns locale objects for consistent
 * localization across UI translations and date formatting.
 */

import { enUS, ru } from 'date-fns/locale';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { Locale } from '@/i18n';

/**
 * Map of application locales to date-fns locale objects
 */
const DATE_LOCALE_MAP: Record<Locale, DateFnsLocale> = {
  en: enUS,
  ru: ru,
};

/**
 * Get date-fns locale object for given application locale
 *
 * @param locale - Application locale ('en' or 'ru')
 * @returns date-fns locale object
 *
 * @example
 * ```ts
 * import { format } from 'date-fns';
 * import { getDateLocale } from '@/lib/utils/get-date-locale';
 *
 * const locale = getDateLocale('ru');
 * format(new Date(), 'PPPPpp', { locale });
 * // Output: "7 ноября 2025 г. в 14:30"
 * ```
 */
export function getDateLocale(locale: Locale): DateFnsLocale {
  return DATE_LOCALE_MAP[locale] || enUS;
}

/**
 * Get date-fns locale from string (with fallback to English)
 *
 * Useful when locale might be undefined or from external source
 *
 * @param locale - Locale string (may be undefined)
 * @returns date-fns locale object
 */
export function getSafeDateLocale(locale?: string): DateFnsLocale {
  if (!locale || !(locale in DATE_LOCALE_MAP)) {
    return enUS;
  }
  return DATE_LOCALE_MAP[locale as Locale];
}
