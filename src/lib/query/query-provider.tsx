'use client';

/**
 * TanStack Query Provider
 *
 * Client-side provider that wraps the application with QueryClientProvider
 * Includes React Query DevTools in development
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from './config';
import { useState } from 'react';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a stable query client instance
  // Using useState ensures it's only created once per component lifecycle
  const [queryClient] = useState(() => getQueryClient());

  // Determine if we're in development mode (client-side only)
  const [showDevTools] = useState(() => {
    // Only check this on the client side to avoid hydration issues
    if (typeof window === 'undefined') return false;
    return process.env.NODE_ENV === 'development';
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only shown in development */}
      {showDevTools && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}
