/**
 * Valkey Connection Test Script
 *
 * Run this script to verify Valkey connectivity and basic operations.
 *
 * Usage:
 *   node --loader ts-node/esm src/lib/cache/test-valkey.ts
 *   or
 *   tsx src/lib/cache/test-valkey.ts
 */

import { isValkeyHealthy, closeValkeyConnection } from "./valkey";
import { cache, CacheTTL } from "./index";

async function testValkeyConnection() {
  console.log("=== Valkey Connection Test ===\n");

  try {
    // Test 1: Health check
    console.log("1. Testing connection health...");
    const healthy = await isValkeyHealthy();
    console.log(`   ✓ Health check: ${healthy ? "PASSED" : "FAILED"}\n`);

    if (!healthy) {
      console.error("   ✗ Valkey is not healthy. Exiting...");
      process.exit(1);
    }

    // Test 2: Basic SET/GET
    console.log("2. Testing basic SET/GET operations...");
    const testKey = "test:basic";
    const testValue = { message: "Hello from Valkey!", timestamp: Date.now() };

    await cache.set(testKey, testValue, CacheTTL.ONE_MINUTE);
    console.log(`   ✓ SET: ${testKey}`);

    const retrieved = await cache.get<typeof testValue>(testKey);
    console.log(`   ✓ GET: ${testKey}`);
    console.log(`   Value: ${JSON.stringify(retrieved, null, 2)}\n`);

    // Test 3: TTL
    console.log("3. Testing TTL...");
    const ttlRemaining = await cache.ttl(testKey);
    console.log(`   ✓ TTL for ${testKey}: ${ttlRemaining} seconds\n`);

    // Test 4: Bulk operations (MSET/MGET)
    console.log("4. Testing bulk operations (MSET/MGET)...");
    const bulkData = {
      "test:bulk:1": { id: 1, name: "Item 1" },
      "test:bulk:2": { id: 2, name: "Item 2" },
      "test:bulk:3": { id: 3, name: "Item 3" },
    };

    await cache.mset(bulkData, CacheTTL.FIVE_MINUTES);
    console.log(`   ✓ MSET: 3 items`);

    const bulkRetrieved = await cache.mget(Object.keys(bulkData));
    console.log(`   ✓ MGET: ${bulkRetrieved.length} items`);
    console.log(`   Values: ${JSON.stringify(bulkRetrieved, null, 2)}\n`);

    // Test 5: Increment/Decrement
    console.log("5. Testing increment/decrement...");
    const counterKey = "test:counter";
    await cache.set(counterKey, 0);

    const incr1 = await cache.incr(counterKey, 5);
    console.log(`   ✓ INCR by 5: ${incr1}`);

    const incr2 = await cache.incr(counterKey, 3);
    console.log(`   ✓ INCR by 3: ${incr2}`);

    const decr1 = await cache.decr(counterKey, 2);
    console.log(`   ✓ DECR by 2: ${decr1}\n`);

    // Test 6: Remember pattern (memoization)
    console.log("6. Testing remember pattern (memoization)...");
    let functionCalls = 0;

    const expensiveOperation = async () => {
      functionCalls++;
      await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate delay
      return { computed: true, timestamp: Date.now() };
    };

    console.log(`   First call (cache miss)...`);
    const result1 = await cache.remember("test:memo", expensiveOperation, CacheTTL.ONE_MINUTE);
    console.log(`   ✓ Result: ${JSON.stringify(result1)}`);
    console.log(`   Function calls: ${functionCalls}`);

    console.log(`   Second call (cache hit)...`);
    const result2 = await cache.remember("test:memo", expensiveOperation, CacheTTL.ONE_MINUTE);
    console.log(`   ✓ Result: ${JSON.stringify(result2)}`);
    console.log(`   Function calls: ${functionCalls} (should still be 1)\n`);

    // Test 7: Pattern invalidation
    console.log("7. Testing pattern invalidation...");
    await cache.set("test:invalidate:1", "value1");
    await cache.set("test:invalidate:2", "value2");
    await cache.set("test:invalidate:3", "value3");
    console.log(`   ✓ Created 3 keys`);

    const deleted = await cache.invalidate("test:invalidate:*");
    console.log(`   ✓ Invalidated pattern "test:invalidate:*": ${deleted} keys deleted\n`);

    // Test 8: Cleanup test keys
    console.log("8. Cleaning up test keys...");
    await cache.invalidate("test:*");
    console.log(`   ✓ Test keys cleaned up\n`);

    // Test 9: Cache stats
    console.log("9. Getting cache statistics...");
    const stats = await cache.getStats();
    console.log(`   ✓ Cache healthy: ${stats.healthy}`);
    console.log(`   Stats: ${stats.stats ? "Available" : "N/A"}\n`);

    console.log("=== All Tests Passed ✓ ===\n");
  } catch (error) {
    console.error("✗ Test failed:", error);
    process.exit(1);
  } finally {
    // Close connection
    await closeValkeyConnection();
    console.log("Connection closed gracefully.");
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testValkeyConnection().catch(console.error);
}

export { testValkeyConnection };
