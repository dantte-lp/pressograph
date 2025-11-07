'use client';

import { useEffect, useCallback, useRef } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';
import { toast } from 'sonner';

interface UseFormCacheOptions<T extends FieldValues> {
  key: string; // Local storage key
  form: UseFormReturn<T>;
  autosaveInterval?: number; // milliseconds, default 30000 (30 seconds)
  enabled?: boolean; // default true
}

/**
 * Three-Tier Form Caching Hook
 *
 * Implements caching strategy as per ADR-003:
 * - Tier 1: React state (form values) - handled by react-hook-form
 * - Tier 2: LocalStorage (draft saving) - handled by this hook
 * - Tier 3: Server-side (database) - handled by form submission
 *
 * Features:
 * - Auto-save form state to localStorage
 * - Restore form state on mount
 * - Clear cache on successful submit
 * - Manual save/restore/clear methods
 *
 * @example
 * ```typescript
 * const form = useForm<TestFormData>({ ... });
 *
 * const { saveToCache, restoreFromCache, clearCache } = useFormCache({
 *   key: 'test-form-draft',
 *   form,
 *   autosaveInterval: 30000, // 30 seconds
 * });
 * ```
 */
export function useFormCache<T extends FieldValues>({
  key,
  form,
  autosaveInterval = 30000,
  enabled = true,
}: UseFormCacheOptions<T>) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string>('');

  // Save form state to localStorage
  const saveToCache = useCallback(() => {
    if (!enabled) return;

    try {
      const formData = form.getValues();
      const serialized = JSON.stringify(formData);

      // Only save if data has changed
      if (serialized === lastSaveRef.current) {
        return;
      }

      localStorage.setItem(key, serialized);
      localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
      lastSaveRef.current = serialized;

      // Silent save - no toast for autosave
      console.log(`[FormCache] Autosaved draft to localStorage: ${key}`);
    } catch (error) {
      console.error('[FormCache] Failed to save to localStorage:', error);
      // Don't show error toast for autosave failures
    }
  }, [key, form, enabled]);

  // Restore form state from localStorage
  const restoreFromCache = useCallback(() => {
    if (!enabled) return false;

    try {
      const cached = localStorage.getItem(key);
      if (!cached) return false;

      const data = JSON.parse(cached) as T;
      const timestamp = localStorage.getItem(`${key}_timestamp`);

      // Check if cache is older than 7 days
      if (timestamp) {
        const cacheAge = Date.now() - new Date(timestamp).getTime();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (cacheAge > maxAge) {
          console.log('[FormCache] Cache expired, clearing...');
          clearCache();
          return false;
        }
      }

      // Restore all form fields
      Object.keys(data).forEach((fieldName) => {
        form.setValue(fieldName as any, data[fieldName], {
          shouldValidate: false,
          shouldDirty: false,
        });
      });

      lastSaveRef.current = JSON.stringify(data);
      console.log(`[FormCache] Restored draft from localStorage: ${key}`);

      // Show toast notification
      toast.info('Draft restored', {
        description: `Last saved: ${new Date(timestamp || Date.now()).toLocaleString()}`,
      });

      return true;
    } catch (error) {
      console.error('[FormCache] Failed to restore from localStorage:', error);
      return false;
    }
  }, [key, form, enabled]);

  // Clear cache from localStorage
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_timestamp`);
      lastSaveRef.current = '';
      console.log(`[FormCache] Cleared cache: ${key}`);
    } catch (error) {
      console.error('[FormCache] Failed to clear localStorage:', error);
    }
  }, [key]);

  // Manual save with toast notification
  const saveDraft = useCallback(() => {
    saveToCache();
    toast.success('Draft saved', {
      description: 'Your changes have been saved locally',
    });
  }, [saveToCache]);

  // Initialize: restore from cache on mount
  useEffect(() => {
    if (!enabled) return;

    restoreFromCache();
  }, [enabled]); // Only run on mount, not when restoreFromCache changes

  // Setup autosave interval
  useEffect(() => {
    if (!enabled || !autosaveInterval) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Setup new interval
    intervalRef.current = setInterval(() => {
      saveToCache();
    }, autosaveInterval);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, autosaveInterval, saveToCache]);

  // Save before page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      saveToCache();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, saveToCache]);

  return {
    saveToCache,
    restoreFromCache,
    clearCache,
    saveDraft,
  };
}
