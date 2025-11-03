import { getValkeyClient, isValkeyHealthy } from "./valkey";

/**
 * Cache Abstraction Layer
 *
 * Provides type-safe cache operations with automatic serialization/deserialization,
 * error handling, and graceful degradation when cache is unavailable.
 *
 * Features:
 * - Type-safe get/set operations with TypeScript generics
 * - TTL (Time To Live) support
 * - Bulk operations (mget, mset)
 * - Pattern-based invalidation
 * - Graceful fallback when cache unavailable
 * - JSON serialization/deserialization
 */

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

/**
 * Default TTL values (in seconds)
 */
export const CacheTTL = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  ONE_HOUR: 3600,
  SIX_HOURS: 21600,
  ONE_DAY: 86400,
  ONE_WEEK: 604800,
  ONE_MONTH: 2592000,
} as const;

/**
 * Get cached value by key
 *
 * @param key - Cache key (will be prefixed automatically)
 * @returns Promise resolving to cached value or null if not found
 */
export async function get<T = unknown>(key: string): Promise<T | null> {
  try {
    const client = getValkeyClient();
    const value = await client.get(key);

    if (!value) {
      return null;
    }

    // Try to parse JSON, return raw string if parsing fails
    try {
      const parsed = JSON.parse(value) as CacheEntry<T>;
      return parsed.value;
    } catch {
      return value as unknown as T;
    }
  } catch (error) {
    console.error(`[Cache] Error getting key "${key}":`, error);
    return null;
  }
}

/**
 * Set cached value with optional TTL
 *
 * @param key - Cache key (will be prefixed automatically)
 * @param value - Value to cache (will be JSON serialized)
 * @param ttl - Time to live in seconds (optional)
 */
export async function set<T = unknown>(
  key: string,
  value: T,
  ttl?: number
): Promise<boolean> {
  try {
    const client = getValkeyClient();

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl,
    };

    const serialized = JSON.stringify(entry);

    if (ttl) {
      await client.setex(key, ttl, serialized);
    } else {
      await client.set(key, serialized);
    }

    return true;
  } catch (error) {
    console.error(`[Cache] Error setting key "${key}":`, error);
    return false;
  }
}

/**
 * Delete cached value
 *
 * @param key - Cache key to delete
 * @returns Promise resolving to true if deleted, false otherwise
 */
export async function del(key: string): Promise<boolean> {
  try {
    const client = getValkeyClient();
    const result = await client.del(key);
    return result > 0;
  } catch (error) {
    console.error(`[Cache] Error deleting key "${key}":`, error);
    return false;
  }
}

/**
 * Invalidate cache keys by pattern
 *
 * @param pattern - Glob pattern (e.g., "user:*", "session:*")
 * @returns Promise resolving to number of keys deleted
 */
export async function invalidate(pattern: string): Promise<number> {
  try {
    const client = getValkeyClient();
    const keys = await client.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    // Remove prefix from keys before deletion (ioredis handles this)
    const deleted = await client.del(...keys);
    console.log(`[Cache] Invalidated ${deleted} keys matching "${pattern}"`);
    return deleted;
  } catch (error) {
    console.error(`[Cache] Error invalidating pattern "${pattern}":`, error);
    return 0;
  }
}

/**
 * Get multiple cache values by keys
 *
 * @param keys - Array of cache keys
 * @returns Promise resolving to array of values (null for missing keys)
 */
export async function mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
  try {
    const client = getValkeyClient();
    const values = await client.mget(...keys);

    return values.map((value) => {
      if (!value) return null;

      try {
        const parsed = JSON.parse(value) as CacheEntry<T>;
        return parsed.value;
      } catch {
        return value as unknown as T;
      }
    });
  } catch (error) {
    console.error(`[Cache] Error getting multiple keys:`, error);
    return keys.map(() => null);
  }
}

/**
 * Set multiple cache values at once
 *
 * @param entries - Object mapping keys to values
 * @param ttl - Optional TTL for all entries (in seconds)
 * @returns Promise resolving to true if successful
 */
export async function mset(
  entries: Record<string, unknown>,
  ttl?: number
): Promise<boolean> {
  try {
    const client = getValkeyClient();

    // Prepare key-value pairs with JSON serialization
    const pairs: Array<string | number> = [];
    for (const [key, value] of Object.entries(entries)) {
      const entry: CacheEntry<unknown> = {
        value,
        timestamp: Date.now(),
        ttl,
      };
      pairs.push(key, JSON.stringify(entry));
    }

    await client.mset(...pairs);

    // Set TTL for all keys if specified
    if (ttl) {
      const pipeline = client.pipeline();
      for (const key of Object.keys(entries)) {
        pipeline.expire(key, ttl);
      }
      await pipeline.exec();
    }

    return true;
  } catch (error) {
    console.error(`[Cache] Error setting multiple keys:`, error);
    return false;
  }
}

/**
 * Check if key exists in cache
 *
 * @param key - Cache key to check
 * @returns Promise resolving to true if exists, false otherwise
 */
export async function exists(key: string): Promise<boolean> {
  try {
    const client = getValkeyClient();
    const result = await client.exists(key);
    return result > 0;
  } catch (error) {
    console.error(`[Cache] Error checking existence of key "${key}":`, error);
    return false;
  }
}

/**
 * Get remaining TTL for a key
 *
 * @param key - Cache key
 * @returns Promise resolving to TTL in seconds (-1 if no expiry, -2 if not exists)
 */
export async function ttl(key: string): Promise<number> {
  try {
    const client = getValkeyClient();
    return await client.ttl(key);
  } catch (error) {
    console.error(`[Cache] Error getting TTL for key "${key}":`, error);
    return -2;
  }
}

/**
 * Increment numeric value in cache
 *
 * @param key - Cache key
 * @param amount - Amount to increment (default: 1)
 * @returns Promise resolving to new value after increment
 */
export async function incr(key: string, amount: number = 1): Promise<number> {
  try {
    const client = getValkeyClient();
    return await client.incrby(key, amount);
  } catch (error) {
    console.error(`[Cache] Error incrementing key "${key}":`, error);
    return 0;
  }
}

/**
 * Decrement numeric value in cache
 *
 * @param key - Cache key
 * @param amount - Amount to decrement (default: 1)
 * @returns Promise resolving to new value after decrement
 */
export async function decr(key: string, amount: number = 1): Promise<number> {
  try {
    const client = getValkeyClient();
    return await client.decrby(key, amount);
  } catch (error) {
    console.error(`[Cache] Error decrementing key "${key}":`, error);
    return 0;
  }
}

/**
 * Cache wrapper for functions - memoization pattern
 *
 * Caches the result of an async function. If cached value exists, returns it.
 * Otherwise, executes the function, caches the result, and returns it.
 *
 * @param key - Cache key
 * @param fn - Async function to execute if cache miss
 * @param ttl - Time to live in seconds (optional)
 * @returns Promise resolving to cached or computed value
 */
export async function remember<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  try {
    // Try to get from cache first
    const cached = await get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await set(key, result, ttl);
    return result;
  } catch (error) {
    console.error(`[Cache] Error in remember for key "${key}":`, error);
    // Fallback: execute function without caching
    return await fn();
  }
}

/**
 * Clear all cache (use with caution)
 *
 * @returns Promise resolving to true if successful
 */
export async function flush(): Promise<boolean> {
  try {
    const client = getValkeyClient();
    await client.flushdb();
    console.log("[Cache] Cache flushed successfully");
    return true;
  } catch (error) {
    console.error("[Cache] Error flushing cache:", error);
    return false;
  }
}

/**
 * Get cache statistics
 *
 * @returns Promise resolving to cache info object
 */
export async function getStats() {
  try {
    const client = getValkeyClient();
    const info = await client.info("stats");
    const memory = await client.info("memory");
    const healthy = await isValkeyHealthy();

    return {
      healthy,
      stats: info,
      memory,
    };
  } catch (error) {
    console.error("[Cache] Error getting stats:", error);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Export all cache utilities as default namespace
 */
export const cache = {
  get,
  set,
  del,
  invalidate,
  mget,
  mset,
  exists,
  ttl,
  incr,
  decr,
  remember,
  flush,
  getStats,
  TTL: CacheTTL,
};

export default cache;
