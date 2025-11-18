/**
 * Setup Form Validation Schemas
 *
 * Zod schemas for validating setup wizard inputs.
 * Implements strict validation with clear error messages.
 */

import { z } from "zod";

/**
 * Admin User Creation Schema
 */
export const adminUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name must not exceed 255 characters")
    .trim(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    )
    .trim(),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

/**
 * Organization Setup Schema
 */
export const organizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(255, "Organization name must not exceed 255 characters")
    .trim(),
  slug: z
    .string()
    .min(2, "Organization slug must be at least 2 characters")
    .max(255, "Organization slug must not exceed 255 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    )
    .trim()
    .optional(),
  defaultLanguage: z.enum(["en", "ru"]).default("en"),
});

/**
 * Complete Setup Schema
 */
export const setupSchema = z.object({
  admin: adminUserSchema,
  organization: organizationSchema,
});

/**
 * Setup Status Response Schema
 */
export const setupStatusSchema = z.object({
  isSetupRequired: z.boolean(),
  isSetupComplete: z.boolean(),
  database: z.object({
    isConnected: z.boolean(),
    version: z.string().optional(),
    name: z.string().optional(),
    tableCount: z.number().optional(),
  }),
  adminUserExists: z.boolean(),
  organizationCount: z.number(),
});

// Export types inferred from schemas
export type AdminUserInput = z.infer<typeof adminUserSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
export type SetupInput = z.infer<typeof setupSchema>;
export type SetupStatus = z.infer<typeof setupStatusSchema>;
