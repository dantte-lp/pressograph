/**
 * Locale Switcher Component
 *
 * Allows users to switch between available application languages.
 * Compatible with Next.js 16 App Router and next-intl.
 * Uses shadcn/ui Select component.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Locales definition (duplicated from i18n.ts to avoid server-side imports in client component)
export const locales = ['en', 'ru'] as const;
export type Locale = (typeof locales)[number];

/**
 * Locale display names with country codes
 * Note: Using text instead of emoji flags for better cross-browser compatibility
 * (emoji flags don't render consistently in all browsers, especially Chrome on Windows)
 */
const LOCALE_NAMES: Record<Locale, string> = {
  en: 'EN | English',
  ru: 'RU | Русский',
};

interface LocaleSwitcherProps {
  /**
   * Current locale (passed from server component)
   * @required
   */
  currentLocale: Locale;

  /**
   * Custom className for the Select trigger
   */
  className?: string;

  /**
   * Size variant for the select
   * @default "default"
   */
  size?: 'sm' | 'default' | 'lg';
}

/**
 * LocaleSwitcher component
 *
 * Displays a dropdown for switching between available application languages.
 * The selected locale is stored in a cookie and the page is refreshed to apply changes.
 *
 * IMPORTANT: This component requires the currentLocale prop to be passed from a Server Component
 * that reads the locale from cookies. This avoids the need for next-intl context.
 *
 * @example
 * ```tsx
 * // In Server Component (e.g., layout or header)
 * import { cookies } from 'next/headers';
 * import { LocaleSwitcher } from '@/components/locale-switcher';
 *
 * export default async function Header() {
 *   const cookieStore = await cookies();
 *   const locale = (cookieStore.get('locale')?.value || 'en') as Locale;
 *
 *   return <LocaleSwitcher currentLocale={locale} />;
 * }
 *
 * // With custom styling
 * <LocaleSwitcher currentLocale={locale} className="w-[180px]" size="sm" />
 * ```
 */
export function LocaleSwitcher({
  currentLocale,
  className,
  size = 'default',
}: LocaleSwitcherProps) {
  const [locale, setLocale] = useState<Locale>(currentLocale);
  const router = useRouter();

  // Update local state when prop changes (e.g., after server refresh)
  useEffect(() => {
    setLocale(currentLocale);
  }, [currentLocale]);

  const handleChange = (newLocale: string) => {
    // Set locale cookie
    document.cookie = `locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`;

    // Refresh to apply new locale
    router.refresh();
  };

  // Combine className with size variant
  const triggerClassName = className || (
    size === 'sm' ? 'w-[160px] h-8 text-sm' :
    size === 'lg' ? 'w-[180px] h-12 text-lg' :
    'w-[160px] h-10'
  );

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger
        className={triggerClassName}
        aria-label="Select language"
      >
        <SelectValue>
          {LOCALE_NAMES[locale]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {LOCALE_NAMES[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
