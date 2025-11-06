/**
 * Script to set a test password for the test user
 * Usage: tsx scripts/set-test-password.ts
 */

import { hash } from 'bcrypt';
import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

const TEST_EMAIL = 'test@pressograph.dev';
const TEST_PASSWORD = 'Test1234!'; // Default test password

async function setTestPassword() {
  console.log('Setting test password for user:', TEST_EMAIL);

  // Hash password with bcrypt (10 rounds)
  const hashedPassword = await hash(TEST_PASSWORD, 10);

  // Update user with hashed password
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.email, TEST_EMAIL));

  console.log('Password set successfully!');
  console.log('Email:', TEST_EMAIL);
  console.log('Password:', TEST_PASSWORD);
  console.log('\nYou can now log in at http://localhost:3000/login');

  process.exit(0);
}

setTestPassword().catch((error) => {
  console.error('Error setting password:', error);
  process.exit(1);
});
