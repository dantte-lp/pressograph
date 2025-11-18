/**
 * Setup Initialization API Route
 *
 * POST /api/setup/init
 *
 * Initializes the application by:
 * - Creating the first admin user
 * - Creating the default organization
 * - Setting up initial configuration
 *
 * This endpoint is publicly accessible but can only be called once
 * (when no admin users exist).
 */

import { NextRequest, NextResponse } from "next/server";
import { setupSchema } from "@/lib/setup/validation";
import { initializeApplication, isSetupRequired } from "@/lib/db/setup";
import { ZodError } from "zod";

export const dynamic = "force-dynamic"; // Disable caching

/**
 * POST /api/setup/init
 *
 * Initialize the application with admin user and organization
 */
export async function POST(request: NextRequest) {
  try {
    // Check if setup is required
    const setupRequired = await isSetupRequired();

    if (!setupRequired) {
      return NextResponse.json(
        {
          success: false,
          error: "Application is already initialized",
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = setupSchema.parse(body);

    // Initialize application
    const { user, organization } = await initializeApplication(
      validatedData.admin,
      validatedData.organization
    );

    // Log successful setup
    console.log("[API] Application initialized successfully", {
      userId: user.id,
      organizationId: organization.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Application initialized successfully",
        data: {
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Setup initialization failed:", error);

    // Handle validation errors
    if (error instanceof ZodError) {
      const fieldErrors = error.issues.map((err: any) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    // Handle known errors
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      );
    }

    // Handle unknown errors
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize application",
      },
      { status: 500 }
    );
  }
}
