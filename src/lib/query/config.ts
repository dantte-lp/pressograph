/**
 * TanStack Query Configuration
 *
 * Centralized configuration for React Query
 * - Cache times and stale times optimized for production
 * - Error handling and retry logic
 * - DevTools configuration
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

/**
 * Default query options for all queries
 */
const queryConfig: DefaultOptions = {
  queries: {
    // Stale time: Data considered fresh for 5 minutes
    staleTime: 5 * 60 * 1000,

    // Cache time: Unused data kept in cache for 10 minutes
    gcTime: 10 * 60 * 1000,

    // Retry configuration
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },

    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus (disabled by default, enable per-query as needed)
    refetchOnWindowFocus: false,

    // Refetch on reconnect
    refetchOnReconnect: true,

    // Refetch on mount (only if stale)
    refetchOnMount: true,
  },

  mutations: {
    // Retry mutations once on network errors
    retry: 1,

    // Retry delay
    retryDelay: 1000,
  },
};

/**
 * Create a new QueryClient instance
 *
 * Should be created once per request on the server
 * and once per session on the client
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: queryConfig,
  });
}

/**
 * Singleton query client for client-side use
 * DO NOT use on the server (will cause memory leaks)
 */
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  // Server: always create a new query client
  if (typeof window === 'undefined') {
    return createQueryClient();
  }

  // Client: reuse existing query client
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }

  return browserQueryClient;
}
