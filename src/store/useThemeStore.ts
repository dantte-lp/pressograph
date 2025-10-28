// ═══════════════════════════════════════════════════════════════════
// Zustand Store for Theme Management
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
// import { persist } from 'zustand/middleware'; // Temporarily disabled for React 19 compatibility
import type { Theme } from '../types';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()((set) => ({
  theme: 'light',

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),

  setTheme: (theme) => set({ theme }),
}));
