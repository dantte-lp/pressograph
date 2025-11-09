'use server';

import { db } from '@/lib/db';
import { pressureTests } from '@/lib/db/schema/pressure-tests';
import { projects } from '@/lib/db/schema/projects';
import { users } from '@/lib/db/schema/users';
import { fileUploads } from '@/lib/db/schema/file-uploads';
import { eq, and, desc, sql, count, or, ilike, gte, lte, inArray } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/server-auth';
import { generateSequentialTestNumber, validateCustomTestNumber } from '@/lib/utils/test-number';

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

  // Get latest graph info for each test
  const testIds = testsData.map(t => t.id);

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

  // Create lookup map for graphs
  const graphMap = new Map<string, typeof latestGraphs[0]>();
  for (const graph of latestGraphs) {
    if (!graphMap.has(graph.testId!)) {
      graphMap.set(graph.testId!, graph);
    }
  }

  // Combine data
  const tests: TestListItem[] = testsData.map(test => {
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
  createdAt: Date;
  updatedAt: Date;
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

  return {
    ...test,
    status: test.status as TestStatus,
    tags: (test.tags as string[]) || [],
    createdByName: test.createdByName || 'Unknown',
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
  testNumber?: string; // Optional custom test number
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

    // Handle test number (custom or auto-generated)
    let testNumber: string;

    if (data.testNumber) {
      // Validate custom test number
      const validation = await validateCustomTestNumber(
        data.testNumber,
        project[0].organizationId
      );

      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      testNumber = data.testNumber.trim();
    } else {
      // Auto-generate test number
      testNumber = await generateSequentialTestNumber(
        data.projectId,
        project[0].organizationId
      );
    }

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
 * Update a test
 */
export async function updateTest(
  testId: string,
  data: {
    name?: string;
    description?: string | null;
    projectId?: string;
    templateType?: 'daily' | 'extended' | 'custom';
    config?: any;
    tags?: string[];
    testNumber?: string; // Optional: allow updating test number
  }
): Promise<{ success: boolean; test?: any; error?: string }> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Verify ownership
    const test = await db
      .select({
        id: pressureTests.id,
        status: pressureTests.status,
        organizationId: pressureTests.organizationId,
        testNumber: pressureTests.testNumber,
      })
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

    // Only allow editing tests in 'draft' or 'ready' status
    if (test[0].status !== 'draft' && test[0].status !== 'ready') {
      return { success: false, error: 'Cannot edit test in current status' };
    }

    // If project is being changed, verify new project ownership
    if (data.projectId && data.projectId !== test[0].id) {
      const project = await db
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(
            eq(projects.id, data.projectId),
            eq(projects.ownerId, userId)
          )
        )
        .limit(1);

      if (!project[0]) {
        return { success: false, error: 'New project not found or access denied' };
      }
    }

    // Validate test number if it's being updated
    if (data.testNumber && data.testNumber !== test[0].testNumber) {
      const validation = await validateCustomTestNumber(
        data.testNumber,
        test[0].organizationId,
        testId // Exclude current test from uniqueness check
      );

      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.templateType !== undefined) updateData.templateType = data.templateType;
    if (data.config !== undefined) updateData.config = data.config;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.testNumber !== undefined && data.testNumber !== test[0].testNumber) {
      updateData.testNumber = data.testNumber.trim();
    }

    // Update test
    const result = await db
      .update(pressureTests)
      .set(updateData)
      .where(eq(pressureTests.id, testId))
      .returning();

    return { success: true, test: result[0] };
  } catch (error) {
    console.error('Error updating test:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update test';
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
 * Batch delete multiple tests
 * Only deletes tests owned by the current user
 */
export async function batchDeleteTests(testIds: string[]): Promise<{ success: boolean; deleted: number; error?: string }> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    if (testIds.length === 0) {
      return { success: false, deleted: 0, error: 'No tests selected' };
    }

    // Verify ownership for all tests
    const ownedTests = await db
      .select({ id: pressureTests.id })
      .from(pressureTests)
      .where(
        and(
          inArray(pressureTests.id, testIds),
          eq(pressureTests.createdBy, userId)
        )
      );

    if (ownedTests.length === 0) {
      return { success: false, deleted: 0, error: 'No tests found or access denied' };
    }

    // Delete tests (cascading will handle related records)
    await db
      .delete(pressureTests)
      .where(
        and(
          inArray(pressureTests.id, ownedTests.map(t => t.id)),
          eq(pressureTests.createdBy, userId)
        )
      );

    return { success: true, deleted: ownedTests.length };
  } catch (error) {
    console.error('Error batch deleting tests:', error);
    return { success: false, deleted: 0, error: 'Failed to delete tests' };
  }
}

