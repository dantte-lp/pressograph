import { pgTable, uuid, varchar, timestamp, boolean, integer, text } from 'drizzle-orm/pg-core';
import { pressureTests } from './pressure-tests';
import { users } from './users';

/**
 * Share Links Table
 *
 * Public links for sharing pressure test results without authentication.
 * Features:
 * - Unique token for access
 * - Expiration dates
 * - Download permissions
 * - Access analytics (view count)
 * - Soft delete support
 */
export const shareLinks = pgTable('share_links', {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys
  pressureTestId: uuid('pressure_test_id')
    .notNull()
    .references(() => pressureTests.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Link properties
  token: varchar('token', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  allowDownload: boolean('allow_download').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),

  // Analytics
  viewCount: integer('view_count').notNull().default(0),
  lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),

  // Optional metadata
  title: varchar('title', { length: 255 }),
  description: text('description'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type ShareLink = typeof shareLinks.$inferSelect;
export type NewShareLink = typeof shareLinks.$inferInsert;
