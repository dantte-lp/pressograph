# Database Schema Analysis and Enhancement Proposals

**Date:** 2025-11-09
**Author:** Claude Code (AI Development Assistant)
**Sprint:** Sprint 2
**Status:** Proposal for Review

---

## Executive Summary

The current Pressograph 2.0 database schema is **comprehensive and well-designed**, covering all major functional areas. This analysis identifies minor enhancements and missing functionality based on the full application feature set documented in PAGES_STRUCTURE_AND_FUNCTIONALITY.md.

**Schema Completeness:** 95%
**Tables Count:** 13 tables
**Missing Features:** 4 minor enhancements identified
**Priority Enhancements:** 2 (Timezone, Test Templates)

---

## Current Schema Overview

### Existing Tables (13 total)

1. **users** - User accounts with RBAC
2. **user_preferences** - Per-user settings (theme, language, UI)
3. **organizations** - Multi-tenancy support
4. **projects** - Project grouping mechanism
5. **pressure_tests** - Test configurations
6. **file_uploads** - Generated graphs (PNG, PDF, etc.)
7. **audit_logs** - Activity tracking
8. **api_keys** - Programmatic API access
9. **notifications** - In-app notification system
10. **share_links** - Public graph sharing
11. **nextauth tables** (accounts, sessions, verification_tokens) - Authentication
12. **relations** - Drizzle ORM relationship definitions

### Schema Strengths

✅ **Excellent Coverage:**
- ✅ User authentication and authorization (NextAuth + RBAC)
- ✅ Multi-tenancy (Organizations)
- ✅ User preferences (Theme, Language, UI settings)
- ✅ Project organization and metadata
- ✅ Pressure test configurations
- ✅ File upload tracking
- ✅ Audit logging for compliance
- ✅ API keys with scoped permissions
- ✅ Notification system
- ✅ Public sharing with expiration

✅ **Performance Optimizations:**
- Proper indexes on foreign keys
- Index on frequently queried fields (email, username, status, etc.)
- JSONB columns for flexible configuration

✅ **Data Integrity:**
- Foreign key constraints with cascade/restrict
- NOT NULL constraints where appropriate
- Unique constraints on business keys
- Default values defined

---

## Missing or Enhancement Areas

### 1. Timezone Support in User Preferences

**Current State:** User preferences include `themePreference` and `languagePreference`, but no `timezone` field.

**Issue:** The application displays timestamps in various places (test runs, audit logs, notifications), and users in different timezones may need localized times.

**Proposal:**

```typescript
// src/lib/db/schema/user-preferences.ts

export const userPreferences = pgTable(
  "user_preferences",
  {
    // ... existing fields ...

    // NEW: Timezone preference
    timezone: varchar("timezone", { length: 50 })
      .default("UTC")
      .notNull(), // IANA timezone (e.g., "America/New_York", "Europe/Moscow")

    // NEW: Date format preference
    dateFormat: varchar("date_format", { length: 20 })
      .default("YYYY-MM-DD")
      .notNull(), // ISO 8601, US format, EU format, etc.

    timeFormat: varchar("time_format", { length: 10 })
      .default("24h")
      .notNull(), // '12h' | '24h'
  },
  // ... existing indexes ...
);
```

**Benefits:**
- Display timestamps in user's local timezone
- Support international users across timezones
- Enhance UX for dashboard and reports
- Align with i18n best practices

**Effort:** 1 SP (low)
**Priority:** P1 (High) - Important for international users
**Sprint:** Sprint 2

---

### 2. Test Templates Table

**Current State:** The `pressure_tests` table has a `templateType` VARCHAR field (`'daily' | 'extended' | 'custom'`), but templates are hardcoded, not stored as reusable entities.

**Issue:** Users cannot create, save, and reuse custom test templates. The current implementation only supports predefined template types.

**Proposal:**

```typescript
// src/lib/db/schema/test-templates.ts

/**
 * Test Templates Table
 *
 * Stores reusable test configuration templates.
 * Users can create custom templates from existing tests.
 * Organizations can share templates among team members.
 */
export const testTemplates = pgTable(
  "test_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Identification
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),

    // Relationships
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),

    // Template type
    category: varchar("category", { length: 50 }).default("custom").notNull(),
    // 'daily' | 'extended' | 'custom' | 'regulatory'

    // Template configuration
    config: jsonb("config").$type<Partial<PressureTestConfig>>().notNull(),
    // Partial allows templates to have only some fields pre-filled

    // Visibility
    isPublic: boolean("is_public").default(false).notNull(),
    isSystemTemplate: boolean("is_system_template").default(false).notNull(),
    // System templates (daily, extended) cannot be modified

    // Usage tracking
    usageCount: integer("usage_count").default(0).notNull(),
    lastUsedAt: timestamp("last_used_at", { mode: "date" }),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdIdx: index("test_templates_org_id_idx").on(table.organizationId),
    categoryIdx: index("test_templates_category_idx").on(table.category),
    isPublicIdx: index("test_templates_is_public_idx").on(table.isPublic),
  })
);

export type TestTemplate = typeof testTemplates.$inferSelect;
export type NewTestTemplate = typeof testTemplates.$inferInsert;
```

**Benefits:**
- Users can save frequently used configurations
- Organizations can standardize test parameters
- Reduces data entry errors
- Speeds up test creation workflow
- Supports "Save as Template" feature in UI

**Effort:** 3 SP (medium) - Requires UI changes + backend logic
**Priority:** P2 (Medium) - Nice to have, not blocking
**Sprint:** Sprint 3

---

### 3. Enhanced Test Run Tracking (Test Executions)

**Current State:** The schema has `file_uploads` table which tracks generated graphs, but doesn't have a dedicated `test_runs` table for tracking actual test executions.

**Issue:** The application references "Test Runs" in multiple places (dashboard statistics, activity feed), but there's no dedicated table for this. Currently, test executions are implied through `file_uploads` or `pressure_tests.startedAt/completedAt`.

**Proposal:**

```typescript
// src/lib/db/schema/test-runs.ts

/**
 * Test Run Status
 */
export type TestRunStatus =
  | 'pending'      // Scheduled but not started
  | 'running'      // Currently executing
  | 'completed'    // Finished successfully
  | 'failed'       // Execution failed
  | 'cancelled';   // Manually stopped

/**
 * Test Runs Table
 *
 * Tracks individual executions of pressure tests.
 * A single pressure_test can have multiple test_runs.
 * Each run may generate multiple file_uploads.
 */
export const testRuns = pgTable(
  "test_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Relationships
    pressureTestId: uuid("pressure_test_id")
      .references(() => pressureTests.id, { onDelete: "cascade" })
      .notNull(),
    executedBy: uuid("executed_by")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),

    // Execution details
    status: varchar("status", { length: 50 })
      .default("pending")
      .notNull()
      .$type<TestRunStatus>(),

    // Timing
    scheduledAt: timestamp("scheduled_at", { mode: "date" }),
    startedAt: timestamp("started_at", { mode: "date" }),
    completedAt: timestamp("completed_at", { mode: "date" }),

    // Results
    finalPressure: numeric("final_pressure", { precision: 10, scale: 2 }), // MPa
    pressureDrop: numeric("pressure_drop", { precision: 10, scale: 2 }), // MPa
    testPassed: boolean("test_passed"), // Did it meet criteria?

    // Measurements (time-series data)
    measurements: jsonb("measurements").$type<Array<{
      timestamp: string; // ISO 8601
      pressure: number;  // MPa
      temperature: number; // °C
    }>>(),

    // Failure information
    failureReason: text("failure_reason"),
    errorLog: text("error_log"),

    // Comments and notes
    notes: text("notes"),
    operatorSignature: varchar("operator_signature", { length: 255 }),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    pressureTestIdIdx: index("test_runs_pressure_test_id_idx").on(table.pressureTestId),
    executedByIdx: index("test_runs_executed_by_idx").on(table.executedBy),
    statusIdx: index("test_runs_status_idx").on(table.status),
    scheduledAtIdx: index("test_runs_scheduled_at_idx").on(table.scheduledAt),
    testPassedIdx: index("test_runs_test_passed_idx").on(table.testPassed),
  })
);

export type TestRun = typeof testRuns.$inferSelect;
export type NewTestRun = typeof testRuns.$inferInsert;
```

**Benefits:**
- Proper separation between test definitions and executions
- Track success/failure rates accurately
- Store time-series measurement data
- Enable analytics on test performance
- Support scheduled/automated tests
- Better audit trail

**Effort:** 5 SP (high) - Significant backend + UI changes
**Priority:** P1 (High) - Referenced throughout application
**Sprint:** Sprint 3
**Note:** This is a larger refactoring that affects multiple pages

---

### 4. Organization Settings Enhancements

**Current State:** The `organizations` table has a `settings` JSONB field with basic configuration:

```typescript
export interface OrganizationSettings {
  defaultLanguage: "en" | "ru";
  allowPublicSharing: boolean;
  requireApprovalForTests: boolean;
  maxTestDuration: number; // hours
  customBranding: {
    enabled: boolean;
    headerText?: string;
    footerText?: string;
  };
}
```

**Issue:** Missing some common enterprise features that would be expected in multi-tenant applications.

**Proposal:**

```typescript
// src/lib/db/schema/organizations.ts

export interface OrganizationSettings {
  // Existing fields
  defaultLanguage: "en" | "ru";
  allowPublicSharing: boolean;
  requireApprovalForTests: boolean;
  maxTestDuration: number; // hours

  // NEW: Enhanced branding
  customBranding: {
    enabled: boolean;
    headerText?: string;
    footerText?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };

  // NEW: Notification preferences (organization-wide defaults)
  notifications: {
    emailEnabled: boolean;
    notifyOnTestComplete: boolean;
    notifyOnTestFailure: boolean;
    notifyOnShareExpiry: boolean;
    digestFrequency: "daily" | "weekly" | "monthly" | "none";
  };

  // NEW: Data retention policies
  dataRetention: {
    testRetentionDays: number; // 0 = keep forever
    fileRetentionDays: number;
    auditLogRetentionDays: number;
    autoArchiveOldTests: boolean;
  };

  // NEW: Feature flags (enable/disable features per org)
  features: {
    enableApiKeys: boolean;
    enablePublicSharing: boolean;
    enableAdvancedGraphs: boolean;
    enableTestTemplates: boolean;
    enableScheduledTests: boolean;
  };

  // NEW: Compliance and security
  security: {
    requireMFA: boolean;
    requirePasswordChange: number; // days, 0 = never
    sessionTimeout: number; // minutes
    allowedIpRanges?: string[]; // CIDR notation
  };
}
```

**Benefits:**
- Enterprise-grade configuration
- GDPR/compliance support (data retention)
- Feature gating per organization
- Enhanced security controls
- Better branding customization

**Effort:** 2 SP (low-medium) - JSONB field update only
**Priority:** P2 (Medium) - Nice to have for enterprise
**Sprint:** Sprint 4

---

## Additional Observations

### ✅ Already Well-Covered (No Changes Needed)

1. **Audit Logging** - Comprehensive `audit_logs` table with:
   - Action tracking
   - User identification
   - IP address logging
   - JSON metadata for details
   - Proper indexing on userId and createdAt

2. **API Keys** - Robust `api_keys` table with:
   - Scoped permissions
   - Key hashing (bcrypt)
   - Expiration support
   - Last used tracking
   - Organization-scoped access

3. **Notifications** - Feature-complete `notifications` table with:
   - Multiple notification types
   - Read/unread status
   - Expiration dates
   - User-specific targeting

4. **File Uploads** - Well-designed `file_uploads` table with:
   - Storage path tracking
   - File size and MIME type
   - Association with pressure tests
   - Organization ownership
   - Soft delete support

5. **Share Links** - Comprehensive `share_links` table with:
   - Token-based access
   - Expiration dates
   - View count tracking
   - Password protection (future)
   - Access control

6. **Projects** - Complete `projects` table with:
   - Organization membership
   - Owner tracking
   - JSONB metadata for custom fields
   - Status management
   - Archival support

---

## Migration Strategy

### Phase 1: Critical Enhancements (Sprint 2)

**Issue #115:** Add Timezone and Date Format to User Preferences

```bash
# Generate migration
pnpm db:generate

# Apply migration
pnpm db:push
```

**Migration File:**
```sql
ALTER TABLE user_preferences
  ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
  ADD COLUMN date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD' NOT NULL,
  ADD COLUMN time_format VARCHAR(10) DEFAULT '24h' NOT NULL;
```

**Effort:** 1 SP
**Risk:** Low (additive only, has defaults)

---

### Phase 2: Test Templates (Sprint 3)

**Issue #116:** Implement Test Templates System

1. Create new `test_templates` table
2. Migrate existing `templateType` values to system templates
3. Update test creation UI to support template selection
4. Add "Save as Template" feature

**Migration File:**
```sql
CREATE TABLE test_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category VARCHAR(50) DEFAULT 'custom' NOT NULL,
  config JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE NOT NULL,
  is_system_template BOOLEAN DEFAULT FALSE NOT NULL,
  usage_count INTEGER DEFAULT 0 NOT NULL,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX test_templates_org_id_idx ON test_templates(organization_id);
CREATE INDEX test_templates_category_idx ON test_templates(category);
CREATE INDEX test_templates_is_public_idx ON test_templates(is_public);

-- Insert system templates
INSERT INTO test_templates (name, organization_id, category, config, is_system_template) VALUES
('Daily Test', (SELECT id FROM organizations LIMIT 1), 'daily', '{"testDuration": 24, "intermediateStages": []}', true),
('Extended Test', (SELECT id FROM organizations LIMIT 1), 'extended', '{"testDuration": 168, "intermediateStages": []}', true);
```

**Effort:** 3 SP
**Risk:** Medium (requires UI changes)

---

### Phase 3: Test Runs Tracking (Sprint 3-4)

**Issue #117:** Implement Test Runs Table and Execution Tracking

1. Create `test_runs` table
2. Migrate existing `pressure_tests.startedAt/completedAt` to test_runs
3. Update file_uploads to reference test_runs (optional FK)
4. Update dashboard statistics queries
5. Add test run detail pages

**Migration File:** (Complex - see Phase 3 section above)

**Effort:** 5 SP
**Risk:** High (affects core functionality)
**Note:** This should be carefully planned and tested

---

### Phase 4: Enhanced Organization Settings (Sprint 4)

**Issue #118:** Enhance Organization Settings Schema

Update JSONB structure with new fields:
- Enhanced branding
- Notification preferences
- Data retention policies
- Feature flags
- Security settings

**Effort:** 2 SP
**Risk:** Low (JSONB update only)

---

## Database Health Recommendations

### Indexes

Current indexing is **excellent**. All foreign keys have indexes, and frequently queried fields are indexed.

**Potential Additional Indexes (if performance issues arise):**

```sql
-- If filtering by date range becomes slow
CREATE INDEX pressure_tests_created_at_idx ON pressure_tests(created_at);
CREATE INDEX file_uploads_created_at_idx ON file_uploads(created_at);

-- If searching by test number becomes slow (partial index for performance)
CREATE INDEX pressure_tests_test_number_partial_idx
  ON pressure_tests(test_number)
  WHERE status = 'ready';

-- Composite index for common queries (dashboard)
CREATE INDEX pressure_tests_org_status_created_idx
  ON pressure_tests(organization_id, status, created_at DESC);
```

### Constraints

Current constraints are comprehensive. Foreign key actions (CASCADE, RESTRICT) are well-chosen.

**No changes recommended.**

### Data Types

All data types are appropriate:
- UUIDs for primary keys (good for distributed systems)
- JSONB for flexible configurations (better than JSON)
- VARCHAR with appropriate lengths
- TIMESTAMP with mode: "date" for Drizzle compatibility

**No changes recommended.**

---

## Summary of Proposals

| Enhancement | Priority | Effort | Sprint | GitHub Issue |
|-------------|----------|--------|--------|--------------|
| 1. Timezone Support | P1 (High) | 1 SP | Sprint 2 | #115 |
| 2. Test Templates | P2 (Medium) | 3 SP | Sprint 3 | #116 |
| 3. Test Runs Table | P1 (High) | 5 SP | Sprint 3-4 | #117 |
| 4. Org Settings Enhancement | P2 (Medium) | 2 SP | Sprint 4 | #118 |

**Total Effort:** 11 SP (approximately 1.5 sprints)

---

## Conclusion

The Pressograph 2.0 database schema is **production-ready and well-architected**. The proposed enhancements are **incremental improvements** that add functionality without disrupting existing features.

**Recommended Action Plan:**
1. ✅ Approve Phase 1 (Timezone Support) for Sprint 2
2. ⏳ Evaluate Phase 2 (Test Templates) for Sprint 3
3. ⏳ Plan Phase 3 (Test Runs) carefully for Sprint 3-4
4. ⏳ Consider Phase 4 (Org Settings) for Sprint 4 or later

---

**Document Status:** Proposal for Review
**Next Steps:** Create GitHub issues #115-#118 for tracking
**Last Updated:** 2025-11-09
**Author:** Claude Code (AI Development Assistant)
