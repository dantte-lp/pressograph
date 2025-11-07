import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

// Static imports for Edge Runtime compatibility
import enMessages from '../messages/en.json';
import ruMessages from '../messages/ru.json';

export const locales = ['en', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Message map for static imports
const messages = {
  en: enMessages,
  ru: ruMessages,
} as const;

export default getRequestConfig(async () => {
  // Get locale from cookie or use default
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale');
  const locale = (localeCookie?.value as Locale) || defaultLocale;

  return {
    locale,
    messages: messages[locale],
  };
});
