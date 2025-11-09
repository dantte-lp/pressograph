#!/usr/bin/env tsx
/**
 * Migration script to add timezone, dateFormat, and timeFormat columns
 * to user_preferences table
 */

import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

async function addDateTimePreferences() {
  console.log('[Migration] Adding timezone, dateFormat, and timeFormat columns...');

  try {
    // Add columns if they don't exist
    await db.execute(sql`
      ALTER TABLE user_preferences
      ADD COLUMN IF NOT EXISTS timezone varchar(50) DEFAULT 'UTC' NOT NULL,
      ADD COLUMN IF NOT EXISTS date_format varchar(20) DEFAULT 'YYYY-MM-DD' NOT NULL,
      ADD COLUMN IF NOT EXISTS time_format varchar(10) DEFAULT '24h' NOT NULL;
    `);

    console.log('[Migration] ✅ Successfully added date/time preference columns');
  } catch (error) {
    console.error('[Migration] ❌ Failed to add columns:', error);
    throw error;
  }
}

// Run migration
addDateTimePreferences()
  .then(() => {
    console.log('[Migration] Complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Migration] Failed:', error);
    process.exit(1);
  });
