'use server';

/**
 * Server Actions for Project CRUD Operations
 *
 * These actions handle project creation, reading, updating, and deletion
 * with proper authentication and authorization checks.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { eq, and, desc, ilike, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects, type Project, type NewProject, type ProjectSettings } from '@/lib/db/schema/projects';
import { users } from '@/lib/db/schema/users';
import { authOptions } from '@/lib/auth/config';

/**
 * Get all projects for the current user
 */
export async function getProjects(options?: {
  searchQuery?: string;
  isArchived?: boolean;
  limit?: number;
  offset?: number;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const { searchQuery, isArchived = false, limit = 50, offset = 0 } = options || {};

    const conditions = [
      eq(projects.ownerId, session.user.id),
      eq(projects.isArchived, isArchived),
    ];

    // Add search condition if query provided
    if (searchQuery && searchQuery.trim()) {
      conditions.push(
        or(
          ilike(projects.name, `%${searchQuery}%`),
          ilike(projects.description, `%${searchQuery}%`)
        )!
      );
    }

    const result = await db
      .select()
      .from(projects)
      .where(and(...conditions))
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);

    return { projects: result, error: null };
  } catch (error) {
    console.error('[getProjects] Error:', error);
    return { projects: [], error: 'Failed to fetch projects' };
  }
}

/**
 * Get a single project by ID
 */
export async function getProject(projectId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const result = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.ownerId, session.user.id)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return { project: null, error: 'Project not found' };
    }

    return { project: result[0], error: null };
  } catch (error) {
    console.error('[getProject] Error:', error);
    return { project: null, error: 'Failed to fetch project' };
  }
}

/**
 * Get project by ID with owner information for detail page
 */
export async function getProjectById(projectId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  try {
    const result = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        organizationId: projects.organizationId,
        ownerId: projects.ownerId,
        ownerName: users.name,
        isArchived: projects.isArchived,
        settings: projects.settings,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .innerJoin(users, eq(projects.ownerId, users.id))
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.ownerId, session.user.id)
        )
      )
      .limit(1);

    return result[0] ?? null;
  } catch (error) {
    console.error('[getProjectById] Error:', error);
    return null;
  }
}

/**
 * Create a new project
 */
export async function createProject(data: {
  name: string;
  description?: string;
  settings?: Partial<ProjectSettings>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { project: null, error: 'Unauthorized' };
  }

  try {
    const { name, description, settings } = data;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return { project: null, error: 'Project name is required' };
    }

    if (name.length > 255) {
      return { project: null, error: 'Project name is too long (max 255 characters)' };
    }

    // Prepare default settings
    const defaultSettings: ProjectSettings = {
      autoNumberTests: true,
      testNumberPrefix: 'PT',
      requireNotes: false,
      defaultTemplateType: 'daily',
      ...settings,
    };

    // Get organizationId - if not in session, fetch from database
    let organizationId = session.user.organizationId;

    if (!organizationId) {
      // Fetch fresh user data to get organizationId
      const [user] = await db
        .select({ organizationId: users.organizationId })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

      organizationId = user?.organizationId;

      // If still no organizationId, user needs to be assigned to an organization
      if (!organizationId) {
        return {
          project: null,
          error: 'User must belong to an organization to create projects. Please contact your administrator.'
        };
      }
    }

    // Insert new project
    const newProject: NewProject = {
      name: name.trim(),
      description: description?.trim() || null,
      organizationId,
      ownerId: session.user.id,
      settings: defaultSettings,
      isArchived: false,
    };

    const result = await db.insert(projects).values(newProject).returning();

    // Revalidate the projects page
    revalidatePath('/projects');

    return { project: result[0], error: null };
  } catch (error) {
    console.error('[createProject] Error:', error);
    return { project: null, error: 'Failed to create project' };
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  projectId: string,
  data: {
    name?: string;
    description?: string;
    settings?: Partial<ProjectSettings>;
  }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { project: null, error: 'Unauthorized' };
  }

  try {
    // Verify ownership
    const existing = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.ownerId, session.user.id)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return { project: null, error: 'Project not found or access denied' };
    }

    // Prepare update data
    const updateData: Partial<Project> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        return { project: null, error: 'Project name cannot be empty' };
      }
      if (data.name.length > 255) {
        return { project: null, error: 'Project name is too long (max 255 characters)' };
      }
      updateData.name = data.name.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }

    if (data.settings !== undefined) {
      updateData.settings = {
        ...existing[0].settings,
        ...data.settings,
      } as ProjectSettings;
    }

    // Update project
    const result = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning();

    // Revalidate pages
    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);

    return { project: result[0], error: null };
  } catch (error) {
    console.error('[updateProject] Error:', error);
    return { project: null, error: 'Failed to update project' };
  }
}

/**
 * Archive or unarchive a project
 */
export async function toggleArchiveProject(projectId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { project: null, error: 'Unauthorized' };
  }

  try {
    // Verify ownership
    const existing = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.ownerId, session.user.id)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return { project: null, error: 'Project not found or access denied' };
    }

    // Toggle archive status
    const result = await db
      .update(projects)
      .set({
        isArchived: !existing[0].isArchived,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    // Revalidate pages
    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);

    return { project: result[0], error: null };
  } catch (error) {
    console.error('[toggleArchiveProject] Error:', error);
    return { project: null, error: 'Failed to archive/unarchive project' };
  }
}

/**
 * Delete a project permanently
 */
export async function deleteProject(projectId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Verify ownership
    const existing = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.ownerId, session.user.id)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'Project not found or access denied' };
    }

    // Delete project (cascade will delete related tests)
    await db.delete(projects).where(eq(projects.id, projectId));

    // Revalidate and redirect
    revalidatePath('/projects');
    redirect('/projects');
  } catch (error) {
    console.error('[deleteProject] Error:', error);
    return { success: false, error: 'Failed to delete project' };
  }
}
