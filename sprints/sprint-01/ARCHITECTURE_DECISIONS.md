# Pressograph 2.0 - Architecture Decision Record

**Date:** 2025-11-03
**Sprint:** 01
**Status:** In Progress

## Executive Summary

This document outlines the complete architectural redesign of Pressograph 2.0, leveraging the full capabilities of our modern stack (Next.js 16, React 19, PostgreSQL 18, Valkey, Drizzle ORM) and following best practices from the UI/UX requirements documents.

**Key Philosophy:** This is NOT a 1:1 migration. We're rethinking everything from the ground up.

---

## UI/UX Requirements Analysis

### From Technical Documents

**Document 1: Migration & UI/UX Overhaul Plan**
- **Guided Workflow:** 4-step process (Select Template → Set Parameters → Add Stages → Export/View)
- **Progressive Disclosure:** Hide complexity until needed, "Advanced Mode" toggles
- **Graph Visualization:** Theme-aware, high-contrast, WCAG AA compliant
- **Touch-Friendly Design:** Large buttons, adequate spacing for tablets/gloves
- **Bilingual Support:** Full Russian/English support
- **SSR Strategy:** Login page, shareable reports (rest client-rendered for interactive features)

**Document 2: Technical Upgrade Manifesto**
- **Color Scheme:** Industrial blue/steel gray primary, dark gray (#1E1E2E) for dark mode
- **Typography:** Inter font (already implemented), weights 300-700, 14px base
- **Accessibility:** WCAG AA contrast standards, keyboard navigation, screen reader support
- **Status Colors:** Red (error/danger), Green (success), Orange (warning), Gray (neutral)
- **Consistency:** Uniform component patterns, predictable interactions

**Critical Design Tokens Extracted:**

```css
/* Industrial Color Palette */
Primary: Deep Blue (#2563EB or similar) - trust, technology
Secondary: Steel Gray (#64748B) - industrial, professional
Success: Green (#17C964) - normal operation
Warning: Orange (#F5A524) - attention needed
Danger: Red (#F31260) - error, critical
Background Light: White (#FFFFFF) or very light gray (#F9FAFB)
Background Dark: Dark Gray (#1E1E2E) not pure black
Text Light Theme: Near Black (#0F172A)
Text Dark Theme: Near White (#F1F5F9)

/* Typography Scale */
Base: 14px (body text)
Small: 12px (helper text)
Large: 16px (section headers)
XL: 20px (page titles)
Weights: 300 (light), 400 (normal), 600 (semibold), 700 (bold)

/* Spacing */
Touch Targets: Minimum 44px height (iOS guidelines)
Button Padding: px-6 py-3 (24px horizontal, 12px vertical)
Card Padding: p-6 (24px all sides)
Section Gaps: gap-6 (24px between sections)

/* Contrast Requirements */
WCAG AA: 4.5:1 for normal text, 3:1 for large text
High Contrast Mode: Support for users with vision impairments
```

---

## 1. Theme Management Architecture (Complete Redesign)

### Problem Statement

The old site uses `localStorage` for theme persistence, which has several issues:
- Flash of Unstyled Content (FOUC) on page load
- No cross-device synchronization for logged-in users
- Not SSR-friendly
- Can't be cached efficiently

### Solution: Three-Tier Theme System

```typescript
/**
 * Theme Management Strategy
 *
 * Tier 1: Cookie (Immediate SSR)
 *   - Read on server, inject into HTML before hydration
 *   - Eliminates FOUC completely
 *   - Expires: 1 year
 *   - Path: /
 *
 * Tier 2: Database (Persistent, Synced)
 *   - user_preferences.theme_preference
 *   - Syncs across all user devices
 *   - Updated on theme toggle
 *
 * Tier 3: Valkey Cache (Performance)
 *   - Cache user preferences for fast access
 *   - TTL: 1 hour (configurable)
 *   - Key: user_preferences:{userId}
 *
 * Flow:
 * 1. User toggles theme → Cookie updated (immediate effect)
 * 2. Server Action triggered → Database updated
 * 3. Valkey cache invalidated and refreshed
 * 4. Next request uses cached preference
 */

// Implementation files needed:
// - src/lib/theme/theme-manager.ts (new)
// - src/lib/theme/theme-cookie.ts (new)
// - src/lib/theme/theme-server-actions.ts (new)
// - src/lib/db/schema/user-preferences.ts (new)
// - src/middleware.ts (enhance for theme injection)
```

**Database Schema Addition:**

```typescript
// src/lib/db/schema/user-preferences.ts
export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),

  // Theme preferences
  themePreference: varchar("theme_preference", { length: 20 }).default("system").notNull(), // 'light' | 'dark' | 'system'

  // Language preferences
  languagePreference: varchar("language_preference", { length: 5 }).default("en").notNull(), // 'en' | 'ru'

  // UI preferences
  sidebarCollapsed: boolean("sidebar_collapsed").default(false),
  graphDefaultFormat: varchar("graph_default_format", { length: 20 }).default("PNG").notNull(),
  graphDefaultResolution: integer("graph_default_resolution").default(2).notNull(), // scale factor

  // Notification preferences
  emailNotifications: boolean("email_notifications").default(true),
  inAppNotifications: boolean("in_app_notifications").default(true),

  // Timestamps
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_preferences_user_id_idx").on(table.userId),
}));
```

**Valkey Cache Strategy:**

```typescript
// src/lib/cache/strategies.ts (enhance)

/**
 * Cache user preferences in Valkey
 * TTL: 1 hour (3600 seconds)
 * Invalidation: On preference update
 */
export async function cacheUserPreferences(
  userId: string,
  preferences: UserPreferences
): Promise<void> {
  const client = getValkeyClient();
  const key = `user_preferences:${userId}`;
  await client.setex(key, 3600, JSON.stringify(preferences));
}

export async function getCachedUserPreferences(
  userId: string
): Promise<UserPreferences | null> {
  const client = getValkeyClient();
  const key = `user_preferences:${userId}`;
  const cached = await client.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function invalidateUserPreferences(userId: string): Promise<void> {
  const client = getValkeyClient();
  const key = `user_preferences:${userId}`;
  await client.del(key);
}
```

**Next.js Middleware Enhancement:**

```typescript
// src/middleware.ts (new or enhance)
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get theme from cookie or default to 'system'
  const themeCookie = request.cookies.get('theme')?.value || 'system';

  // If user is authenticated, sync with database preference
  const token = await getToken({ req: request });
  if (token?.sub) {
    // Check Valkey cache first, then DB
    // Update cookie if DB preference differs
    // (Implementation details)
  }

  // Set theme in response header for SSR
  response.headers.set('x-theme', themeCookie);

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Benefits of This Approach:**

1. Zero FOUC - Theme is available before first paint
2. Cross-device sync for logged-in users
3. Fast access via Valkey cache
4. Falls back gracefully (cookie → cache → DB → default)
5. SSR-friendly
6. Respects system preferences

**Migration Plan:**
1. Remove `next-themes` dependency reliance on localStorage
2. Implement cookie-based theme with server components
3. Add database schema and migrations
4. Implement Valkey caching layer
5. Update ThemeProvider to use new system
6. Test across devices and browsers

---

## 2. Database Schema Design (Complete)

### Core Entities

```typescript
// src/lib/db/schema/index.ts

/**
 * Complete Database Schema for Pressograph 2.0
 *
 * Entities:
 * - users (existing, enhance)
 * - user_preferences (new)
 * - organizations (new - multi-tenancy future)
 * - projects (new - group related tests)
 * - pressure_tests (new - main entity)
 * - test_runs (new - individual executions)
 * - test_stages (new - intermediate pressure stages)
 * - test_results (new - results data, JSONB)
 * - file_uploads (new - graph images, PDFs)
 * - audit_logs (new - compliance tracking)
 * - api_keys (new - programmatic access)
 * - notifications (new - user alerts)
 *
 * NextAuth Tables:
 * - accounts (OAuth)
 * - sessions (session management)
 * - verification_tokens (email verification)
 */

// Users (enhance existing)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: varchar("image", { length: 512 }),

  // New fields
  role: varchar("role", { length: 50 }).default("user").notNull(), // 'admin' | 'manager' | 'user' | 'viewer'
  organizationId: uuid("organization_id").references(() => organizations.id),
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at", { mode: "date" }),

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  orgIdIdx: index("users_org_id_idx").on(table.organizationId),
  roleIdx: index("users_role_idx").on(table.role),
}));

// Organizations (multi-tenancy)
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),

  // Branding
  logoUrl: varchar("logo_url", { length: 512 }),
  primaryColor: varchar("primary_color", { length: 7 }).default("#2563EB"), // hex color

  // Settings
  settings: jsonb("settings").$type<OrganizationSettings>().default({}),

  // Subscription
  planType: varchar("plan_type", { length: 50 }).default("free").notNull(),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("active"),
  subscriptionEndsAt: timestamp("subscription_ends_at", { mode: "date" }),

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("organizations_slug_idx").on(table.slug),
}));

// Projects (group related tests)
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Relationships
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  ownerId: uuid("owner_id").references(() => users.id).notNull(),

  // Settings
  isArchived: boolean("is_archived").default(false).notNull(),
  settings: jsonb("settings").$type<ProjectSettings>().default({}),

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => ({
  orgIdIdx: index("projects_org_id_idx").on(table.organizationId),
  ownerIdIdx: index("projects_owner_id_idx").on(table.ownerId),
}));

// Pressure Tests (main entity)
export const pressureTests = pgTable("pressure_tests", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Identification
  testNumber: varchar("test_number", { length: 100 }).notNull(), // e.g., "PT-2025-001"
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Relationships
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),

  // Template
  templateType: varchar("template_type", { length: 50 }), // 'daily' | 'extended' | 'custom'

  // Test Configuration (JSONB for flexibility)
  config: jsonb("config").$type<PressureTestConfig>().notNull(),
  /* config structure:
   * {
   *   workingPressure: number; // MPa
   *   maxPressure: number; // MPa
   *   testDuration: number; // hours
   *   temperature: number; // °C
   *   allowablePressureDrop: number; // MPa
   *   intermediateStages: Array<{
   *     time: number; // minutes from start
   *     pressure: number; // MPa
   *     duration: number; // minutes
   *   }>;
   * }
   */

  // Status
  status: varchar("status", { length: 50 }).default("draft").notNull(),
  // 'draft' | 'ready' | 'running' | 'completed' | 'failed' | 'cancelled'

  // Execution tracking
  startedAt: timestamp("started_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),

  // Sharing
  isPublic: boolean("is_public").default(false).notNull(),
  shareToken: varchar("share_token", { length: 64 }).unique(), // for /share/[token] route
  shareExpiresAt: timestamp("share_expires_at", { mode: "date" }),

  // Metadata
  tags: jsonb("tags").$type<string[]>().default([]),

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("pressure_tests_project_id_idx").on(table.projectId),
  createdByIdx: index("pressure_tests_created_by_idx").on(table.createdBy),
  statusIdx: index("pressure_tests_status_idx").on(table.status),
  testNumberIdx: uniqueIndex("pressure_tests_test_number_idx").on(table.testNumber, table.organizationId),
  shareTokenIdx: uniqueIndex("pressure_tests_share_token_idx").on(table.shareToken),
}));

// Test Runs (individual executions with results)
export const testRuns = pgTable("test_runs", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Relationships
  pressureTestId: uuid("pressure_test_id").references(() => pressureTests.id).notNull(),
  executedBy: uuid("executed_by").references(() => users.id).notNull(),

  // Results Data (JSONB for flexibility)
  results: jsonb("results").$type<TestRunResults>().notNull(),
  /* results structure:
   * {
   *   measurements: Array<{
   *     timestamp: number; // epoch ms
   *     pressure: number; // MPa
   *     temperature: number; // °C
   *   }>;
   *   finalPressure: number;
   *   pressureDrop: number;
   *   passed: boolean;
   *   notes: string;
   * }
   */

  // Status
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  // 'pending' | 'running' | 'completed' | 'failed'

  // Execution times
  startedAt: timestamp("started_at", { mode: "date" }).notNull(),
  completedAt: timestamp("completed_at", { mode: "date" }),
  duration: integer("duration"), // seconds

  // Quality
  passed: boolean("passed"),
  failureReason: text("failure_reason"),

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => ({
  testIdIdx: index("test_runs_test_id_idx").on(table.pressureTestId),
  executedByIdx: index("test_runs_executed_by_idx").on(table.executedBy),
  statusIdx: index("test_runs_status_idx").on(table.status),
}));

// File Uploads (graph images, PDFs, CSVs)
export const fileUploads = pgTable("file_uploads", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Relationships
  pressureTestId: uuid("pressure_test_id").references(() => pressureTests.id),
  testRunId: uuid("test_run_id").references(() => testRuns.id),
  uploadedBy: uuid("uploaded_by").references(() => users.id).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),

  // File metadata
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // 'image/png' | 'application/pdf' | 'text/csv'
  fileSize: integer("file_size").notNull(), // bytes

  // Storage
  storageKey: varchar("storage_key", { length: 512 }).notNull().unique(), // S3 key or file path
  storageProvider: varchar("storage_provider", { length: 50 }).default("local").notNull(),

  // Access
  isPublic: boolean("is_public").default(false).notNull(),
  accessToken: varchar("access_token", { length: 64 }).unique(),

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => ({
  testIdIdx: index("file_uploads_test_id_idx").on(table.pressureTestId),
  runIdIdx: index("file_uploads_run_id_idx").on(table.testRunId),
  storageKeyIdx: uniqueIndex("file_uploads_storage_key_idx").on(table.storageKey),
}));

// Audit Logs (compliance, security)
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Actor
  userId: uuid("user_id").references(() => users.id),
  userEmail: varchar("user_email", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 45 }), // IPv6 support
  userAgent: text("user_agent"),

  // Action
  action: varchar("action", { length: 100 }).notNull(), // 'user.login' | 'test.create' | 'test.delete' | etc.
  resource: varchar("resource", { length: 100 }).notNull(), // 'user' | 'pressure_test' | 'project' | etc.
  resourceId: uuid("resource_id"),

  // Details
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),

  // Result
  status: varchar("status", { length: 20 }).default("success").notNull(), // 'success' | 'failure'
  errorMessage: text("error_message"),

  timestamp: timestamp("timestamp", { mode: "date" }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  resourceIdx: index("audit_logs_resource_idx").on(table.resource, table.resourceId),
  timestampIdx: index("audit_logs_timestamp_idx").on(table.timestamp),
}));

// API Keys (programmatic access)
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Relationships
  userId: uuid("user_id").references(() => users.id).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),

  // Key details
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("key_hash", { length: 128 }).notNull().unique(), // bcrypt hash
  keyPrefix: varchar("key_prefix", { length: 16 }).notNull(), // for identification (e.g., 'pg_test_')

  // Permissions
  scopes: jsonb("scopes").$type<string[]>().default([]), // ['read:tests', 'write:tests', 'admin']

  // Status
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  lastUsedAt: timestamp("last_used_at", { mode: "date" }),

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("api_keys_user_id_idx").on(table.userId),
  keyHashIdx: uniqueIndex("api_keys_key_hash_idx").on(table.keyHash),
  keyPrefixIdx: index("api_keys_key_prefix_idx").on(table.keyPrefix),
}));

// Notifications (user alerts)
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Recipient
  userId: uuid("user_id").references(() => users.id).notNull(),

  // Content
  type: varchar("type", { length: 50 }).notNull(), // 'test_completed' | 'test_failed' | 'share_expired' | etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),

  // Links
  actionUrl: varchar("action_url", { length: 512 }),
  actionLabel: varchar("action_label", { length: 100 }),

  // Status
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at", { mode: "date" }),

  // Related resources
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: uuid("resource_id"),

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("notifications_user_id_idx").on(table.userId),
  isReadIdx: index("notifications_is_read_idx").on(table.userId, table.isRead),
  createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
}));

// NextAuth Tables
export const accounts = pgTable("accounts", {
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  id_token: text("id_token"),
  session_state: varchar("session_state", { length: 255 }),
}, (table) => ({
  compoundKey: primaryKey({ columns: [table.provider, table.providerAccountId] }),
}));

export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).notNull().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
}, (table) => ({
  userIdIdx: index("sessions_user_id_idx").on(table.userId),
}));

export const verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
}, (table) => ({
  compoundKey: primaryKey({ columns: [table.identifier, table.token] }),
}));
```

**TypeScript Type Definitions:**

```typescript
// src/types/database.ts

export interface PressureTestConfig {
  workingPressure: number; // MPa
  maxPressure: number; // MPa
  testDuration: number; // hours
  temperature: number; // °C
  allowablePressureDrop: number; // MPa
  intermediateStages: Array<{
    time: number; // minutes from start
    pressure: number; // MPa
    duration: number; // minutes
  }>;
  // Additional fields from UI/UX docs
  pressureUnit: 'MPa' | 'Bar' | 'PSI';
  temperatureUnit: 'C' | 'F';
  notes?: string;
}

export interface TestRunResults {
  measurements: Array<{
    timestamp: number; // epoch ms
    pressure: number; // MPa
    temperature: number; // °C
  }>;
  finalPressure: number;
  pressureDrop: number;
  passed: boolean;
  notes: string;
  // Calculated fields
  averagePressure?: number;
  minPressure?: number;
  maxPressure?: number;
  stabilizationTime?: number; // minutes
}

export interface OrganizationSettings {
  defaultLanguage: 'en' | 'ru';
  allowPublicSharing: boolean;
  requireApprovalForTests: boolean;
  maxTestDuration: number; // hours
  customBranding: {
    enabled: boolean;
    headerText?: string;
    footerText?: string;
  };
}

export interface ProjectSettings {
  autoNumberTests: boolean;
  testNumberPrefix: string;
  requireNotes: boolean;
  defaultTemplateType: string;
}
```

**Migration Strategy:**

```bash
# Generate migration
pnpm db:generate

# Review migration SQL
cat drizzle/[timestamp]_complete_schema.sql

# Apply migration
pnpm db:migrate

# Seed initial data (if needed)
tsx src/scripts/seed-initial-data.ts
```

---

## 3. State Management Strategy

### Analysis of Current Needs

**Server State vs Client State:**
- Server State: User data, test data, projects, organizations (from DB)
- Client State: UI state, form state, modals, temporary selections

**Current Setup:**
- Zustand for client state
- No server state management (fetch directly)

**Recommendation: Zustand + TanStack Query**

### TanStack Query Integration

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

**Why TanStack Query:**
1. **Automatic Background Refetching** - Keep data fresh
2. **Request Deduplication** - Multiple components requesting same data = single request
3. **Caching** - Reduce server load
4. **Optimistic Updates** - Instant UI feedback
5. **Pagination/Infinite Scroll** - Built-in support
6. **Mutations with Rollback** - Error handling
7. **DevTools** - Debugging queries/mutations
8. **SSR Hydration** - Pre-fetch on server

**Setup:**

```typescript
// src/lib/query/query-client.ts
import { QueryClient } from '@tanstack/react-query';
import { getValkeyClient } from '@/lib/cache/valkey';

/**
 * Custom Query Client with Valkey integration
 *
 * Features:
 * - Valkey cache for SSR hydration
 * - Stale-while-revalidate strategy
 * - Optimistic updates
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

/**
 * Hydrate query cache from Valkey (for SSR)
 */
export async function hydrateQueryFromValkey(
  queryKey: string[],
  queryFn: () => Promise<any>
): Promise<any> {
  const valkey = getValkeyClient();
  const cacheKey = `query:${queryKey.join(':')}`;

  // Try Valkey first
  const cached = await valkey.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fallback to query function
  const data = await queryFn();

  // Cache in Valkey for next request
  await valkey.setex(cacheKey, 300, JSON.stringify(data)); // 5 min TTL

  return data;
}
```

**Provider Setup:**

```typescript
// src/app/layout.tsx (enhance)
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createQueryClient } from '@/lib/query/query-client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const queryClient = createQueryClient();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

**Example Usage:**

```typescript
// src/features/tests/hooks/use-pressure-tests.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPressureTests, createPressureTest, updatePressureTest } from '@/lib/api/pressure-tests';

export function usePressureTests(projectId: string) {
  return useQuery({
    queryKey: ['pressure-tests', projectId],
    queryFn: () => getPressureTests(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreatePressureTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPressureTest,
    onMutate: async (newTest) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['pressure-tests', newTest.projectId] });

      const previousTests = queryClient.getQueryData(['pressure-tests', newTest.projectId]);

      queryClient.setQueryData(['pressure-tests', newTest.projectId], (old: any) => [...old, newTest]);

      return { previousTests };
    },
    onError: (err, newTest, context) => {
      // Rollback on error
      queryClient.setQueryData(['pressure-tests', newTest.projectId], context?.previousTests);
    },
    onSettled: (data, error, variables) => {
      // Refetch to get server truth
      queryClient.invalidateQueries({ queryKey: ['pressure-tests', variables.projectId] });
    },
  });
}
```

### Enhanced Zustand Store

```bash
pnpm add zustand/middleware immer
```

**Store Structure:**

```typescript
// src/store/use-store.ts (enhance)
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { valkeyPersistMiddleware } from './middleware/valkey-persist';

/**
 * Zustand Store with Middleware
 *
 * Middleware Stack:
 * 1. Immer - Immutable updates with mutable syntax
 * 2. DevTools - Redux DevTools integration
 * 3. Valkey Persist - Selective persistence to Valkey (not localStorage!)
 */

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Modals
  activeModal: string | null;
  modalData: Record<string, any>;

  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;

  // Form state (temporary)
  currentTestDraft: any | null;

  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  openModal: (modal: string, data?: any) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  setCurrentTestDraft: (draft: any) => void;
  clearCurrentTestDraft: () => void;
}

export const useStore = create<UIState>()(
  devtools(
    immer(
      valkeyPersistMiddleware(
        (set) => ({
          // Initial state
          sidebarOpen: true,
          sidebarCollapsed: false,
          activeModal: null,
          modalData: {},
          notifications: [],
          currentTestDraft: null,

          // Actions
          setSidebarOpen: (open) => set({ sidebarOpen: open }),

          toggleSidebarCollapsed: () => set((state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
          }),

          openModal: (modal, data = {}) => set({
            activeModal: modal,
            modalData: data
          }),

          closeModal: () => set({
            activeModal: null,
            modalData: {}
          }),

          addNotification: (notification) => set((state) => {
            state.notifications.push({
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              ...notification,
            });
          }),

          removeNotification: (id) => set((state) => {
            state.notifications = state.notifications.filter((n) => n.id !== id);
          }),

          setCurrentTestDraft: (draft) => set({ currentTestDraft: draft }),

          clearCurrentTestDraft: () => set({ currentTestDraft: null }),
        }),
        {
          name: 'pressograph-ui-state',
          partialize: (state) => ({
            // Only persist these fields to Valkey
            sidebarCollapsed: state.sidebarCollapsed,
            // Don't persist modals, notifications, drafts
          }),
        }
      )
    ),
    { name: 'Pressograph UI Store' }
  )
);

// Selector hooks with useShallow (prevent unnecessary re-renders)
import { useShallow } from 'zustand/react/shallow';

export function useSidebar() {
  return useStore(
    useShallow((state) => ({
      open: state.sidebarOpen,
      collapsed: state.sidebarCollapsed,
      setOpen: state.setSidebarOpen,
      toggleCollapsed: state.toggleSidebarCollapsed,
    }))
  );
}

export function useModal() {
  return useStore(
    useShallow((state) => ({
      active: state.activeModal,
      data: state.modalData,
      open: state.openModal,
      close: state.closeModal,
    }))
  );
}

export function useNotifications() {
  return useStore(
    useShallow((state) => ({
      notifications: state.notifications,
      add: state.addNotification,
      remove: state.removeNotification,
    }))
  );
}
```

**Custom Valkey Persist Middleware:**

```typescript
// src/store/middleware/valkey-persist.ts
import { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { getValkeyClient } from '@/lib/cache/valkey';

/**
 * Zustand Middleware for Valkey Persistence
 *
 * Unlike localStorage, this persists to Valkey with:
 * - TTL support (expiration)
 * - Server-side access
 * - Cross-session synchronization
 * - No GDPR concerns (ephemeral)
 */

export interface ValkeyPersistOptions {
  name: string; // Valkey key name
  partialize?: (state: any) => Partial<any>; // Select fields to persist
  ttl?: number; // Time-to-live in seconds (default: 24 hours)
}

export const valkeyPersistMiddleware = <T>(
  config: StateCreator<T>,
  options: ValkeyPersistOptions
): StateCreator<T> => {
  return (set, get, api) => {
    const { name, partialize = (state) => state, ttl = 86400 } = options;

    // Load initial state from Valkey
    (async () => {
      try {
        const valkey = getValkeyClient();
        const stored = await valkey.get(name);
        if (stored) {
          const parsedState = JSON.parse(stored);
          set(parsedState);
        }
      } catch (error) {
        console.error('[Valkey Persist] Failed to load state:', error);
      }
    })();

    // Wrap set to persist on changes
    const persistedSet: typeof set = (partial, replace) => {
      set(partial, replace);

      // Persist to Valkey (debounced)
      setTimeout(async () => {
        try {
          const state = get();
          const stateToPersist = partialize(state);
          const valkey = getValkeyClient();
          await valkey.setex(name, ttl, JSON.stringify(stateToPersist));
        } catch (error) {
          console.error('[Valkey Persist] Failed to persist state:', error);
        }
      }, 500); // 500ms debounce
    };

    return config(persistedSet, get, api);
  };
};
```

---

## 4. Data Visualization Library Selection

### Requirements from UI/UX Docs

- High-contrast pressure graphs (dark/light themes)
- Professional engineering look
- Gridlines, axes labels (Russian/English)
- Multiple pressure stages on one graph
- Export to PNG/PDF (high resolution)
- Responsive (desktop/tablet)
- Accessible (WCAG AA)

### Evaluation Matrix

| Library | Bundle Size | TypeScript | Accessibility | Customization | Animation | Verdict |
|---------|------------|------------|---------------|---------------|-----------|---------|
| **Recharts** | ~96 KB | Good | Moderate | High | Basic | RECOMMENDED |
| **Visx** | ~45 KB | Excellent | Excellent | Very High | Custom | Advanced Users |
| **Nivo** | ~150 KB | Good | Good | Moderate | Excellent | Too Heavy |
| **Chart.js** | ~200 KB | Moderate | Moderate | Moderate | Good | Too Heavy |
| **Victory** | ~180 KB | Good | Good | High | Good | Too Heavy |

**Recommendation: Recharts**

**Rationale:**
1. **Moderate Bundle Size** - 96 KB is acceptable for a specialized app
2. **Excellent TypeScript Support** - First-class types
3. **Industrial Look** - Easy to style for engineering graphs
4. **Customization** - Full control over gridlines, axes, colors
5. **React-Native** - D3-based but React-friendly API
6. **Theme Integration** - Easy to hook into our theme system
7. **Print-Friendly** - SVG output, good for PDF generation

**Installation:**

```bash
pnpm add recharts
pnpm add -D @types/recharts
```

**Example Implementation:**

```typescript
// src/components/charts/pressure-graph.tsx
'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useTheme } from 'next-themes';
import { useTranslation } from 'next-intl';

interface PressureGraphProps {
  data: Array<{
    time: number; // minutes
    pressure: number; // MPa
    stage: string;
  }>;
  config: {
    workingPressure: number;
    maxPressure: number;
    allowablePressureDrop: number;
  };
}

export function PressureGraph({ data, config }: PressureGraphProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const isDark = theme === 'dark';

  // Theme-aware colors
  const colors = useMemo(() => ({
    background: isDark ? '#1E1E2E' : '#FFFFFF',
    text: isDark ? '#F1F5F9' : '#0F172A',
    grid: isDark ? '#334155' : '#E2E8F0',
    primaryLine: isDark ? '#60A5FA' : '#2563EB',
    warningLine: '#F59E0B',
    dangerLine: '#EF4444',
  }), [isDark]);

  return (
    <ResponsiveContainer width="100%" height={500}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={colors.grid}
          strokeOpacity={0.5}
        />

        <XAxis
          dataKey="time"
          label={{
            value: t('graph.time'),
            position: 'insideBottom',
            offset: -10,
            fill: colors.text,
          }}
          tick={{ fill: colors.text }}
          stroke={colors.text}
        />

        <YAxis
          label={{
            value: t('graph.pressure'),
            angle: -90,
            position: 'insideLeft',
            fill: colors.text,
          }}
          tick={{ fill: colors.text }}
          stroke={colors.text}
          domain={[0, config.maxPressure * 1.1]}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: colors.background,
            border: `1px solid ${colors.grid}`,
            color: colors.text,
          }}
          labelStyle={{ color: colors.text }}
        />

        <Legend
          wrapperStyle={{ color: colors.text }}
        />

        {/* Reference lines */}
        <ReferenceLine
          y={config.workingPressure}
          stroke={colors.primaryLine}
          strokeDasharray="5 5"
          label={{ value: t('graph.workingPressure'), fill: colors.text }}
        />

        <ReferenceLine
          y={config.maxPressure}
          stroke={colors.dangerLine}
          strokeDasharray="5 5"
          label={{ value: t('graph.maxPressure'), fill: colors.text }}
        />

        {/* Data line */}
        <Line
          type="monotone"
          dataKey="pressure"
          stroke={colors.primaryLine}
          strokeWidth={2}
          dot={{ r: 3, fill: colors.primaryLine }}
          activeDot={{ r: 5 }}
          name={t('graph.actualPressure')}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Alternative: Keep Canvas API for Ultra-High-Resolution Export**

- Use Recharts for interactive UI
- Use Canvas API for PDF/PNG export (2000+ DPI)
- Maintain both implementations

---

## 5. Error Monitoring & Observability

### Sentry Integration

```bash
pnpm add @sentry/nextjs
```

**Setup:**

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION,

  // Filters
  beforeSend(event) {
    // Don't send development errors
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },

  // Integrations
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

**Benefits:**
1. Real-time error tracking
2. Performance monitoring
3. Session replay (see what user saw)
4. Breadcrumbs (user actions leading to error)
5. Source maps (readable stack traces)
6. Release tracking
7. Alert notifications

---

## 6. Additional Recommended Packages

### Form Handling

```bash
# Already installed:
# react-hook-form
# @hookform/resolvers
# zod

# Add for enhanced functionality:
pnpm add react-dropzone  # File uploads
```

### File Processing

```bash
pnpm add papaparse @types/papaparse  # CSV parsing
pnpm add xlsx  # Excel parsing (if needed)
```

### PDF Generation

```bash
pnpm add jspdf jspdf-autotable  # PDF reports
# or
pnpm add @react-pdf/renderer  # React-based PDF generation
```

### Date Handling

```bash
# Already installed: date-fns
# Consider adding:
pnpm add date-fns-tz  # Timezone support
```

### Real-time Updates (Optional)

```bash
# Option 1: Socket.io (full-featured)
pnpm add socket.io socket.io-client

# Option 2: Native SSE (lighter, simpler)
# No package needed, use native EventSource API
```

**Recommendation: Start with SSE, upgrade to Socket.io if needed**

---

## 7. Internationalization Strategy

### Current Setup

- `next-intl` (already installed)
- Russian + English support

### Enhancement Needed

**Namespaced Translation Files:**

```
src/
  locales/
    en/
      common.json        # Shared UI strings
      auth.json          # Authentication
      tests.json         # Pressure tests
      graph.json         # Graph visualization
      errors.json        # Error messages
      validation.json    # Form validation
    ru/
      (same structure)
```

**Configuration:**

```typescript
// src/i18n/config.ts
export const locales = ['en', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
};
```

**Middleware Integration:**

```typescript
// src/middleware.ts (enhance)
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // /en/page or /page
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

---

## 8. Sprint Plan & GitHub Issues

### Sprint 1: Foundation (Current)

**Issues to Create:**

1. **ARCH-001: Implement server-side theme management**
   - Remove localStorage dependency
   - Cookie + Database + Valkey integration
   - Zero FOUC implementation
   - Estimated: 8 hours

2. **ARCH-002: Complete database schema implementation**
   - All entity tables (pressure_tests, test_runs, projects, etc.)
   - Relationships and indexes
   - Migration scripts
   - Estimated: 12 hours

3. **ARCH-003: Install and configure TanStack Query**
   - Setup QueryClient with Valkey hydration
   - Create example hooks
   - DevTools setup
   - Estimated: 6 hours

4. **ARCH-004: Enhance Zustand store with middleware**
   - Add Redux DevTools
   - Add Immer
   - Implement Valkey persistence middleware
   - Create selector hooks
   - Estimated: 6 hours

5. **ARCH-005: Update TailwindCSS config with design tokens**
   - Extract colors from UI/UX docs
   - Implement industrial color scheme
   - Dark/light theme optimization
   - Typography scale
   - Estimated: 4 hours

6. **ARCH-006: Integrate Recharts for graph visualization**
   - Install and configure
   - Create PressureGraph component
   - Theme integration
   - Accessibility features
   - Estimated: 8 hours

7. **ARCH-007: Setup Sentry error monitoring**
   - Install @sentry/nextjs
   - Configure client and server
   - Source maps setup
   - Test error tracking
   - Estimated: 3 hours

8. **ARCH-008: Enhance internationalization structure**
   - Namespace translation files
   - Middleware configuration
   - Language switcher component
   - Estimated: 4 hours

### Sprint 2: Core Features

- User authentication (NextAuth complete setup)
- Pressure test CRUD operations
- Project management
- File upload system
- Basic graph rendering

### Sprint 3: Advanced Features

- Real-time test progress (SSE)
- Multi-user features
- Advanced analytics
- Admin dashboard
- Audit logging

### Sprint 4: Polish & Deploy

- Performance optimization
- Comprehensive testing
- Documentation
- Production deployment
- Monitoring setup

---

## 9. Migration from Old Site

### Key Differences

**Old Site (Vite + React):**
- Client-side routing (React Router)
- localStorage for theme/state
- Manual fetch() calls
- No server-side rendering
- Limited caching

**New Site (Next.js 16 + React 19):**
- Server Components by default
- Server-side theme management
- TanStack Query for server state
- SSR/ISG for performance
- Valkey caching layer

### Migration Strategy

**DO NOT:**
- Copy old code directly
- Replicate localStorage patterns
- Use client-side state for server data
- Implement custom auth (use NextAuth)

**DO:**
- Rethink each component for Server Components
- Use Server Actions for mutations
- Leverage Valkey for caching
- Use TanStack Query for server state
- Follow UI/UX guidelines from docs

---

## 10. Performance Targets

### Metrics

**Core Web Vitals:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**Custom Metrics:**
- Time to Interactive (TTI): < 3s
- Graph Render Time: < 500ms
- API Response Time (p95): < 200ms
- Valkey Cache Hit Rate: > 80%

### Optimization Strategies

1. **Code Splitting** - Dynamic imports for heavy components
2. **Image Optimization** - Next.js Image component, sharp processing
3. **Caching** - Aggressive Valkey caching, ISR for static pages
4. **Database** - Proper indexes, query optimization, connection pooling
5. **Bundle Size** - Tree-shaking, analyze with next/bundle-analyzer

---

## 11. Security Considerations

### Authentication & Authorization

- NextAuth 4.24 with database sessions
- JWT for API keys
- Role-based access control (RBAC)
- Multi-factor authentication (future)

### Data Protection

- SQL injection prevention (Drizzle parameterized queries)
- XSS prevention (React automatic escaping)
- CSRF protection (NextAuth built-in)
- Rate limiting (Valkey-based)
- Input validation (Zod schemas everywhere)

### Audit Logging

- All create/update/delete operations logged
- IP address and user agent tracking
- Compliance-ready (GDPR, SOC2)

---

## 12. Testing Strategy

### Unit Tests

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

- All utility functions
- Custom hooks
- Zustand store actions
- Form validation logic

### Integration Tests

- API route handlers
- Server Actions
- Database queries (with test DB)
- Valkey cache operations

### E2E Tests

```bash
pnpm add -D @playwright/test
```

- Critical user flows (login, create test, view graph)
- Multi-language support
- Theme switching
- Graph export

---

## 13. Documentation Requirements

### Code Documentation

- JSDoc for all public functions
- Type definitions with descriptions
- README in each feature folder

### User Documentation

- Help page (in-app)
- API documentation (if public API)
- Admin guide
- Deployment guide

### Developer Documentation

- Architecture decisions (this document)
- Database schema ERD
- API endpoints reference
- State management guide
- Contributing guidelines

---

## 14. Deployment Architecture

### Container Strategy

```yaml
# docker-compose.yml (production)
services:
  app:
    image: pressograph:2.0.0
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://cache:6379
      - NEXTAUTH_URL=https://pressograph.example.com
      - NEXTAUTH_SECRET=...
      - SENTRY_DSN=...
    depends_on:
      - db
      - cache
    ports:
      - "3000:3000"
    restart: unless-stopped

  db:
    image: postgres:18-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=pressograph
      - POSTGRES_USER=...
      - POSTGRES_PASSWORD=...
    restart: unless-stopped

  cache:
    image: valkey/valkey:8-alpine
    volumes:
      - valkey_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  valkey_data:
```

### Environment Variables

```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_APP_VERSION=2.0.0

# Database
DATABASE_URL=postgresql://user:pass@db:5432/pressograph

# Valkey/Redis
REDIS_URL=redis://cache:6379
REDIS_DB=0
REDIS_PREFIX=pressograph:

# NextAuth
NEXTAUTH_URL=https://pressograph.example.com
NEXTAUTH_SECRET=...
DATABASE_URL_NEXTAUTH=postgresql://...

# Sentry
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...

# Feature Flags
NEXT_PUBLIC_ENABLE_REAL_TIME=true
NEXT_PUBLIC_ENABLE_PUBLIC_SHARING=true
```

---

## 15. Success Criteria

### Technical Success

- All Core Web Vitals in green
- Zero hydration errors
- 95%+ test coverage for critical paths
- < 1% error rate in production
- 99.9% uptime

### User Success

- 4-step guided workflow implemented
- WCAG AA accessibility compliance
- < 30 second time to create first test
- Bilingual support (Russian/English) complete
- Mobile/tablet responsive

### Business Success

- User satisfaction improved (feedback surveys)
- Reduced training time for new users
- Increased test creation velocity
- Professional appearance (branding compliant)

---

## 16. Next Steps

### Immediate (Today/Tomorrow)

1. Create GitHub issues for Sprint 1
2. Implement server-side theme management
3. Complete database schema and migrations
4. Install TanStack Query and Recharts
5. Update TailwindCSS config with design tokens

### Short-term (This Week)

6. Enhance Zustand store with middleware
7. Setup Sentry error monitoring
8. Enhance internationalization structure
9. Create base component library (shadcn/ui)
10. Document architectural decisions

### Medium-term (Next Week)

11. Implement NextAuth authentication
12. Build pressure test CRUD operations
13. Create graph visualization components
14. Implement file upload system
15. Setup real-time updates (SSE)

---

## Appendix A: Package Versions

```json
{
  "dependencies": {
    "next": "16.0.1",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "typescript": "5.9.3",
    "@tanstack/react-query": "^5.x", // ADD
    "@tanstack/react-query-devtools": "^5.x", // ADD
    "recharts": "^2.x", // ADD
    "@sentry/nextjs": "^8.x", // ADD
    "zustand": "^5.0.8",
    "immer": "^10.x", // ADD
    "drizzle-orm": "^0.44.7",
    "postgres": "^3.4.5",
    "ioredis": "^5.8.2",
    "next-auth": "^4.24.13",
    "next-intl": "^4.4.0",
    "next-themes": "^0.4.4",
    "react-hook-form": "^7.54.2",
    "react-hot-toast": "^2.4.1",
    "zod": "^4.1.12",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.462.0",
    "tailwindcss": "^4.1.16",
    "react-dropzone": "^14.x", // ADD
    "papaparse": "^5.x", // ADD
    "@types/papaparse": "^5.x", // ADD
    "jspdf": "^2.x", // ADD
    "jspdf-autotable": "^3.x" // ADD
  }
}
```

---

## Appendix B: Color Palette Reference

```css
/* Light Theme (Industrial) */
--primary: hsl(217, 91%, 60%);           /* #3B82F6 - Blue */
--primary-foreground: hsl(0, 0%, 100%);  /* #FFFFFF */

--secondary: hsl(215, 25%, 46%);         /* #64748B - Steel Gray */
--secondary-foreground: hsl(0, 0%, 100%);

--success: hsl(142, 76%, 36%);           /* #17A34A - Green */
--warning: hsl(38, 92%, 50%);            /* #F59E0B - Orange */
--danger: hsl(0, 84%, 60%);              /* #EF4444 - Red */

--background: hsl(0, 0%, 100%);          /* #FFFFFF */
--foreground: hsl(222, 47%, 11%);        /* #0F172A */

/* Dark Theme (Industrial) */
--background: hsl(224, 71%, 12%);        /* #1E1E2E */
--foreground: hsl(210, 40%, 95%);        /* #F1F5F9 */

--primary: hsl(217, 91%, 70%);           /* Lighter blue for dark */
--secondary: hsl(215, 25%, 60%);         /* Lighter gray for dark */

/* Graph Colors */
--graph-primary: hsl(217, 91%, 60%);
--graph-secondary: hsl(142, 76%, 36%);
--graph-tertiary: hsl(38, 92%, 50%);
--graph-quaternary: hsl(280, 65%, 60%);
--graph-grid: hsl(215, 20%, 65%);        /* Light mode */
--graph-grid-dark: hsl(215, 20%, 25%);   /* Dark mode */
```

---

## Document Metadata

**Version:** 1.0.0
**Last Updated:** 2025-11-03
**Authors:** Senior Frontend Developer (Claude Code)
**Status:** Draft → Review → Approved → Implementation

**Approval Required:**
- Technical Lead
- Product Manager
- UX Designer

**Next Review:** After Sprint 1 completion

---

END OF DOCUMENT
