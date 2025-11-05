# Next Actions - Pressograph 2.0

## Current Status (November 5, 2025)
- **Sprint 1 Progress:** 70% complete (19/27 SP)
- **Development Server:** Running successfully on port 3001
- **Database:** All 13 tables created and verified
- **Authentication:** Backend configured, UI pending
- **UI Foundation:** Providers implemented, components ready

## Immediate Next Steps

### 1. Authentication UI Implementation (Priority: HIGH)
**Story Points:** 4
**Files to Create:**
- `/src/app/(auth)/login/page.tsx` - Login page with form
- `/src/app/(auth)/register/page.tsx` - Registration page
- `/src/app/api/auth/register/route.ts` - Registration API endpoint
- `/src/middleware.ts` - Protected route middleware

**Requirements:**
- Use React Hook Form for form handling
- Zod validation for input
- bcrypt for password hashing
- Show loading states during auth
- Error handling with toast notifications

### 2. Dashboard Shell (Priority: HIGH)
**Story Points:** 3
**Files to Create:**
- `/src/app/dashboard/layout.tsx` - Dashboard layout with sidebar
- `/src/app/dashboard/page.tsx` - Dashboard home
- `/src/components/dashboard/sidebar.tsx` - Navigation sidebar
- `/src/components/dashboard/user-nav.tsx` - User dropdown menu

**Requirements:**
- Protected routes (require authentication)
- Responsive sidebar navigation
- User profile dropdown
- Breadcrumb navigation

### 3. Theme Toggle Component (Priority: MEDIUM)
**Story Points:** 1
**Files to Create:**
- `/src/components/theme-toggle.tsx` - Theme switcher UI

**Requirements:**
- Sun/Moon icons from lucide-react
- Dropdown with light/dark/system options
- Keyboard accessible
- Persist preference in localStorage

### 4. i18n Setup (Priority: MEDIUM)
**Story Points:** 5
**Tasks:**
- Install next-intl package
- Configure middleware for locale detection
- Create translation files (en/ru)
- Add language switcher component

### 5. Complete GitHub Issues
**Close when ready:**
- #45 - Traefik secure access (verified working)
- #46 - Drizzle Studio routing (configured, needs studio start)

**Update with progress:**
- #37 - NextAuth configuration (60% complete)
- #38 - Theme Provider (70% complete)

## Testing Checklist
- [ ] Login flow works end-to-end
- [ ] Registration creates user in database
- [ ] Protected routes redirect to login
- [ ] Theme toggle persists on refresh
- [ ] Dark mode applies to all components
- [ ] Session management works
- [ ] Logout clears session

## Commands Reference

### Start Development Server
```bash
podman exec -u developer -w /workspace pressograph-dev-workspace pnpm dev
```

### Run Database Migrations
```bash
podman exec -u developer -w /workspace pressograph-dev-workspace pnpm db:push
```

### Start Drizzle Studio
```bash
podman exec -u developer -w /workspace pressograph-dev-workspace pnpm db:studio
```

### Fix Permission Issues
```bash
podman exec -u root pressograph-dev-workspace chown -R developer:developer /workspace/src
```

## Known Issues
1. Dev server occasionally uses port 3001 when 3000 is occupied
2. Permission errors may occur when files are created with wrong ownership
3. Turbopack warnings about Webpack configuration (can be ignored)

## Environment Variables Required
Ensure these are set in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for NextAuth
- `NEXTAUTH_URL` - Application URL
- `VALKEY_URL` - Redis/Valkey connection string

## Sprint 1 Remaining Work
- Authentication UI (4 SP)
- Dashboard shell (3 SP)
- i18n implementation (5 SP)
- Testing and documentation (3 SP)

**Target Completion:** November 17, 2025
**Current Velocity:** Ahead of schedule