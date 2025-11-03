import { pgTable, uuid, varchar, integer, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { pressureTests } from "./pressure-tests";
import { testRuns } from "./test-runs";
import { users } from "./users";
import { organizations } from "./organizations";

/**
 * File Uploads Table
 *
 * Tracks all uploaded files:
 * - Graph exports (PNG, PDF)
 * - Test data imports (CSV, Excel)
 * - Supporting documentation
 *
 * Supports both local storage and cloud storage (S3, etc.)
 */
export const fileUploads = pgTable(
  "file_uploads",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Relationships (nullable - file might not be attached to specific test)
    pressureTestId: uuid("pressure_test_id").references(() => pressureTests.id, {
      onDelete: "set null",
    }),
    testRunId: uuid("test_run_id").references(() => testRuns.id, { onDelete: "set null" }),
    uploadedBy: uuid("uploaded_by")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),

    // File metadata
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 50 }).notNull(), // MIME type: 'image/png' | 'application/pdf' | 'text/csv'
    fileSize: integer("file_size").notNull(), // bytes

    // Storage
    storageKey: varchar("storage_key", { length: 512 }).notNull().unique(), // S3 key or file path
    storageProvider: varchar("storage_provider", { length: 50 }).default("local").notNull(), // 'local' | 's3' | 'r2'

    // Access control
    isPublic: boolean("is_public").default(false).notNull(),
    accessToken: varchar("access_token", { length: 64 }).unique(), // For secure download links

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    testIdIdx: index("file_uploads_test_id_idx").on(table.pressureTestId),
    runIdIdx: index("file_uploads_run_id_idx").on(table.testRunId),
    uploadedByIdx: index("file_uploads_uploaded_by_idx").on(table.uploadedBy),
    storageKeyIdx: uniqueIndex("file_uploads_storage_key_idx").on(table.storageKey),
    createdAtIdx: index("file_uploads_created_at_idx").on(table.createdAt),
  })
);

export type FileUpload = typeof fileUploads.$inferSelect;
export type NewFileUpload = typeof fileUploads.$inferInsert;
