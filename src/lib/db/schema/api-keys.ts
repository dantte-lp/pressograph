import { pgTable, uuid, varchar, jsonb, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { organizations } from "./organizations";

/**
 * API Keys Table
 *
 * Supports programmatic access to Pressograph API.
 * Keys are hashed (bcrypt) and only displayed once at creation.
 *
 * Scopes control access level:
 * - read:tests - Read test data
 * - write:tests - Create/update tests
 * - delete:tests - Delete tests
 * - read:projects - Read project data
 * - admin - Full access
 */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Relationships
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),

    // Key details
    name: varchar("name", { length: 255 }).notNull(), // User-friendly name
    keyHash: varchar("key_hash", { length: 128 }).notNull().unique(), // bcrypt hash of the key
    keyPrefix: varchar("key_prefix", { length: 16 }).notNull(), // e.g., 'pg_test_abc123' for identification

    // Permissions
    scopes: jsonb("scopes").$type<string[]>().default([]), // ['read:tests', 'write:tests']

    // Status
    isActive: boolean("is_active").default(true).notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }), // null = never expires
    lastUsedAt: timestamp("last_used_at", { mode: "date" }),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("api_keys_user_id_idx").on(table.userId),
    keyHashIdx: uniqueIndex("api_keys_key_hash_idx").on(table.keyHash),
    keyPrefixIdx: index("api_keys_key_prefix_idx").on(table.keyPrefix),
    isActiveIdx: index("api_keys_is_active_idx").on(table.isActive),
  })
);

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
