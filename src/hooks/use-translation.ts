/**
 * useTranslation Hook
 *
 * Custom hook for using i18next translations in Client Components
 * Re-exports react-i18next's useTranslation hook with proper typing
 *
 * Note: This hook must be used within the I18nProvider context
 */

'use client';

import { useTranslation as useI18nextTranslation } from 'react-i18next';

/**
 * Hook for translations
 *
 * @param namespace - Translation namespace (default: 'common')
 * @returns Translation object with t function and other utilities
 */
export function useTranslation(namespace: string = 'common') {
  return useI18nextTranslation(namespace);
}
