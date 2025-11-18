/**
 * Database Setup Utilities
 *
 * Provides utilities for initial application setup, including:
 * - Checking if setup is required
 * - Creating admin users
 * - Creating default organizations
 * - Seeding initial data
 *
 * @module lib/db/setup
 */

import { db } from "./index";
import { users, organizations } from "./schema";
import { eq, count, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { AdminUserInput, OrganizationInput } from "../setup/validation";

/**
 * Check if application setup is required
 *
 * Setup is required if:
 * - No admin users exist
 * - No organizations exist
 *
 * @returns Promise<boolean> - true if setup is required
 */
export async function isSetupRequired(): Promise<boolean> {
  try {
    // Check if any admin users exist
    const [adminCountResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "admin"));

    const adminCount = adminCountResult?.count ?? 0;

    return adminCount === 0;
  } catch (error) {
    console.error("[Setup] Error checking if setup required:", error);
    // If we can't check, assume setup is required
    return true;
  }
}

/**
 * Check if setup is complete
 *
 * Setup is complete if:
 * - At least one admin user exists
 * - At least one organization exists
 *
 * @returns Promise<boolean> - true if setup is complete
 */
export async function isSetupComplete(): Promise<boolean> {
  const setupRequired = await isSetupRequired();
  return !setupRequired;
}

/**
 * Get database information for setup status
 */
export async function getDatabaseInfo() {
  try {
    // Get PostgreSQL version
    const versionResult = await db.execute<{ version: string }>(
      sql`SELECT version() as version`
    );
    const version = (versionResult[0] as any)?.version || "Unknown";

    // Get database name
    const dbNameResult = await db.execute<{ current_database: string }>(
      sql`SELECT current_database() as current_database`
    );
    const name = (dbNameResult[0] as any)?.current_database || "Unknown";

    // Get table count from information_schema
    const tableCountResult = await db.execute<{ count: string }>(
      sql`
        SELECT COUNT(*)::text as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
      `
    );
    const tableCount = parseInt((tableCountResult[0] as any)?.count || "0");

    return {
      isConnected: true,
      version,
      name,
      tableCount,
    };
  } catch (error) {
    console.error("[Setup] Error getting database info:", error);
    return {
      isConnected: false,
      version: undefined,
      name: undefined,
      tableCount: 0,
    };
  }
}

/**
 * Get setup status information
 */
export async function getSetupStatus() {
  const [database, setupRequired, adminCount, orgCount] = await Promise.all([
    getDatabaseInfo(),
    isSetupRequired(),
    getAdminUserCount(),
    getOrganizationCount(),
  ]);

  return {
    isSetupRequired: setupRequired,
    isSetupComplete: !setupRequired,
    database,
    adminUserExists: adminCount > 0,
    organizationCount: orgCount,
  };
}

/**
 * Get count of admin users
 */
async function getAdminUserCount(): Promise<number> {
  try {
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "admin"));

    return result?.count ?? 0;
  } catch (error) {
    console.error("[Setup] Error getting admin user count:", error);
    return 0;
  }
}

/**
 * Get count of organizations
 */
async function getOrganizationCount(): Promise<number> {
  try {
    const [result] = await db.select({ count: count() }).from(organizations);

    return result?.count ?? 0;
  } catch (error) {
    console.error("[Setup] Error getting organization count:", error);
    return 0;
  }
}

/**
 * Create a slug from a name
 */
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Create default organization
 *
 * @param input - Organization input data
 * @returns Promise<Organization> - Created organization
 */
export async function createDefaultOrganization(input: OrganizationInput) {
  try {
    // Generate slug if not provided
    const slug = input.slug || createSlug(input.name);

    // Check if organization with this slug already exists
    const existing = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
    });

    if (existing) {
      throw new Error(`Organization with slug "${slug}" already exists`);
    }

    // Create organization with default settings
    const [organization] = await db
      .insert(organizations)
      .values({
        name: input.name,
        slug,
        settings: {
          defaultLanguage: input.defaultLanguage || "en",
          allowPublicSharing: false,
          requireApprovalForTests: false,
          maxTestDuration: 48,
          customBranding: {
            enabled: false,
          },
        },
        planType: "free",
        subscriptionStatus: "active",
      })
      .returning();

    console.log(`[Setup] Created organization: ${organization.name} (${organization.id})`);

    return organization;
  } catch (error) {
    console.error("[Setup] Error creating organization:", error);
    throw new Error("Failed to create organization");
  }
}

/**
 * Create admin user
 *
 * @param input - Admin user input data
 * @param organizationId - Optional organization ID to associate with user
 * @returns Promise<User> - Created user (without password)
 */
export async function createAdminUser(
  input: AdminUserInput,
  organizationId?: string
) {
  try {
    // Check if user with this email or username already exists
    const existingByEmail = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (existingByEmail) {
      throw new Error(`User with email "${input.email}" already exists`);
    }

    const existingByUsername = await db.query.users.findFirst({
      where: eq(users.username, input.username),
    });

    if (existingByUsername) {
      throw new Error(`User with username "${input.username}" already exists`);
    }

    // Hash password with bcrypt (cost factor: 10)
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create admin user
    const [user] = await db
      .insert(users)
      .values({
        name: input.name,
        username: input.username,
        email: input.email,
        password: hashedPassword,
        role: "admin",
        organizationId: organizationId || null,
        isActive: true,
        emailVerified: new Date(), // Auto-verify admin user
      })
      .returning();

    console.log(`[Setup] Created admin user: ${user.username} (${user.id})`);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error("[Setup] Error creating admin user:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create admin user");
  }
}

/**
 * Initialize application
 *
 * Creates admin user and default organization in a transaction.
 *
 * @param adminInput - Admin user input
 * @param orgInput - Organization input
 * @returns Promise<{ user, organization }> - Created entities
 */
export async function initializeApplication(
  adminInput: AdminUserInput,
  orgInput: OrganizationInput
) {
  try {
    // Check if already initialized
    const setupRequired = await isSetupRequired();
    if (!setupRequired) {
      throw new Error("Application is already initialized");
    }

    // Create organization first
    const organization = await createDefaultOrganization(orgInput);

    // Create admin user linked to organization
    const user = await createAdminUser(adminInput, organization.id);

    console.log("[Setup] Application initialization complete");

    return {
      user,
      organization,
    };
  } catch (error) {
    console.error("[Setup] Error initializing application:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to initialize application");
  }
}
