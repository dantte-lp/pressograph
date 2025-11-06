/**
 * User Preferences API Route
 *
 * Handles user preference updates including:
 * - Theme preferences
 * - Language preferences
 * - UI preferences
 * - Notification preferences
 *
 * @route GET /api/preferences - Get user preferences
 * @route PATCH /api/preferences - Update user preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema/user-preferences';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for preference updates
const preferencesUpdateSchema = z.object({
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
  languagePreference: z.enum(['en', 'ru']).optional(),
  sidebarCollapsed: z.boolean().optional(),
  graphDefaultFormat: z.enum(['PNG', 'SVG', 'PDF']).optional(),
  graphDefaultResolution: z.number().min(1).max(4).optional(),
  emailNotifications: z.boolean().optional(),
  inAppNotifications: z.boolean().optional(),
});

/**
 * GET /api/preferences
 * Retrieve current user's preferences
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    // If no preferences exist, return defaults
    if (!prefs) {
      return NextResponse.json({
        themePreference: 'system',
        languagePreference: 'en',
        sidebarCollapsed: false,
        graphDefaultFormat: 'PNG',
        graphDefaultResolution: 2,
        emailNotifications: true,
        inAppNotifications: true,
      });
    }

    return NextResponse.json(prefs);
  } catch (error) {
    console.error('[API /preferences GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/preferences
 * Update current user's preferences
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const validation = preferencesUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Check if preferences already exist
    const [existingPrefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1);

    let updatedPrefs;

    if (existingPrefs) {
      // Update existing preferences
      [updatedPrefs] = await db
        .update(userPreferences)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, session.user.id))
        .returning();
    } else {
      // Create new preferences
      [updatedPrefs] = await db
        .insert(userPreferences)
        .values({
          userId: session.user.id,
          ...updates,
        })
        .returning();
    }

    if (!updatedPrefs) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: updatedPrefs,
    });
  } catch (error) {
    console.error('[API /preferences PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
