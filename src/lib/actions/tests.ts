'use server';

import { db } from '@/lib/db';
import { pressureTests } from '@/lib/db/schema/pressure-tests';
import { projects } from '@/lib/db/schema/projects';
import { users } from '@/lib/db/schema/users';
import { testRuns } from '@/lib/db/schema/test-runs';
import { fileUploads } from '@/lib/db/schema/file-uploads';
import { eq, and, desc, sql, count, or, ilike, gte, lte } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/server-auth';

/**
 * Test Status Types
 */
export type TestStatus = 'draft' | 'ready' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Test with related data for table view
 */
export interface TestListItem {
  id: string;
  testNumber: string;
  name: string;
  status: TestStatus;
  projectId: string;
  projectName: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
  runCount: number;
  lastRunDate: Date | null;
  latestGraphFormat: string | null;
  latestGraphSize: number | null;
}

/**
 * Filters for test list
 */
export interface TestFilters {
  search?: string;
  projectId?: string;
  status?: TestStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'newest' | 'oldest' | 'testNumber' | 'name' | 'lastRun';
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Paginated test list response
 */
export interface PaginatedTests {
  tests: TestListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get paginated list of tests with filters
 */
export async function getTests(
  filters: TestFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 20 }
): Promise<PaginatedTests> {
  const session = await requireAuth();
  const userId = session.user.id;

  // Build WHERE conditions
  const conditions = [eq(pressureTests.createdBy, userId)];

  // Search filter (test number or name)
  if (filters.search) {
    conditions.push(
      or(
        ilike(pressureTests.testNumber, `%${filters.search}%`),
        ilike(pressureTests.name, `%${filters.search}%`)
      )!
    );
  }

  // Project filter
  if (filters.projectId) {
    conditions.push(eq(pressureTests.projectId, filters.projectId));
  }

  // Status filter
  if (filters.status && filters.status.length > 0) {
    conditions.push(
      sql`${pressureTests.status} IN ${filters.status}`
    );
  }

  // Date range filter
  if (filters.dateFrom) {
    conditions.push(gte(pressureTests.createdAt, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(pressureTests.createdAt, filters.dateTo));
  }

  // Get total count
  const countResult = await db
    .select({ count: count() })
    .from(pressureTests)
    .where(and(...conditions));

  const total = countResult[0]?.count ?? 0;

  // Calculate pagination
  const offset = (pagination.page - 1) * pagination.pageSize;
  const totalPages = Math.ceil(total / pagination.pageSize);

  // Build ORDER BY clause
  let orderByClause;
  switch (filters.sortBy) {
    case 'oldest':
      orderByClause = pressureTests.createdAt;
      break;
    case 'testNumber':
      orderByClause = pressureTests.testNumber;
      break;
    case 'name':
      orderByClause = pressureTests.name;
      break;
    case 'newest':
    default:
      orderByClause = desc(pressureTests.createdAt);
      break;
  }

  // Get tests with joined data
  const testsData = await db
    .select({
      id: pressureTests.id,
      testNumber: pressureTests.testNumber,
      name: pressureTests.name,
      status: pressureTests.status,
      projectId: pressureTests.projectId,
      projectName: projects.name,
      createdAt: pressureTests.createdAt,
      updatedAt: pressureTests.updatedAt,
      createdByName: users.name,
    })
    .from(pressureTests)
    .innerJoin(projects, eq(pressureTests.projectId, projects.id))
    .innerJoin(users, eq(pressureTests.createdBy, users.id))
    .where(and(...conditions))
    .orderBy(orderByClause)
    .limit(pagination.pageSize)
    .offset(offset);

  // Get run counts and latest graph info for each test
  const testIds = testsData.map(t => t.id);

  const runCounts = testIds.length > 0
    ? await db
        .select({
          testId: testRuns.pressureTestId,
          count: count(),
          lastRunDate: sql<Date>`MAX(${testRuns.startedAt})`,
        })
        .from(testRuns)
        .where(sql`${testRuns.pressureTestId} IN ${testIds}`)
        .groupBy(testRuns.pressureTestId)
    : [];

  const latestGraphs = testIds.length > 0
    ? await db
        .select({
          testId: fileUploads.pressureTestId,
          fileType: fileUploads.fileType,
          fileSize: fileUploads.fileSize,
          createdAt: fileUploads.createdAt,
        })
        .from(fileUploads)
        .where(sql`${fileUploads.pressureTestId} IN ${testIds}`)
        .orderBy(desc(fileUploads.createdAt))
    : [];

  // Create lookup maps
  const runCountMap = new Map(runCounts.map(r => [r.testId, r]));
  const graphMap = new Map<string, typeof latestGraphs[0]>();
  for (const graph of latestGraphs) {
    if (!graphMap.has(graph.testId!)) {
      graphMap.set(graph.testId!, graph);
    }
  }

  // Combine data
  const tests: TestListItem[] = testsData.map(test => {
    const runData = runCountMap.get(test.id);
    const graphData = graphMap.get(test.id);

    return {
      id: test.id,
      testNumber: test.testNumber,
      name: test.name,
      status: test.status as TestStatus,
      projectId: test.projectId,
      projectName: test.projectName,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt,
      createdByName: test.createdByName ?? 'Unknown',
      runCount: runData?.count ?? 0,
      lastRunDate: runData?.lastRunDate ?? null,
      latestGraphFormat: graphData?.fileType ?? null,
      latestGraphSize: graphData?.fileSize ?? null,
    };
  });

  return {
    tests,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
  };
}

/**
 * Get test detail by ID
 */
export async function getTestById(testId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const test = await db
    .select({
      id: pressureTests.id,
      testNumber: pressureTests.testNumber,
      name: pressureTests.name,
      description: pressureTests.description,
      status: pressureTests.status,
      config: pressureTests.config,
      projectId: pressureTests.projectId,
      projectName: projects.name,
      createdAt: pressureTests.createdAt,
      updatedAt: pressureTests.updatedAt,
      createdBy: pressureTests.createdBy,
      createdByName: users.name,
    })
    .from(pressureTests)
    .innerJoin(projects, eq(pressureTests.projectId, projects.id))
    .innerJoin(users, eq(pressureTests.createdBy, users.id))
    .where(
      and(
        eq(pressureTests.id, testId),
        eq(pressureTests.createdBy, userId)
      )
    )
    .limit(1);

  return test[0] ?? null;
}

/**
 * Delete a test
 */
export async function deleteTest(testId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Verify ownership
    const test = await db
      .select({ id: pressureTests.id })
      .from(pressureTests)
      .where(
        and(
          eq(pressureTests.id, testId),
          eq(pressureTests.createdBy, userId)
        )
      )
      .limit(1);

    if (!test[0]) {
      return { success: false, error: 'Test not found or access denied' };
    }

    // Delete test (cascading will handle related records)
    await db
      .delete(pressureTests)
      .where(eq(pressureTests.id, testId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting test:', error);
    return { success: false, error: 'Failed to delete test' };
  }
}
