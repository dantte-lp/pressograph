import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";
import type { PressureTestConfig } from "./pressure-tests";

/**
 * Test Templates Table
 *
 * Reusable test configuration templates for quick test creation.
 *
 * Supports:
 * - User-created custom templates
 * - Organization-wide shared templates
 * - System templates (daily, extended, regulatory)
 * - Template usage tracking
 */
export const testTemplates = pgTable(
  "test_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Identification
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),

    // Relationships
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),

    // Category
    category: varchar("category", { length: 50 }).default("custom").notNull(),
    // 'custom' | 'daily' | 'extended' | 'regulatory'

    // Configuration (partial - users fill in remaining values)
    config: jsonb("config").$type<Partial<PressureTestConfig>>().notNull(),

    // Sharing
    isPublic: boolean("is_public").default(false).notNull(), // Visible to other users in org
    isSystemTemplate: boolean("is_system_template").default(false).notNull(), // System-wide template

    // Usage tracking
    usageCount: integer("usage_count").default(0).notNull(),
    lastUsedAt: timestamp("last_used_at", { mode: "date" }),

    // Timestamps
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("test_templates_org_id_idx").on(table.organizationId),
    categoryIdx: index("test_templates_category_idx").on(table.category),
    isPublicIdx: index("test_templates_is_public_idx").on(table.isPublic),
    isSystemIdx: index("test_templates_is_system_idx").on(table.isSystemTemplate),
    createdByIdx: index("test_templates_created_by_idx").on(table.createdBy),
  })
);

export type TestTemplate = typeof testTemplates.$inferSelect;
export type NewTestTemplate = typeof testTemplates.$inferInsert;
