/**
 * useTranslation Hook
 *
 * Custom hook for using next-intl translations in Client Components
 * Re-exports next-intl's useTranslations hook with compatibility layer
 *
 * Note: This hook must be used within the NextIntlClientProvider context
 */

'use client';

import { useTranslations } from 'next-intl';

/**
 * Hook for translations with next-intl
 *
 * Provides compatibility with previous react-i18next usage patterns
 * All translation keys use dot notation (e.g., 'nav.dashboard', 'common.save')
 *
 * @returns Translation object with t function
 */
export function useTranslation() {
  const t = useTranslations();

  return { t };
}
