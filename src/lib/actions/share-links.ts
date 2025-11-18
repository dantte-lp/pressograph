/**
 * Share Links Server Actions
 *
 * Server actions for managing public share links:
 * - Create share links with expiration
 * - Retrieve share links by token
 * - Manage share link permissions
 * - Track analytics (views)
 * - List user's share links
 */

'use server';

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { shareLinks } from '@/lib/db/schema/share-links';
import { pressureTests } from '@/lib/db/schema/pressure-tests';
import { projects } from '@/lib/db/schema/projects';
import { users } from '@/lib/db/schema/users';
import { getSession } from '@/lib/auth/server-auth';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

/**
 * Generate a unique secure token for share links
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new share link for a pressure test
 */
export async function createShareLink(data: {
  pressureTestId: string;
  expiresInDays?: number | null; // null = never expires
  allowDownload?: boolean;
  title?: string;
  description?: string;
}) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify the user has access to this test
    const test = await db
      .select({ id: pressureTests.id, createdBy: pressureTests.createdBy })
      .from(pressureTests)
      .where(eq(pressureTests.id, data.pressureTestId))
      .limit(1);

    if (test.length === 0) {
      return { success: false, error: 'Test not found' };
    }

    if (test[0].createdBy !== session.user.id) {
      return { success: false, error: 'Unauthorized to share this test' };
    }

    // Calculate expiration date
    let expiresAt: Date | null = null;
    if (data.expiresInDays !== null && data.expiresInDays !== undefined) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);
    }

    // Generate unique token
    const token = generateToken();

    // Create share link
    const [newLink] = await db
      .insert(shareLinks)
      .values({
        pressureTestId: data.pressureTestId,
        createdBy: session.user.id,
        token,
        expiresAt,
        allowDownload: data.allowDownload ?? true,
        isActive: true,
        title: data.title || null,
        description: data.description || null,
      })
      .returning({
        id: shareLinks.id,
        token: shareLinks.token,
        expiresAt: shareLinks.expiresAt,
      });

    revalidatePath('/tests');
    revalidatePath(`/tests/${data.pressureTestId}`);

    return {
      success: true,
      shareLink: {
        id: newLink.id,
        token: newLink.token,
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${newLink.token}`,
        expiresAt: newLink.expiresAt,
      },
    };
  } catch (error) {
    console.error('[createShareLink] Error:', error);
    return { success: false, error: 'Failed to create share link' };
  }
}

/**
 * Get share link by token (public access)
 */
export async function getShareLinkByToken(token: string) {
  try {
    const link = await db
      .select({
        id: shareLinks.id,
        token: shareLinks.token,
        title: shareLinks.title,
        description: shareLinks.description,
        expiresAt: shareLinks.expiresAt,
        allowDownload: shareLinks.allowDownload,
        isActive: shareLinks.isActive,
        viewCount: shareLinks.viewCount,
        createdAt: shareLinks.createdAt,
        // Test details
        testId: pressureTests.id,
        testNumber: pressureTests.testNumber,
        testName: pressureTests.name,
        testStatus: pressureTests.status,
        testConfig: pressureTests.config,
        testCreatedAt: pressureTests.createdAt,
        // Project details
        projectName: projects.name,
        // Creator details
        creatorName: users.name,
      })
      .from(shareLinks)
      .innerJoin(pressureTests, eq(shareLinks.pressureTestId, pressureTests.id))
      .leftJoin(projects, eq(pressureTests.projectId, projects.id))
      .leftJoin(users, eq(shareLinks.createdBy, users.id))
      .where(eq(shareLinks.token, token))
      .limit(1);

    if (link.length === 0) {
      return { success: false, error: 'Share link not found' };
    }

    const shareLink = link[0];

    // Check if link is active
    if (!shareLink.isActive) {
      return { success: false, error: 'Share link has been deactivated' };
    }

    // Check if link has expired
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return { success: false, error: 'Share link has expired' };
    }

    // Increment view count
    await db
      .update(shareLinks)
      .set({
        viewCount: shareLink.viewCount + 1,
        lastViewedAt: new Date(),
      })
      .where(eq(shareLinks.id, shareLink.id));

    return {
      success: true,
      shareLink: {
        id: shareLink.id,
        token: shareLink.token,
        title: shareLink.title,
        description: shareLink.description,
        expiresAt: shareLink.expiresAt,
        allowDownload: shareLink.allowDownload,
        viewCount: shareLink.viewCount + 1,
        createdAt: shareLink.createdAt,
        test: {
          id: shareLink.testId,
          testNumber: shareLink.testNumber,
          name: shareLink.testName,
          status: shareLink.testStatus,
          config: shareLink.testConfig,
          createdAt: shareLink.testCreatedAt,
          project: {
            name: shareLink.projectName,
          },
          creator: {
            name: shareLink.creatorName,
          },
        },
      },
    };
  } catch (error) {
    console.error('[getShareLinkByToken] Error:', error);
    return { success: false, error: 'Failed to retrieve share link' };
  }
}

/**
 * Get all share links for a specific test
 */
export async function getTestShareLinks(testId: string) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify the user has access to this test
    const test = await db
      .select({ id: pressureTests.id, createdBy: pressureTests.createdBy })
      .from(pressureTests)
      .where(eq(pressureTests.id, testId))
      .limit(1);

    if (test.length === 0) {
      return { success: false, error: 'Test not found' };
    }

    if (test[0].createdBy !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get all share links for this test
    const links = await db
      .select({
        id: shareLinks.id,
        token: shareLinks.token,
        title: shareLinks.title,
        description: shareLinks.description,
        expiresAt: shareLinks.expiresAt,
        allowDownload: shareLinks.allowDownload,
        isActive: shareLinks.isActive,
        viewCount: shareLinks.viewCount,
        lastViewedAt: shareLinks.lastViewedAt,
        createdAt: shareLinks.createdAt,
      })
      .from(shareLinks)
      .where(
        and(
          eq(shareLinks.pressureTestId, testId),
          eq(shareLinks.createdBy, session.user.id)
        )
      )
      .orderBy(desc(shareLinks.createdAt));

    return {
      success: true,
      shareLinks: links.map((link) => ({
        ...link,
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${link.token}`,
        isExpired: link.expiresAt ? new Date(link.expiresAt) < new Date() : false,
      })),
    };
  } catch (error) {
    console.error('[getTestShareLinks] Error:', error);
    return { success: false, error: 'Failed to retrieve share links' };
  }
}

/**
 * Get all share links created by the current user
 */
export async function getUserShareLinks() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const links = await db
      .select({
        id: shareLinks.id,
        token: shareLinks.token,
        title: shareLinks.title,
        description: shareLinks.description,
        expiresAt: shareLinks.expiresAt,
        allowDownload: shareLinks.allowDownload,
        isActive: shareLinks.isActive,
        viewCount: shareLinks.viewCount,
        lastViewedAt: shareLinks.lastViewedAt,
        createdAt: shareLinks.createdAt,
        // Test details
        testId: pressureTests.id,
        testNumber: pressureTests.testNumber,
        testName: pressureTests.name,
        // Project details
        projectName: projects.name,
      })
      .from(shareLinks)
      .innerJoin(pressureTests, eq(shareLinks.pressureTestId, pressureTests.id))
      .leftJoin(projects, eq(pressureTests.projectId, projects.id))
      .where(eq(shareLinks.createdBy, session.user.id))
      .orderBy(desc(shareLinks.createdAt));

    return {
      success: true,
      shareLinks: links.map((link) => ({
        ...link,
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${link.token}`,
        isExpired: link.expiresAt ? new Date(link.expiresAt) < new Date() : false,
      })),
    };
  } catch (error) {
    console.error('[getUserShareLinks] Error:', error);
    return { success: false, error: 'Failed to retrieve share links' };
  }
}

/**
 * Update share link settings
 */
export async function updateShareLink(
  linkId: string,
  data: {
    title?: string;
    description?: string;
    allowDownload?: boolean;
    isActive?: boolean;
    expiresInDays?: number | null;
  }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const link = await db
      .select({ id: shareLinks.id, createdBy: shareLinks.createdBy })
      .from(shareLinks)
      .where(eq(shareLinks.id, linkId))
      .limit(1);

    if (link.length === 0) {
      return { success: false, error: 'Share link not found' };
    }

    if (link[0].createdBy !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Calculate new expiration if provided
    let expiresAt: Date | null | undefined = undefined;
    if (data.expiresInDays !== undefined) {
      if (data.expiresInDays === null) {
        expiresAt = null;
      } else {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);
      }
    }

    // Update share link
    await db
      .update(shareLinks)
      .set({
        title: data.title,
        description: data.description,
        allowDownload: data.allowDownload,
        isActive: data.isActive,
        ...(expiresAt !== undefined && { expiresAt }),
        updatedAt: new Date(),
      })
      .where(eq(shareLinks.id, linkId));

    revalidatePath('/tests');

    return { success: true };
  } catch (error) {
    console.error('[updateShareLink] Error:', error);
    return { success: false, error: 'Failed to update share link' };
  }
}

/**
 * Delete a share link
 */
export async function deleteShareLink(linkId: string) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const link = await db
      .select({ id: shareLinks.id, createdBy: shareLinks.createdBy })
      .from(shareLinks)
      .where(eq(shareLinks.id, linkId))
      .limit(1);

    if (link.length === 0) {
      return { success: false, error: 'Share link not found' };
    }

    if (link[0].createdBy !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete the share link
    await db.delete(shareLinks).where(eq(shareLinks.id, linkId));

    revalidatePath('/tests');

    return { success: true };
  } catch (error) {
    console.error('[deleteShareLink] Error:', error);
    return { success: false, error: 'Failed to delete share link' };
  }
}

/**
 * Toggle share link active status
 */
export async function toggleShareLinkStatus(linkId: string) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership and get current status
    const link = await db
      .select({
        id: shareLinks.id,
        createdBy: shareLinks.createdBy,
        isActive: shareLinks.isActive,
      })
      .from(shareLinks)
      .where(eq(shareLinks.id, linkId))
      .limit(1);

    if (link.length === 0) {
      return { success: false, error: 'Share link not found' };
    }

    if (link[0].createdBy !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Toggle status
    await db
      .update(shareLinks)
      .set({
        isActive: !link[0].isActive,
        updatedAt: new Date(),
      })
      .where(eq(shareLinks.id, linkId));

    revalidatePath('/tests');

    return { success: true, isActive: !link[0].isActive };
  } catch (error) {
    console.error('[toggleShareLinkStatus] Error:', error);
    return { success: false, error: 'Failed to toggle share link status' };
  }
}
