// ═══════════════════════════════════════════════════════════════════
// Initialization Status Store
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';

interface InitializationStore {
  isInitialized: boolean | null; // null = checking, true = initialized, false = not initialized
  isLoading: boolean;
  error: string | null;

  checkInitialization: () => Promise<void>;
  markAsInitialized: () => void;
}

export const useInitializationStore = create<InitializationStore>((set) => ({
  isInitialized: null,
  isLoading: false,
  error: null,

  checkInitialization: async () => {
    set({ isLoading: true, error: null });

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/v1/setup/status`);

      if (!response.ok) {
        throw new Error('Failed to check initialization status');
      }

      const data = await response.json();
      set({ isInitialized: data.initialized, isLoading: false });
    } catch (error) {
      console.error('Initialization check failed:', error);
      // If API is not available, assume not initialized
      set({ isInitialized: false, isLoading: false, error: 'Unable to connect to server' });
    }
  },

  markAsInitialized: () => {
    set({ isInitialized: true });
  },
}));
