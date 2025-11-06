---
id: route-migration-analysis
title: Route Migration Analysis - v1.0 to v2.0
sidebar_label: Route Migration
---

# Route Migration Analysis: v1.0 to v2.0

**Date:** 2025-11-06
**Author:** Development Team
**Status:** Documentation

## Purpose

This document analyzes the routes from the old Pressograph v1.0 (Vite/React) and maps them to the new v2.0 architecture (Next.js 15).

## Old Project Routes (v1.0)

### Source Location
`/opt/backup/pressograph-20251103-051742/src/App.tsx`

### Route Structure

```typescript
<Routes>
  {/* Public Routes */}
  <Route path="/setup" element={<SetupPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/share/:token" element={<ShareLink />} />

  {/* Protected Routes (require authentication) */}
  <Route path="/" element={<HomePage />} />
  <Route path="/history" element={<History />} />
  <Route path="/admin" element={<Admin />} />
  <Route path="/help" element={<Help />} />
  <Route path="/profile" element={<Profile />} />
</Routes>
```

## Detailed Route Analysis

### 1. `/history` Route - Graph History Management

**Status:** ⚠️ NOT in current v2.0 plans

**Old Implementation:**
- **File:** `/opt/backup/pressograph-20251103-051742/src/pages/History.tsx`
- **Size:** 1,224 lines of code
- **Complexity:** High - comprehensive feature set

**Features:**
1. **Table View**
   - Pagination with configurable limit (default 20 items)
   - Column headers: ID, Test Number, Format, File Size, Creation Date, Comment, Status, Actions
   - Responsive design with dark mode support

2. **Search & Filtering**
   - Full-text search across test numbers and comments
   - Filter by format: All, PNG, PDF, JSON
   - Sort options:
     - Newest first (default)
     - Oldest first
     - By test number

3. **Actions per Graph**
   - **View:** Preview modal with all details and test settings
   - **Download:** Download original file (PNG/PDF)
   - **Download JSON:** Export settings as JSON
   - **Regenerate:** Create new version with different format/theme
   - **Share:** Generate public share link with clipboard copy
   - **Delete:** Remove graph with confirmation modal
   - **Edit Comment:** Add/edit notes on graphs

4. **Preview Modal**
   - Display all graph metadata
   - Show test parameters (temperature, pressure, duration)
   - Edit comments inline
   - Quick download actions

5. **Regenerate Modal**
   - Select new format (PNG, PDF, JSON)
   - Choose theme (light, dark) - only for PNG/PDF
   - Configurable quality settings (scale, width, height)
   - Shows file size and generation time after completion

6. **Status Indicators**
   - Success (green)
   - Failed (red)
   - Pending (yellow)

7. **Empty States**
   - No graphs yet: prompt to create first graph
   - No search results: clear filters button

**Backend API:**
```typescript
// Service calls used in History page
getHistory(params: HistoryQueryParams)
deleteGraph(graphId: number)
downloadGraph(graphId: number)
createShareLink({ graphId, allowDownload })
regenerateGraph(graphId, { format, theme, scale, width, height })
updateComment(graphId, comment)
```

**Recommendation:**
- **Priority:** P1 (High) - Critical user-facing feature
- **Sprint:** Sprint 2 or Sprint 3
- **Estimate:** 8-13 SP
- **Dependencies:**
  - Dashboard layout (S02-T008)
  - Navigation component (S02-T009)
  - Table components
  - Modal components
  - Graph generation API

**Migration Notes:**
- Rewrite using Next.js App Router and Server Components
- Use TanStack Query for data fetching
- Integrate with new Drizzle ORM schema
- Implement server actions for mutations
- Add OpenTelemetry tracing
- Enhance with better TypeScript types

---

### 2. `/admin` Route - Administration Dashboard

**Status:** ✅ PLANNED in Sprints 3-4

**Old Implementation:**
- **Frontend:** `/opt/backup/pressograph-20251103-051742/src/pages/Admin.tsx`
- **Size:** 66 lines (placeholder/"Coming Soon" page)
- **Backend:** `/opt/backup/pressograph-20251103-051742/server/src/routes/admin.routes.ts`

**Old Backend API Routes:**
```typescript
// Dashboard
GET /admin/dashboard              - Statistics (implemented)

// User Management
GET /admin/users                  - List users (implemented)
GET /admin/users/:id             - User details (stub)
POST /admin/users                - Create user (stub)
PUT /admin/users/:id             - Update user (stub)
DELETE /admin/users/:id          - Delete user (stub)

// Graph Management
GET /admin/graphs                - List graphs (implemented)
GET /admin/graphs/:id            - Graph details (stub)
DELETE /admin/graphs/:id         - Delete graph (stub)

// Analytics
GET /admin/analytics/usage       - Usage analytics (stub)
GET /admin/analytics/performance - Performance metrics (stub)

// System
GET /admin/system/health         - System health (implemented)
GET /admin/system/logs           - System logs (stub)
```

**Security:**
- All routes protected with `authenticateToken` middleware
- All routes require `requireAdmin` middleware
- Role-based access control (RBAC)

**New v2.0 Plan:**

**Sprint 3: Admin Dashboard Backend** (Dec 2-15, 2025) - 40 SP
- Dashboard statistics endpoint (5 SP)
- User management CRUD endpoints (8 SP)
- Graph management endpoints (5 SP)
- Analytics endpoints (usage, performance) (8 SP)
- System health endpoints (5 SP)
- Integration tests for admin API (5 SP)
- Admin role middleware (2 SP)
- OpenAPI documentation for admin API (2 SP)

**Sprint 4: Admin Dashboard Frontend** (Dec 16-29, 2025) - 42 SP
- Admin dashboard layout with tabs (5 SP)
- Overview tab (stats cards, charts) (8 SP)
- Users management tab (table, CRUD) (8 SP)
- Graphs management tab (5 SP)
- Analytics tab (charts, reports) (8 SP)
- System tab (health, logs) (5 SP)
- Real-time updates (polling every 30s) (3 SP)

**Enhancements over v1.0:**
- Full implementation (v1.0 was mostly stubs)
- Modern Next.js App Router architecture
- Real-time updates via polling
- Comprehensive analytics with charts
- OpenAPI documentation
- Integration tests
- Better RBAC implementation
- Audit logging integration
- OpenTelemetry observability

---

### 3. Other Routes

#### `/` (Home Page)
- **Status:** ✅ Implemented
- **Location:** `/opt/projects/repositories/pressograph/src/app/page.tsx`
- **Note:** Landing page with pressure test creation workflow

#### `/profile` Route
- **Status:** ⏸️ Planned for Sprint 5
- **Old:** `/opt/backup/pressograph-20251103-051742/src/pages/Profile.tsx`
- **New Plan:**
  - Sprint 5: Profile backend endpoints (5 SP)
  - Sprint 5: Profile page UI (8 SP)
  - Sprint 5: Profile statistics section (3 SP)
  - Sprint 5: Profile activity log (3 SP)

#### `/help` Route
- **Status:** ⏸️ Not yet planned
- **Old:** `/opt/backup/pressograph-20251103-051742/src/pages/Help.tsx` (23KB)
- **Recommendation:** Add to Sprint 2 or backlog as documentation route

#### `/login` Route
- **Status:** 🔄 Different approach in v2.0
- **Old:** Custom login page with username/password
- **New:** NextAuth handles authentication
  - OAuth providers (GitHub, Google)
  - Credentials provider (optional)
  - Built-in sign-in pages at `/api/auth/signin`

#### `/setup` Route (Initial Setup Wizard)
- **Status:** ⏸️ Not yet planned
- **Old:** First-time setup wizard for database initialization
- **New:** May not be needed with NextAuth and Docker setup
- **Recommendation:** Evaluate if still needed for initial admin user creation

#### `/share/:token` Route (Public Share Links)
- **Status:** ⏸️ Not yet planned
- **Old:** Public access to shared graphs without authentication
- **Recommendation:** Plan for Sprint 2 or Sprint 3 alongside History page

## New Routes in v2.0 (Not in v1.0)

### `/dashboard`
- **Status:** ✅ Placeholder exists
- **Purpose:** Main user dashboard (replacing old Home page)
- **Plan:** Sprint 2 - Dashboard layout with sidebar (4 SP)

### `/projects`
- **Status:** ✅ Placeholder exists
- **Purpose:** Project management (new feature in v2.0)
- **Plan:** TBD (not in current 6-sprint roadmap)

### `/tests`
- **Status:** ✅ Placeholder exists
- **Purpose:** Test management (separate from history)
- **Plan:** TBD (not in current 6-sprint roadmap)

### `/docs`
- **Status:** ✅ Placeholder exists
- **Purpose:** User documentation
- **Plan:** Sprint 6 - Comprehensive user guide (5 SP)

### `/api-docs`
- **Status:** ✅ Placeholder exists
- **Purpose:** API documentation with OpenAPI
- **Plan:** Sprint 3 - OpenAPI documentation (2 SP)

### `/privacy` & `/terms`
- **Status:** ✅ Placeholders exist
- **Purpose:** Legal pages
- **Plan:** Sprint 6 or backlog

## Route Comparison Table

| Route | v1.0 Status | v2.0 Status | Sprint | Priority | Notes |
|-------|-------------|-------------|--------|----------|-------|
| `/` | ✅ Home | ✅ Landing | Current | - | Implemented |
| `/dashboard` | ❌ None | 🔄 Planned | Sprint 2 | P1 | New route |
| `/history` | ✅ Full (1224 lines) | ⚠️ **MISSING** | **Sprint 2/3** | **P1** | **Critical gap** |
| `/admin` | 🔄 Stub | ✅ Planned | Sprint 3-4 | P1 | Full implementation |
| `/profile` | ✅ Basic | 🔄 Planned | Sprint 5 | P2 | Enhanced version |
| `/help` | ✅ Full (23KB) | ⏸️ Not planned | Backlog | P2 | Documentation |
| `/login` | ✅ Custom | ✅ NextAuth | Current | - | Different approach |
| `/setup` | ✅ Wizard | ⏸️ TBD | TBD | P3 | May not be needed |
| `/share/:token` | ✅ Basic | ⏸️ Not planned | Sprint 2/3 | P2 | Needs planning |
| `/projects` | ❌ None | 🔄 Placeholder | TBD | P3 | New feature |
| `/tests` | ❌ None | 🔄 Placeholder | TBD | P2 | New feature |
| `/docs` | ❌ None | 🔄 Placeholder | Sprint 6 | P2 | New feature |
| `/api-docs` | ❌ None | 🔄 Placeholder | Sprint 3 | P2 | New feature |
| `/privacy` | ❌ None | 🔄 Placeholder | Sprint 6 | P3 | Legal |
| `/terms` | ❌ None | 🔄 Placeholder | Sprint 6 | P3 | Legal |

**Legend:**
- ✅ Implemented/Full
- 🔄 Partial/In Progress
- ⏸️ Planned but not started
- ❌ Doesn't exist
- ⚠️ Critical gap

## Critical Gaps Identified

### 1. History Page (HIGH PRIORITY)
**Problem:** The comprehensive graph history management page (1,224 lines) is not in the current roadmap.

**Impact:**
- Users cannot view their past test results
- Cannot regenerate graphs with different formats/themes
- Cannot share graphs via public links
- Cannot manage (delete, comment on) old graphs
- This is core functionality, not a "nice to have"

**Recommendation:**
- **Add to Sprint 2:** As high-priority task (8-13 SP)
- **Dependencies:** Dashboard layout, navigation, table components
- **Alternative:** Add to Sprint 3 alongside Admin Dashboard backend

**Proposed GitHub Issue:**
```
Title: Implement Graph History Page (/history route)
Priority: P1 (High)
Estimate: 8-13 SP
Sprint: Sprint 2 or Sprint 3

Description:
Recreate the comprehensive graph history management page from v1.0:
- Table view with pagination (20 items per page)
- Search and filter (by format, test number, date)
- Sort options (newest, oldest, by test number)
- Actions: view, download, regenerate, share, delete
- Edit comments on graphs
- Preview modal with test settings
- Status indicators (success, failed, pending)

Technical Requirements:
- Use Next.js App Router with Server Components
- TanStack Query for data fetching
- Server Actions for mutations
- Drizzle ORM for database queries
- shadcn/ui components (table, modal, dropdown)
- OpenTelemetry tracing
- Comprehensive TypeScript types

Acceptance Criteria:
- User can view all their test history in a table
- User can search and filter results
- User can download original files
- User can regenerate graphs with new format/theme
- User can create public share links
- User can delete old graphs (with confirmation)
- User can add/edit comments
- Table supports pagination and sorting
- Preview modal shows all graph details
- All actions properly tracked in audit log
```

### 2. Public Share Links
**Problem:** Share link functionality (`/share/:token`) not planned.

**Impact:**
- Users cannot share graphs with others
- Collaboration features missing

**Recommendation:**
- Add to Sprint 2 or Sprint 3 (5 SP)
- Implement alongside History page

### 3. Help/Documentation Route
**Problem:** Comprehensive help page (23KB) not planned.

**Impact:**
- Users may struggle without in-app help
- Increased support burden

**Recommendation:**
- Add to Sprint 6 or backlog (3-5 SP)
- Consider using `/docs` route instead

## Recommendations Summary

### Immediate Action (Sprint 2)
1. **Create GitHub issue for History Page** (8-13 SP)
2. **Create GitHub issue for Share Links** (5 SP)
3. **Update Sprint 2 milestone** to include these tasks
4. **Assess capacity:** May need to defer some low-priority Sprint 2 tasks

### Short-term (Sprint 3)
1. **If History Page deferred from Sprint 2:** Make it Priority 1 for Sprint 3
2. **Admin Dashboard Backend:** Already planned (40 SP)

### Long-term
1. **Help/Documentation:** Add to Sprint 6 or backlog
2. **Setup Wizard:** Evaluate if still needed
3. **Projects/Tests routes:** Define scope and add to future sprints

## Next Steps

1. **Product Owner Decision Required:**
   - Should History Page be in Sprint 2 or Sprint 3?
   - Is Public Share Links in scope for v2.0 initial release?
   - Do we need Setup Wizard for v2.0?

2. **Technical Lead Actions:**
   - Create detailed GitHub issues for missing routes
   - Update Sprint 2 plan if History Page added
   - Document API endpoints needed for History Page

3. **Documentation:**
   - Update `DEVELOPMENT_ROADMAP.md` with History Page
   - Update `CHANGELOG.md` with planned routes (✅ Done)
   - Create ADR for route naming conventions

## Conclusion

The migration from v1.0 to v2.0 is well-planned for most features, but the **History Page is a critical gap** that needs immediate attention. This is not a minor feature—it's core functionality that users depend on for managing their test results.

**Recommendation:** Add History Page to Sprint 2 (if capacity allows) or Sprint 3 at latest, before Admin Dashboard work begins.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-06
**Next Review:** Sprint 2 planning (2025-11-17)
