# GitHub Issues Management - Sprint 2

**Date:** 2025-11-07
**Sprint:** Sprint 2 - Foundation & Core UI
**Status:** Ready for Issue Creation

---

## Summary

This document outlines the GitHub issues that should be created or updated following the completion of hydration error fixes and in preparation for Sprint 2 development.

---

## Completed Work (Ready to Close)

### Issue: Hydration Errors on Profile and Test Pages

**Status:** ✅ FIXED - Ready to close if issue exists

**Resolution:**
- Implemented consistent date formatting utilities using date-fns
- Fixed 5 files with 12+ date formatting instances
- All hydration errors resolved

**Commits:**
- `fad1b911` - feat(utils): add date formatting utilities
- `d0e665b2` - fix(profile): resolve hydration error in profile form
- `5451f445` - fix(tests): resolve hydration errors in test runs table
- `dc5aa467` - fix(tests): resolve 6 hydration errors in test detail page
- `925f0628` - fix(projects): resolve hydration error in project detail page
- `66d7b31f` - docs(changelog): document hydration error fixes

**Files Modified:**
1. `/opt/projects/repositories/pressograph/src/lib/utils/format.ts`
2. `/opt/projects/repositories/pressograph/src/components/profile/profile-form.tsx`
3. `/opt/projects/repositories/pressograph/src/components/tests/test-runs-table.tsx`
4. `/opt/projects/repositories/pressograph/src/app/(dashboard)/tests/[id]/page.tsx`
5. `/opt/projects/repositories/pressograph/src/app/(dashboard)/projects/[id]/page.tsx`

---

## Sprint 2 Issues to Create

Based on `/opt/projects/repositories/pressograph/docs/development/PAGES_STRUCTURE_AND_FUNCTIONALITY.md`, the following issues should be created for Sprint 2:

### 1. Dashboard Page Implementation

**Title:** Implement Dashboard Page with Overview Statistics

**Labels:** `enhancement`, `sprint-2`, `dashboard`, `priority-high`

**Description:**
Implement the main dashboard landing page (`/dashboard`) with overview statistics and quick actions.

**Requirements:**
- Statistics cards (total projects, active tests, recent runs, storage usage)
- Recent activity feed (latest 10 items)
- Quick action buttons (Create Test, Generate Graph, etc.)
- Navigation sidebar with active state highlighting
- Mobile responsive design
- Server Components with loading states

**Acceptance Criteria:**
- [ ] Dashboard displays all statistics correctly
- [ ] Activity feed shows real-time data
- [ ] Quick actions navigate to correct pages
- [ ] Sidebar highlights current page
- [ ] Mobile drawer works properly
- [ ] Loading skeletons display during data fetch
- [ ] All links functional

**Estimated Effort:** 4 SP

**Files to Create/Modify:**
- `/src/app/(dashboard)/dashboard/page.tsx`
- `/src/components/dashboard/stats-card.tsx`
- `/src/components/dashboard/activity-feed.tsx`
- `/src/lib/actions/dashboard.ts`

**Related Documentation:**
- `/docs/development/PAGES_STRUCTURE_AND_FUNCTIONALITY.md` (Lines 153-208)

---

### 2. Navigation Component with Sidebar

**Title:** Implement Global Navigation Sidebar Component

**Labels:** `enhancement`, `sprint-2`, `ui-component`, `priority-high`

**Description:**
Create reusable navigation sidebar component with icons, active states, and mobile responsiveness.

**Requirements:**
- Sidebar with all main routes (Dashboard, Projects, Tests, Profile, Admin)
- Active state highlighting
- Mobile responsive drawer
- User profile dropdown with theme toggle
- Organization switcher (for future multi-tenancy)
- Collapsible on desktop

**Acceptance Criteria:**
- [ ] Sidebar shows all navigation items with icons
- [ ] Active page highlighted correctly
- [ ] Mobile drawer opens/closes smoothly
- [ ] User dropdown shows profile actions
- [ ] Theme toggle works (light/dark/system)
- [ ] Keyboard navigation supported
- [ ] ARIA labels for accessibility

**Estimated Effort:** 3 SP

**Files to Create/Modify:**
- `/src/components/layout/sidebar.tsx`
- `/src/components/layout/mobile-nav.tsx`
- `/src/components/layout/user-dropdown.tsx`
- `/src/app/(dashboard)/layout.tsx`

**Related Documentation:**
- `/docs/development/PAGES_STRUCTURE_AND_FUNCTIONALITY.md` (Lines 869-894)

---

### 3. Core UI Components from shadcn/ui

**Title:** Install and Configure Additional shadcn/ui Components

**Labels:** `enhancement`, `sprint-2`, `ui-component`, `priority-medium`

**Description:**
Install missing shadcn/ui components needed for Sprint 2 development.

**Components to Install:**
- `dialog` - For modals (test detail preview, share link, etc.)
- `badge` - For status indicators (already installed, verify)
- `avatar` - For user profiles
- `alert` - For notifications and warnings
- `separator` - For section dividers
- `scroll-area` - For scrollable content
- `command` - For search/command palette (future)
- `popover` - For tooltips and help text
- `switch` - For toggle settings
- `checkbox` - For multi-select forms

**Acceptance Criteria:**
- [ ] All components installed via `pnpm dlx shadcn@latest add [component]`
- [ ] Components imported and working in example pages
- [ ] TypeScript types correct
- [ ] Dark mode styles verified
- [ ] Documentation added to `/docs/development/SHADCN_INTEGRATION_STRATEGY.md`

**Estimated Effort:** 2 SP (1 hour each for installation and testing)

**Commands:**
```bash
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add avatar
pnpm dlx shadcn@latest add alert
pnpm dlx shadcn@latest add separator
pnpm dlx shadcn@latest add scroll-area
pnpm dlx shadcn@latest add popover
pnpm dlx shadcn@latest add switch
pnpm dlx shadcn@latest add checkbox
```

**Related Documentation:**
- `/docs/development/SHADCN_INTEGRATION_STRATEGY.md` (Lines 919-940)

---

### 4. Dashboard Statistics Backend

**Title:** Implement Server Actions for Dashboard Statistics

**Labels:** `enhancement`, `sprint-2`, `backend`, `priority-high`

**Description:**
Create server actions to fetch dashboard statistics efficiently.

**Requirements:**
- Get project count by organization
- Get active tests count (status = 'running' or 'ready')
- Get recent test runs (last 10)
- Calculate storage usage
- Get test success rate (last 30 days)
- Optimize with database queries (no N+1)

**Acceptance Criteria:**
- [ ] All statistics queries optimized with proper indexes
- [ ] Server actions return typed data
- [ ] Error handling implemented
- [ ] Caching strategy defined (Next.js cache)
- [ ] Unit tests written for calculations
- [ ] Performance < 500ms for all queries

**Estimated Effort:** 4 SP

**Files to Create/Modify:**
- `/src/lib/actions/dashboard.ts`
- `/src/lib/db/queries/statistics.ts`
- `/src/types/dashboard.ts`

**Database Queries:**
```typescript
// Example
SELECT COUNT(*) FROM projects WHERE organization_id = ?
SELECT COUNT(*) FROM pressure_tests WHERE status IN ('running', 'ready')
SELECT * FROM test_runs ORDER BY created_at DESC LIMIT 10
SELECT SUM(file_size) FROM file_uploads WHERE organization_id = ?
```

**Related Documentation:**
- `/docs/development/PAGES_STRUCTURE_AND_FUNCTIONALITY.md` (Lines 193-200)

---

### 5. Recent Activity Feed Component

**Title:** Implement Recent Activity Feed with Real-time Updates

**Labels:** `enhancement`, `sprint-2`, `dashboard`, `priority-medium`

**Description:**
Create activity feed component showing recent test runs, graph generations, and user actions.

**Requirements:**
- Display last 10 activities
- Activity types: test created, test run, graph generated, project created
- Show user avatar, action description, timestamp
- Relative time display (e.g., "2 hours ago")
- Link to related resource (test, project, etc.)
- Auto-refresh every 30 seconds (optional for MVP)
- Empty state when no activities

**Acceptance Criteria:**
- [ ] Activity feed displays correctly
- [ ] Timestamps show relative time using formatRelativeTime()
- [ ] User avatars display or show initials
- [ ] Links navigate to correct pages
- [ ] Empty state shown when no data
- [ ] Skeleton loader during fetch
- [ ] Mobile responsive design

**Estimated Effort:** 3 SP

**Files to Create/Modify:**
- `/src/components/dashboard/activity-feed.tsx`
- `/src/components/dashboard/activity-item.tsx`
- `/src/lib/actions/activities.ts`
- `/src/types/activity.ts`

**Related Documentation:**
- `/docs/development/PAGES_STRUCTURE_AND_FUNCTIONALITY.md` (Lines 162-167)

---

### 6. Dashboard Charts and Visualizations

**Title:** Implement Dashboard Charts (Test Success Rate)

**Labels:** `enhancement`, `sprint-2`, `dashboard`, `visualization`, `priority-low`

**Description:**
Add charts to dashboard showing test success rate and trends using Recharts or ECharts.

**Requirements:**
- Test success rate chart (last 30 days)
- Line chart showing pass/fail trends
- Storage usage over time (optional)
- Responsive chart sizing
- Dark mode compatible colors
- Tooltip on hover showing exact values

**Acceptance Criteria:**
- [ ] Chart displays test success rate correctly
- [ ] Data fetched from backend efficiently
- [ ] Chart responsive on mobile
- [ ] Dark mode colors work properly
- [ ] Tooltips show detailed information
- [ ] Loading state during data fetch
- [ ] Empty state when no data

**Estimated Effort:** 4 SP

**Files to Create/Modify:**
- `/src/components/dashboard/success-rate-chart.tsx`
- `/src/components/dashboard/storage-usage-chart.tsx`
- `/src/lib/actions/analytics.ts`

**Library Decision:**
- Use ECharts (already installed and documented in `/docs/development/ECharts_vs_echarts-for-react.md`)

**Related Documentation:**
- `/docs/development/PAGES_STRUCTURE_AND_FUNCTIONALITY.md` (Lines 181-184)
- `/docs/development/ECharts_vs_echarts-for-react.md`

---

## Sprint 2 Milestone

**Name:** Sprint 2 - Foundation & Core UI

**Due Date:** 2025-12-01 (2 weeks from 2025-11-17)

**Description:**
Complete the foundation of Pressograph 2.0 with dashboard, navigation, and core UI components.

**Goals:**
- Implement fully functional dashboard page
- Create reusable navigation component
- Install all required shadcn/ui components
- Build activity feed and statistics display
- Add basic data visualization

**Total Story Points:** 20 SP (manageable for 2-week sprint)

**Issues Included:**
1. Dashboard Page Implementation (4 SP)
2. Navigation Sidebar Component (3 SP)
3. shadcn/ui Components Installation (2 SP)
4. Dashboard Statistics Backend (4 SP)
5. Recent Activity Feed (3 SP)
6. Dashboard Charts (4 SP)

---

## V1 Issues to Review and Close

Based on the route migration analysis and current state, the following v1 issues should be reviewed:

### Issues Related to `/history` Route

**Action:** Close as completed or migrate to v2.0 scope

**Reason:** The `/history` route functionality is now replaced by:
- `/tests` - Global test list (replaces history table)
- `/tests/[id]` - Test detail page (replaces history preview modal)
- `/tests/[id]/runs` - Test execution history

**Migration Note:** Add redirect from `/history` to `/tests` in Next.js middleware or route handler.

### Issues Related to Graph Generation

**Action:** Keep open and assign to Sprint 3 or later

**Reason:** Graph generation with ECharts is planned for Sprint 4-5 according to roadmap.

---

## Issue Creation Commands

Since GitHub CLI (`gh`) is not installed in the development container, issues should be created manually via the GitHub web interface OR by installing `gh` first:

### Install GitHub CLI (Optional)

```bash
# In the container as root
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null
apt update
apt install gh

# Authenticate
gh auth login
```

### Create Issues via GitHub API (Alternative)

If `gh` CLI is available, issues can be created using GraphQL:

```bash
gh api graphql -f query='
  mutation {
    createIssue(input: {
      repositoryId: "REPO_ID"
      title: "Implement Dashboard Page with Overview Statistics"
      body: "SEE DESCRIPTION ABOVE"
      labelIds: ["enhancement", "sprint-2", "dashboard"]
    }) {
      issue {
        url
      }
    }
  }
'
```

### Manual Creation via Web UI

1. Navigate to https://github.com/dantte-lp/pressograph/issues/new
2. Copy title and description from sections above
3. Add appropriate labels
4. Assign to Sprint 2 milestone
5. Set priority and story points in project board

---

## Next Steps

1. **Push commits to GitHub:**
   ```bash
   git push origin master
   ```
   Note: Authentication required (SSH key or personal access token)

2. **Create Sprint 2 milestone** on GitHub with due date 2025-12-01

3. **Create all 6 issues** listed above using web UI or `gh` CLI

4. **Assign issues to Sprint 2 milestone**

5. **Update project board** with new issues in "To Do" column

6. **Start development** with highest priority issues:
   - Dashboard Page Implementation
   - Navigation Sidebar Component
   - Dashboard Statistics Backend

---

## Summary

**Completed:**
- ✅ Fixed all hydration errors (12+ instances across 5 files)
- ✅ Created date formatting utilities
- ✅ Made 6 atomic commits
- ✅ Updated CHANGELOG.md

**Ready for Push:**
- 6 commits ready to push to `master` branch
- All tests passing (hydration errors resolved)

**Next Sprint 2 Tasks:**
- Dashboard implementation (20 SP total)
- Navigation component
- Core UI components
- Backend statistics

**Estimated Timeline:**
- Sprint 2: 2025-11-17 to 2025-12-01 (2 weeks)
- Daily standup recommended to track progress

---

**Document Created:** 2025-11-07
**Author:** Claude (AI Development Assistant)
**Repository:** https://github.com/dantte-lp/pressograph
**Branch:** master
