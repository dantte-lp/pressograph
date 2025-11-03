# Sprint 2: Authentication & Core UI
**Dates:** 2025-11-17 → 2025-12-01 (2 weeks)
**Goal:** Complete authentication system and establish core UI framework

## Sprint Goals
1. Fix remaining Next.js 15 build issues
2. Complete NextAuth integration with Drizzle ORM
3. Implement comprehensive theme system (light/dark)
4. Build core UI component library
5. Create dashboard layout and navigation
6. Implement user profile and settings pages

## Story Points
- **Planned:** TBD (after Sprint 1 retrospective)
- **Completed:** 0
- **Remaining:** TBD

## Prerequisites from Sprint 1
- [ ] Next.js 15.5.6 build fully working
- [ ] Database schema finalized
- [ ] Development environment stable
- [ ] GitHub issues organized

## Sprint Backlog

### High Priority (Must Have)
- [ ] Fix Html import build error (1 SP)
- [ ] Implement Drizzle-compatible auth queries (3 SP)
- [ ] Theme context provider with persistence (3 SP)
- [ ] Dark/Light mode toggle component (2 SP)
- [ ] Base button components with variants (2 SP)
- [ ] Form input components with validation (3 SP)
- [ ] Card and container components (2 SP)
- [ ] Dashboard layout with sidebar (4 SP)
- [ ] Main navigation component (3 SP)

### Medium Priority (Should Have)
- [ ] User profile page with edit capability (5 SP)
- [ ] Settings page with preferences (4 SP)
- [ ] Toast notification system (2 SP)
- [ ] Loading states and skeletons (2 SP)
- [ ] Error boundary implementation (2 SP)

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
*Last updated: 2025-11-03*