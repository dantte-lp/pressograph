/**
 * Cache Strategies for Pressograph
 *
 * Pre-configured caching strategies for common use cases:
 * - Session caching
 * - API response caching
 * - Static data caching
 * - User data caching
 */

import { get, set, del, invalidate, remember, CacheTTL } from "./index";

/**
 * Session Cache Strategy
 *
 * Stores user sessions with 24-hour TTL.
 * Pattern: session:{sessionId}
 */
export const SessionCache = {
  /**
   * Get session data
   */
  async get<T = unknown>(sessionId: string): Promise<T | null> {
    return get<T>(`session:${sessionId}`);
  },

  /**
   * Store session data (24-hour TTL)
   */
  async set<T = unknown>(sessionId: string, data: T): Promise<boolean> {
    return set(`session:${sessionId}`, data, CacheTTL.ONE_DAY);
  },

  /**
   * Delete session
   */
  async delete(sessionId: string): Promise<boolean> {
    return del(`session:${sessionId}`);
  },

  /**
   * Invalidate all sessions for a user
   */
  async invalidateUser(userId: string): Promise<number> {
    return invalidate(`session:*:user:${userId}`);
  },

  /**
   * Invalidate all sessions
   */
  async invalidateAll(): Promise<number> {
    return invalidate("session:*");
  },
};

/**
 * API Response Cache Strategy
 *
 * Caches API responses with configurable TTL.
 * Pattern: api:{endpoint}:{params}
 */
export const ApiCache = {
  /**
   * Get cached API response
   */
  async get<T = unknown>(endpoint: string, params?: Record<string, unknown>): Promise<T | null> {
    const key = this.buildKey(endpoint, params);
    return get<T>(key);
  },

  /**
   * Cache API response
   */
  async set<T = unknown>(
    endpoint: string,
    data: T,
    params?: Record<string, unknown>,
    ttl: number = CacheTTL.FIVE_MINUTES
  ): Promise<boolean> {
    const key = this.buildKey(endpoint, params);
    return set(key, data, ttl);
  },

  /**
   * Remember API response (get from cache or fetch and cache)
   */
  async remember<T>(
    endpoint: string,
    fetcher: () => Promise<T>,
    params?: Record<string, unknown>,
    ttl: number = CacheTTL.FIVE_MINUTES
  ): Promise<T> {
    const key = this.buildKey(endpoint, params);
    return remember(key, fetcher, ttl);
  },

  /**
   * Invalidate API cache for endpoint
   */
  async invalidate(endpoint: string): Promise<number> {
    return invalidate(`api:${endpoint}:*`);
  },

  /**
   * Build cache key from endpoint and params
   */
  buildKey(endpoint: string, params?: Record<string, unknown>): string {
    const normalizedEndpoint = endpoint.replace(/^\//, "").replace(/\//g, ":");
    if (!params) {
      return `api:${normalizedEndpoint}`;
    }
    const paramsHash = this.hashParams(params);
    return `api:${normalizedEndpoint}:${paramsHash}`;
  },

  /**
   * Hash params object for cache key
   */
  hashParams(params: Record<string, unknown>): string {
    const sorted = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, unknown>);
    return Buffer.from(JSON.stringify(sorted)).toString("base64url");
  },
};

/**
 * Static Data Cache Strategy
 *
 * Caches rarely-changing data with long TTL.
 * Pattern: static:{type}:{id}
 */
export const StaticCache = {
  /**
   * Get static data
   */
  async get<T = unknown>(type: string, id?: string): Promise<T | null> {
    const key = id ? `static:${type}:${id}` : `static:${type}`;
    return get<T>(key);
  },

  /**
   * Cache static data (1-week TTL by default)
   */
  async set<T = unknown>(
    type: string,
    data: T,
    id?: string,
    ttl: number = CacheTTL.ONE_WEEK
  ): Promise<boolean> {
    const key = id ? `static:${type}:${id}` : `static:${type}`;
    return set(key, data, ttl);
  },

  /**
   * Remember static data
   */
  async remember<T>(
    type: string,
    fetcher: () => Promise<T>,
    id?: string,
    ttl: number = CacheTTL.ONE_WEEK
  ): Promise<T> {
    const key = id ? `static:${type}:${id}` : `static:${type}`;
    return remember(key, fetcher, ttl);
  },

  /**
   * Invalidate static data by type
   */
  async invalidate(type: string): Promise<number> {
    return invalidate(`static:${type}:*`);
  },

  /**
   * Delete specific static data
   */
  async delete(type: string, id?: string): Promise<boolean> {
    const key = id ? `static:${type}:${id}` : `static:${type}`;
    return del(key);
  },
};

/**
 * User Data Cache Strategy
 *
 * Caches user-specific data with medium TTL.
 * Pattern: user:{userId}:{type}
 */
export const UserCache = {
  /**
   * Get user data
   */
  async get<T = unknown>(userId: string, type: string = "profile"): Promise<T | null> {
    return get<T>(`user:${userId}:${type}`);
  },

  /**
   * Cache user data (6-hour TTL by default)
   */
  async set<T = unknown>(
    userId: string,
    data: T,
    type: string = "profile",
    ttl: number = CacheTTL.SIX_HOURS
  ): Promise<boolean> {
    return set(`user:${userId}:${type}`, data, ttl);
  },

  /**
   * Remember user data
   */
  async remember<T>(
    userId: string,
    fetcher: () => Promise<T>,
    type: string = "profile",
    ttl: number = CacheTTL.SIX_HOURS
  ): Promise<T> {
    return remember(`user:${userId}:${type}`, fetcher, ttl);
  },

  /**
   * Invalidate all data for a user
   */
  async invalidateUser(userId: string): Promise<number> {
    return invalidate(`user:${userId}:*`);
  },

  /**
   * Invalidate specific user data type
   */
  async invalidateType(userId: string, type: string): Promise<boolean> {
    return del(`user:${userId}:${type}`);
  },
};

/**
 * Rate Limiting Cache Strategy
 *
 * Implements rate limiting using cache counters.
 * Pattern: ratelimit:{identifier}:{window}
 */
export const RateLimitCache = {
  /**
   * Check and increment rate limit counter
   *
   * @param identifier - Unique identifier (e.g., IP, userId)
   * @param limit - Maximum number of requests
   * @param windowSeconds - Time window in seconds
   * @returns Object with allowed status and remaining count
   */
  async check(
    identifier: string,
    limit: number,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    try {
      const key = `ratelimit:${identifier}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;

      const current = await get<number>(key);
      const count = current ? current + 1 : 1;

      if (count > limit) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: Math.ceil(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000,
        };
      }

      await set(key, count, windowSeconds);

      return {
        allowed: true,
        remaining: limit - count,
        resetAt: Math.ceil(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000,
      };
    } catch (error) {
      console.error("[RateLimit] Error checking rate limit:", error);
      // Fail open: allow request on error
      return { allowed: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 };
    }
  },

  /**
   * Reset rate limit for identifier
   */
  async reset(identifier: string): Promise<number> {
    return invalidate(`ratelimit:${identifier}:*`);
  },
};

/**
 * Graph Data Cache Strategy
 *
 * Caches generated pressure test graphs.
 * Pattern: graph:{testId}:{format}
 */
export const GraphCache = {
  /**
   * Get cached graph data
   */
  async get<T = unknown>(testId: string, format: string = "svg"): Promise<T | null> {
    return get<T>(`graph:${testId}:${format}`);
  },

  /**
   * Cache graph data (1-day TTL)
   */
  async set<T = unknown>(
    testId: string,
    data: T,
    format: string = "svg",
    ttl: number = CacheTTL.ONE_DAY
  ): Promise<boolean> {
    return set(`graph:${testId}:${format}`, data, ttl);
  },

  /**
   * Remember graph data
   */
  async remember<T>(
    testId: string,
    generator: () => Promise<T>,
    format: string = "svg",
    ttl: number = CacheTTL.ONE_DAY
  ): Promise<T> {
    return remember(`graph:${testId}:${format}`, generator, ttl);
  },

  /**
   * Invalidate all formats for a test
   */
  async invalidateTest(testId: string): Promise<number> {
    return invalidate(`graph:${testId}:*`);
  },

  /**
   * Invalidate all cached graphs
   */
  async invalidateAll(): Promise<number> {
    return invalidate("graph:*");
  },
};

/**
 * Export all strategies
 */
export const CacheStrategies = {
  Session: SessionCache,
  Api: ApiCache,
  Static: StaticCache,
  User: UserCache,
  RateLimit: RateLimitCache,
  Graph: GraphCache,
};

export default CacheStrategies;
