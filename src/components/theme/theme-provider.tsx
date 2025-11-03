'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Theme Provider Component
 *
 * Wraps the application with next-themes provider for dark/light mode support.
 * Supports system theme detection and persists user preference.
 *
 * @example
 * ```tsx
 * <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
