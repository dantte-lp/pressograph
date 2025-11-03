'use server';

/**
 * Theme Server Actions
 *
 * Server-side theme management with three-tier caching:
 * 1. Cookie (SSR immediate access)
 * 2. Valkey (performance, 1hr TTL)
 * 3. Database (persistent, cross-device sync)
 */

import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cache as valkeyCache } from '@/lib/cache';
import { revalidatePath } from 'next/cache';

type Theme = 'light' | 'dark' | 'system';

const THEME_COOKIE_NAME = 'pressograph-theme';
const THEME_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

/**
 * Get user's theme preference
 * Checks cookie → Valkey → Database
 */
export async function getTheme(userId?: string): Promise<Theme> {
  // 1. Check cookie first (fastest, available in RSC)
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE_NAME);
  if (themeCookie?.value) {
    return themeCookie.value as Theme;
  }

  // 2. If user is logged in, check Valkey cache
  if (userId) {
    const cacheKey = `theme:${userId}`;
    const cachedTheme = await valkeyCache.get(cacheKey);
    if (cachedTheme && typeof cachedTheme === 'string') {
      // Update cookie for next request
      cookieStore.set(THEME_COOKIE_NAME, cachedTheme as string, {
        maxAge: THEME_COOKIE_MAX_AGE,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      return cachedTheme as Theme;
    }

    // 3. Check database
    const prefs = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    });

    if (prefs?.themePreference) {
      const theme = prefs.themePreference as Theme;

      // Update Valkey cache (1 hour TTL)
      await valkeyCache.set(cacheKey, theme, 3600);

      // Update cookie
      cookieStore.set(THEME_COOKIE_NAME, theme, {
        maxAge: THEME_COOKIE_MAX_AGE,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      return theme;
    }
  }

  // Default to system theme
  return 'system';
}

/**
 * Set user's theme preference
 * Updates all three layers: Cookie + Valkey + Database
 */
export async function setTheme(
  theme: Theme,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Always update cookie (works for anonymous users)
    const cookieStore = await cookies();
    cookieStore.set(THEME_COOKIE_NAME, theme, {
      maxAge: THEME_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    // 2. If user is logged in, update database and Valkey
    if (userId) {
      // Update database
      const existingPrefs = await db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, userId),
      });

      if (existingPrefs) {
        await db
          .update(userPreferences)
          .set({
            themePreference: theme,
            updatedAt: new Date(),
          })
          .where(eq(userPreferences.userId, userId));
      } else {
        await db.insert(userPreferences).values({
          userId,
          themePreference: theme,
        });
      }

      // Update Valkey cache
      const cacheKey = `theme:${userId}`;
      await valkeyCache.set(cacheKey, theme, 3600);
    }

    // Revalidate to trigger re-render
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error) {
    console.error('Error setting theme:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clear theme preference (reset to system)
 */
export async function clearTheme(userId?: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(THEME_COOKIE_NAME);

  if (userId) {
    await db
      .delete(userPreferences)
      .where(eq(userPreferences.userId, userId));

    const cacheKey = `theme:${userId}`;
    await valkeyCache.del(cacheKey);
  }

  revalidatePath('/', 'layout');
}
