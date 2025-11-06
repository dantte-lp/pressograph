/**
 * Script to set a test password for the test user
 * Usage: tsx scripts/set-test-password.ts
 */

import { hash } from 'bcrypt';
import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

const TEST_USERNAME = 'testuser';
const TEST_EMAIL = 'test@pressograph.dev';
const TEST_PASSWORD = 'Test1234!'; // Default test password

async function setTestPassword() {
  console.log('Setting test credentials for user:', TEST_EMAIL);
  console.log('Username:', TEST_USERNAME);

  // Hash password with bcrypt (10 rounds)
  const hashedPassword = await hash(TEST_PASSWORD, 10);

  // Update user with hashed password and username
  await db
    .update(users)
    .set({
      username: TEST_USERNAME,
      password: hashedPassword
    })
    .where(eq(users.email, TEST_EMAIL));

  console.log('\n✅ Test credentials set successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Username:', TEST_USERNAME);
  console.log('Password:', TEST_PASSWORD);
  console.log('Email:', TEST_EMAIL, '(for recovery only)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔐 Login at http://localhost:3000/login');
  console.log('Use USERNAME (not email) to log in!');

  process.exit(0);
}

setTestPassword().catch((error) => {
  console.error('Error setting password:', error);
  process.exit(1);
});
