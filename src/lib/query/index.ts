/**
 * TanStack Query Library Index
 *
 * Centralized exports for React Query functionality
 */

export { QueryProvider } from './query-provider';
export { createQueryClient, getQueryClient } from './config';

// Re-export commonly used TanStack Query hooks and utilities
export {
  useQuery,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
  type QueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseInfiniteQueryOptions,
} from '@tanstack/react-query';
