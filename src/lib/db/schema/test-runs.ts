import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { pressureTests } from "./pressure-tests";
import { users } from "./users";

/**
 * Test Run Measurements Data Structure
 *
 * Stores actual measurement data from test execution with timestamps
 */
export interface TestRunMeasurements {
  dataPoints: Array<{
    timestamp: number; // Unix timestamp in milliseconds
    pressure: number; // MPa (or configured unit)
    temperature?: number; // °C (or configured unit)
  }>;
  samplingRate: number; // Seconds between measurements
  totalPoints: number; // Total number of data points
  startTime?: number; // Test start timestamp
  endTime?: number; // Test end timestamp
}

/**
 * Test Run Results Data Structure
 *
 * Contains pass/fail status, deviations, and statistical analysis
 */
export interface TestRunResults {
  // Overall status
  status: "passed" | "failed" | "warning";

  // Deviation analysis
  deviations: {
    maxDeviation: number; // MPa
    avgDeviation: number; // MPa
    exceedances: number; // Number of times pressure exceeded allowable drop
    exceedanceTimestamps?: number[]; // When exceedances occurred
  };

  // Statistical summary
  statistics: {
    minPressure: number; // MPa
    maxPressure: number; // MPa
    avgPressure: number; // MPa
    stdDeviation?: number; // Standard deviation
    duration: number; // Actual test duration in seconds
  };

  // Comparison with specification
  specification?: {
    expectedPressure: number; // MPa
    allowableDrop: number; // MPa
    plannedDuration: number; // Seconds
  };

  // Notes and observations
  notes?: string;
  operatorObservations?: string;
}

/**
 * Test Runs Table
 *
 * Tracks individual test executions with actual measurement data.
 * Supports:
 * - Sequential run numbering per test
 * - Multiple status states (scheduled → in_progress → completed/failed)
 * - JSONB storage for flexible measurement data
 * - Operator tracking and notes
 * - Duration tracking
 * - Results analysis
 */
export const testRuns = pgTable(
  "test_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Relationships
    testId: uuid("test_id")
      .references(() => pressureTests.id, { onDelete: "cascade" })
      .notNull(),
    operatorId: uuid("operator_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),

    // Run identification
    runNumber: integer("run_number").notNull(), // Sequential per test (1, 2, 3, ...)

    // Status tracking
    status: varchar("status", { length: 50 }).default("scheduled").notNull(),
    // 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'cancelled'

    // Timing
    startedAt: timestamp("started_at", { mode: "date" }),
    completedAt: timestamp("completed_at", { mode: "date" }),
    durationSeconds: integer("duration_seconds"), // Actual duration

    // Measurement data (JSONB for flexibility)
    measurements: jsonb("measurements").$type<TestRunMeasurements>(),

    // Results and analysis (JSONB for complex structure)
    results: jsonb("results").$type<TestRunResults>(),

    // Notes and observations
    notes: text("notes"), // Operator notes during/after test
    operatorObservations: text("operator_observations"), // Detailed observations

    // Metadata
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    // Composite unique index for test_id + run_number
    testRunNumberIdx: uniqueIndex("test_runs_test_run_number_idx").on(
      table.testId,
      table.runNumber
    ),

    // Performance indexes
    testIdIdx: index("test_runs_test_id_idx").on(table.testId),
    operatorIdIdx: index("test_runs_operator_id_idx").on(table.operatorId),
    statusIdx: index("test_runs_status_idx").on(table.status),
    startedAtIdx: index("test_runs_started_at_idx").on(table.startedAt), // For time-range queries
    completedAtIdx: index("test_runs_completed_at_idx").on(table.completedAt),
  })
);

export type TestRun = typeof testRuns.$inferSelect;
export type NewTestRun = typeof testRuns.$inferInsert;
