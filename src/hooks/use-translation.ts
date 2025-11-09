/**
 * useTranslation Hook
 *
 * Custom hook for using i18next translations in Client Components
 * Automatically detects locale from cookies
 */

'use client';

import { useEffect, useState } from 'react';
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { initI18next } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import { defaultLocale } from '@/i18n/config';

/**
 * Get locale from cookie
 */
function getLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return defaultLocale;

  const match = document.cookie.match(/locale=([^;]+)/);
  return (match?.[1] as Locale) || defaultLocale;
}

/**
 * Hook for translations with automatic locale detection
 */
export function useTranslation(namespace: string = 'common') {
  const [isInitialized, setIsInitialized] = useState(false);
  const locale = getLocaleFromCookie();

  useEffect(() => {
    const init = async () => {
      await initI18next(locale);
      setIsInitialized(true);
    };

    init();
  }, [locale]);

  const translation = useI18nextTranslation(namespace);

  return {
    ...translation,
    isReady: isInitialized && translation.ready,
  };
}
