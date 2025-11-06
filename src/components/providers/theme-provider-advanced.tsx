'use client';

/**
 * Advanced Theme Provider with Three-Tier Persistence
 *
 * Features:
 * - Cookie-based persistence (Tier 1)
 * - Valkey cache persistence (Tier 2)
 * - Database persistence (Tier 3)
 * - Syncs theme across devices for logged-in users
 * - System theme detection
 * - No FOUC (Flash of Unstyled Content)
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useSession } from 'next-auth/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

type Theme = 'light' | 'dark' | 'system';

interface AdvancedThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  isLoading: boolean;
  isSyncing: boolean;
}

const AdvancedThemeContext = createContext<AdvancedThemeContextValue>({
  theme: 'system',
  setTheme: async () => {},
  isLoading: false,
  isSyncing: false,
});

interface AdvancedThemeProviderProps extends Omit<ThemeProviderProps, 'children'> {
  children: React.ReactNode;
  initialTheme?: Theme;
}

export function AdvancedThemeProvider({
  children,
  initialTheme = 'system',
  ...props
}: AdvancedThemeProviderProps) {
  const { data: session, status } = useSession();
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load theme from cookie on mount
  useEffect(() => {
    const cookieTheme = document.cookie
      .split('; ')
      .find(row => row.startsWith('theme='))
      ?.split('=')[1] as Theme | undefined;

    if (cookieTheme && cookieTheme !== theme) {
      setThemeState(cookieTheme);
    }
  }, []);

  // Sync theme from server when user logs in
  useEffect(() => {
    if (session?.user && status === 'authenticated') {
      syncThemeFromServer();
    }
  }, [session, status]);

  // Sync theme from server
  const syncThemeFromServer = useCallback(async () => {
    if (!session?.user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/preferences/theme');
      if (response.ok) {
        const data = await response.json();
        if (data.theme && data.theme !== theme) {
          setThemeState(data.theme);
          // Update cookie
          document.cookie = `theme=${data.theme}; path=/; max-age=31536000; SameSite=Lax`;
        }
      }
    } catch (error) {
      console.error('Failed to sync theme from server:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session, theme]);

  // Set theme with three-tier persistence
  const setTheme = useCallback(async (newTheme: Theme) => {
    setIsSyncing(true);

    try {
      // 1. Update local state immediately
      setThemeState(newTheme);

      // 2. Update cookie (Tier 1)
      document.cookie = `theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;

      // 3. Update server if authenticated (Tier 2 & 3)
      if (session?.user) {
        const response = await fetch('/api/preferences/theme', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ theme: newTheme }),
        });

        if (!response.ok) {
          console.error('Failed to save theme to server');
          // Don't revert - keep local change even if server save fails
        }
      }

      // 4. Apply theme to document
      applyThemeToDocument(newTheme);
    } catch (error) {
      console.error('Failed to set theme:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [session]);

  // Apply theme to document element
  const applyThemeToDocument = (theme: Theme) => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

    const effectiveTheme = theme === 'system' ? systemTheme : theme;

    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    root.setAttribute('data-theme', effectiveTheme);
  };

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyThemeToDocument('system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Context value
  const contextValue: AdvancedThemeContextValue = {
    theme,
    setTheme,
    isLoading,
    isSyncing,
  };

  return (
    <AdvancedThemeContext.Provider value={contextValue}>
      <NextThemesProvider
        attribute="class"
        defaultTheme={initialTheme}
        enableSystem
        disableTransitionOnChange
        value={{
          light: 'light',
          dark: 'dark',
          system: 'system',
        }}
        {...props}
      >
        {children}
      </NextThemesProvider>
    </AdvancedThemeContext.Provider>
  );
}

// Hook to use the advanced theme context
export function useAdvancedTheme() {
  const context = useContext(AdvancedThemeContext);
  if (!context) {
    throw new Error('useAdvancedTheme must be used within AdvancedThemeProvider');
  }
  return context;
}

// Export the original useTheme from next-themes for compatibility
export { useTheme } from 'next-themes';