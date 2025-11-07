/**
 * Locale Switcher Component
 *
 * Allows users to switch between available application languages.
 * Uses next-intl for internationalization and shadcn/ui Select component.
 */

'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { locales } from '@/i18n';
import type { Locale } from '@/i18n';

/**
 * Locale display names
 */
const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
};

/**
 * Locale emoji flags for visual distinction
 */
const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  ru: '🇷🇺',
};

interface LocaleSwitcherProps {
  /**
   * Whether to show flag emoji next to language name
   * @default true
   */
  showFlags?: boolean;

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
 * @example
 * ```tsx
 * // In header or settings page
 * <LocaleSwitcher />
 *
 * // Without flags
 * <LocaleSwitcher showFlags={false} />
 *
 * // With custom styling
 * <LocaleSwitcher className="w-[180px]" size="sm" />
 * ```
 */
export function LocaleSwitcher({
  showFlags = true,
  className,
  size = 'default',
}: LocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();

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
          {showFlags && LOCALE_FLAGS[locale]}{' '}
          {LOCALE_NAMES[locale]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {showFlags && LOCALE_FLAGS[loc]}{' '}
            {LOCALE_NAMES[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
