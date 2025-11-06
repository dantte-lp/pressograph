# Sprint 2: Authentication & Core UI - Detailed Plan

**Sprint Period:** 2025-11-17 to 2025-12-01 (2 weeks)
**Sprint Goal:** Complete authentication system and establish core UI framework
**GitHub Milestone:** [Sprint 2 - Authentication & Core UI](https://github.com/dantte-lp/pressograph/milestone/10) (to be created)

---

## Sprint Overview

### Sprint Objectives

1. Fix remaining Next.js 15 build issues
2. Complete NextAuth integration with Drizzle adapter
3. Implement comprehensive theme system
4. Build core UI component library
5. Create dashboard layout and navigation
6. Implement user profile and settings pages

### Sprint Statistics

- **Planned Story Points:** 40 SP (target capacity)
- **High Priority (Must Have):** 23 SP
- **Medium Priority (Should Have):** 15 SP
- **Low Priority (Nice to Have):** 8 SP
- **Technical Debt:** 8 SP
- **Total Capacity:** 40 SP
- **Buffer:** 0 SP

**Sprint Status:** ⏸️ Planned (starts after Sprint 1 completion)

---

## Prerequisites from Sprint 1

### Must Be Completed

- [x] Next.js 15.5.6 build fully working
- [ ] Database schema finalized
- [ ] Development environment stable
- [ ] GitHub issues organized
- [ ] Sprint 1 retrospective completed

### Risks if Prerequisites Not Met

- **Build Issues:** Will delay all frontend work
- **Database Schema:** May require rework of auth integration
- **Unstable Environment:** Will impact developer productivity
- **Missing Issues:** Will cause sprint planning delays

---

## Task Breakdown

### High Priority Tasks (Must Have) - 23 SP

These tasks are critical for sprint success and must be completed.

| ID | Task | Issue | Priority | SP | Dependencies | Status |
|----|------|-------|----------|----|--------------|--------|
| S02-T001 | Fix Html import build error | TBD | P0 | 1 | None | 📝 Need to create |
| S02-T002 | Drizzle-compatible auth queries | TBD | P0 | 3 | S01-T003 | 📝 Need to create |
| S02-T003 | Theme context with persistence | TBD | P0 | 3 | S01-T004 | 📝 Need to create |
| S02-T004 | Dark/Light mode toggle | TBD | P1 | 2 | S02-T003 | 📝 Need to create |
| S02-T005 | Base button components | TBD | P1 | 2 | None | 📝 Need to create |
| S02-T006 | Form input components | TBD | P1 | 3 | None | 📝 Need to create |
| S02-T007 | Card and container components | TBD | P1 | 2 | None | 📝 Need to create |
| S02-T008 | Dashboard layout with sidebar | TBD | P1 | 4 | S02-T005 | 📝 Need to create |
| S02-T009 | Main navigation component | TBD | P1 | 3 | S02-T008 | 📝 Need to create |

### Medium Priority Tasks (Should Have) - 15 SP

These tasks are important but can be deferred if capacity issues arise.

| ID | Task | Issue | Priority | SP | Dependencies | Status |
|----|------|-------|----------|----|--------------|--------|
| S02-T010 | User profile page with edit | TBD | P2 | 5 | S02-T008 | 📝 Need to create |
| S02-T011 | Settings page with preferences | TBD | P2 | 4 | S02-T008 | 📝 Need to create |
| S02-T012 | Toast notification system | TBD | P2 | 2 | None | 📝 Need to create |
| S02-T013 | Loading states and skeletons | TBD | P2 | 2 | None | 📝 Need to create |
| S02-T014 | Error boundary implementation | TBD | P2 | 2 | None | 📝 Need to create |

### Low Priority Tasks (Nice to Have) - 8 SP

These tasks can be deferred to Sprint 3 or backlog.

| ID | Task | Issue | Priority | SP | Dependencies | Status |
|----|------|-------|----------|----|--------------|--------|
| S02-T015 | Animated page transitions | TBD | P3 | 2 | S02-T008 | 📝 Need to create |
| S02-T016 | Breadcrumb navigation | TBD | P3 | 1 | S02-T008 | 📝 Need to create |
| S02-T017 | Search component | TBD | P3 | 3 | None | 📝 Need to create |
| S02-T018 | Keyboard shortcuts | TBD | P3 | 2 | None | 📝 Need to create |

### Technical Debt from Sprint 1 - 8 SP

Technical debt that accumulated in Sprint 1 and must be addressed.

| ID | Task | Priority | SP | Status |
|----|------|----------|----|--------|
| S02-TD01 | Fix ESLint circular reference | P2 | 2 | 📝 Need to create |
| S02-TD02 | Implement CredentialsProvider | P1 | 3 | 📝 Need to create |
| S02-TD03 | Fix static generation Html import | P0 | 1 | Same as S02-T001 |
| S02-TD04 | Replace `any` types with proper types | P2 | 2 | 📝 Need to create |

---

## Detailed Task Specifications

### S02-T001: Fix Html import build error

**Priority:** P0 (Critical)
**Estimate:** 1 SP
**Status:** 📝 Need to create issue

#### Problem Statement
Next.js production build fails with Html import error during static generation.

#### Acceptance Criteria
- [ ] Production build completes without errors
- [ ] Static pages generate successfully
- [ ] No runtime errors in production

#### Implementation Steps
1. Identify the Html import issue in build logs (30m)
2. Fix the import statement (30m)
3. Test production build (30m)
4. Verify static generation (30m)

---

### S02-T002: Drizzle-compatible auth queries

**Priority:** P0 (Critical)
**Estimate:** 3 SP
**Status:** 📝 Need to create issue
**Dependencies:** S01-T003 (NextAuth Configuration)

#### Problem Statement
Migrate from Prisma-style queries to Drizzle ORM for NextAuth operations.

#### Acceptance Criteria
- [ ] All NextAuth queries use Drizzle ORM
- [ ] User CRUD operations working
- [ ] Session management working
- [ ] Account linking working
- [ ] No Prisma dependencies remaining

#### Implementation Steps
1. Create Drizzle query utilities (2h)
2. Implement user operations (2h)
3. Implement session operations (2h)
4. Implement account operations (1h)
5. Test all auth flows (1h)

---

### S02-T008: Dashboard layout with sidebar

**Priority:** P1 (High)
**Estimate:** 4 SP
**Status:** 📝 Need to create issue
**Dependencies:** S02-T005 (Button Components)

#### Problem Statement
Create responsive dashboard layout with collapsible sidebar for main application interface.

#### Acceptance Criteria
- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Collapsible sidebar with state persistence
- [ ] Breadcrumb navigation
- [ ] User menu in header
- [ ] Theme toggle in header
- [ ] Sidebar highlights active route
- [ ] WCAG 2.1 AA compliant

#### Implementation Steps
1. Create layout component structure (2h)
2. Implement sidebar component (3h)
3. Implement header component (2h)
4. Add responsive behavior (2h)
5. Add accessibility features (1h)
6. Test on all breakpoints (1h)

---

### S02-T010: User profile page with edit

**Priority:** P2 (Medium)
**Estimate:** 5 SP
**Status:** 📝 Need to create issue
**Dependencies:** S02-T008 (Dashboard Layout)

#### Problem Statement
Create user profile page where users can view and edit their information.

#### Acceptance Criteria
- [ ] Display user information (name, email, avatar)
- [ ] Edit form with validation
- [ ] Avatar upload functionality
- [ ] Password change form
- [ ] Email change form (with verification)
- [ ] Success/error notifications
- [ ] Optimistic UI updates

#### Implementation Steps
1. Create profile page layout (1h)
2. Implement profile display (2h)
3. Implement edit form (3h)
4. Add avatar upload (2h)
5. Add password change (2h)
6. Add email change (2h)
7. Test all flows (1h)

---

## Sprint Planning

### Capacity Allocation

**Total Capacity:** 40 SP

**Allocation Strategy:**
- High Priority (Must Have): 23 SP (58%)
- Medium Priority (Should Have): 15 SP (37%)
- Low Priority (Nice to Have): Defer to backlog
- Technical Debt: 2 SP (5%) - only critical debt

**Adjusted Sprint Backlog:**
- High Priority: 23 SP
- Medium Priority (selected): 13 SP (defer S02-T010 or S02-T011 if needed)
- Technical Debt: 2 SP (S02-T001, S02-TD02)
- Buffer: 2 SP

**Total Committed:** 38 SP (allows 2 SP buffer)

---

## Success Criteria

### Sprint Success

- [ ] 95%+ story points completed (38/40 SP minimum)
- [ ] All P0 tasks completed
- [ ] All P1 tasks completed
- [ ] At least 50% of P2 tasks completed
- [ ] No critical bugs in production

### Technical Success

- [ ] Production build completes without errors
- [ ] User can sign in via OAuth (GitHub/Google)
- [ ] Theme persists across sessions
- [ ] All core UI components have dark mode variants
- [ ] Dashboard renders with responsive layout
- [ ] User profile data displays and updates
- [ ] 90%+ TypeScript type coverage
- [ ] Zero accessibility violations (WCAG 2.1 AA)

### Performance Targets

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Bundle size < 250KB (initial)

---

## Sprint Risks

### Critical Risks

| Risk ID | Description | Probability | Impact | Mitigation |
|---------|-------------|------------|--------|------------|
| R-S02-001 | Drizzle adapter compatibility issues | Medium | High | Research examples, fallback to JWT sessions |
| R-S02-002 | Dark mode edge cases | Medium | Medium | Test thoroughly, use CSS variables |
| R-S02-003 | OAuth provider issues | Medium | Medium | Test in staging, have fallback auth |
| R-S02-004 | Component library scope creep | High | Medium | Focus on essential components only |

### Mitigation Actions

1. **Week 1:**
   - Complete all P0 tasks
   - Test OAuth flows thoroughly
   - Establish dark mode CSS variable system

2. **Week 2:**
   - Complete dashboard layout
   - Implement profile page
   - Reserve last 2 days for bug fixes

---

## Sprint Ceremonies

### Sprint Planning
- **Date:** 2025-11-17 (after Sprint 1 retro)
- **Duration:** 2 hours
- **Agenda:**
  - Review Sprint 1 outcomes
  - Refine Sprint 2 backlog
  - Commit to sprint goal

### Daily Standups
- **Time:** 10:00 UTC (async)
- **Format:** Daily log file in `/sprints/sprint-02/daily/`

### Sprint Review
- **Date:** 2025-12-01
- **Duration:** 1 hour
- **Agenda:** Demo completed work

### Sprint Retrospective
- **Date:** 2025-12-01
- **Duration:** 1 hour
- **Agenda:** What went well? What didn't? What to improve?

---

## Definition of Done

A task is "Done" when:

**Code Complete:**
- [ ] Code written and follows coding standards
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no warnings
- [ ] No console errors

**Tested:**
- [ ] Unit tests written and passing (where applicable)
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Accessibility tested

**Reviewed:**
- [ ] Code self-reviewed
- [ ] Acceptance criteria verified

**Documented:**
- [ ] Code comments added (JSDoc)
- [ ] Documentation updated (if needed)

**Deployed:**
- [ ] Committed with conventional commit message
- [ ] Merged to main branch
- [ ] Deployed to dev environment
- [ ] Verified in dev environment

---

## Related Documents

- [Sprint 2 README](./README.md)
- [Development Roadmap](/opt/projects/repositories/pressograph/docs/planning/DEVELOPMENT_ROADMAP.md)
- [Sprint 1 Plan](../sprint-01/PLAN.md)

---

**Created:** 2025-11-06
**Status:** Draft - Pending Sprint 1 completion
**Next Update:** 2025-11-17 (Sprint Planning)
