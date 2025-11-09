"use server";

import { db } from "@/lib/db";
import { testTemplates } from "@/lib/db/schema/test-templates";
import { users } from "@/lib/db/schema/users";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/server-auth";
import { revalidatePath } from "next/cache";
import type { PressureTestConfig } from "@/lib/db/schema/pressure-tests";

/**
 * Test Template with creator info
 */
export interface TestTemplateListItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isPublic: boolean;
  isSystemTemplate: boolean;
  usageCount: number;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  creatorName: string;
}

/**
 * Get all test templates for current user\'s organization
 * Includes system templates, organization-wide templates, and user\'s own templates
 */
export async function getTestTemplates(category?: string): Promise<TestTemplateListItem[]> {
  const session = await requireAuth();
  const userId = session.user.id as string;
  const organizationId = session.user.organizationId as string;

  const conditions = [eq(testTemplates.organizationId, organizationId)];

  if (category) {
    conditions.push(eq(testTemplates.category, category));
  }

  const templates = await db
    .select({
      id: testTemplates.id,
      name: testTemplates.name,
      description: testTemplates.description,
      category: testTemplates.category,
      isPublic: testTemplates.isPublic,
      isSystemTemplate: testTemplates.isSystemTemplate,
      usageCount: testTemplates.usageCount,
      lastUsedAt: testTemplates.lastUsedAt,
      createdAt: testTemplates.createdAt,
      updatedAt: testTemplates.updatedAt,
      creatorName: users.name,
    })
    .from(testTemplates)
    .leftJoin(users, eq(testTemplates.createdBy, users.id))
    .where(
      and(
        ...conditions,
        or(
          eq(testTemplates.isSystemTemplate, true), // System templates
          eq(testTemplates.isPublic, true), // Public organization templates
          eq(testTemplates.createdBy, userId) // User\'s own templates
        )
      )
    )
    .orderBy(desc(testTemplates.usageCount), desc(testTemplates.createdAt));

  return templates.map((t) => ({
    ...t,
    creatorName: t.creatorName || "System",
  }));
}

/**
 * Get single test template by ID
 */
export async function getTestTemplateById(id: string) {
  const session = await requireAuth();
  const organizationId = session.user.organizationId as string;

  const [template] = await db
    .select()
    .from(testTemplates)
    .where(
      and(
        eq(testTemplates.id, id),
        eq(testTemplates.organizationId, organizationId)
      )
    )
    .limit(1);

  return template || null;
}

/**
 * Create new test template
 */
export async function createTestTemplate(data: {
  name: string;
  description?: string;
  category?: string;
  config: Partial<PressureTestConfig>;
  isPublic?: boolean;
}) {
  const session = await requireAuth();
  const userId = session.user.id as string;
  const organizationId = session.user.organizationId as string;

  const [template] = await db
    .insert(testTemplates)
    .values({
      name: data.name,
      description: data.description || null,
      category: data.category || "custom",
      config: data.config,
      isPublic: data.isPublic || false,
      isSystemTemplate: false,
      organizationId,
      createdBy: userId,
      usageCount: 0,
    })
    .returning();

  revalidatePath("/tests/new");
  revalidatePath("/settings/templates");

  return template;
}

/**
 * Update test template
 */
export async function updateTestTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    category?: string;
    config?: Partial<PressureTestConfig>;
    isPublic?: boolean;
  }
) {
  const session = await requireAuth();
  const userId = session.user.id as string;
  const organizationId = session.user.organizationId as string;

  // Only allow updating own templates or if system admin
  const [template] = await db
    .update(testTemplates)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(testTemplates.id, id),
        eq(testTemplates.organizationId, organizationId),
        or(
          eq(testTemplates.createdBy, userId),
          eq(testTemplates.isSystemTemplate, false) // Prevent editing system templates
        )
      )
    )
    .returning();

  if (!template) {
    throw new Error("Template not found or you don't have permission to edit it");
  }

  revalidatePath("/tests/new");
  revalidatePath("/settings/templates");
  revalidatePath(`/settings/templates/${id}`);

  return template;
}

/**
 * Delete test template
 */
export async function deleteTestTemplate(id: string) {
  const session = await requireAuth();
  const userId = session.user.id as string;
  const organizationId = session.user.organizationId as string;

  // Only allow deleting own templates, not system templates
  const [deleted] = await db
    .delete(testTemplates)
    .where(
      and(
        eq(testTemplates.id, id),
        eq(testTemplates.organizationId, organizationId),
        eq(testTemplates.createdBy, userId),
        eq(testTemplates.isSystemTemplate, false) // Prevent deleting system templates
      )
    )
    .returning();

  if (!deleted) {
    throw new Error("Template not found or you don't have permission to delete it");
  }

  revalidatePath("/tests/new");
  revalidatePath("/settings/templates");

  return { success: true };
}

/**
 * Increment template usage count
 */
export async function incrementTemplateUsage(id: string) {
  const session = await requireAuth();
  const organizationId = session.user.organizationId as string;

  await db
    .update(testTemplates)
    .set({
      usageCount: sql`${testTemplates.usageCount} + 1`,
      lastUsedAt: new Date(),
    })
    .where(
      and(
        eq(testTemplates.id, id),
        eq(testTemplates.organizationId, organizationId)
      )
    );
}

/**
 * Get template usage statistics
 */
export async function getTemplateStats() {
  const session = await requireAuth();
  const organizationId = session.user.organizationId as string;

  const stats = await db
    .select({
      totalTemplates: sql<number>`count(*)::int`,
      systemTemplates: sql<number>`count(*) filter (where ${testTemplates.isSystemTemplate} = true)::int`,
      publicTemplates: sql<number>`count(*) filter (where ${testTemplates.isPublic} = true AND ${testTemplates.isSystemTemplate} = false)::int`,
      privateTemplates: sql<number>`count(*) filter (where ${testTemplates.isPublic} = false AND ${testTemplates.isSystemTemplate} = false)::int`,
      totalUsage: sql<number>`coalesce(sum(${testTemplates.usageCount}), 0)::int`,
    })
    .from(testTemplates)
    .where(eq(testTemplates.organizationId, organizationId));

  return stats[0] || {
    totalTemplates: 0,
    systemTemplates: 0,
    publicTemplates: 0,
    privateTemplates: 0,
    totalUsage: 0,
  };
}
