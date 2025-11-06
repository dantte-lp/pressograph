/**
 * User Preferences Cache Strategy
 *
 * Specialized cache strategies for user preferences and themes with
 * three-tier caching (Cookie → Valkey → Database)
 */

import { get, set, del, CacheTTL } from "./index";

/**
 * User preferences data structure
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: boolean;
  [key: string]: unknown;
}

/**
 * Theme-specific cache operations
 */
export const ThemeCache = {
  /**
   * Get cached theme for user
   * @param userId - User identifier
   * @returns Theme preference or null if not cached
   */
  async get(userId: string): Promise<string | null> {
    return get<string>(`theme:${userId}`);
  },

  /**
   * Cache user theme preference
   * @param userId - User identifier
   * @param theme - Theme preference (light/dark/system)
   * @param ttl - TTL in seconds (default 1 hour)
   */
  async set(userId: string, theme: string, ttl: number = CacheTTL.ONE_HOUR): Promise<boolean> {
    return set(`theme:${userId}`, theme, ttl);
  },

  /**
   * Delete cached theme for user
   * @param userId - User identifier
   */
  async delete(userId: string): Promise<boolean> {
    return del(`theme:${userId}`);
  },

  /**
   * Bulk get themes for multiple users
   * @param userIds - Array of user identifiers
   */
  async getMany(userIds: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();

    for (const userId of userIds) {
      const theme = await this.get(userId);
      results.set(userId, theme);
    }

    return results;
  },
};

/**
 * User preferences cache operations
 */
export const PreferencesCache = {
  /**
   * Get cached preferences for user
   * @param userId - User identifier
   * @returns User preferences or null if not cached
   */
  async get(userId: string): Promise<UserPreferences | null> {
    return get<UserPreferences>(`preferences:${userId}`);
  },

  /**
   * Cache user preferences
   * @param userId - User identifier
   * @param preferences - User preferences object
   * @param ttl - TTL in seconds (default 1 hour)
   */
  async set(
    userId: string,
    preferences: UserPreferences,
    ttl: number = CacheTTL.ONE_HOUR
  ): Promise<boolean> {
    return set(`preferences:${userId}`, preferences, ttl);
  },

  /**
   * Update specific preference field
   * @param userId - User identifier
   * @param field - Field to update
   * @param value - New value
   */
  async updateField(userId: string, field: string, value: unknown): Promise<boolean> {
    const current = await this.get(userId);
    const updated = { ...current, [field]: value };
    return this.set(userId, updated);
  },

  /**
   * Delete cached preferences for user
   * @param userId - User identifier
   */
  async delete(userId: string): Promise<boolean> {
    return del(`preferences:${userId}`);
  },

  /**
   * Invalidate all preference caches for a user
   * @param userId - User identifier
   */
  async invalidateUser(userId: string): Promise<void> {
    await Promise.all([
      this.delete(userId),
      ThemeCache.delete(userId),
    ]);
  },
};

/**
 * Combined cache operations for user data
 */
export const UserDataCache = {
  themes: ThemeCache,
  preferences: PreferencesCache,

  /**
   * Warm up cache for a user by preloading common data
   * @param userId - User identifier
   * @param data - Data to preload
   */
  async warmup(userId: string, data: {
    theme?: string;
    preferences?: UserPreferences;
  }): Promise<void> {
    const promises = [];

    if (data.theme) {
      promises.push(ThemeCache.set(userId, data.theme));
    }

    if (data.preferences) {
      promises.push(PreferencesCache.set(userId, data.preferences));
    }

    await Promise.all(promises);
  },

  /**
   * Clear all cached data for a user
   * @param userId - User identifier
   */
  async clear(userId: string): Promise<void> {
    await PreferencesCache.invalidateUser(userId);
  },
};