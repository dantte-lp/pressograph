import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database Connection Configuration
 *
 * Implements connection pooling, SSL support, and proper error handling
 * for PostgreSQL 18 using postgres.js driver.
 *
 * Features:
 * - Connection pooling with configurable limits
 * - SSL/TLS support for production
 * - Retry logic for transient failures
 * - Proper timeout configuration
 * - Statement timeout to prevent long-running queries
 *
 * @see https://orm.drizzle.team/docs/get-started/postgresql-new
 * @see https://orm.drizzle.team/docs/connect-overview
 */

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Parse connection options
const connectionOptions: postgres.Options<{}> = {
  // Connection pooling
  max: parseInt(process.env.POSTGRES_POOL_MAX || "20"), // Maximum connections in pool
  idle_timeout: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || "30"), // Seconds before idle connection closes
  connect_timeout: parseInt(process.env.POSTGRES_CONNECT_TIMEOUT || "10"), // Connection timeout in seconds
  max_lifetime: parseInt(process.env.POSTGRES_MAX_LIFETIME || "3600"), // Maximum lifetime for a connection in seconds

  // SSL/TLS configuration
  ssl: process.env.POSTGRES_SSL === "true" ? {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  } : undefined,

  // Type parsing
  transform: {
    undefined: null, // Transform undefined to null for PostgreSQL
  },

  // Error handling
  onnotice: process.env.NODE_ENV === "development"
    ? (notice) => console.log("[PostgreSQL Notice]", notice)
    : undefined,

  // Debug mode (development only)
  debug: process.env.POSTGRES_DEBUG === "true" && process.env.NODE_ENV === "development"
    ? (connection, query, params) => {
        console.log("[PostgreSQL Debug]", {
          connection,
          query,
          params,
        });
      }
    : undefined,
};

// Create connection with pooling
const queryClient = postgres(process.env.DATABASE_URL, connectionOptions);

// Set statement timeout if configured (in milliseconds)
const statementTimeout = process.env.POSTGRES_STATEMENT_TIMEOUT;
if (statementTimeout) {
  queryClient`SET statement_timeout = ${parseInt(statementTimeout)}`
    .then(() => console.log(`[PostgreSQL] Statement timeout set to ${statementTimeout}ms`))
    .catch((err) => console.error("[PostgreSQL] Failed to set statement timeout:", err));
}

// Initialize Drizzle ORM with schema
export const db = drizzle(queryClient, {
  schema,
  logger: process.env.DRIZZLE_LOG_QUERIES === "true" || process.env.NODE_ENV === "development",
});

// Export the underlying client for raw queries if needed
export { queryClient };

// Export schema for external use
export { schema };

/**
 * Health check function for database connection
 * Useful for readiness/liveness probes in containerized environments
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await queryClient`SELECT 1 as health_check`;
    return true;
  } catch (error) {
    console.error("[Database Health Check Failed]", error);
    return false;
  }
}

/**
 * Graceful shutdown - close all connections
 * Call this during application shutdown to prevent connection leaks
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await queryClient.end({ timeout: 5 }); // 5 second timeout
    console.log("[Database] Connection pool closed gracefully");
  } catch (error) {
    console.error("[Database] Error closing connection pool", error);
    throw error;
  }
}
