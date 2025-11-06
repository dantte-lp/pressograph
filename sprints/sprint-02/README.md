# Sprint 2: Authentication & Core UI
**Duration:** 2025-11-17 to 2025-12-01 (2 weeks)
**Sprint Goal:** Complete authentication system and establish core UI framework
**Planned Story Points:** 40 SP

## Sprint Goals
1. Fix remaining Next.js 15 build issues
2. Complete NextAuth integration with Drizzle ORM
3. Implement comprehensive theme system (light/dark)
4. Build core UI component library
5. Create dashboard layout and navigation
6. Implement user profile and settings pages

## Story Points
- **Planned:** 40 SP
- **Completed:** 0
- **Remaining:** 40
- **Additional Tech Debt:** 2 SP (Issue #83 - TypeScript errors)

## Prerequisites from Sprint 1
- [x] Next.js 15.5.6 build working
- [x] Database schema finalized with Drizzle ORM
- [x] Development environment stable on dev-pressograph.infra4.dev
- [x] Valkey cache integration complete
- [x] Theme system with SSR implemented
- [x] Basic shadcn/ui components installed

## Sprint Backlog

### High Priority (Must Have)
- [ ] Fix Html import build error (1 SP) - Issue #69
- [ ] Fix TypeScript errors in theme and database schema (2 SP) - Issue #83 [TECH DEBT]
- [ ] Implement Drizzle-compatible auth queries (3 SP) - Issue #70
- [ ] Theme context provider with persistence (3 SP) - Issue #71
- [ ] Dark/Light mode toggle component (2 SP) - Issue #72
- [ ] Base button components with variants (2 SP) - Issue #73
- [ ] Form input components with validation (3 SP) - Issue #74
- [ ] Card and container components (2 SP) - Issue #75
- [ ] Dashboard layout with sidebar (4 SP) - Issue #76
- [ ] Main navigation component (3 SP) - Issue #77

### Medium Priority (Should Have)
- [ ] User profile page with edit capability (5 SP) - Issue #78
- [ ] Settings page with preferences (4 SP) - Issue #79
- [ ] Toast notification system (2 SP) - Issue #80
- [ ] Loading states and skeletons (2 SP) - Issue #81
- [ ] Error boundary implementation (2 SP) - Issue #82

### Low Priority (Nice to Have)
- [ ] Animated page transitions (2 SP)
- [ ] Breadcrumb navigation (1 SP)
- [ ] Search component (3 SP)
- [ ] Keyboard shortcuts (2 SP)

## Technical Debt from Sprint 1
1. **ESLint Configuration:** Circular reference in flat config
2. **Auth System:** CredentialsProvider commented out
3. **Build Process:** Static generation Html import error
4. **TypeScript:** Some `any` types used for quick fixes

## Success Criteria
- [ ] Production build completes without errors
- [ ] User can sign in via OAuth (GitHub/Google)
- [ ] Theme persists across sessions
- [ ] All core UI components have dark mode variants
- [ ] Dashboard renders with responsive layout
- [ ] User profile data displays and updates
- [ ] 90%+ TypeScript type coverage
- [ ] Zero accessibility violations (WCAG 2.1 AA)

## Technical Considerations

### Authentication
- Migrate from Prisma adapter to Drizzle adapter
- Implement session management with Valkey
- Add role-based access control (RBAC)
- Email verification flow

### UI Components
- Use Radix UI primitives for accessibility
- Implement CVA for component variants
- Follow compound component patterns
- Ensure all components support dark mode

### Performance Targets
- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Bundle size < 250KB (initial)

## Risk Mitigation
| Risk | Impact | Mitigation |
|------|--------|------------|
| Drizzle adapter complexity | High | Research examples, fallback to JWT sessions |
| Dark mode edge cases | Medium | Test thoroughly, use CSS variables |
| OAuth provider issues | Medium | Test in staging, have fallback auth |
| Component library scope creep | Medium | Focus on essential components only |

## Dependencies
- NextAuth Drizzle adapter documentation
- Radix UI component library
- CVA (Class Variance Authority)
- Zod for validation schemas

## Sprint Ceremonies
- **Planning:** 2025-11-17 (after Sprint 1 retro)
- **Daily Standups:** 10:00 UTC
- **Review:** 2025-12-01
- **Retrospective:** 2025-12-01

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests written (where applicable)
- [ ] Documentation updated
- [ ] Accessibility tested
- [ ] Dark mode tested
- [ ] Mobile responsive tested
- [ ] Build passes without warnings
- [ ] Deployed to staging environment

## Notes
- Focus on production-ready authentication first
- UI components should be reusable across projects
- Prioritize accessibility from the start
- Keep bundle size in check
- Document component usage with examples

## GitHub Tracking
- Milestone: [Sprint 2 - Authentication & Core UI](https://github.com/dantte-lp/pressograph/milestone/10)
- Labels: `sprint:2`, `authentication`, `ui-components`
- Project Board: Pressograph v2.0

---
*Sprint begins after Sprint 1 completion and retrospective*
*Last updated: 2025-11-06*

## Carried Over from Sprint 1
- [ ] Drizzle Studio Routing (3 SP) - Issue #46
- [ ] Fix TypeScript type inconsistencies (theme vs themePreference)