/**
 * Profile API Route
 *
 * Handles user profile updates including:
 * - Name and email updates
 * - Profile information retrieval
 *
 * @route PATCH /api/profile - Update user profile
 * @route GET /api/profile - Get user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long').optional(),
  email: z.string().email('Invalid email format').max(255, 'Email is too long').optional(),
});

/**
 * GET /api/profile
 * Retrieve current user's profile information
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        username: users.username,
        image: users.image,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('[API /profile GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Update current user's profile information
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const validation = profileUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, email } = validation.data;

    // Check if email is already taken by another user
    if (email) {
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 409 }
        );
      }
    }

    // Update user profile
    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateData.name = name;
    }

    if (email !== undefined) {
      updateData.email = email;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        username: users.username,
        updatedAt: users.updatedAt,
      });

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('[API /profile PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
