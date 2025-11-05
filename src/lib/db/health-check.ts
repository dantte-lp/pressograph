#!/usr/bin/env tsx
/**
 * Database Health Check Script
 *
 * Checks database connectivity and reports connection pool status.
 * Used for monitoring and container health checks.
 *
 * Usage:
 *   pnpm db:health
 *   node --loader tsx src/lib/db/health-check.ts
 */

import { checkDatabaseHealth } from "./index";

async function main() {
  console.log("[Database Health Check] Starting...");

  const isHealthy = await checkDatabaseHealth();

  if (isHealthy) {
    console.log("[Database Health Check] ✅ Database is healthy");
    process.exit(0);
  } else {
    console.error("[Database Health Check] ❌ Database is unhealthy");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("[Database Health Check] Fatal error:", error);
  process.exit(1);
});
