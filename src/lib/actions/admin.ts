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
import { packageVersions } from '@/lib/db/schema/package-versions';
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

/**
 * Get extended system metrics for monitoring
 */
export async function getSystemMetrics() {
  await requireAdmin();

  try {
    // Database health and version
    let databaseVersion = 'unknown';
    let databaseSizeBytes = 0;
    let tablesSize = 0;
    let indexesSize = 0;
    let schemaVersion = 'unknown';
    let activeConnections = 0;
    let maxConnections = 0;

    try {
      // Get PostgreSQL version
      const versionResult = await db.execute(sql`SELECT version()`);
      if (versionResult && versionResult[0]) {
        const fullVersion = (versionResult[0] as any).version as string;
        const match = fullVersion.match(/PostgreSQL ([\d.]+)/);
        if (match) {
          databaseVersion = match[1];
        }
      }

      // Get database size
      const dbName = process.env.POSTGRES_DB || 'pressograph';
      const sizeResult = await db.execute(
        sql`SELECT pg_database_size(${dbName}) as size`
      );
      if (sizeResult && sizeResult[0]) {
        databaseSizeBytes = Number((sizeResult[0] as any).size) || 0;
      }

      // Get tables and indexes sizes
      const tablesResult = await db.execute(sql`
        SELECT
          pg_size_pretty(sum(pg_total_relation_size(schemaname||'.'||tablename))::bigint) as total,
          sum(pg_total_relation_size(schemaname||'.'||tablename))::bigint as total_bytes,
          sum(pg_relation_size(schemaname||'.'||tablename))::bigint as tables_bytes,
          sum(pg_indexes_size(schemaname||'.'||tablename))::bigint as indexes_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
      `);
      if (tablesResult && tablesResult[0]) {
        const row = tablesResult[0] as any;
        tablesSize = Number(row.tables_bytes) || 0;
        indexesSize = Number(row.indexes_bytes) || 0;
      }

      // Get active database connections
      const connectionsResult = await db.execute(sql`
        SELECT
          count(*) FILTER (WHERE state = 'active') as active,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max
        FROM pg_stat_activity
        WHERE datname = ${dbName}
      `);
      if (connectionsResult && connectionsResult[0]) {
        const row = connectionsResult[0] as any;
        activeConnections = Number(row.active) || 0;
        maxConnections = Number(row.max) || 100;
      }

      // Get schema version from migrations
      try {
        const migrationResult = await db.execute(sql`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = '__drizzle_migrations'
        `);
        if (Array.isArray(migrationResult) && migrationResult.length > 0) {
          const latestMigration = await db.execute(sql`
            SELECT created_at
            FROM __drizzle_migrations
            ORDER BY created_at DESC
            LIMIT 1
          `);
          if (Array.isArray(latestMigration) && latestMigration[0]) {
            const migrationDate = new Date((latestMigration[0] as any).created_at);
            schemaVersion = migrationDate.toISOString().split('T')[0];
          }
        }
      } catch {
        // Migration table doesn't exist yet
        schemaVersion = 'initial';
      }
    } catch (error) {
      console.error('[System Metrics] Database query error:', error);
    }

    // Component versions
    const nodeVersion = process.version;
    const nextVersion = require('next/package.json').version;
    const reactVersion = require('react/package.json').version;

    // System information with resource usage
    const platform = process.platform;
    const architecture = process.arch;
    const uptimeSeconds = process.uptime();

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercent = (usedMemory / totalMemory) * 100;

    // CPU usage (approximate based on process time)
    const cpuUsage = process.cpuUsage();
    const cpuPercent = ((cpuUsage.user + cpuUsage.system) / (uptimeSeconds * 1000000)) * 100;

    // Disk usage - Using environment variable or database size as proxy
    const diskUsageBytes = databaseSizeBytes; // In containerized environment
    const diskTotalBytes = parseInt(process.env.DISK_TOTAL_BYTES || '107374182400', 10); // Default 100GB
    const diskPercent = (diskUsageBytes / diskTotalBytes) * 100;

    // Business metrics
    const [usersCount, projectsCount, testsCount] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(projects),
      db.select({ count: count() }).from(pressureTests),
    ]);

    // Active sessions (users logged in last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const activeSessionsResult = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.lastLoginAt, oneDayAgo));

    return {
      database: {
        healthy: true,
        version: databaseVersion,
        sizeBytes: databaseSizeBytes,
        tablesSize,
        indexesSize,
        schemaVersion,
        activeConnections,
        maxConnections,
        connectionPercent: maxConnections > 0 ? (activeConnections / maxConnections) * 100 : 0,
      },
      components: {
        node: nodeVersion,
        nextjs: nextVersion,
        react: reactVersion,
      },
      system: {
        platform,
        architecture,
        environment: process.env.NODE_ENV || 'development',
        uptimeSeconds,
        memory: {
          usedBytes: usedMemory,
          totalBytes: totalMemory,
          percent: memoryPercent,
        },
        cpu: {
          percent: Math.min(cpuPercent, 100), // Cap at 100%
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        disk: {
          usedBytes: diskUsageBytes,
          totalBytes: diskTotalBytes,
          percent: diskPercent,
        },
      },
      metrics: {
        users: usersCount[0]?.count ?? 0,
        projects: projectsCount[0]?.count ?? 0,
        tests: testsCount[0]?.count ?? 0,
        activeSessions: activeSessionsResult[0]?.count ?? 0,
      },
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[System Metrics] Error:', error);
    return {
      database: {
        healthy: false,
        version: 'error',
        sizeBytes: 0,
        tablesSize: 0,
        indexesSize: 0,
        schemaVersion: 'error',
        activeConnections: 0,
        maxConnections: 0,
        connectionPercent: 0,
      },
      components: {
        node: process.version,
        nextjs: 'unknown',
        react: 'unknown',
      },
      system: {
        platform: process.platform,
        architecture: process.arch,
        environment: process.env.NODE_ENV || 'development',
        uptimeSeconds: process.uptime(),
        memory: {
          usedBytes: 0,
          totalBytes: 0,
          percent: 0,
        },
        cpu: {
          percent: 0,
          user: 0,
          system: 0,
        },
        disk: {
          usedBytes: 0,
          totalBytes: 0,
          percent: 0,
        },
      },
      metrics: {
        users: 0,
        projects: 0,
        tests: 0,
        activeSessions: 0,
      },
      timestamp: new Date(),
      error: 'Failed to fetch system metrics',
    };
  }
}

/**
 * Package Management Types and Actions
 */

export interface PackageInfo {
  name: string;
  currentVersion: string;
  latestVersion: string;
  currentReleaseDate: string | null;
  latestReleaseDate: string | null;
  isUpToDate: boolean;
  type: 'dependency' | 'devDependency';
  homepage?: string;
  description?: string;
}

export interface PackageUpdateSummary {
  total: number;
  upToDate: number;
  outdated: number;
  packages: PackageInfo[];
  lastChecked: Date;
}

interface NpmPackageMetadata {
  name: string;
  'dist-tags': {
    latest: string;
    [key: string]: string;
  };
  time: {
    [version: string]: string;
  };
  description?: string;
  homepage?: string;
}

/**
 * Fetch package metadata from npm registry
 */
async function fetchPackageMetadata(packageName: string): Promise<NpmPackageMetadata | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.warn(`[fetchPackageMetadata] Failed to fetch ${packageName}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[fetchPackageMetadata] Error fetching ${packageName}:`, error);
    return null;
  }
}

/**
 * Get all package versions and update information
 */
export async function getPackageVersions(): Promise<PackageUpdateSummary> {
  await requireAdmin();

  try {
    // Read package.json from project root
    const path = await import('path');
    const fs = await import('fs/promises');
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    // Combine all packages
    const allPackages: Array<{ name: string; version: string; type: 'dependency' | 'devDependency' }> = [
      ...Object.entries(dependencies).map(([name, version]) => ({
        name,
        version: version as string,
        type: 'dependency' as const,
      })),
      ...Object.entries(devDependencies).map(([name, version]) => ({
        name,
        version: version as string,
        type: 'devDependency' as const,
      })),
    ];

    // Fetch metadata for all packages in parallel (with concurrency limit)
    const chunkSize = 10; // Process 10 packages at a time
    const packages: PackageInfo[] = [];

    for (let i = 0; i < allPackages.length; i += chunkSize) {
      const chunk = allPackages.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (pkg) => {
          const metadata = await fetchPackageMetadata(pkg.name);

          if (!metadata) {
            return {
              name: pkg.name,
              currentVersion: pkg.version.replace(/[\^~]/, ''),
              latestVersion: pkg.version.replace(/[\^~]/, ''),
              currentReleaseDate: null,
              latestReleaseDate: null,
              isUpToDate: true,
              type: pkg.type,
            };
          }

          const currentVersion = pkg.version.replace(/[\^~]/, '');
          const latestVersion = metadata['dist-tags']?.latest || currentVersion;

          const currentReleaseDate = metadata.time?.[currentVersion] || null;
          const latestReleaseDate = metadata.time?.[latestVersion] || null;

          return {
            name: pkg.name,
            currentVersion,
            latestVersion,
            currentReleaseDate,
            latestReleaseDate,
            isUpToDate: currentVersion === latestVersion,
            type: pkg.type,
            homepage: metadata.homepage,
            description: metadata.description,
          };
        })
      );

      packages.push(...chunkResults);
    }

    // Sort: outdated first, then by name
    packages.sort((a, b) => {
      if (a.isUpToDate !== b.isUpToDate) {
        return a.isUpToDate ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });

    const outdated = packages.filter((p) => !p.isUpToDate).length;
    const upToDate = packages.filter((p) => p.isUpToDate).length;

    return {
      total: packages.length,
      upToDate,
      outdated,
      packages,
      lastChecked: new Date(),
    };
  } catch (error) {
    console.error('[getPackageVersions] Error:', error);
    throw new Error('Failed to fetch package versions');
  }
}

/**
 * Check if there are any package updates available (lightweight check)
 */
export async function checkForUpdates(): Promise<{ hasUpdates: boolean; outdatedCount: number }> {
  await requireAdmin();

  try {
    const summary = await getPackageVersions();
    return {
      hasUpdates: summary.outdated > 0,
      outdatedCount: summary.outdated,
    };
  } catch (error) {
    console.error('[checkForUpdates] Error:', error);
    return {
      hasUpdates: false,
      outdatedCount: 0,
    };
  }
}

/**
 * Database-backed Package Version Management
 * ==========================================
 *
 * These functions implement a caching layer for npm package metadata:
 * - syncPackageVersions(): Fetches fresh data from npm (slow, runs in background)
 * - getPackageVersionsFromDB(): Reads cached data from database (fast, instant)
 */

export interface SyncResult {
  success: boolean;
  packagesProcessed: number;
  packagesUpdated: number;
  packagesCreated: number;
  errors: number;
  duration: number;
  timestamp: Date;
  error?: string;
}

/**
 * Sync package versions from npm registry to database
 *
 * This function fetches fresh metadata from npm for all packages
 * and stores/updates them in the database. It's designed to run
 * in the background and can take time (30-60 seconds).
 *
 * Use cases:
 * - Manual sync via admin UI
 * - Scheduled cron job
 * - Initial database population
 */
export async function syncPackageVersions(): Promise<SyncResult> {
  await requireAdmin();

  const startTime = Date.now();
  let packagesProcessed = 0;
  let packagesUpdated = 0;
  let packagesCreated = 0;
  let errors = 0;

  try {
    console.log('[syncPackageVersions] Starting package sync from npm registry...');

    // Read package.json
    const path = await import('path');
    const fs = await import('fs/promises');
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    // Combine all packages
    const allPackages: Array<{ name: string; version: string; type: 'dependency' | 'devDependency' }> = [
      ...Object.entries(dependencies).map(([name, version]) => ({
        name,
        version: version as string,
        type: 'dependency' as const,
      })),
      ...Object.entries(devDependencies).map(([name, version]) => ({
        name,
        version: version as string,
        type: 'devDependency' as const,
      })),
    ];

    console.log(`[syncPackageVersions] Found ${allPackages.length} packages to sync`);

    // Process packages in chunks to avoid overwhelming the npm registry
    const chunkSize = 5; // Reduced from 10 for more reliability
    const syncTimestamp = new Date();

    for (let i = 0; i < allPackages.length; i += chunkSize) {
      const chunk = allPackages.slice(i, i + chunkSize);
      console.log(`[syncPackageVersions] Processing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(allPackages.length / chunkSize)}...`);

      await Promise.all(
        chunk.map(async (pkg) => {
          try {
            const metadata = await fetchPackageMetadata(pkg.name);
            packagesProcessed++;

            if (!metadata) {
              console.warn(`[syncPackageVersions] No metadata for ${pkg.name}, skipping`);
              errors++;
              return;
            }

            const currentVersion = pkg.version.replace(/[\^~]/, '');
            const latestVersion = metadata['dist-tags']?.latest || currentVersion;
            const currentReleaseDate = metadata.time?.[currentVersion]
              ? new Date(metadata.time[currentVersion])
              : null;
            const latestReleaseDate = metadata.time?.[latestVersion]
              ? new Date(metadata.time[latestVersion])
              : null;

            // Check if package already exists in database
            const existingPackage = await db
              .select()
              .from(packageVersions)
              .where(eq(packageVersions.name, pkg.name))
              .limit(1);

            if (existingPackage.length > 0) {
              // Update existing package
              await db
                .update(packageVersions)
                .set({
                  type: pkg.type,
                  currentVersion,
                  latestVersion,
                  currentReleaseDate,
                  latestReleaseDate,
                  isUpToDate: currentVersion === latestVersion,
                  description: metadata.description || null,
                  homepage: metadata.homepage || null,
                  lastChecked: syncTimestamp,
                  updatedAt: new Date(),
                })
                .where(eq(packageVersions.name, pkg.name));
              packagesUpdated++;
            } else {
              // Insert new package
              await db.insert(packageVersions).values({
                name: pkg.name,
                type: pkg.type,
                currentVersion,
                latestVersion,
                currentReleaseDate,
                latestReleaseDate,
                isUpToDate: currentVersion === latestVersion,
                description: metadata.description || null,
                homepage: metadata.homepage || null,
                lastChecked: syncTimestamp,
              });
              packagesCreated++;
            }
          } catch (error) {
            console.error(`[syncPackageVersions] Error processing ${pkg.name}:`, error);
            errors++;
          }
        })
      );

      // Small delay between chunks to be nice to npm registry
      if (i + chunkSize < allPackages.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[syncPackageVersions] Sync completed in ${duration}ms: ${packagesCreated} created, ${packagesUpdated} updated, ${errors} errors`);

    // Revalidate the components page
    revalidatePath('/admin/system/components');

    return {
      success: true,
      packagesProcessed,
      packagesUpdated,
      packagesCreated,
      errors,
      duration,
      timestamp: syncTimestamp,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[syncPackageVersions] Fatal error during sync:', error);
    return {
      success: false,
      packagesProcessed,
      packagesUpdated,
      packagesCreated,
      errors: errors + 1,
      duration,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get package versions from database (fast, cached)
 *
 * This function reads package version data from the database
 * instead of fetching from npm. It's instant and won't timeout.
 *
 * Returns cached data with the last sync timestamp.
 */
export async function getPackageVersionsFromDB(): Promise<PackageUpdateSummary | null> {
  await requireAdmin();

  try {
    // Fetch all packages from database
    const packages = await db
      .select()
      .from(packageVersions)
      .orderBy(
        sql`CASE WHEN ${packageVersions.isUpToDate} THEN 1 ELSE 0 END`,
        packageVersions.name
      );

    if (packages.length === 0) {
      console.log('[getPackageVersionsFromDB] No packages in database, needs initial sync');
      return null;
    }

    // Get the most recent sync time
    const mostRecentSync = packages.reduce((latest, pkg) => {
      return pkg.lastChecked > latest ? pkg.lastChecked : latest;
    }, packages[0].lastChecked);

    // Transform to PackageInfo format
    const packageInfos: PackageInfo[] = packages.map(pkg => ({
      name: pkg.name,
      currentVersion: pkg.currentVersion,
      latestVersion: pkg.latestVersion,
      currentReleaseDate: pkg.currentReleaseDate?.toISOString() || null,
      latestReleaseDate: pkg.latestReleaseDate?.toISOString() || null,
      isUpToDate: pkg.isUpToDate,
      type: pkg.type as 'dependency' | 'devDependency',
      homepage: pkg.homepage || undefined,
      description: pkg.description || undefined,
    }));

    const outdated = packageInfos.filter(p => !p.isUpToDate).length;
    const upToDate = packageInfos.filter(p => p.isUpToDate).length;

    console.log(`[getPackageVersionsFromDB] Loaded ${packages.length} packages from DB (last sync: ${mostRecentSync.toISOString()})`);

    return {
      total: packageInfos.length,
      upToDate,
      outdated,
      packages: packageInfos,
      lastChecked: mostRecentSync,
    };
  } catch (error) {
    console.error('[getPackageVersionsFromDB] Error reading from database:', error);
    throw new Error('Failed to read package versions from database');
  }
}
