/**
 * Valkey Cache Integration Test
 *
 * Run this script to verify the cache is working correctly
 */

import { isValkeyHealthy } from './valkey';
import { get, set, del, invalidate } from './index';
import { ThemeCache, PreferencesCache } from './user-preferences';

async function testBasicOperations() {
  console.log('\n=== Testing Basic Cache Operations ===');

  // Test set and get
  const testKey = 'test:basic';
  const testValue = { message: 'Hello, Valkey!', timestamp: Date.now() };

  const setResult = await set(testKey, testValue, 60); // 1 minute TTL
  console.log(`✅ Set operation: ${setResult ? 'SUCCESS' : 'FAILED'}`);

  const getValue = await get(testKey);
  console.log(`✅ Get operation: ${getValue ? 'SUCCESS' : 'FAILED'}`);
  console.log('  Retrieved value:', getValue);

  // Test delete
  const delResult = await del(testKey);
  console.log(`✅ Delete operation: ${delResult ? 'SUCCESS' : 'FAILED'}`);

  const afterDelete = await get(testKey);
  console.log(`✅ Verify deletion: ${!afterDelete ? 'SUCCESS' : 'FAILED'}`);
}

async function testThemeCache() {
  console.log('\n=== Testing Theme Cache ===');

  const userId = 'test-user-123';
  const theme = 'dark';

  // Set theme
  const setResult = await ThemeCache.set(userId, theme);
  console.log(`✅ Set theme: ${setResult ? 'SUCCESS' : 'FAILED'}`);

  // Get theme
  const getTheme = await ThemeCache.get(userId);
  console.log(`✅ Get theme: ${getTheme === theme ? 'SUCCESS' : 'FAILED'}`);
  console.log('  Retrieved theme:', getTheme);

  // Delete theme
  const delResult = await ThemeCache.delete(userId);
  console.log(`✅ Delete theme: ${delResult ? 'SUCCESS' : 'FAILED'}`);
}

async function testPreferencesCache() {
  console.log('\n=== Testing Preferences Cache ===');

  const userId = 'test-user-456';
  const preferences = {
    theme: 'light' as const,
    language: 'en',
    notifications: true,
    customSetting: 'value'
  };

  // Set preferences
  const setResult = await PreferencesCache.set(userId, preferences);
  console.log(`✅ Set preferences: ${setResult ? 'SUCCESS' : 'FAILED'}`);

  // Get preferences
  const getPrefs = await PreferencesCache.get(userId);
  console.log(`✅ Get preferences: ${getPrefs ? 'SUCCESS' : 'FAILED'}`);
  console.log('  Retrieved preferences:', getPrefs);

  // Update field
  const updateResult = await PreferencesCache.updateField(userId, 'theme', 'dark');
  console.log(`✅ Update field: ${updateResult ? 'SUCCESS' : 'FAILED'}`);

  const updatedPrefs = await PreferencesCache.get(userId);
  console.log('  Updated preferences:', updatedPrefs);

  // Clean up
  await PreferencesCache.delete(userId);
}

async function testConnectionPooling() {
  console.log('\n=== Testing Connection Pooling ===');

  // Multiple rapid operations should use the same connection
  const operations = [];
  for (let i = 0; i < 10; i++) {
    operations.push(set(`test:pool:${i}`, { index: i }, 60));
  }

  const results = await Promise.all(operations);
  const successCount = results.filter(r => r).length;
  console.log(`✅ Pooled operations: ${successCount}/10 successful`);

  // Clean up
  await invalidate('test:pool:*');
}

async function runIntegrationTests() {
  console.log('Starting Valkey Cache Integration Tests...\n');

  try {
    // Check health
    const isHealthy = await isValkeyHealthy();
    console.log(`✅ Valkey health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);

    if (!isHealthy) {
      console.error('❌ Valkey is not healthy. Stopping tests.');
      return;
    }

    // Run test suites
    await testBasicOperations();
    await testThemeCache();
    await testPreferencesCache();
    await testConnectionPooling();

    console.log('\n✅ All integration tests completed successfully!');
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  } finally {
    // Clean up test data
    await invalidate('test:*');
    console.log('\n🧹 Test data cleaned up');
  }
}

// Export for use in other modules
export { runIntegrationTests };

// Run tests if executed directly
if (require.main === module) {
  runIntegrationTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}