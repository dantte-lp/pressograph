import { pgTable, uuid, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Notifications Table
 *
 * In-app notification system for user alerts:
 * - Test created
 * - Share link expiration
 * - System announcements
 *
 * Read/unread status tracking for UI badge counts.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Recipient
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),

    // Content
    type: varchar("type", { length: 50 }).notNull(),
    // 'test_created' | 'share_expired' | 'system_announcement'
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),

    // Action link (optional)
    actionUrl: varchar("action_url", { length: 512 }),
    actionLabel: varchar("action_label", { length: 100 }),

    // Status
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { mode: "date" }),

    // Related resource (for navigation)
    resourceType: varchar("resource_type", { length: 50 }), // 'pressure_test' | 'project'
    resourceId: uuid("resource_id"),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    isReadIdx: index("notifications_is_read_idx").on(table.userId, table.isRead),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
    resourceIdx: index("notifications_resource_idx").on(table.resourceType, table.resourceId),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
