import { pgTable, uuid, varchar, text, boolean, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

/**
 * Project Settings Type
 */
export interface ProjectSettings {
  autoNumberTests: boolean;
  testNumberPrefix: string;
  requireNotes: boolean;
  defaultTemplateType: string;
}

/**
 * Projects Table
 *
 * Groups related pressure tests together.
 * Belongs to an organization and has an owner.
 */
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),

    // Relationships
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    ownerId: uuid("owner_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),

    // Settings
    isArchived: boolean("is_archived").default(false).notNull(),
    settings: jsonb("settings").$type<ProjectSettings>().default({
      autoNumberTests: true,
      testNumberPrefix: "PT",
      requireNotes: false,
      defaultTemplateType: "daily",
    }),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("projects_org_id_idx").on(table.organizationId),
    ownerIdIdx: index("projects_owner_id_idx").on(table.ownerId),
    archivedIdx: index("projects_archived_idx").on(table.isArchived),
    // Note: Cannot create unique index on JSONB field directly
    // Uniqueness is enforced at application level in server actions
  })
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
