'use server';

import { db } from '@/lib/db';
import { testRuns } from '@/lib/db/schema/test-runs';
import { testMeasurements } from '@/lib/db/schema/test-measurements';
import { pressureTests } from '@/lib/db/schema/pressure-tests';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/server-auth';

/**
 * Start a new test run
 */
export async function startTestRun(testId: string): Promise<{
  success: boolean;
  runId?: string;
  error?: string;
}> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Verify test exists and is ready
    const test = await db
      .select({
        id: pressureTests.id,
        status: pressureTests.status,
        createdBy: pressureTests.createdBy,
      })
      .from(pressureTests)
      .where(
        and(
          eq(pressureTests.id, testId),
          eq(pressureTests.createdBy, userId)
        )
      )
      .limit(1);

    if (test.length === 0) {
      return { success: false, error: 'Test not found or access denied' };
    }

    if (test[0].status !== 'ready') {
      return { success: false, error: 'Test must be in ready status to run' };
    }

    // Create test_run record
    const [run] = await db
      .insert(testRuns)
      .values({
        pressureTestId: testId,
        executedBy: userId,
        status: 'running',
        startedAt: new Date(),
        results: { measurements: [] },
      })
      .returning();

    // Update pressure_test status
    await db
      .update(pressureTests)
      .set({
        status: 'running',
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pressureTests.id, testId));

    return { success: true, runId: run.id };
  } catch (error) {
    console.error('Error starting test run:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to start test run';
    return { success: false, error: errorMessage };
  }
}

/**
 * Record a measurement during test run
 */
export async function recordMeasurement(
  runId: string,
  data: {
    pressure: number;
    temperature?: number;
    timestamp?: Date;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Verify run exists and user has access
    const run = await db
      .select({
        id: testRuns.id,
        status: testRuns.status,
        executedBy: testRuns.executedBy,
      })
      .from(testRuns)
      .where(
        and(
          eq(testRuns.id, runId),
          eq(testRuns.executedBy, userId)
        )
      )
      .limit(1);

    if (run.length === 0) {
      return { success: false, error: 'Test run not found or access denied' };
    }

    if (run[0].status !== 'running') {
      return { success: false, error: 'Test run is not in running status' };
    }

    // Insert measurement
    await db.insert(testMeasurements).values({
      testRunId: runId,
      timestamp: data.timestamp || new Date(),
      pressure: data.pressure,
      temperature: data.temperature,
    });

    return { success: true };
  } catch (error) {
    console.error('Error recording measurement:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to record measurement';
    return { success: false, error: errorMessage };
  }
}

/**
 * Complete test run and calculate metrics
 */
export async function completeTestRun(
  runId: string,
  notes?: string
): Promise<{
  success: boolean;
  passed?: boolean;
  results?: any;
  error?: string;
}> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Get run and test configuration
    const runData = await db
      .select({
        run: testRuns,
        test: pressureTests,
      })
      .from(testRuns)
      .innerJoin(pressureTests, eq(testRuns.pressureTestId, pressureTests.id))
      .where(
        and(
          eq(testRuns.id, runId),
          eq(testRuns.executedBy, userId)
        )
      )
      .limit(1);

    if (runData.length === 0) {
      return { success: false, error: 'Test run not found or access denied' };
    }

    const { run, test } = runData[0];
    const config = test.config as any;

    // Get all measurements
    const measurements = await db
      .select()
      .from(testMeasurements)
      .where(eq(testMeasurements.testRunId, runId))
      .orderBy(testMeasurements.timestamp);

    if (measurements.length === 0) {
      return { success: false, error: 'No measurements recorded' };
    }

    // Calculate metrics
    const finalPressure = measurements[measurements.length - 1]?.pressure || 0;
    const pressureDrop = config.workingPressure - finalPressure;
    const passed = pressureDrop <= config.allowablePressureDrop;

    const startTime = new Date(run.startedAt);
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / 1000 / 60);

    const results = {
      measurements: measurements.map(m => ({
        timestamp: m.timestamp,
        pressure: m.pressure,
        temperature: m.temperature,
      })),
      finalPressure,
      pressureDrop,
      holdDuration: durationMinutes,
      passed,
      failureReason: passed ? undefined : 'Pressure drop exceeded allowable limit',
      notes,
    };

    // Update test_run
    await db
      .update(testRuns)
      .set({
        status: 'completed',
        completedAt: endTime,
        duration: durationMinutes,
        passed,
        failureReason: passed ? null : 'Pressure drop exceeded allowable limit',
        results,
        updatedAt: new Date(),
      })
      .where(eq(testRuns.id, runId));

    // Update pressure_test
    await db
      .update(pressureTests)
      .set({
        status: 'completed',
        completedAt: endTime,
        updatedAt: new Date(),
      })
      .where(eq(pressureTests.id, test.id));

    return { success: true, passed, results };
  } catch (error) {
    console.error('Error completing test run:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to complete test run';
    return { success: false, error: errorMessage };
  }
}
