import { pgTable, uuid, varchar, text, integer, timestamp, primaryKey, index } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * NextAuth Tables
 *
 * Standard NextAuth database adapter tables for authentication.
 * Required for NextAuth session and OAuth support.
 *
 * See: https://authjs.dev/reference/adapter/drizzle
 */

/**
 * Accounts Table
 *
 * Stores OAuth provider accounts linked to users.
 * Multiple accounts (Google, GitHub, etc.) can link to one user.
 */
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 255 }).notNull(), // 'oauth' | 'email' | 'credentials'
    provider: varchar("provider", { length: 255 }).notNull(), // 'google' | 'github' | etc.
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),

    // OAuth tokens
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (table) => ({
    compoundKey: primaryKey({ columns: [table.provider, table.providerAccountId] }),
    userIdIdx: index("accounts_user_id_idx").on(table.userId),
  })
);

/**
 * Sessions Table
 *
 * Active user sessions.
 * Cached in Valkey for performance, DB as source of truth.
 */
export const sessions = pgTable(
  "sessions",
  {
    sessionToken: varchar("session_token", { length: 255 }).notNull().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
    expiresIdx: index("sessions_expires_idx").on(table.expires),
  })
);

/**
 * Verification Tokens Table
 *
 * Email verification and password reset tokens.
 * Single-use tokens with expiration.
 */
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(), // email or user ID
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({ columns: [table.identifier, table.token] }),
    expiresIdx: index("verification_tokens_expires_idx").on(table.expires),
  })
);

export type Account = typeof accounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type VerificationToken = typeof verificationTokens.$inferSelect;
