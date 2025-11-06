/**
 * Server-side theme utilities
 *
 * Functions to get and set themes on the server with three-tier caching
 */

import { cookies, headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ThemeCache } from '@/lib/cache/user-preferences';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type Theme = 'light' | 'dark' | 'system';

/**
 * Get theme on the server with three-tier fallback
 * 1. Cookie (fastest)
 * 2. Valkey cache (fast)
 * 3. Database (slowest but persistent)
 *
 * @param userId Optional user ID for authenticated users
 * @returns Theme preference
 */
export async function getServerTheme(userId?: string): Promise<Theme> {
  // 1. Check cookie (Tier 1)
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get('theme')?.value as Theme | undefined;

  if (cookieTheme && isValidTheme(cookieTheme)) {
    return cookieTheme;
  }

  // If no user ID provided, try to get from session
  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }

  // If still no user ID, return default
  if (!userId) {
    return 'system';
  }

  // 2. Check Valkey cache (Tier 2)
  try {
    const cachedTheme = await ThemeCache.get(userId);
    if (cachedTheme && isValidTheme(cachedTheme)) {
      // Update cookie for next time
      await setThemeCookie(cachedTheme as Theme);
      return cachedTheme as Theme;
    }
  } catch (error) {
    console.error('[Theme Server] Cache error:', error);
  }

  // 3. Check database (Tier 3)
  try {
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (preferences.length > 0 && preferences[0].theme) {
      const theme = preferences[0].theme as Theme;

      // Update cache and cookie for next time
      await Promise.allSettled([
        ThemeCache.set(userId, theme),
        setThemeCookie(theme),
      ]);

      return theme;
    }
  } catch (error) {
    console.error('[Theme Server] Database error:', error);
  }

  // Default fallback
  return 'system';
}

/**
 * Get theme from middleware headers (for client components)
 * This is set by the middleware for SSR
 */
export async function getThemeFromHeaders(): Promise<Theme> {
  const headersList = await headers();
  const theme = headersList.get('x-theme') as Theme | null;
  return theme || 'system';
}

/**
 * Set theme cookie on the server
 */
export async function setThemeCookie(theme: Theme): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('theme', theme, {
    path: '/',
    maxAge: 31536000, // 1 year
    sameSite: 'lax',
    httpOnly: false, // Allow client access
  });
}

/**
 * Delete theme cookie on the server
 */
export async function deleteThemeCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('theme');
}

/**
 * Initialize theme for a new user
 */
export async function initializeUserTheme(
  userId: string,
  theme: Theme = 'system'
): Promise<void> {
  try {
    // Set in all three tiers
    await Promise.allSettled([
      // Tier 1: Cookie
      setThemeCookie(theme),

      // Tier 2: Cache
      ThemeCache.set(userId, theme),

      // Tier 3: Database
      db.insert(userPreferences).values({
        userId,
        theme,
      }).onConflictDoNothing(),
    ]);
  } catch (error) {
    console.error('[Theme Server] Failed to initialize theme:', error);
  }
}

/**
 * Sync theme across all tiers
 * Useful after login or when inconsistencies are detected
 */
export async function syncTheme(userId: string): Promise<Theme> {
  // Get the source of truth from database
  const preferences = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  const theme = (preferences[0]?.theme as Theme) || 'system';

  // Update other tiers
  await Promise.allSettled([
    setThemeCookie(theme),
    ThemeCache.set(userId, theme),
  ]);

  return theme;
}

/**
 * Helper to validate theme value
 */
function isValidTheme(theme: unknown): theme is Theme {
  return typeof theme === 'string' && ['light', 'dark', 'system'].includes(theme);
}

/**
 * Get effective theme (resolve 'system' to actual theme)
 */
export function getEffectiveTheme(
  theme: Theme,
  prefersDark: boolean = false
): 'light' | 'dark' {
  if (theme === 'system') {
    return prefersDark ? 'dark' : 'light';
  }
  return theme;
}