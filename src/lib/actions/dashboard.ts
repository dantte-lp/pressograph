'use server';

import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema/projects';
import { pressureTests } from '@/lib/db/schema/pressure-tests';
import { testRuns } from '@/lib/db/schema/test-runs';
import { fileUploads } from '@/lib/db/schema/file-uploads';
import { eq, and, count, desc, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/server';

/**
 * Dashboard Statistics
 */
export interface DashboardStats {
  totalProjects: number;
  activeTests: number;
  recentTestRuns: number;
  storageUsed: number; // bytes
}

/**
 * Recent Activity Item
 */
export interface RecentActivity {
  id: string;
  type: 'test_run' | 'test_created' | 'project_created';
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

  // Get recent test runs count (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRunsResult = await db
    .select({ count: count() })
    .from(testRuns)
    .where(
      and(
        eq(testRuns.executedBy, userId),
        sql`${testRuns.startedAt} >= ${thirtyDaysAgo}`
      )
    );

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
    recentTestRuns: recentRunsResult[0]?.count ?? 0,
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

  // Get recent test runs (last 5)
  const recentRuns = await db
    .select({
      id: testRuns.id,
      pressureTestId: testRuns.pressureTestId,
      status: testRuns.status,
      startedAt: testRuns.startedAt,
      testNumber: pressureTests.testNumber,
      testName: pressureTests.name,
    })
    .from(testRuns)
    .innerJoin(pressureTests, eq(testRuns.pressureTestId, pressureTests.id))
    .where(eq(testRuns.executedBy, userId))
    .orderBy(desc(testRuns.startedAt))
    .limit(5);

  for (const run of recentRuns) {
    activities.push({
      id: run.id,
      type: 'test_run',
      title: `Test Run: ${run.testNumber}`,
      description: `${run.testName} - ${run.status}`,
      timestamp: run.startedAt,
      link: `/tests/${run.pressureTestId}/runs/${run.id}`,
    });
  }

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

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
