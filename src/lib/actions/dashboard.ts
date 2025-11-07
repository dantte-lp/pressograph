'use server';

import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema/projects';
import { pressureTests } from '@/lib/db/schema/pressure-tests';
import { fileUploads } from '@/lib/db/schema/file-uploads';
import { eq, and, count, desc, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/server-auth';

/**
 * Dashboard Statistics
 */
export interface DashboardStats {
  totalProjects: number;
  activeTests: number;
  totalTests: number;
  storageUsed: number; // bytes
}

/**
 * Recent Activity Item
 */
export interface RecentActivity {
  id: string;
  type: 'test_created' | 'project_created';
  title: string;
  description: string;
  timestamp: Date;
  link: string;
}

/**
 * Get dashboard statistics for the current user
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await requireAuth();
  const userId = session.user.id;

  // Get total projects count
  const projectsResult = await db
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.ownerId, userId));

  // Get active tests count (status = 'running' or 'ready')
  const activeTestsResult = await db
    .select({ count: count() })
    .from(pressureTests)
    .where(
      and(
        eq(pressureTests.createdBy, userId),
        sql`${pressureTests.status} IN ('running', 'ready')`
      )
    );

  // Get total tests count
  const totalTestsResult = await db
    .select({ count: count() })
    .from(pressureTests)
    .where(eq(pressureTests.createdBy, userId));

  // Get storage usage (sum of file sizes)
  const storageResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${fileUploads.fileSize}), 0)`
    })
    .from(fileUploads)
    .where(eq(fileUploads.uploadedBy, userId));

  return {
    totalProjects: projectsResult[0]?.count ?? 0,
    activeTests: activeTestsResult[0]?.count ?? 0,
    totalTests: totalTestsResult[0]?.count ?? 0,
    storageUsed: Number(storageResult[0]?.total ?? 0),
  };
}

/**
 * Get recent activity for the current user
 */
export async function getRecentActivity(): Promise<RecentActivity[]> {
  const session = await requireAuth();
  const userId = session.user.id;

  const activities: RecentActivity[] = [];

  // Get recently created tests (last 5)
  const recentTests = await db
    .select({
      id: pressureTests.id,
      testNumber: pressureTests.testNumber,
      name: pressureTests.name,
      createdAt: pressureTests.createdAt,
    })
    .from(pressureTests)
    .where(eq(pressureTests.createdBy, userId))
    .orderBy(desc(pressureTests.createdAt))
    .limit(5);

  for (const test of recentTests) {
    activities.push({
      id: test.id,
      type: 'test_created',
      title: `Test Created: ${test.testNumber}`,
      description: test.name,
      timestamp: test.createdAt,
      link: `/tests/${test.id}`,
    });
  }

  // Get recently created projects (last 5)
  const recentProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(eq(projects.ownerId, userId))
    .orderBy(desc(projects.createdAt))
    .limit(5);

  for (const project of recentProjects) {
    activities.push({
      id: project.id,
      type: 'project_created',
      title: `Project Created: ${project.name}`,
      description: project.description || 'No description',
      timestamp: project.createdAt,
      link: `/projects/${project.id}`,
    });
  }

  // Sort all activities by timestamp (most recent first) and limit to 10
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);
}
