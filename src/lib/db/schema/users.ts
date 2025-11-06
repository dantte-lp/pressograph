import { pgTable, uuid, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

/**
 * Users Table
 *
 * Core user entity with authentication and profile data.
 * Enhanced for role-based access control and organization membership.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: varchar("image", { length: 512 }),

    // Credentials authentication
    password: varchar("password", { length: 255 }), // Nullable for OAuth-only users (future migration)

    // Role-based access control
    role: varchar("role", { length: 50 }).default("user").notNull(),
    // 'admin' | 'manager' | 'user' | 'viewer'

    // Organization membership (nullable for system admins)
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),

    // Status
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at", { mode: "date" }),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    orgIdIdx: index("users_org_id_idx").on(table.organizationId),
    roleIdx: index("users_role_idx").on(table.role),
    isActiveIdx: index("users_is_active_idx").on(table.isActive),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
