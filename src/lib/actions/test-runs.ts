"use server";

import { db } from "@/lib/db";
import { testRuns } from "@/lib/db/schema/test-runs";
import { pressureTests } from "@/lib/db/schema/pressure-tests";
import { users } from "@/lib/db/schema/users";
import { eq, and, desc, asc, gte, lte, sql, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/server-auth";
import { revalidatePath } from "next/cache";
import type { TestRunMeasurements, TestRunResults } from "@/lib/db/schema/test-runs";

/**
 * Test Run with operator and test info
 */
export interface TestRunListItem {
  id: string;
  runNumber: number;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  durationSeconds: number | null;
  operatorName: string | null;
  operatorId: string;
  testNumber: string;
  testName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Test Run Statistics
 */
export interface TestRunStatistics {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  averageDuration: number | null;
  successRate: number;
  lastRunDate: Date | null;
}

/**
 * Get all test runs for a specific test
 */
export async function getTestRuns(testId: string): Promise<TestRunListItem[]> {
  const session = await requireAuth();
  const organizationId = session.user.organizationId as string;

  // First verify test belongs to user's organization
  const [test] = await db
    .select()
    .from(pressureTests)
    .where(
      and(
        eq(pressureTests.id, testId),
        eq(pressureTests.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!test) {
    throw new Error("Test not found or access denied");
  }

  const runs = await db
    .select({
      id: testRuns.id,
      runNumber: testRuns.runNumber,
      status: testRuns.status,
      startedAt: testRuns.startedAt,
      completedAt: testRuns.completedAt,
      durationSeconds: testRuns.durationSeconds,
      operatorName: users.name,
      operatorId: users.id,
      testNumber: pressureTests.testNumber,
      testName: pressureTests.name,
      createdAt: testRuns.createdAt,
      updatedAt: testRuns.updatedAt,
    })
    .from(testRuns)
    .innerJoin(pressureTests, eq(testRuns.testId, pressureTests.id))
    .innerJoin(users, eq(testRuns.operatorId, users.id))
    .where(eq(testRuns.testId, testId))
    .orderBy(desc(testRuns.runNumber));

  return runs;
}

/**
 * Get single test run by ID with full details
 */
export async function getTestRunById(runId: string) {
  const session = await requireAuth();
  const organizationId = session.user.organizationId as string;

  const [run] = await db
    .select({
      id: testRuns.id,
      testId: testRuns.testId,
      runNumber: testRuns.runNumber,
      status: testRuns.status,
      startedAt: testRuns.startedAt,
      completedAt: testRuns.completedAt,
      durationSeconds: testRuns.durationSeconds,
      measurements: testRuns.measurements,
      results: testRuns.results,
      notes: testRuns.notes,
      operatorObservations: testRuns.operatorObservations,
      createdAt: testRuns.createdAt,
      updatedAt: testRuns.updatedAt,
      operatorName: users.name,
      operatorId: users.id,
      testNumber: pressureTests.testNumber,
      testName: pressureTests.name,
      testConfig: pressureTests.config,
    })
    .from(testRuns)
    .innerJoin(pressureTests, eq(testRuns.testId, pressureTests.id))
    .innerJoin(users, eq(testRuns.operatorId, users.id))
    .where(
      and(
        eq(testRuns.id, runId),
        eq(pressureTests.organizationId, organizationId)
      )
    )
    .limit(1);

  return run || null;
}

/**
 * Create new test run
 */
export async function createTestRun(data: {
  testId: string;
  operatorId?: string; // Optional, defaults to current user
  status?: string;
  startedAt?: Date;
  notes?: string;
}) {
  const session = await requireAuth();
  const userId = session.user.id as string;
  const organizationId = session.user.organizationId as string;

  // Verify test exists and belongs to organization
  const [test] = await db
    .select()
    .from(pressureTests)
    .where(
      and(
        eq(pressureTests.id, data.testId),
        eq(pressureTests.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!test) {
    throw new Error("Test not found or access denied");
  }

  // Get next run number for this test
  const [lastRun] = await db
    .select({ maxRunNumber: sql<number>`COALESCE(MAX(${testRuns.runNumber}), 0)` })
    .from(testRuns)
    .where(eq(testRuns.testId, data.testId));

  const nextRunNumber = (lastRun?.maxRunNumber || 0) + 1;

  // Create run
  const [run] = await db
    .insert(testRuns)
    .values({
      testId: data.testId,
      operatorId: data.operatorId || userId,
      runNumber: nextRunNumber,
      status: data.status || "scheduled",
      startedAt: data.startedAt || null,
      notes: data.notes || null,
    })
    .returning();

  revalidatePath(`/tests/${data.testId}`);
  revalidatePath(`/tests/${data.testId}/runs`);

  return run;
}

/**
 * Update test run
 */
export async function updateTestRun(
  runId: string,
  data: {
    status?: string;
    startedAt?: Date;
    completedAt?: Date;
    durationSeconds?: number;
    measurements?: TestRunMeasurements;
    results?: TestRunResults;
    notes?: string;
    operatorObservations?: string;
  }
) {
  const session = await requireAuth();
  const organizationId = session.user.organizationId as string;

  // Verify run exists and belongs to organization
  const [existingRun] = await db
    .select({ testId: testRuns.testId, operatorId: testRuns.operatorId })
    .from(testRuns)
    .innerJoin(pressureTests, eq(testRuns.testId, pressureTests.id))
    .where(
      and(
        eq(testRuns.id, runId),
        eq(pressureTests.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!existingRun) {
    throw new Error("Test run not found or access denied");
  }

  // Only operator or creator can update
  // (In production, add more granular permission checks)

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.status !== undefined) updateData.status = data.status;
  if (data.startedAt !== undefined) updateData.startedAt = data.startedAt;
  if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
  if (data.durationSeconds !== undefined) updateData.durationSeconds = data.durationSeconds;
  if (data.measurements !== undefined) updateData.measurements = data.measurements;
  if (data.results !== undefined) updateData.results = data.results;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.operatorObservations !== undefined)
    updateData.operatorObservations = data.operatorObservations;

  const [updatedRun] = await db
    .update(testRuns)
    .set(updateData)
    .where(eq(testRuns.id, runId))
    .returning();

  revalidatePath(`/tests/${existingRun.testId}`);
  revalidatePath(`/tests/${existingRun.testId}/runs`);
  revalidatePath(`/tests/${existingRun.testId}/runs/${runId}`);

  return updatedRun;
}

/**
 * Delete test run
 */
export async function deleteTestRun(runId: string) {
  const session = await requireAuth();
  const userId = session.user.id as string;
  const organizationId = session.user.organizationId as string;

  // Verify run exists and belongs to organization
  const [existingRun] = await db
    .select({
      testId: testRuns.testId,
      operatorId: testRuns.operatorId,
      createdBy: pressureTests.createdBy,
    })
    .from(testRuns)
    .innerJoin(pressureTests, eq(testRuns.testId, pressureTests.id))
    .where(
      and(
        eq(testRuns.id, runId),
        eq(pressureTests.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!existingRun) {
    throw new Error("Test run not found or access denied");
  }

  // Only operator or test creator can delete
  if (existingRun.operatorId !== userId && existingRun.createdBy !== userId) {
    throw new Error("Only the operator or test creator can delete this run");
  }

  await db.delete(testRuns).where(eq(testRuns.id, runId));

  revalidatePath(`/tests/${existingRun.testId}`);
  revalidatePath(`/tests/${existingRun.testId}/runs`);

  return { success: true };
}

/**
 * Get test run statistics for a specific test
 */
export async function getTestRunStatistics(testId: string): Promise<TestRunStatistics> {
  const session = await requireAuth();
  const organizationId = session.user.organizationId as string;

  // Verify test belongs to organization
  const [test] = await db
    .select()
    .from(pressureTests)
    .where(
      and(
        eq(pressureTests.id, testId),
        eq(pressureTests.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!test) {
    throw new Error("Test not found or access denied");
  }

  const [stats] = await db
    .select({
      totalRuns: sql<number>`COUNT(*)`,
      completedRuns: sql<number>`SUM(CASE WHEN ${testRuns.status} = 'completed' THEN 1 ELSE 0 END)`,
      failedRuns: sql<number>`SUM(CASE WHEN ${testRuns.status} = 'failed' THEN 1 ELSE 0 END)`,
      averageDuration: sql<number | null>`AVG(${testRuns.durationSeconds})`,
      lastRunDate: sql<Date | null>`MAX(${testRuns.completedAt})`,
    })
    .from(testRuns)
    .where(eq(testRuns.testId, testId));

  const totalRuns = Number(stats?.totalRuns || 0);
  const completedRuns = Number(stats?.completedRuns || 0);

  return {
    totalRuns,
    completedRuns,
    failedRuns: Number(stats?.failedRuns || 0),
    averageDuration: stats?.averageDuration || null,
    successRate: totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0,
    lastRunDate: stats?.lastRunDate || null,
  };
}

/**
 * Compare multiple test runs
 */
export async function compareTestRuns(runIds: string[]) {
  const session = await requireAuth();
  const organizationId = session.user.organizationId as string;

  if (runIds.length === 0) {
    return [];
  }

  const runs = await db
    .select({
      id: testRuns.id,
      runNumber: testRuns.runNumber,
      status: testRuns.status,
      startedAt: testRuns.startedAt,
      completedAt: testRuns.completedAt,
      durationSeconds: testRuns.durationSeconds,
      measurements: testRuns.measurements,
      results: testRuns.results,
      operatorName: users.name,
      testNumber: pressureTests.testNumber,
      testName: pressureTests.name,
    })
    .from(testRuns)
    .innerJoin(pressureTests, eq(testRuns.testId, pressureTests.id))
    .innerJoin(users, eq(testRuns.operatorId, users.id))
    .where(
      and(
        inArray(testRuns.id, runIds),
        eq(pressureTests.organizationId, organizationId)
      )
    )
    .orderBy(asc(testRuns.runNumber));

  return runs;
}

/**
 * Get test runs within a date range
 */
export async function getTestRunsByDateRange(
  testId: string,
  startDate: Date,
  endDate: Date
): Promise<TestRunListItem[]> {
  const session = await requireAuth();
  const organizationId = session.user.organizationId as string;

  // Verify test belongs to organization
  const [test] = await db
    .select()
    .from(pressureTests)
    .where(
      and(
        eq(pressureTests.id, testId),
        eq(pressureTests.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!test) {
    throw new Error("Test not found or access denied");
  }

  const runs = await db
    .select({
      id: testRuns.id,
      runNumber: testRuns.runNumber,
      status: testRuns.status,
      startedAt: testRuns.startedAt,
      completedAt: testRuns.completedAt,
      durationSeconds: testRuns.durationSeconds,
      operatorName: users.name,
      operatorId: users.id,
      testNumber: pressureTests.testNumber,
      testName: pressureTests.name,
      createdAt: testRuns.createdAt,
      updatedAt: testRuns.updatedAt,
    })
    .from(testRuns)
    .innerJoin(pressureTests, eq(testRuns.testId, pressureTests.id))
    .innerJoin(users, eq(testRuns.operatorId, users.id))
    .where(
      and(
        eq(testRuns.testId, testId),
        gte(testRuns.startedAt, startDate),
        lte(testRuns.startedAt, endDate)
      )
    )
    .orderBy(desc(testRuns.startedAt));

  return runs;
}
