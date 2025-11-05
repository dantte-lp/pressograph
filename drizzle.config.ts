import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env.local or .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

/**
 * Drizzle Kit Configuration
 *
 * Complete configuration for Drizzle ORM with all features enabled:
 * - Schema management and migrations
 * - Drizzle Studio for database browsing
 * - PostgreSQL 18 connection with SSL support
 * - Migration versioning and breakpoints
 *
 * @see https://orm.drizzle.team/docs/drizzle-config-file
 * @see https://orm.drizzle.team/docs/drizzle-kit-studio
 */
export default defineConfig({
  // Schema configuration
  schema: "./src/lib/db/schema/*",
  out: "./drizzle/migrations",

  // Database dialect
  dialect: "postgresql",

  // Database credentials
  dbCredentials: {
    // Use DATABASE_URL if available, otherwise construct from individual vars
    url: process.env.DATABASE_URL ||
      `postgresql://${process.env.POSTGRES_USER || "postgres"}:${process.env.POSTGRES_PASSWORD || "postgres"}@${process.env.POSTGRES_HOST || "localhost"}:${process.env.POSTGRES_PORT || "5432"}/${process.env.POSTGRES_DB || "pressograph"}`,

    // SSL configuration for production
    ssl: process.env.POSTGRES_SSL === "true" ? {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    } : false,
  },

  // Verbose logging for debugging
  verbose: process.env.DRIZZLE_VERBOSE === "true" || true,

  // Strict mode - fails on schema conflicts
  strict: true,

  // Migration configuration
  migrations: {
    table: "drizzle_migrations",
    schema: "public",
    prefix: "timestamp", // Migration naming: timestamp or index
  },

  // Enable breakpoints for debugging migrations
  breakpoints: true,

  // Drizzle Studio configuration
  // Note: Studio is configured via CLI flags, not in the config file
  // Access at: https://dbdev-pressograph.infra4.dev or http://localhost:5555
  // Run with: pnpm db:studio --host 0.0.0.0 --port 5555

  // Schema filtering (optional - include/exclude specific tables)
  // tablesFilter: ["users", "projects", "pressure_tests"],

  // Extension handling
  extensionsFilters: ["postgis"], // Add PostgreSQL extensions to track

  // Introspection configuration
  introspect: {
    casing: "preserve", // preserve | camelCase
  },
});
