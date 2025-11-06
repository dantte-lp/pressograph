/**
 * Script to apply username migration manually
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function applyMigration() {
  console.log('🚀 Applying username migration...\n');

  const sql = postgres(process.env.DATABASE_URL || '', {
    max: 1,
  });

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'drizzle/migrations/20251106212609_real_killraven.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split by statement breakpoint and clean up
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => {
        // Remove comments but keep the SQL
        const lines = s.split('\n')
          .filter(line => {
            const trimmed = line.trim();
            return trimmed && !trimmed.startsWith('--');
          });
        return lines.join('\n').trim();
      })
      .filter(s => s.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executing...`);
      console.log(`   ${statement.substring(0, 80)}${statement.length > 80 ? '...' : ''}`);

      try {
        await sql.unsafe(statement);
        console.log(`   ✅ Success\n`);
      } catch (error: any) {
        console.error(`   ❌ Error:`, error.message);
        throw error;
      }
    }

    // Verify the migration
    console.log('🔍 Verifying migration...\n');

    const users = await sql`
      SELECT id, email, username
      FROM users
      LIMIT 5
    `;

    console.log('✅ Migration applied successfully!\n');
    console.log(`📊 Users in database (${users.length}):`);
    users.forEach((user, idx) => {
      console.log(`${idx + 1}. Email: ${user.email} → Username: ${user.username}`);
    });

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

applyMigration();
