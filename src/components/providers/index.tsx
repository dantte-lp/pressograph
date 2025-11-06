'use client';

/**
 * Root Providers Component
 *
 * Combines all application providers:
 * - SessionProvider (NextAuth for authentication)
 * - QueryProvider (TanStack Query for server state)
 * - AdvancedThemeProvider (3-tier theme persistence)
 *
 * This component is client-side only and wraps the app children.
 */

import { SessionProvider } from './session-provider';
import { QueryProvider } from './query-provider';
import { AdvancedThemeProvider } from './theme-provider-advanced';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <AdvancedThemeProvider>{children}</AdvancedThemeProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
