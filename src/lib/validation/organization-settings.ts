/**
 * Organization Settings Validation Schemas
 *
 * Zod schemas for validating organization settings JSONB data.
 * Ensures type safety and data integrity for all organization configuration.
 */

import { z } from "zod";

/**
 * Branding Settings Schema
 */
export const brandingSchema = z.object({
  logo: z.string().url().optional().or(z.string().startsWith("data:image/")),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  customCSS: z.string().max(10000, "Custom CSS must be less than 10KB").optional(),
});

/**
 * Notifications Settings Schema
 */
export const notificationsSchema = z.object({
  emailEnabled: z.boolean().optional(),
  slackWebhook: z.string().url().startsWith("https://hooks.slack.com/").optional(),
  discordWebhook: z.string().url().startsWith("https://discord.com/api/webhooks/").optional(),
  digestFrequency: z.enum(["daily", "weekly", "never"]).optional(),
});

/**
 * Data Retention Settings Schema (GDPR Compliance)
 */
export const dataRetentionSchema = z.object({
  testDataDays: z.number().int().min(30, "Must retain test data for at least 30 days").max(3650, "Cannot exceed 10 years").optional(),
  auditLogDays: z.number().int().min(365, "Must retain audit logs for at least 1 year").max(3650, "Cannot exceed 10 years").optional(),
  autoDeleteEnabled: z.boolean().optional(),
});

/**
 * Feature Flags Schema
 */
export const featuresSchema = z.object({
  apiAccessEnabled: z.boolean().optional(),
  publicSharingEnabled: z.boolean().optional(),
  exportFormats: z.array(z.enum(["pdf", "png", "svg", "csv"])).optional(),
  maxTestsPerMonth: z.number().int().positive().max(100000, "Cannot exceed 100,000 tests per month").optional(),
  advancedAnalytics: z.boolean().optional(),
});

/**
 * Password Policy Schema
 */
export const passwordPolicySchema = z.object({
  minLength: z.number().int().min(8, "Minimum password length must be at least 8").max(128).optional(),
  requireSpecialChars: z.boolean().optional(),
  requireNumbers: z.boolean().optional(),
  requireUppercase: z.boolean().optional(),
});

/**
 * Security Settings Schema
 */
export const securitySchema = z.object({
  mfaRequired: z.boolean().optional(),
  allowedIPRanges: z.array(
    z.string().regex(
      /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/,
      "Must be a valid IP address or CIDR range"
    )
  ).optional(),
  sessionTimeout: z.number().int().min(5, "Session timeout must be at least 5 minutes").max(1440, "Session timeout cannot exceed 24 hours").optional(),
  passwordPolicy: passwordPolicySchema.optional(),
});

/**
 * Legacy Custom Branding Schema (for backward compatibility)
 */
export const customBrandingSchema = z.object({
  enabled: z.boolean(),
  headerText: z.string().max(255).optional(),
  footerText: z.string().max(255).optional(),
});

/**
 * Complete Organization Settings Schema
 */
export const organizationSettingsSchema = z.object({
  // Localization
  defaultLanguage: z.enum(["en", "ru"]),

  // Legacy settings (required for backward compatibility)
  allowPublicSharing: z.boolean(),
  requireApprovalForTests: z.boolean(),
  maxTestDuration: z.number().int().min(1, "Max test duration must be at least 1 hour").max(168, "Max test duration cannot exceed 1 week"),
  customBranding: customBrandingSchema,

  // Enhanced settings (optional)
  branding: brandingSchema.optional(),
  notifications: notificationsSchema.optional(),
  dataRetention: dataRetentionSchema.optional(),
  features: featuresSchema.optional(),
  security: securitySchema.optional(),
});

/**
 * Partial update schema (all fields optional except constraints)
 */
export const organizationSettingsUpdateSchema = organizationSettingsSchema.partial();

/**
 * Type exports
 */
export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>;
export type OrganizationSettingsUpdate = z.infer<typeof organizationSettingsUpdateSchema>;
export type BrandingSettings = z.infer<typeof brandingSchema>;
export type NotificationsSettings = z.infer<typeof notificationsSchema>;
export type DataRetentionSettings = z.infer<typeof dataRetentionSchema>;
export type FeaturesSettings = z.infer<typeof featuresSchema>;
export type SecuritySettings = z.infer<typeof securitySchema>;

/**
 * Default organization settings
 */
export const defaultOrganizationSettings: OrganizationSettingsInput = {
  defaultLanguage: "en",
  allowPublicSharing: false,
  requireApprovalForTests: false,
  maxTestDuration: 48,
  customBranding: {
    enabled: false,
  },
  branding: undefined,
  notifications: {
    emailEnabled: true,
    digestFrequency: "weekly",
  },
  dataRetention: {
    testDataDays: 365,
    auditLogDays: 730,
    autoDeleteEnabled: false,
  },
  features: {
    apiAccessEnabled: false,
    publicSharingEnabled: false,
    exportFormats: ["pdf", "png", "csv"],
    maxTestsPerMonth: 1000,
    advancedAnalytics: false,
  },
  security: {
    mfaRequired: false,
    sessionTimeout: 60,
    passwordPolicy: {
      minLength: 8,
      requireSpecialChars: true,
      requireNumbers: true,
      requireUppercase: true,
    },
  },
};

/**
 * Validate organization settings
 * @param settings - Settings to validate
 * @returns Validation result with typed data or errors
 */
export function validateOrganizationSettings(settings: unknown) {
  return organizationSettingsSchema.safeParse(settings);
}

/**
 * Merge partial settings with defaults
 * @param partial - Partial settings to merge
 * @returns Complete settings with defaults filled in
 */
export function mergeOrganizationSettings(
  partial: Partial<OrganizationSettingsInput>
): OrganizationSettingsInput {
  return {
    ...defaultOrganizationSettings,
    ...partial,
    // Deep merge nested objects
    customBranding: {
      ...defaultOrganizationSettings.customBranding,
      ...partial.customBranding,
    },
    branding: partial.branding ? {
      ...defaultOrganizationSettings.branding,
      ...partial.branding,
    } : undefined,
    notifications: {
      ...defaultOrganizationSettings.notifications,
      ...partial.notifications,
    },
    dataRetention: {
      ...defaultOrganizationSettings.dataRetention,
      ...partial.dataRetention,
    },
    features: {
      ...defaultOrganizationSettings.features,
      ...partial.features,
    },
    security: {
      ...defaultOrganizationSettings.security,
      ...partial.security,
      passwordPolicy: {
        ...defaultOrganizationSettings.security?.passwordPolicy,
        ...partial.security?.passwordPolicy,
      },
    },
  };
}
