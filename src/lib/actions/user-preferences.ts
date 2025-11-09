'use server';

/**
 * Server Actions for User Preferences
 *
 * Handles CRUD operations for user preferences including:
 * - Theme, language, sidebar, graph defaults
 * - Notification settings
 * - Date/time formatting (timezone, date format, time format)
 */

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema/user-preferences';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/server-auth';
import type { DateFormat, TimeFormat } from '@/lib/utils/date-time';

export interface UpdatePreferencesInput {
  themePreference?: 'light' | 'dark' | 'system';
  languagePreference?: 'en' | 'ru';
  sidebarCollapsed?: boolean;
  graphDefaultFormat?: 'PNG' | 'JPEG' | 'SVG' | 'PDF';
  graphDefaultResolution?: number;
  emailNotifications?: boolean;
  inAppNotifications?: boolean;
  timezone?: string;
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
}

/**
 * Get user preferences for authenticated user
 */
export async function getUserPreferences() {
  try {
    const session = await requireAuth();
    if (!session.user?.id) {
      throw new Error('User not authenticated');
    }

    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    if (!preferences) {
      // Create default preferences if none exist
      const [newPreferences] = await db
        .insert(userPreferences)
        .values({
          userId: session.user.id,
        })
        .returning();

      return {
        success: true,
        data: newPreferences,
      };
    }

    return {
      success: true,
      data: preferences,
    };
  } catch (error) {
    console.error('[getUserPreferences] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch preferences',
    };
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(input: UpdatePreferencesInput) {
  try {
    const session = await requireAuth();
    if (!session.user?.id) {
      throw new Error('User not authenticated');
    }

    // Check if preferences exist
    const [existing] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    if (!existing) {
      // Create new preferences
      const [newPreferences] = await db
        .insert(userPreferences)
        .values({
          userId: session.user.id,
          ...input,
        })
        .returning();

      revalidatePath('/settings');
      return {
        success: true,
        data: newPreferences,
      };
    }

    // Update existing preferences
    const [updated] = await db
      .update(userPreferences)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, session.user.id))
      .returning();

    revalidatePath('/settings');
    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error('[updateUserPreferences] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update preferences',
    };
  }
}

/**
 * Update timezone preference
 */
export async function updateTimezone(timezone: string) {
  return updateUserPreferences({ timezone });
}

/**
 * Update date format preference
 */
export async function updateDateFormat(dateFormat: DateFormat) {
  return updateUserPreferences({ dateFormat });
}

/**
 * Update time format preference
 */
export async function updateTimeFormat(timeFormat: TimeFormat) {
  return updateUserPreferences({ timeFormat });
}

/**
 * Update theme preference
 */
export async function updateTheme(themePreference: 'light' | 'dark' | 'system') {
  return updateUserPreferences({ themePreference });
}

/**
 * Update language preference
 */
export async function updateLanguage(languagePreference: 'en' | 'ru') {
  return updateUserPreferences({ languagePreference });
}

/**
 * Update notification preferences
 */
export async function updateNotifications(input: {
  emailNotifications?: boolean;
  inAppNotifications?: boolean;
}) {
  return updateUserPreferences(input);
}

/**
 * Update display preferences
 */
export async function updateDisplayPreferences(input: {
  sidebarCollapsed?: boolean;
  graphDefaultFormat?: 'PNG' | 'JPEG' | 'SVG' | 'PDF';
  graphDefaultResolution?: number;
}) {
  return updateUserPreferences(input);
}
