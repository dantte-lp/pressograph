/**
 * Script to check existing users before migration
 */

import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';

async function checkUsers() {
  console.log('Checking existing users...\n');

  try {
    const allUsers = await db.select().from(users);

    if (allUsers.length === 0) {
      console.log('✅ No existing users found. Safe to apply migration.');
    } else {
      console.log(`⚠️  Found ${allUsers.length} existing user(s):\n`);
      allUsers.forEach((user, idx) => {
        console.log(`${idx + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name || '(no name)'}`);
        console.log('');
      });
      console.log('📝 Note: Migration will need to handle existing users.');
    }
  } catch (error) {
    console.error('❌ Error checking users:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

checkUsers();
