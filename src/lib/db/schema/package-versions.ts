import { pgTable, uuid, varchar, boolean, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Package Versions Table
 *
 * Stores cached npm package version information to avoid
 * repeated slow API calls to the npm registry.
 *
 * This table enables:
 * - Fast page loads (read from DB instead of npm API)
 * - Manual/scheduled sync via syncPackageVersions()
 * - Historical tracking of package updates
 */
export const packageVersions = pgTable(
  "package_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Package identification
    name: varchar("name", { length: 255 }).notNull().unique(), // e.g., "next", "react"
    type: varchar("type", { length: 20 }).notNull(), // "dependency" | "devDependency"

    // Version information
    currentVersion: varchar("current_version", { length: 50 }).notNull(), // Version in package.json
    latestVersion: varchar("latest_version", { length: 50 }).notNull(), // Latest from npm

    // Release date tracking
    currentReleaseDate: timestamp("current_release_date", { mode: "date" }), // When current version was released
    latestReleaseDate: timestamp("latest_release_date", { mode: "date" }), // When latest version was released

    // Status flags
    isUpToDate: boolean("is_up_to_date").default(false).notNull(), // currentVersion === latestVersion

    // Package metadata
    description: varchar("description", { length: 1000 }), // Package description from npm
    homepage: varchar("homepage", { length: 500 }), // Package homepage URL

    // Sync tracking
    lastChecked: timestamp("last_checked", { mode: "date" }).notNull(), // When this record was last updated from npm

    // Timestamps
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("package_versions_name_idx").on(table.name),
    typeIdx: index("package_versions_type_idx").on(table.type),
    isUpToDateIdx: index("package_versions_up_to_date_idx").on(table.isUpToDate),
    lastCheckedIdx: index("package_versions_last_checked_idx").on(table.lastChecked),
  })
);

export type PackageVersion = typeof packageVersions.$inferSelect;
export type NewPackageVersion = typeof packageVersions.$inferInsert;
