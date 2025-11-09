/**
 * Admin Server Actions
 *
 * Server actions for admin functionality:
 * - User management
 * - System statistics
 * - Organization management
 */

'use server';

import { eq, gte, desc, and, or, ilike, sql, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { organizations } from '@/lib/db/schema/organizations';
import { projects } from '@/lib/db/schema/projects';
import { pressureTests } from '@/lib/db/schema/pressure-tests';
import { fileUploads } from '@/lib/db/schema/file-uploads';
import { requireAdmin } from '@/lib/auth/server-auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

/**
 * Get system-wide statistics for admin dashboard
 */
export async function getAdminStats() {
  await requireAdmin();

  // Get counts
  const [
    totalUsersResult,
    totalOrganizationsResult,
    totalProjectsResult,
    totalTestsResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(organizations),
    db.select({ count: count() }).from(projects),
    db.select({ count: count() }).from(pressureTests),
  ]);

  const totalUsers = totalUsersResult[0]?.count ?? 0;
  const totalOrganizations = totalOrganizationsResult[0]?.count ?? 0;
  const totalProjects = totalProjectsResult[0]?.count ?? 0;
  const totalTests = totalTestsResult[0]?.count ?? 0;

  // Get total file uploads and storage
  const fileStats = await db
    .select({
      count: count(),
      totalSize: sql<number>`COALESCE(SUM(${fileUploads.fileSize}), 0)`,
    })
    .from(fileUploads);

  const totalFileUploads = fileStats[0]?.count ?? 0;
  const storageUsed = Number(fileStats[0]?.totalSize ?? 0);

  // Get recent users (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentUsersResult = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.createdAt, thirtyDaysAgo));

  const recentUsers = recentUsersResult[0]?.count ?? 0;

  // Get active users (logged in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const activeUsersResult = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.lastLoginAt, sevenDaysAgo));

  const activeUsers = activeUsersResult[0]?.count ?? 0;

  // For totalTestRuns, we would need the testRuns table
  // For now, we'll return 0 as the table might not be in the schema yet
  const totalTestRuns = 0;

  return {
    totalUsers,
    totalOrganizations,
    totalProjects,
    totalTests,
    totalTestRuns,
    totalFileUploads,
    storageUsed,
    recentUsers,
    activeUsers,
  };
}

/**
 * Get all users with pagination
 */
export async function getUsers(options: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: 'admin' | 'user';
}) {
  await requireAdmin();

  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [];

  if (options.search) {
    conditions.push(
      or(
        ilike(users.name, `%${options.search}%`),
        ilike(users.email, `%${options.search}%`),
        ilike(users.username, `%${options.search}%`)
      )
    );
  }

  if (options.role) {
    conditions.push(eq(users.role, options.role));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get users with counts
  const usersList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      role: users.role,
      organizationId: users.organizationId,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(skip);

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(users)
    .where(whereClause);

  const total = totalResult[0]?.count ?? 0;

  // Add counts for projects and tests per user
  const usersWithCounts = await Promise.all(
    usersList.map(async (user) => {
      const projectsCount = await db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.ownerId, user.id));

      const testsCount = await db
        .select({ count: count() })
        .from(pressureTests)
        .where(eq(pressureTests.createdBy, user.id));

      return {
        ...user,
        _count: {
          projects: projectsCount[0]?.count ?? 0,
          pressureTests: testsCount[0]?.count ?? 0,
        },
      };
    })
  );

  return {
    users: usersWithCounts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get all organizations
 */
export async function getOrganizations() {
  await requireAdmin();

  const orgList = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      logoUrl: organizations.logoUrl,
      primaryColor: organizations.primaryColor,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .orderBy(desc(organizations.createdAt));

  // Add counts for users and projects per organization
  const orgsWithCounts = await Promise.all(
    orgList.map(async (org) => {
      const usersCount = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.organizationId, org.id));

      const projectsCount = await db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.organizationId, org.id));

      return {
        ...org,
        _count: {
          users: usersCount[0]?.count ?? 0,
          projects: projectsCount[0]?.count ?? 0,
        },
      };
    })
  );

  return orgsWithCounts;
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: 'admin' | 'user') {
  await requireAdmin();

  await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId));

  revalidatePath('/admin');
  revalidatePath('/admin/users');
}

/**
 * Get system health metrics
 */
export async function getSystemHealth() {
  await requireAdmin();

  // Database connection check
  let dbHealthy = false;
  try {
    await db.select({ result: sql`1` }).from(users).limit(1);
    dbHealthy = true;
  } catch (error) {
    console.error('[System Health] Database check failed:', error);
    dbHealthy = false;
  }

  return {
    database: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date(),
  };
}

/**
 * Get recent activity across the system
 */
export async function getRecentAdminActivity(limit = 20) {
  await requireAdmin();

  // Get recent projects
  const recentProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      createdAt: projects.createdAt,
      ownerName: users.name,
      ownerEmail: users.email,
      orgName: organizations.name,
    })
    .from(projects)
    .leftJoin(users, eq(projects.ownerId, users.id))
    .leftJoin(organizations, eq(projects.organizationId, organizations.id))
    .orderBy(desc(projects.createdAt))
    .limit(limit);

  // Get recent tests
  const recentTests = await db
    .select({
      id: pressureTests.id,
      testNumber: pressureTests.testNumber,
      name: pressureTests.name,
      createdAt: pressureTests.createdAt,
      creatorName: users.name,
      creatorEmail: users.email,
      projectName: projects.name,
    })
    .from(pressureTests)
    .leftJoin(users, eq(pressureTests.createdBy, users.id))
    .leftJoin(projects, eq(pressureTests.projectId, projects.id))
    .orderBy(desc(pressureTests.createdAt))
    .limit(limit);

  // Get recent users
  const recentUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      role: users.role,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit);

  return {
    projects: recentProjects.map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      owner: {
        name: p.ownerName ?? 'Unknown',
        email: p.ownerEmail ?? 'unknown@example.com',
      },
      organization: {
        name: p.orgName ?? 'Unknown',
      },
    })),
    tests: recentTests.map((t) => ({
      id: t.id,
      testNumber: t.testNumber,
      name: t.name ?? 'Unnamed Test',
      createdAt: t.createdAt,
      creator: {
        name: t.creatorName ?? 'Unknown',
        email: t.creatorEmail ?? 'unknown@example.com',
      },
      project: {
        name: t.projectName ?? 'Unknown',
      },
    })),
    users: recentUsers,
  };
}

/**
 * User Management Actions
 */

/**
 * Create a new user
 */
export async function createUser(data: {
  name: string;
  email: string;
  username: string;
  password: string;
  role?: 'admin' | 'user';
  organizationId?: string;
}) {
  await requireAdmin();

  try {
    // Check if email or username already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, data.email), eq(users.username, data.username)))
      .limit(1);

    if (existingUser.length > 0) {
      return {
        success: false,
        error: 'User with this email or username already exists',
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        username: data.username,
        password: hashedPassword,
        role: data.role ?? 'user',
        organizationId: data.organizationId || null,
      })
      .returning({ id: users.id });

    revalidatePath('/admin/users');
    revalidatePath('/admin');

    return {
      success: true,
      userId: newUser.id,
    };
  } catch (error) {
    console.error('[createUser] Error creating user:', error);
    return {
      success: false,
      error: 'Failed to create user',
    };
  }
}

/**
 * Update user details
 */
export async function updateUser(
  userId: string,
  data: {
    name?: string;
    email?: string;
    username?: string;
    role?: 'admin' | 'user';
    organizationId?: string | null;
    isActive?: boolean;
  }
) {
  await requireAdmin();

  try {
    // Check if email or username is being changed and already exists
    if (data.email || data.username) {
      const conditions = [];
      if (data.email) conditions.push(eq(users.email, data.email));
      if (data.username) conditions.push(eq(users.username, data.username));

      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(and(or(...conditions), sql`${users.id} != ${userId}`))
        .limit(1);

      if (existingUser.length > 0) {
        return {
          success: false,
          error: 'Email or username already in use by another user',
        };
      }
    }

    await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    revalidatePath('/admin/users');
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error('[updateUser] Error updating user:', error);
    return {
      success: false,
      error: 'Failed to update user',
    };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  await requireAdmin();

  try {
    // Check if user exists
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Delete user (cascading deletes handled by database)
    await db.delete(users).where(eq(users.id, userId));

    revalidatePath('/admin/users');
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error('[deleteUser] Error deleting user:', error);
    return {
      success: false,
      error: 'Failed to delete user',
    };
  }
}

/**
 * Reset user password (admin action)
 */
export async function resetUserPassword(userId: string, newPassword: string) {
  await requireAdmin();

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    console.error('[resetUserPassword] Error resetting password:', error);
    return {
      success: false,
      error: 'Failed to reset password',
    };
  }
}

/**
 * Organization Management Actions
 */

/**
 * Create a new organization
 */
export async function createOrganization(data: {
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
}) {
  await requireAdmin();

  try {
    // Check if slug already exists
    const existingOrg = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, data.slug))
      .limit(1);

    if (existingOrg.length > 0) {
      return {
        success: false,
        error: 'Organization with this slug already exists',
      };
    }

    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor || '#2563EB',
      })
      .returning({ id: organizations.id });

    revalidatePath('/admin/organizations');
    revalidatePath('/admin');

    return {
      success: true,
      organizationId: newOrg.id,
    };
  } catch (error) {
    console.error('[createOrganization] Error creating organization:', error);
    return {
      success: false,
      error: 'Failed to create organization',
    };
  }
}

/**
 * Update organization details
 */
export async function updateOrganization(
  organizationId: string,
  data: {
    name?: string;
    slug?: string;
    logoUrl?: string | null;
    primaryColor?: string;
  }
) {
  await requireAdmin();

  try {
    // Check if slug is being changed and already exists
    if (data.slug) {
      const existingOrg = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(
          and(
            eq(organizations.slug, data.slug),
            sql`${organizations.id} != ${organizationId}`
          )
        )
        .limit(1);

      if (existingOrg.length > 0) {
        return {
          success: false,
          error: 'Slug already in use by another organization',
        };
      }
    }

    await db
      .update(organizations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId));

    revalidatePath('/admin/organizations');
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error('[updateOrganization] Error updating organization:', error);
    return {
      success: false,
      error: 'Failed to update organization',
    };
  }
}

/**
 * Delete an organization
 */
export async function deleteOrganization(organizationId: string) {
  await requireAdmin();

  try {
    // Check if organization has users
    const usersInOrg = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.organizationId, organizationId));

    if ((usersInOrg[0]?.count ?? 0) > 0) {
      return {
        success: false,
        error: 'Cannot delete organization with existing users. Please reassign or delete users first.',
      };
    }

    // Check if organization has projects
    const projectsInOrg = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.organizationId, organizationId));

    if ((projectsInOrg[0]?.count ?? 0) > 0) {
      return {
        success: false,
        error: 'Cannot delete organization with existing projects. Please delete projects first.',
      };
    }

    // Delete organization
    await db.delete(organizations).where(eq(organizations.id, organizationId));

    revalidatePath('/admin/organizations');
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error('[deleteOrganization] Error deleting organization:', error);
    return {
      success: false,
      error: 'Failed to delete organization',
    };
  }
}
