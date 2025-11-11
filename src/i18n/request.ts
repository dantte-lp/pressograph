/**
 * next-intl Request Configuration
 *
 * Configures internationalization for Next.js App Router with next-intl
 * Compatible with Next.js 16 and static site generation
 */

import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Get locale from cookie or default to 'en'
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale');
  const locale = localeCookie?.value || 'en';

  // Validate locale
  const validLocales = ['en', 'ru'];
  const validatedLocale = validLocales.includes(locale) ? locale : 'en';

  return {
    locale: validatedLocale,
    messages: (await import(`../../messages/${validatedLocale}.json`)).default,
  };
});
