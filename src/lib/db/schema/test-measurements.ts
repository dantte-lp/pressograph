import { pgTable, uuid, timestamp, numeric } from 'drizzle-orm/pg-core';
import { testRuns } from './test-runs';

/**
 * Test Measurements Table
 *
 * Stores individual pressure and temperature measurements recorded during a test run.
 * This allows for detailed time-series analysis and graph generation.
 */
export const testMeasurements = pgTable('test_measurements', {
  id: uuid('id').defaultRandom().primaryKey(),
  testRunId: uuid('test_run_id')
    .notNull()
    .references(() => testRuns.id, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  pressure: numeric('pressure', { precision: 10, scale: 3 }).notNull(),
  temperature: numeric('temperature', { precision: 6, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
