'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { setTheme as setThemeAction } from '@/lib/theme/actions';

/**
 * Theme Toggle Button Component
 *
 * Provides a button to switch between light and dark themes.
 * Uses lucide-react icons for visual feedback.
 * Optimized to prevent re-renders with useCallback.
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  // Prevent hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = React.useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';

    // Optimistic update for immediate UI feedback
    setTheme(newTheme);

    // Persist to server (cookie + DB + Valkey)
    startTransition(async () => {
      await setThemeAction(newTheme as 'light' | 'dark');
    });
  }, [theme, setTheme]);

  // Return a placeholder during SSR to prevent layout shift
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-5 w-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      disabled={isPending}
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
