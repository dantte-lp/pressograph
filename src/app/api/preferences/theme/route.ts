/**
 * Theme Preferences API
 *
 * Handles theme persistence with three-tier caching:
 * 1. Cookie (immediate)
 * 2. Valkey cache (fast access)
 * 3. Database (permanent storage)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ThemeCache, PreferencesCache } from '@/lib/cache/user-preferences';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type Theme = 'light' | 'dark' | 'system';

/**
 * GET /api/preferences/theme
 * Get the current user's theme preference
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // Return cookie theme for unauthenticated users
      const cookieTheme = request.cookies.get('theme')?.value || 'system';
      return NextResponse.json({ theme: cookieTheme });
    }

    const userId = session.user.id;

    // Try cache first (Tier 2)
    const cachedTheme = await ThemeCache.get(userId);
    if (cachedTheme) {
      console.log(`[Theme API] Cache hit for user ${userId}`);
      return NextResponse.json({ theme: cachedTheme });
    }

    // Try database (Tier 3)
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (preferences.length > 0 && preferences[0].themePreference) {
      const theme = preferences[0].themePreference as Theme;

      // Update cache for next time
      await ThemeCache.set(userId, theme);

      console.log(`[Theme API] Database hit for user ${userId}`);
      return NextResponse.json({ theme });
    }

    // Default to system theme
    const defaultTheme = 'system';

    // Create default preferences
    await db.insert(userPreferences).values({
      userId,
      themePreference: defaultTheme,
    }).onConflictDoNothing();

    await ThemeCache.set(userId, defaultTheme);

    return NextResponse.json({ theme: defaultTheme });
  } catch (error) {
    console.error('[Theme API] Error getting theme:', error);
    return NextResponse.json(
      { error: 'Failed to get theme preference' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/preferences/theme
 * Update the current user's theme preference
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // For unauthenticated users, just set the cookie
      const { theme } = await request.json();

      if (!isValidTheme(theme)) {
        return NextResponse.json(
          { error: 'Invalid theme value' },
          { status: 400 }
        );
      }

      const response = NextResponse.json({ success: true, theme });
      response.cookies.set('theme', theme, {
        path: '/',
        maxAge: 31536000, // 1 year
        sameSite: 'lax',
      });

      return response;
    }

    const userId = session.user.id;
    const { theme } = await request.json();

    if (!isValidTheme(theme)) {
      return NextResponse.json(
        { error: 'Invalid theme value' },
        { status: 400 }
      );
    }

    // Update all three tiers in parallel
    const [cacheResult, dbResult] = await Promise.allSettled([
      // Tier 2: Update cache
      ThemeCache.set(userId, theme),

      // Tier 3: Update database
      db
        .insert(userPreferences)
        .values({
          userId,
          themePreference: theme,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            themePreference: theme,
            updatedAt: new Date(),
          },
        }),
    ]);

    // Log any failures (but don't fail the request)
    if (cacheResult.status === 'rejected') {
      console.error('[Theme API] Failed to update cache:', cacheResult.reason);
    }
    if (dbResult.status === 'rejected') {
      console.error('[Theme API] Failed to update database:', dbResult.reason);
    }

    // Also update user preferences cache if it exists
    const currentPrefs = await PreferencesCache.get(userId);
    if (currentPrefs) {
      await PreferencesCache.updateField(userId, 'theme', theme);
    }

    console.log(`[Theme API] Updated theme for user ${userId} to ${theme}`);

    const response = NextResponse.json({ success: true, theme });

    // Tier 1: Set cookie
    response.cookies.set('theme', theme, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('[Theme API] Error setting theme:', error);
    return NextResponse.json(
      { error: 'Failed to save theme preference' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/preferences/theme
 * Reset theme to system default
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      const response = NextResponse.json({ success: true, theme: 'system' });
      response.cookies.delete('theme');
      return response;
    }

    const userId = session.user.id;

    // Clear from all tiers
    await Promise.allSettled([
      ThemeCache.delete(userId),
      PreferencesCache.delete(userId),
      db
        .update(userPreferences)
        .set({ themePreference: 'system', updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId)),
    ]);

    const response = NextResponse.json({ success: true, theme: 'system' });
    response.cookies.delete('theme');

    return response;
  } catch (error) {
    console.error('[Theme API] Error resetting theme:', error);
    return NextResponse.json(
      { error: 'Failed to reset theme preference' },
      { status: 500 }
    );
  }
}

// Helper function to validate theme
function isValidTheme(theme: unknown): theme is Theme {
  return typeof theme === 'string' && ['light', 'dark', 'system'].includes(theme);
}