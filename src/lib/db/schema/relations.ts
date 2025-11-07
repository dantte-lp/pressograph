/**
 * Drizzle ORM Relations
 *
 * Defines relationships between tables for:
 * - Type-safe joins
 * - Eager/lazy loading
 * - Cascade operations
 *
 * @see https://orm.drizzle.team/docs/rqb#select-from-relations
 */

import { relations } from "drizzle-orm";
import { users } from "./users";
import { organizations } from "./organizations";
import { projects } from "./projects";
import { pressureTests } from "./pressure-tests";
import { fileUploads } from "./file-uploads";
import { shareLinks } from "./share-links";
import { auditLogs } from "./audit-logs";
import { apiKeys } from "./api-keys";
import { notifications } from "./notifications";
import { userPreferences } from "./user-preferences";

/**
 * Organization Relations
 */
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  projects: many(projects),
  pressureTests: many(pressureTests),
  auditLogs: many(auditLogs),
  apiKeys: many(apiKeys),
}));

/**
 * User Relations
 */
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  ownedProjects: many(projects, { relationName: "project_owner" }),
  createdTests: many(pressureTests, { relationName: "test_creator" }),
  uploadedFiles: many(fileUploads, { relationName: "file_uploader" }),
  createdShareLinks: many(shareLinks),
  performedAudits: many(auditLogs, { relationName: "audit_performer" }),
  createdApiKeys: many(apiKeys, { relationName: "api_key_creator" }),
  notifications: many(notifications),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
}));

/**
 * Project Relations
 */
export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
    relationName: "project_owner",
  }),
  pressureTests: many(pressureTests),
}));

/**
 * Pressure Test Relations
 */
export const pressureTestsRelations = relations(pressureTests, ({ one, many }) => ({
  project: one(projects, {
    fields: [pressureTests.projectId],
    references: [projects.id],
  }),
  organization: one(organizations, {
    fields: [pressureTests.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [pressureTests.createdBy],
    references: [users.id],
    relationName: "test_creator",
  }),
  shareLinks: many(shareLinks),
}));

/**
 * File Upload Relations
 */
export const fileUploadsRelations = relations(fileUploads, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [fileUploads.uploadedBy],
    references: [users.id],
    relationName: "file_uploader",
  }),
}));

/**
 * Audit Log Relations
 */
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
    relationName: "audit_performer",
  }),
}));

/**
 * API Key Relations
 */
export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
    relationName: "api_key_owner",
  }),
}));

/**
 * Notification Relations
 */
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

/**
 * User Preferences Relations
 */
export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

/**
 * Share Link Relations
 */
export const shareLinksRelations = relations(shareLinks, ({ one }) => ({
  pressureTest: one(pressureTests, {
    fields: [shareLinks.pressureTestId],
    references: [pressureTests.id],
  }),
  createdBy: one(users, {
    fields: [shareLinks.createdBy],
    references: [users.id],
  }),
}));
