/**
 * I18n Provider Component
 *
 * Initializes i18next for client-side components
 * Must be used in the root layout to provide translations to all client components
 *
 * Note: We don't use I18nextProvider because it causes issues with Next.js 16 RSC.
 * Instead, we initialize i18next globally and use useTranslation hook directly.
 */

'use client';

import { useEffect, useState } from 'react';
import { initI18next } from '@/i18n/client';
import { defaultLocale, type Locale } from '@/i18n/config';

interface I18nProviderProps {
  children: React.ReactNode;
}

/**
 * Get locale from cookie
 */
function getLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return defaultLocale;

  const match = document.cookie.match(/locale=([^;]+)/);
  return (match?.[1] as Locale) || defaultLocale;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const locale = getLocaleFromCookie();
      await initI18next(locale);
      setIsInitialized(true);
    };

    init();
  }, []);

  // Show loading state while i18next initializes
  if (!isInitialized) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
