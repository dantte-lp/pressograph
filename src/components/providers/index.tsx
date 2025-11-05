'use client';

/**
 * Root Providers Component
 *
 * Combines all application providers:
 * - QueryProvider (TanStack Query for server state)
 * - ThemeProvider (next-themes for dark mode)
 *
 * This component is client-side only and wraps the app children.
 */

import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryProvider>
  );
}
