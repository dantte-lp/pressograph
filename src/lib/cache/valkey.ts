import Redis from "ioredis";

/**
 * Valkey (Redis) Client Configuration
 *
 * This module provides a singleton Redis client connection for Valkey cache.
 * Valkey is a high-performance fork of Redis that provides drop-in compatibility.
 *
 * Features:
 * - Singleton pattern for connection pooling
 * - Automatic reconnection on failure
 * - Error handling and logging
 * - TypeScript support
 *
 * Environment Variables:
 * - REDIS_URL: Connection string (e.g., redis://cache:6379)
 * - REDIS_DB: Database number (default: 0)
 * - REDIS_PREFIX: Key prefix for namespacing (default: pressograph:)
 */

// Valkey client singleton
let valkeyClient: Redis | null = null;

/**
 * Redis/Valkey connection options
 */
interface ValkeyOptions {
  url?: string;
  db?: number;
  keyPrefix?: string;
  retryStrategy?: (times: number) => number | void;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
}

/**
 * Default connection options
 */
const defaultOptions: ValkeyOptions = {
  url: process.env.REDIS_URL || "redis://cache:6379",
  db: parseInt(process.env.REDIS_DB || "0", 10),
  keyPrefix: process.env.REDIS_PREFIX || "pressograph:",
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

/**
 * Get Valkey client instance (singleton)
 *
 * Creates a new connection if one doesn't exist, or returns the existing connection.
 *
 * @param options - Optional connection options
 * @returns Redis client instance
 */
export function getValkeyClient(options: ValkeyOptions = {}): Redis {
  if (valkeyClient && valkeyClient.status === "ready") {
    return valkeyClient;
  }

  const config = { ...defaultOptions, ...options };

  try {
    valkeyClient = new Redis(config.url!, {
      db: config.db,
      keyPrefix: config.keyPrefix,
      maxRetriesPerRequest: config.maxRetriesPerRequest,
      enableReadyCheck: config.enableReadyCheck,
      lazyConnect: config.lazyConnect,
      retryStrategy: config.retryStrategy,
    });

    // Event handlers for connection monitoring
    valkeyClient.on("connect", () => {
      console.log("[Valkey] Connecting to Valkey...");
    });

    valkeyClient.on("ready", () => {
      console.log("[Valkey] Connected and ready");
    });

    valkeyClient.on("error", (err) => {
      console.error("[Valkey] Connection error:", err.message);
    });

    valkeyClient.on("close", () => {
      console.warn("[Valkey] Connection closed");
    });

    valkeyClient.on("reconnecting", (time: number) => {
      console.log(`[Valkey] Reconnecting in ${time}ms...`);
    });

    return valkeyClient;
  } catch (error) {
    console.error("[Valkey] Failed to create client:", error);
    throw error;
  }
}

/**
 * Close Valkey connection
 *
 * Gracefully closes the connection. Should be called on app shutdown.
 */
export async function closeValkeyConnection(): Promise<void> {
  if (valkeyClient) {
    try {
      await valkeyClient.quit();
      valkeyClient = null;
      console.log("[Valkey] Connection closed gracefully");
    } catch (error) {
      console.error("[Valkey] Error closing connection:", error);
      // Force disconnect if graceful quit fails
      if (valkeyClient) {
        valkeyClient.disconnect();
        valkeyClient = null;
      }
    }
  }
}

/**
 * Check if Valkey is connected and healthy
 */
export async function isValkeyHealthy(): Promise<boolean> {
  try {
    const client = getValkeyClient();
    const pong = await client.ping();
    return pong === "PONG";
  } catch (error) {
    console.error("[Valkey] Health check failed:", error);
    return false;
  }
}

/**
 * Get connection info for debugging
 */
export function getValkeyInfo() {
  if (!valkeyClient) {
    return { status: "not_initialized" };
  }

  return {
    status: valkeyClient.status,
    options: {
      db: valkeyClient.options.db,
      keyPrefix: valkeyClient.options.keyPrefix,
    },
  };
}

// Export the client for direct use if needed
export { valkeyClient };
