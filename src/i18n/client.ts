/**
 * i18n Client Configuration
 *
 * Client-side i18next setup for use in Client Components
 */

'use client';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { defaultLocale, locales, type Locale } from './config';

// Initialize i18next only once
const initI18next = async (locale: Locale) => {
  if (!i18next.isInitialized) {
    await i18next
      .use(initReactI18next)
      .use(
        resourcesToBackend(
          (language: string, namespace: string) =>
            import(`./locales/${language}/${namespace}.json`)
        )
      )
      .init({
        lng: locale,
        fallbackLng: defaultLocale,
        supportedLngs: locales,
        defaultNS: 'common',
        fallbackNS: 'common',
        ns: ['common'],
        preload: typeof window === 'undefined' ? locales : [],
        react: {
          useSuspense: false,
        },
        interpolation: {
          escapeValue: false,
        },
      });
  } else {
    // If already initialized, just change language
    if (i18next.language !== locale) {
      await i18next.changeLanguage(locale);
    }
  }
};

export { initI18next };
export default i18next;
