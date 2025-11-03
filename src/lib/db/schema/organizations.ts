import { pgTable, uuid, varchar, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Organization Settings Type
 */
export interface OrganizationSettings {
  defaultLanguage: "en" | "ru";
  allowPublicSharing: boolean;
  requireApprovalForTests: boolean;
  maxTestDuration: number; // hours
  customBranding: {
    enabled: boolean;
    headerText?: string;
    footerText?: string;
  };
}

/**
 * Organizations Table
 *
 * Multi-tenancy support for future enterprise features.
 * Each organization can have multiple users and projects.
 */
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),

    // Branding
    logoUrl: varchar("logo_url", { length: 512 }),
    primaryColor: varchar("primary_color", { length: 7 }).default("#2563EB"), // hex color

    // Settings
    settings: jsonb("settings").$type<OrganizationSettings>().default({
      defaultLanguage: "en",
      allowPublicSharing: false,
      requireApprovalForTests: false,
      maxTestDuration: 48,
      customBranding: {
        enabled: false,
      },
    }),

    // Subscription (future)
    planType: varchar("plan_type", { length: 50 }).default("free").notNull(),
    subscriptionStatus: varchar("subscription_status", { length: 50 }).default("active"),
    subscriptionEndsAt: timestamp("subscription_ends_at", { mode: "date" }),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("organizations_slug_idx").on(table.slug),
  })
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
