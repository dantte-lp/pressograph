import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";
import { organizations } from "./organizations";

/**
 * Pressure Test Configuration Type
 *
 * Based on UI/UX requirements from technical documents
 */
export interface PressureTestConfig {
  // Core parameters
  workingPressure: number; // MPa
  maxPressure: number; // MPa
  testDuration: number; // hours
  temperature: number; // °C
  allowablePressureDrop: number; // MPa

  // Test schedule (NEW: for date/time tracking)
  startDateTime?: string; // ISO 8601 string (e.g., "2025-11-07T10:00:00")
  endDateTime?: string; // ISO 8601 string (auto-calculated or manual override)

  // Intermediate stages (from "Add Stages" step)
  intermediateStages: Array<{
    time: number; // minutes from start
    pressure: number; // MPa
    duration: number; // minutes to hold pressure
  }>;

  // Units (for internationalization)
  pressureUnit: "MPa" | "Bar" | "PSI";
  temperatureUnit: "C" | "F";

  // Additional metadata
  notes?: string;
  equipmentId?: string;
  operatorName?: string;
}

/**
 * Pressure Tests Table
 *
 * Main entity representing a pressure test configuration.
 * Used for graph generation and visualization.
 *
 * Supports:
 * - Draft/Ready states for test configuration
 * - Public sharing via token
 * - Template-based creation
 * - Complex multi-stage tests
 */
export const pressureTests = pgTable(
  "pressure_tests",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Identification
    testNumber: varchar("test_number", { length: 100 }).notNull(), // e.g., "PT-2025-001"
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),

    // Relationships
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),

    // Template (from "Select Template" step)
    templateType: varchar("template_type", { length: 50 }), // 'daily' | 'extended' | 'custom'

    // Test Configuration (from "Set Parameters" step)
    config: jsonb("config").$type<PressureTestConfig>().notNull(),

    // Status
    status: varchar("status", { length: 50 }).default("draft").notNull(),
    // 'draft' | 'ready'

    // Tracking (optional for future use)
    startedAt: timestamp("started_at", { mode: "date" }),
    completedAt: timestamp("completed_at", { mode: "date" }),

    // Sharing (for shareable reports via /share/[token])
    isPublic: boolean("is_public").default(false).notNull(),
    shareToken: varchar("share_token", { length: 64 }).unique(),
    shareExpiresAt: timestamp("share_expires_at", { mode: "date" }),

    // Metadata
    tags: jsonb("tags").$type<string[]>().default([]),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("pressure_tests_project_id_idx").on(table.projectId),
    createdByIdx: index("pressure_tests_created_by_idx").on(table.createdBy),
    statusIdx: index("pressure_tests_status_idx").on(table.status),
    testNumberIdx: uniqueIndex("pressure_tests_test_number_idx").on(
      table.testNumber,
      table.organizationId
    ),
    shareTokenIdx: uniqueIndex("pressure_tests_share_token_idx").on(table.shareToken),
    createdAtIdx: index("pressure_tests_created_at_idx").on(table.createdAt),
  })
);

export type PressureTest = typeof pressureTests.$inferSelect;
export type NewPressureTest = typeof pressureTests.$inferInsert;
