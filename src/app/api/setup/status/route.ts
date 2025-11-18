/**
 * Setup Status API Route
 *
 * GET /api/setup/status
 *
 * Returns the current setup status including:
 * - Whether setup is required
 * - Database connection status
 * - Admin user existence
 * - Organization count
 *
 * This endpoint is publicly accessible (no auth required)
 * to allow checking setup status before authentication is configured.
 */

import { NextResponse } from "next/server";
import { getSetupStatus } from "@/lib/db/setup";

export const dynamic = "force-dynamic"; // Disable caching for status checks

/**
 * GET /api/setup/status
 *
 * Check if application setup is required and get system status
 */
export async function GET() {
  try {
    const status = await getSetupStatus();

    return NextResponse.json(
      {
        success: true,
        data: status,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[API] Setup status check failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check setup status",
        data: {
          isSetupRequired: true,
          isSetupComplete: false,
          database: {
            isConnected: false,
          },
          adminUserExists: false,
          organizationCount: 0,
        },
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
