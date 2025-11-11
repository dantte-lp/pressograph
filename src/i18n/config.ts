/**
 * i18n Configuration
 *
 * Configures internationalization for next-intl
 * Compatible with Next.js 16 App Router and static site generation
 */

export const defaultLocale = 'en' as const;
export const locales = ['en', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
};

export const i18nConfig = {
  defaultLocale,
  locales,
  localeDetection: false, // We handle detection via cookies
} as const;
