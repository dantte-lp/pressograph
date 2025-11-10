/**
 * Organization Server Actions
 *
 * Server-side actions for managing organizations and their settings.
 * Includes settings updates, validation, and audit logging.
 */

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/server-auth";
import {
  organizationSettingsUpdateSchema,
  type OrganizationSettingsUpdate,
  mergeOrganizationSettings,
} from "@/lib/validation/organization-settings";
import { auditLogs } from "@/lib/db/schema";

/**
 * Result type for actions
 */
type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get organization by ID
 */
export async function getOrganization(organizationId: string) {
  try {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!organization) {
      return { success: false, error: "Organization not found" } as ActionResult;
    }

    return {
      success: true,
      data: organization,
    } as ActionResult<typeof organization>;
  } catch (error) {
    console.error("[getOrganization Error]", error);
    return {
      success: false,
      error: "Failed to fetch organization",
    } as ActionResult;
  }
}

/**
 * Update organization settings
 */
export async function updateOrganizationSettings(
  organizationId: string,
  settings: OrganizationSettingsUpdate
): Promise<ActionResult> {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify user has access to this organization
    const [user] = await db.query.users.findMany({
      where: (users, { eq }) => eq(users.id, session.user.id),
      limit: 1,
    });

    if (!user || (user.organizationId !== organizationId && user.role !== "admin")) {
      return {
        success: false,
        error: "You don't have permission to update this organization",
      };
    }

    // Get current organization settings
    const [currentOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!currentOrg) {
      return { success: false, error: "Organization not found" };
    }

    // Merge with existing settings
    const mergedSettings = mergeOrganizationSettings({
      ...(currentOrg.settings as any),
      ...settings,
    });

    // Validate the merged settings
    const validation = organizationSettingsUpdateSchema.safeParse(mergedSettings);
    if (!validation.success) {
      return {
        success: false,
        error: `Invalid settings: ${validation.error.errors[0]?.message}`,
      };
    }

    // Update organization settings
    await db
      .update(organizations)
      .set({
        settings: mergedSettings,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId));

    // Log the change
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "update_organization_settings",
      entityType: "organization",
      entityId: organizationId,
      details: {
        updatedFields: Object.keys(settings),
        timestamp: new Date().toISOString(),
      },
      ipAddress: null, // TODO: Get from request headers
    });

    // Revalidate relevant paths
    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[updateOrganizationSettings Error]", error);
    return {
      success: false,
      error: "Failed to update organization settings",
    };
  }
}

/**
 * Update organization branding
 */
export async function updateOrganizationBranding(
  organizationId: string,
  branding: {
    logoUrl?: string;
    primaryColor?: string;
  }
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify permissions
    const [user] = await db.query.users.findMany({
      where: (users, { eq }) => eq(users.id, session.user.id),
      limit: 1,
    });

    if (!user || (user.organizationId !== organizationId && user.role !== "admin")) {
      return {
        success: false,
        error: "You don't have permission to update this organization",
      };
    }

    // Update organization
    await db
      .update(organizations)
      .set({
        ...(branding.logoUrl && { logoUrl: branding.logoUrl }),
        ...(branding.primaryColor && { primaryColor: branding.primaryColor }),
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId));

    // Log the change
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "update_organization_branding",
      entityType: "organization",
      entityId: organizationId,
      details: {
        branding,
        timestamp: new Date().toISOString(),
      },
      ipAddress: null,
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[updateOrganizationBranding Error]", error);
    return {
      success: false,
      error: "Failed to update organization branding",
    };
  }
}

/**
 * Get organization settings with defaults
 */
export async function getOrganizationSettings(organizationId: string) {
  try {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!organization) {
      return { success: false, error: "Organization not found" } as ActionResult;
    }

    // Merge with defaults to ensure all fields exist
    const settings = mergeOrganizationSettings(organization.settings as any);

    return {
      success: true,
      data: settings,
    } as ActionResult<typeof settings>;
  } catch (error) {
    console.error("[getOrganizationSettings Error]", error);
    return {
      success: false,
      error: "Failed to fetch organization settings",
    } as ActionResult;
  }
}
