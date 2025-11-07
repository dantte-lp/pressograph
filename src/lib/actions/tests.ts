'use server';

import { db } from '@/lib/db';
import { pressureTests } from '@/lib/db/schema/pressure-tests';
import { projects } from '@/lib/db/schema/projects';
import { users } from '@/lib/db/schema/users';
import { testRuns } from '@/lib/db/schema/test-runs';
import { fileUploads } from '@/lib/db/schema/file-uploads';
import { eq, and, desc, sql, count, or, ilike, gte, lte, inArray } from 'drizzle-orm';
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
      inArray(pressureTests.status, filters.status as any)
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
 * Test detail with full configuration
 */
export interface TestDetail {
  id: string;
  testNumber: string;
  name: string;
  description: string | null;
  status: TestStatus;
  templateType: string | null;
  config: any;
  tags: string[];
  projectId: string;
  projectName: string;
  createdBy: string;
  createdByName: string;
  organizationId: string;
  isPublic: boolean;
  shareToken: string | null;
  shareExpiresAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  runCount: number;
  lastRunDate: Date | null;
}

/**
 * Get test by ID with full details
 */
export async function getTestById(testId: string): Promise<TestDetail | null> {
  const session = await requireAuth();
  const userId = session.user.id;

  // Get test with joined data
  const testData = await db
    .select({
      id: pressureTests.id,
      testNumber: pressureTests.testNumber,
      name: pressureTests.name,
      description: pressureTests.description,
      status: pressureTests.status,
      templateType: pressureTests.templateType,
      config: pressureTests.config,
      tags: pressureTests.tags,
      projectId: pressureTests.projectId,
      projectName: projects.name,
      createdBy: pressureTests.createdBy,
      createdByName: users.name,
      organizationId: pressureTests.organizationId,
      isPublic: pressureTests.isPublic,
      shareToken: pressureTests.shareToken,
      shareExpiresAt: pressureTests.shareExpiresAt,
      startedAt: pressureTests.startedAt,
      completedAt: pressureTests.completedAt,
      createdAt: pressureTests.createdAt,
      updatedAt: pressureTests.updatedAt,
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

  if (testData.length === 0) {
    return null;
  }

  const test = testData[0];

  // Get run count and last run date
  const runStats = await db
    .select({
      count: count(),
      lastRunDate: sql<Date>`MAX(${testRuns.startedAt})`,
    })
    .from(testRuns)
    .where(eq(testRuns.pressureTestId, testId));

  const runCount = runStats[0]?.count ?? 0;
  const lastRunDate = runStats[0]?.lastRunDate ?? null;

  return {
    ...test,
    status: test.status as TestStatus,
    tags: (test.tags as string[]) || [],
    createdByName: test.createdByName || 'Unknown',
    runCount,
    lastRunDate,
  };
}

/**
 * Get test detail by ID (keeping existing implementation)
 * Note: Extended version with more fields available above as getTestById returning TestDetail
 */
export async function getTestByIdSimple(testId: string) {
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
 * Test run list item
 */
export interface TestRunListItem {
  id: string;
  pressureTestId: string;
  status: string;
  executedBy: string;
  executedByName: string;
  startedAt: Date;
  completedAt: Date | null;
  duration: number | null;
  passed: boolean | null;
  failureReason: string | null;
  results: any;
}

/**
 * Paginated test runs response
 */
export interface PaginatedTestRuns {
  runs: TestRunListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get test runs for a specific test
 */
export async function getTestRuns(
  testId: string,
  pagination: PaginationParams = { page: 1, pageSize: 20 }
): Promise<PaginatedTestRuns> {
  const session = await requireAuth();
  const userId = session.user.id;

  // Verify test ownership
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

  if (test.length === 0) {
    return {
      runs: [],
      total: 0,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: 0,
    };
  }

  // Get total count
  const countResult = await db
    .select({ count: count() })
    .from(testRuns)
    .where(eq(testRuns.pressureTestId, testId));

  const total = countResult[0]?.count ?? 0;

  // Calculate pagination
  const offset = (pagination.page - 1) * pagination.pageSize;
  const totalPages = Math.ceil(total / pagination.pageSize);

  // Get test runs with joined data
  const runsData = await db
    .select({
      id: testRuns.id,
      pressureTestId: testRuns.pressureTestId,
      status: testRuns.status,
      executedBy: testRuns.executedBy,
      executedByName: users.name,
      startedAt: testRuns.startedAt,
      completedAt: testRuns.completedAt,
      duration: testRuns.duration,
      passed: testRuns.passed,
      failureReason: testRuns.failureReason,
      results: testRuns.results,
    })
    .from(testRuns)
    .innerJoin(users, eq(testRuns.executedBy, users.id))
    .where(eq(testRuns.pressureTestId, testId))
    .orderBy(desc(testRuns.startedAt))
    .limit(pagination.pageSize)
    .offset(offset);

  const runs: TestRunListItem[] = runsData.map(run => ({
    id: run.id,
    pressureTestId: run.pressureTestId,
    status: run.status,
    executedBy: run.executedBy,
    executedByName: run.executedByName ?? 'Unknown',
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    duration: run.duration,
    passed: run.passed,
    failureReason: run.failureReason,
    results: run.results,
  }));

  return {
    runs,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
  };
}

/**
 * Create a new pressure test
 */
export async function createTest(data: {
  name: string;
  projectId: string;
  description: string | null;
  tags: string[];
  templateType: 'daily' | 'extended' | 'custom';
  config: any;
  status: 'draft' | 'ready';
  userId: string;
  organizationId: string;
}): Promise<{ success: boolean; test?: any; error?: string }> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Verify project ownership
    const project = await db
      .select({ id: projects.id, settings: projects.settings, organizationId: projects.organizationId })
      .from(projects)
      .where(
        and(
          eq(projects.id, data.projectId),
          eq(projects.ownerId, userId)
        )
      )
      .limit(1);

    if (!project[0]) {
      return { success: false, error: 'Project not found or access denied' };
    }

    // Generate test number
    const projectSettings = project[0].settings as any;
    const prefix = projectSettings?.testNumberPrefix || 'PT';
    const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
    const testNumber = `${prefix}-${timestamp}`;

    // Ensure tags is an array
    const tags = Array.isArray(data.tags) ? data.tags : [];

    // Insert new test
    const result = await db
      .insert(pressureTests)
      .values({
        testNumber,
        name: data.name,
        description: data.description || null,
        projectId: data.projectId,
        createdBy: userId,
        organizationId: project[0].organizationId,
        templateType: data.templateType,
        config: data.config,
        tags: tags,
        status: data.status,
        isPublic: false,
      })
      .returning();

    return { success: true, test: result[0] };
  } catch (error) {
    console.error('Error creating test:', error);
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Failed to create test';
    console.error('Detailed error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return { success: false, error: errorMessage };
  }
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

/**
 * Test Run Detail with full data
 */
export interface TestRunDetail {
  id: string;
  pressureTestId: string;
  testNumber: string;
  testName: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  duration: number | null;
  passed: boolean | null;
  failureReason: string | null;
  results: any;
  executedBy: string;
  executedByName: string;
  createdAt: Date;
  updatedAt: Date;
  files: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    storageKey: string;
    createdAt: Date;
  }>;
}

/**
 * Get test run by ID with full details
 */
export async function getTestRunById(runId: string): Promise<TestRunDetail | null> {
  const session = await requireAuth();
  const userId = session.user.id;

  // Get test run with joined data
  const runData = await db
    .select({
      id: testRuns.id,
      pressureTestId: testRuns.pressureTestId,
      testNumber: pressureTests.testNumber,
      testName: pressureTests.name,
      status: testRuns.status,
      startedAt: testRuns.startedAt,
      completedAt: testRuns.completedAt,
      duration: testRuns.duration,
      passed: testRuns.passed,
      failureReason: testRuns.failureReason,
      results: testRuns.results,
      executedBy: testRuns.executedBy,
      executedByName: users.name,
      createdAt: testRuns.createdAt,
      updatedAt: testRuns.updatedAt,
    })
    .from(testRuns)
    .innerJoin(pressureTests, eq(testRuns.pressureTestId, pressureTests.id))
    .innerJoin(users, eq(testRuns.executedBy, users.id))
    .where(
      and(
        eq(testRuns.id, runId),
        eq(pressureTests.createdBy, userId) // Verify user owns the test
      )
    )
    .limit(1);

  if (runData.length === 0) {
    return null;
  }

  const run = runData[0];

  // Get associated files
  const files = await db
    .select({
      id: fileUploads.id,
      fileName: fileUploads.fileName,
      fileType: fileUploads.fileType,
      fileSize: fileUploads.fileSize,
      storageKey: fileUploads.storageKey,
      createdAt: fileUploads.createdAt,
    })
    .from(fileUploads)
    .where(eq(fileUploads.testRunId, runId))
    .orderBy(desc(fileUploads.createdAt));

  return {
    id: run.id,
    pressureTestId: run.pressureTestId,
    testNumber: run.testNumber,
    testName: run.testName,
    status: run.status,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    duration: run.duration,
    passed: run.passed,
    failureReason: run.failureReason,
    results: run.results,
    executedBy: run.executedBy,
    executedByName: run.executedByName ?? 'Unknown',
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    files: files,
  };
}
