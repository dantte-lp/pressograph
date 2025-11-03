import { NextResponse } from "next/server";
import { isValkeyHealthy, getValkeyInfo } from "@/lib/cache/valkey";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * Health Check API Route
 *
 * Checks the health status of all critical services:
 * - Next.js application
 * - Valkey cache
 * - PostgreSQL database
 *
 * Returns 200 if all healthy, 503 if any service is down.
 */
export async function GET() {
  const checks = {
    app: { status: "healthy", timestamp: new Date().toISOString() },
    cache: { status: "unknown", info: null as any },
    database: { status: "unknown" },
  };

  try {
    // Check Valkey cache
    const cacheHealthy = await isValkeyHealthy();
    checks.cache.status = cacheHealthy ? "healthy" : "unhealthy";
    checks.cache.info = getValkeyInfo();
  } catch (error) {
    checks.cache.status = "error";
    checks.cache.info = {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  try {
    // Check PostgreSQL database
    // Simple query to verify connection
    await db.execute(sql`SELECT 1`);
    checks.database.status = "healthy";
  } catch (error) {
    checks.database.status = "error";
    checks.database = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    } as any;
  }

  // Determine overall health
  const allHealthy =
    checks.cache.status === "healthy" && checks.database.status === "healthy";

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allHealthy ? 200 : 503 }
  );
}
