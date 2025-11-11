import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { pressureTests } from "./pressure-tests";
import { users } from "./users";

/**
 * Test Comments Table
 *
 * Comments on pressure tests with Markdown support.
 * Supports editing with history tracking and @mentions.
 *
 * Features:
 * - Markdown content rendering
 * - Edit history tracking (isEdited flag)
 * - @mentions support (parsed from content)
 * - Author-only edit/delete permissions
 */
export const testComments = pgTable(
  "test_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Relationships
    pressureTestId: uuid("pressure_test_id")
      .references(() => pressureTests.id, { onDelete: "cascade" })
      .notNull(),
    authorId: uuid("author_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    // Content (Markdown)
    content: text("content").notNull(),

    // Edit tracking
    isEdited: boolean("is_edited").default(false).notNull(),
    editedAt: timestamp("edited_at", { mode: "date" }),

    // Timestamps
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    pressureTestIdIdx: index("test_comments_pressure_test_id_idx").on(
      table.pressureTestId
    ),
    authorIdIdx: index("test_comments_author_id_idx").on(table.authorId),
    createdAtIdx: index("test_comments_created_at_idx").on(table.createdAt),
  })
);

export type TestComment = typeof testComments.$inferSelect;
export type NewTestComment = typeof testComments.$inferInsert;
