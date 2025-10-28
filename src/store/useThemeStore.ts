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

const THEME_STORAGE_KEY = 'pressure-test-visualizer-theme';

// Load theme from localStorage on initialization
const getInitialTheme = (): Theme => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'light';
};

export const useThemeStore = create<ThemeStore>()((set) => ({
  theme: getInitialTheme(),

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      return { theme: newTheme };
    }),

  setTheme: (theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    set({ theme });
  },
}));
