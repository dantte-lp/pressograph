import { pgTable, uuid, jsonb, varchar, timestamp, integer, boolean, text, index } from "drizzle-orm/pg-core";
import { pressureTests } from "./pressure-tests";
import { users } from "./users";

/**
 * Test Run Results Type
 *
 * Stores actual measurement data from test execution
 */
export interface TestRunResults {
  // Time-series measurements
  measurements: Array<{
    timestamp: number; // epoch ms
    pressure: number; // MPa
    temperature: number; // °C
  }>;

  // Final results
  finalPressure: number;
  pressureDrop: number;
  passed: boolean;
  notes: string;

  // Calculated metrics
  averagePressure?: number;
  minPressure?: number;
  maxPressure?: number;
  stabilizationTime?: number; // minutes until pressure stabilized
}

/**
 * Test Runs Table
 *
 * Individual executions of a pressure test.
 * A single pressure test can have multiple runs.
 *
 * Stores:
 * - Measurement data (time-series pressure/temperature)
 * - Execution metadata (who, when, how long)
 * - Pass/fail status
 */
export const testRuns = pgTable(
  "test_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Relationships
    pressureTestId: uuid("pressure_test_id")
      .references(() => pressureTests.id, { onDelete: "cascade" })
      .notNull(),
    executedBy: uuid("executed_by")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),

    // Results Data (JSONB for flexibility)
    results: jsonb("results").$type<TestRunResults>().notNull(),

    // Status
    status: varchar("status", { length: 50 }).default("pending").notNull(),
    // 'pending' | 'running' | 'completed' | 'failed'

    // Execution times
    startedAt: timestamp("started_at", { mode: "date" }).notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
    duration: integer("duration"), // seconds (calculated: completedAt - startedAt)

    // Quality assessment
    passed: boolean("passed"),
    failureReason: text("failure_reason"),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    testIdIdx: index("test_runs_test_id_idx").on(table.pressureTestId),
    executedByIdx: index("test_runs_executed_by_idx").on(table.executedBy),
    statusIdx: index("test_runs_status_idx").on(table.status),
    startedAtIdx: index("test_runs_started_at_idx").on(table.startedAt),
  })
);

export type TestRun = typeof testRuns.$inferSelect;
export type NewTestRun = typeof testRuns.$inferInsert;
