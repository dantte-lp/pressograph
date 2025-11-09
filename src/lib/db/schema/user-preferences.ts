import { pgTable, uuid, varchar, boolean, integer, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * User Preferences Table
 *
 * Stores per-user settings and preferences for:
 * - Theme (light/dark/system)
 * - Language (en/ru)
 * - UI preferences
 * - Notification settings
 *
 * Cached in Valkey for performance (1 hour TTL)
 * Synced across all user devices
 */
export const userPreferences = pgTable(
  "user_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(),

    // Theme preferences
    themePreference: varchar("theme_preference", { length: 20 })
      .default("system")
      .notNull(), // 'light' | 'dark' | 'system'

    // Language preferences
    languagePreference: varchar("language_preference", { length: 5 })
      .default("en")
      .notNull(), // 'en' | 'ru'

    // UI preferences
    sidebarCollapsed: boolean("sidebar_collapsed").default(false).notNull(),
    graphDefaultFormat: varchar("graph_default_format", { length: 20 })
      .default("PNG")
      .notNull(),
    graphDefaultResolution: integer("graph_default_resolution")
      .default(2)
      .notNull(), // scale factor (1-4)

    // Notification preferences
    emailNotifications: boolean("email_notifications").default(true).notNull(),
    inAppNotifications: boolean("in_app_notifications").default(true).notNull(),

    // Date & Time preferences
    timezone: varchar("timezone", { length: 50 })
      .default("UTC")
      .notNull(), // IANA timezone (e.g., "America/New_York", "Europe/Moscow")
    dateFormat: varchar("date_format", { length: 20 })
      .default("YYYY-MM-DD")
      .notNull(), // "MM/DD/YYYY" | "DD.MM.YYYY" | "YYYY-MM-DD"
    timeFormat: varchar("time_format", { length: 10 })
      .default("24h")
      .notNull(), // "12h" | "24h"

    // Timestamps
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_preferences_user_id_idx").on(table.userId),
  })
);

export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;
