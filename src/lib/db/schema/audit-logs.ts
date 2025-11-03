import { pgTable, uuid, varchar, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Audit Logs Table
 *
 * Compliance and security tracking for all significant actions:
 * - User authentication events
 * - Data modifications (create/update/delete)
 * - Permission changes
 * - Configuration updates
 *
 * Immutable log (no updates/deletes) for audit trail integrity.
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Actor (user who performed the action)
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }), // nullable if user deleted
    userEmail: varchar("user_email", { length: 255 }), // Preserved even if user deleted
    ipAddress: varchar("ip_address", { length: 45 }), // IPv6 support (max 45 chars)
    userAgent: text("user_agent"),

    // Action details
    action: varchar("action", { length: 100 }).notNull(),
    // Examples: 'user.login' | 'user.logout' | 'test.create' | 'test.update' | 'test.delete' | 'project.create'
    resource: varchar("resource", { length: 100 }).notNull(), // 'user' | 'pressure_test' | 'project' | 'organization'
    resourceId: uuid("resource_id"), // ID of affected resource

    // Additional context
    metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
    // Example: { previousValue: {...}, newValue: {...}, changes: [...] }

    // Result
    status: varchar("status", { length: 20 }).default("success").notNull(), // 'success' | 'failure'
    errorMessage: text("error_message"),

    timestamp: timestamp("timestamp", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    actionIdx: index("audit_logs_action_idx").on(table.action),
    resourceIdx: index("audit_logs_resource_idx").on(table.resource, table.resourceId),
    timestampIdx: index("audit_logs_timestamp_idx").on(table.timestamp),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
