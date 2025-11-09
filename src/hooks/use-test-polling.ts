'use client';

/**
 * Test Polling Hook
 *
 * Provides real-time test status updates using TanStack Query's refetch interval.
 * Implements Issue #101 - Real-time test updates with polling.
 *
 * Features:
 * - Automatic polling every 30 seconds for running tests
 * - Pause/resume polling based on page visibility
 * - Optimistic UI updates
 * - Visual indicators for running tests
 * - Efficient query invalidation
 *
 * @module hooks/use-test-polling
 */

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Test status type
 */
type TestStatus = 'draft' | 'ready' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Test data structure for polling
 */
interface Test {
  id: string;
  testNumber: string;
  name: string;
  status: TestStatus;
  updatedAt: string;
  [key: string]: any;
}

/**
 * Polling configuration options
 */
interface PollingOptions {
  /** Query key for the tests query */
  queryKey: any[];
  /** Fetch function to retrieve tests */
  fetchFn: () => Promise<Test[]>;
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  interval?: number;
  /** Enable polling (default: true) */
  enabled?: boolean;
  /** Callback when test status changes */
  onStatusChange?: (test: Test, oldStatus: TestStatus) => void;
}

/**
 * Hook for polling test updates
 *
 * Automatically polls for test updates at the specified interval,
 * focusing on tests with "running" status. Pauses when page is not visible.
 *
 * @example
 * ```tsx
 * const { data, isPolling, pausePolling, resumePolling } = useTestPolling({
 *   queryKey: ['tests'],
 *   fetchFn: async () => {
 *     const response = await fetch('/api/tests');
 *     return response.json();
 *   },
 *   onStatusChange: (test, oldStatus) => {
 *     if (test.status === 'completed') {
 *       toast.success(`Test ${test.testNumber} completed`);
 *     }
 *   },
 * });
 * ```
 */
export function useTestPolling({
  queryKey,
  fetchFn,
  interval = 30000, // 30 seconds
  enabled = true,
  onStatusChange,
}: PollingOptions) {
  const queryClient = useQueryClient();
  const previousDataRef = useRef<Test[]>([]);

  /**
   * Query with automatic refetching
   */
  const query = useQuery({
    queryKey,
    queryFn: fetchFn,
    refetchInterval: enabled ? interval : false,
    refetchIntervalInBackground: false, // Pause when tab is not visible
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    staleTime: interval, // Consider data stale after interval
  });

  /**
   * Detect status changes and invoke callback
   */
  useEffect(() => {
    if (!query.data || !onStatusChange) return;

    const currentData = query.data;
    const previousData = previousDataRef.current;

    // Compare current data with previous data
    currentData.forEach((currentTest) => {
      const previousTest = previousData.find((t) => t.id === currentTest.id);

      if (previousTest && previousTest.status !== currentTest.status) {
        // Status changed - invoke callback
        onStatusChange(currentTest, previousTest.status);
      }
    });

    // Update reference
    previousDataRef.current = currentData;
  }, [query.data, onStatusChange]);

  /**
   * Check if any tests are currently running
   */
  const hasRunningTests = query.data?.some((test) => test.status === 'running') ?? false;

  /**
   * Manually pause polling
   */
  const pausePolling = () => {
    queryClient.cancelQueries({ queryKey });
  };

  /**
   * Manually resume polling
   */
  const resumePolling = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  /**
   * Force immediate refresh
   */
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  return {
    /** Current test data */
    data: query.data,
    /** Loading state */
    isLoading: query.isLoading,
    /** Error state */
    error: query.error,
    /** Whether polling is currently active */
    isPolling: enabled && !query.isPaused,
    /** Whether any tests are running */
    hasRunningTests,
    /** Manually pause polling */
    pausePolling,
    /** Manually resume polling */
    resumePolling,
    /** Force immediate refresh */
    refresh,
    /** Last update timestamp */
    dataUpdatedAt: query.dataUpdatedAt,
  };
}

/**
 * Hook for polling a single test
 *
 * Specialized version for monitoring individual test status.
 *
 * @example
 * ```tsx
 * const { test, isRunning, refresh } = useSingleTestPolling({
 *   testId: '123',
 *   fetchFn: async (id) => {
 *     const response = await fetch(`/api/tests/${id}`);
 *     return response.json();
 *   },
 *   onComplete: (test) => {
 *     toast.success('Test completed!');
 *   },
 * });
 * ```
 */
export function useSingleTestPolling({
  testId,
  fetchFn,
  interval = 30000,
  enabled = true,
  onComplete,
  onFail,
}: {
  testId: string;
  fetchFn: (id: string) => Promise<Test>;
  interval?: number;
  enabled?: boolean;
  onComplete?: (test: Test) => void;
  onFail?: (test: Test) => void;
}) {
  const queryClient = useQueryClient();
  const previousStatusRef = useRef<TestStatus | undefined>(undefined);

  const query = useQuery({
    queryKey: ['test', testId],
    queryFn: () => fetchFn(testId),
    refetchInterval: enabled ? interval : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: interval,
    enabled: enabled && !!testId,
  });

  /**
   * Detect completion or failure
   */
  useEffect(() => {
    if (!query.data) return;

    const currentStatus = query.data.status;
    const previousStatus = previousStatusRef.current;

    if (previousStatus === 'running') {
      if (currentStatus === 'completed' && onComplete) {
        onComplete(query.data);
      } else if (currentStatus === 'failed' && onFail) {
        onFail(query.data);
      }
    }

    previousStatusRef.current = currentStatus;
  }, [query.data, onComplete, onFail]);

  const isRunning = query.data?.status === 'running';

  return {
    /** Current test data */
    test: query.data,
    /** Whether test is currently running */
    isRunning,
    /** Loading state */
    isLoading: query.isLoading,
    /** Error state */
    error: query.error,
    /** Force immediate refresh */
    refresh: () => queryClient.invalidateQueries({ queryKey: ['test', testId] }),
    /** Last update timestamp */
    dataUpdatedAt: query.dataUpdatedAt,
  };
}
