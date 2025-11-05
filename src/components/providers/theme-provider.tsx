'use client';

/**
 * Theme Provider with Server-Side Support
 *
 * Provides dark/light/system theme management with:
 * - Cookie-based persistence
 * - Server-side theme detection
 * - next-themes integration
 */

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
