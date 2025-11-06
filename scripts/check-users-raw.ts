/**
 * Script to check existing users before migration (using raw SQL)
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function checkUsers() {
  console.log('Checking existing users...\n');

  const sql = postgres(process.env.DATABASE_URL || '', {
    max: 1,
  });

  try {
    const result = await sql`
      SELECT id, username, email, name, created_at
      FROM users
      ORDER BY created_at DESC
    `;

    if (result.length === 0) {
      console.log('✅ No existing users found.');
    } else {
      console.log(`✅ Found ${result.length} user(s):\n`);
      result.forEach((user, idx) => {
        console.log(`${idx + 1}. ID: ${user.id}`);
        console.log(`   Username: ${user.username || '(no username)'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name || '(no name)'}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error checking users:', error);
    process.exit(1);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

checkUsers();
