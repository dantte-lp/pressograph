#!/usr/bin/env node

/**
 * Simple Valkey Connection Test
 * Tests connectivity to Valkey without Next.js
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://cache:6379';

console.log('=== Simple Valkey Connection Test ===\n');
console.log(`Connecting to: ${REDIS_URL}\n`);

const client = new Redis(REDIS_URL, {
  keyPrefix: 'pressograph:',
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

client.on('connect', () => {
  console.log('[✓] Connecting to Valkey...');
});

client.on('ready', async () => {
  console.log('[✓] Connected and ready\n');

  try {
    // Test PING
    console.log('Testing PING...');
    const pong = await client.ping();
    console.log(`[✓] PING response: ${pong}\n`);

    // Test SET
    console.log('Testing SET...');
    await client.set('test:hello', JSON.stringify({ message: 'Hello from Valkey!', timestamp: Date.now() }), 'EX', 60);
    console.log('[✓] SET test:hello\n');

    // Test GET
    console.log('Testing GET...');
    const value = await client.get('test:hello');
    console.log(`[✓] GET test:hello: ${value}\n`);

    // Test DEL
    console.log('Testing DEL...');
    await client.del('test:hello');
    console.log('[✓] DEL test:hello\n');

    console.log('=== All Tests Passed ✓ ===\n');

    await client.quit();
    process.exit(0);
  } catch (error) {
    console.error('[✗] Test failed:', error);
    await client.quit();
    process.exit(1);
  }
});

client.on('error', (err) => {
  console.error('[✗] Connection error:', err.message);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('[✗] Connection timeout');
  client.disconnect();
  process.exit(1);
}, 10000);
