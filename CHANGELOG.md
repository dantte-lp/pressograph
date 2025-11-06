# Changelog

All notable changes to the Pressograph project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Authentication Pages (2025-11-07)
- **Created:** Complete authentication flow with sign-in and error pages
  - **Sign-in Page:** `/opt/projects/repositories/pressograph/src/app/auth/signin/page.tsx`
    - Clean, centered layout with Pressograph branding
    - Credentials-based authentication (username/password)
    - Dynamic rendering with Suspense support
    - Callback URL support for post-login redirects
    - Footer with terms and privacy policy links
    - Test credentials hint in development mode
  - **Sign-in Form Component:** `/opt/projects/repositories/pressograph/src/components/auth/signin-form.tsx`
    - Client-side form with React state management
    - NextAuth.js credentials provider integration
    - Real-time validation and error handling
    - Toast notifications for success/error states
    - Loading state with spinner during authentication
    - Accessible form with proper labels and ARIA attributes
    - Test credentials display in development
  - **Error Page:** `/opt/projects/repositories/pressograph/src/app/auth/error/page.tsx`
    - Comprehensive error handling for all NextAuth error types
    - User-friendly error messages for 12+ error scenarios
    - Call-to-action buttons (Try Again, Return to Home)
    - Professional error display with shadcn/ui Card components
    - Support contact information
  - **Technical Features:**
    - Suspense boundary for useSearchParams hook
    - Dynamic rendering (force-dynamic) to prevent static generation issues
    - Window.location.href for post-auth redirects (TypeScript strict routing)
    - Session management with NextAuth React hooks
    - Sonner toast notifications integration
    - Lucide icons for visual feedback
  - **Status:** ✅ Authentication pages complete and tested

#### shadcn/ui Integration Strategy Documentation (2025-11-07)
- **Created:** Comprehensive shadcn/ui integration strategy document
  - **Document:** `docs/development/SHADCN_INTEGRATION_STRATEGY.md` (800+ lines)
  - **Analysis Completed:**
    - Studied 10 official shadcn/ui documentation URLs via WebFetch
    - Analyzed current implementation (components.json, CSS, theme system)
    - Assessed compatibility with Next.js 16.0.1 + React 19.2.0 + Tailwind v4.1.16
    - Verified all 14 installed UI components
  - **Key Findings:**
    - ✅ Current implementation follows all shadcn/ui best practices
    - ✅ Fully compatible with latest stack (Next.js 16, React 19, Tailwind v4)
    - ✅ Proper configuration (new-york style, CSS variables, RSC enabled)
    - ✅ React 19 patterns implemented (no forwardRef in Button component)
    - ✅ Comprehensive theming with industrial design color palette
    - ✅ Dark mode properly configured with next-themes
    - ✅ No critical issues found - no migration needed
  - **Documentation Sections:**
    1. Executive Summary - Current state assessment and recommendations
    2. Current State Assessment - Detailed analysis of all configuration files
    3. Compatibility Analysis - Next.js 16, React 19, Tailwind v4 compatibility
    4. Installation & Setup - Complete setup process and component installation
    5. Theming Strategy - Color system, CSS variables, dark mode implementation
    6. Component Usage Patterns - Comprehensive examples for all components
    7. Form Integration - React Hook Form patterns with complete examples
    8. Best Practices - 8 categories of development best practices
    9. Migration Checklist - Optional enhancements (no required changes)
    10. Next.js 16 + React 19 Considerations - Modern patterns and features
    11. Troubleshooting - Common issues and solutions
    12. References - Links to all official documentation
  - **Resources Studied:**
    - shadcn/ui Next.js Installation Guide
    - components.json Configuration Reference
    - Theming Documentation
    - Dark Mode for Next.js Guide
    - CLI Commands Reference
    - Monorepo Setup Guide
    - Components Library Structure
    - React Hook Form Integration
    - TanStack Form Integration
    - Changelog and Recent Updates
  - **Technical Highlights:**
    - 14 components installed (Button, Card, Input, Select, Tabs, etc.)
    - Tailwind CSS v4 @theme inline directives configured
    - Industrial design color palette (light/dark themes)
    - Server Component support enabled
    - TypeScript strict mode compliant
    - Form validation ready (React Hook Form + Zod)
  - **Status:** ✅ Documentation complete, no implementation changes needed
  - **Next Steps:** Use document as team reference for future component additions

### Fixed

#### Critical Authentication and Routing Issues (2025-11-07)
- **Fixed:** Three critical authentication issues preventing proper access control
  - **Issue 1: Unauthenticated Dashboard Access** (неавторизованный пользователь может увидеть /dashboard)
    - **Problem:** Dashboard was accessible without authentication
    - **Security Risk:** Critical - anyone could view protected dashboard content
    - **Root Cause:** No server-side authentication check in dashboard layout
    - **Solution Applied:**
      - **File:** `/opt/projects/repositories/pressograph/src/app/(dashboard)/layout.tsx`
      - Added `getServerSession(authOptions)` to check authentication
      - Added redirect to `/auth/signin?callbackUrl=/dashboard` for unauthenticated users
      - Session check runs on every page load (server-side)
      - Protects all routes under (dashboard) group: /dashboard, /projects, /tests, /profile, /settings
    - **Status:** ✅ Dashboard now requires authentication

  - **Issue 2: Test Blocks Visible on Dashboard** (на странице /dashboard видны различные тестовые блоки)
    - **Problem:** Dashboard showed ToastDemo and LoadingDemo components
    - **Issue:** Test/demo components not suitable for production
    - **User Experience:** Confusing interface with non-functional test elements
    - **Solution Applied:**
      - **File:** `/opt/projects/repositories/pressograph/src/app/(dashboard)/dashboard/page.tsx`
      - Removed `<ToastDemo />` component
      - Removed `<LoadingDemo />` component
      - Removed imports for both demo components
      - Kept production-ready content: Quick Stats, Quick Actions, Recent Activity
      - Clean dashboard with only functional elements
    - **Status:** ✅ Dashboard shows only production content

  - **Issue 3: Sign In Redirect Error** (при переходе на 'Sign in' вижу переход на localhost:3000 и 404)
    - **Problem:** Sign In button redirected to `http://localhost:3000/login` causing 404
    - **Root Causes:**
      - NEXTAUTH_URL was set to `http://localhost:3000` instead of production domain
      - NextAuth config pointed to `/login` page that didn't exist
      - No sign-in page was created
    - **Solution Applied:**
      1. **Environment Configuration:**
         - **File:** `/opt/projects/repositories/pressograph/.env.local`
         - Changed `NEXTAUTH_URL=http://localhost:3000` to `NEXTAUTH_URL=https://dev-pressograph.infra4.dev`
         - Fixed domain to match production environment
      2. **NextAuth Configuration:**
         - **File:** `/opt/projects/repositories/pressograph/src/lib/auth/config.ts`
         - Changed `signIn: '/login'` to `signIn: '/auth/signin'`
         - Changed `signOut: '/logout'` to `signOut: '/auth/signout'`
         - Updated pages configuration to match new routes
      3. **Created Authentication Pages:**
         - Created `/src/app/auth/signin/page.tsx` (sign-in page)
         - Created `/src/components/auth/signin-form.tsx` (sign-in form)
         - Created `/src/app/auth/error/page.tsx` (error handling)
         - All pages use shadcn/ui components for consistency
    - **Status:** ✅ Sign In redirects correctly to production domain

#### Build Fixes (2025-11-07)
- **Fixed:** Build errors preventing successful compilation
  - **Issue 1: bcryptjs Import Error**
    - **Problem:** `/src/app/api/profile/password/route.ts` imported `bcryptjs` instead of `bcrypt`
    - **Error:** Module not found: Can't resolve 'bcryptjs'
    - **Solution:** Changed all `bcrypt` references from `bcryptjs` to `bcrypt` package
      - Changed import: `import { compare, hash } from 'bcrypt'`
      - Updated function calls: `bcrypt.compare` → `compare`, `bcrypt.hash` → `hash`
    - **Status:** ✅ Password API route now builds successfully

  - **Issue 2: .env.local Permission Error**
    - **Problem:** `.env.local` owned by root, unreadable by developer user
    - **Error:** EACCES: permission denied, open '/workspace/.env.local'
    - **Solution:** Fixed ownership and permissions
      - `chown developer:developer .env.local`
      - `chmod 644 .env.local`
    - **Status:** ✅ Environment variables now load correctly

  - **Issue 3: useSearchParams SSR Error**
    - **Problem:** Sign-in page failed static generation due to useSearchParams
    - **Error:** useSearchParams() should be wrapped in a suspense boundary
    - **Solution:** Added Suspense and dynamic rendering
      - Added `export const dynamic = 'force-dynamic'` to signin page
      - Wrapped `<SignInForm />` in `<Suspense>` boundary
      - Changed redirect to `window.location.href` for TypeScript strict routing
    - **Status:** ✅ Sign-in page builds and renders correctly

#### Header Menu - Authentication and Layout Issues (2025-11-07)
- **Fixed:** Header menu visibility and layout issues on landing page
  - **Issue 1:** Navigation menu (Projects, Tests, Dashboard) visible to unauthenticated users
    - **Problem:** Protected routes were exposed in UI without authentication check
    - **Security Risk:** UI elements visible without proper authentication state verification
    - **Root Cause:** Navigation rendering not conditional on session state
  - **Issue 2:** Header layout and spacing issues
    - **Problem:** Navigation positioned incorrectly causing visual issues
    - **Layout Issues:** Inconsistent spacing, improper flexbox alignment
    - **Mobile Issues:** Mobile menu button visible to unauthenticated users
  - **Solution Applied:**
    - **Component:** `/opt/projects/repositories/pressograph/src/components/layout/header.tsx`
    - **Changes Made:**
      1. Added authentication check: `const isAuthenticated = !!session`
      2. Wrapped desktop navigation in conditional: `{isAuthenticated && <nav>...</nav>}`
      3. Wrapped mobile menu in conditional: `{isAuthenticated && mobileMenuOpen && ...}`
      4. Wrapped mobile menu button in conditional: `{isAuthenticated && <button>...`
      5. Improved layout structure: Removed nested flex containers
      6. Fixed spacing: Changed from `gap-6` to `gap-3`, added proper padding
      7. Improved loading state: Changed skeleton from circle to rectangular button shape
      8. Added sign out callback URL: `signOut({ callbackUrl: '/' })`
      9. Enhanced responsive design: Added `mx-auto` and responsive padding
      10. Improved mobile menu styling: Added `bg-background` for better contrast
  - **Rendering Logic:**
    - **Unauthenticated Users See:**
      - Pressograph logo (clickable, links to home)
      - Theme toggle (sun/moon icon)
      - Sign In button
      - NO navigation menu
      - NO mobile menu button
    - **Authenticated Users See:**
      - Pressograph logo
      - Desktop navigation: Projects, Tests, Dashboard (hidden on mobile)
      - Theme toggle
      - User name (hidden on smaller screens, visible on lg+)
      - Sign Out button
      - Mobile menu button (shows hamburger icon on mobile)
      - Mobile navigation drawer (when menu button clicked)
  - **CSS Improvements:**
    - Simplified header structure: 3-column layout (Logo | Navigation | Actions)
    - Added `container mx-auto` for proper centering
    - Added responsive padding: `px-4 sm:px-6 lg:px-8`
    - Improved gap consistency: `gap-3` throughout
    - Better mobile menu styling: Added padding, proper spacing
  - **Security Notes:**
    - This is UI-level hiding only
    - Server-side route protection still required via middleware
    - NextAuth session check provides authentication state
  - **Testing Performed:**
    - Verified unauthenticated view: No navigation visible
    - Verified authenticated view: Full navigation visible
    - Tested mobile responsiveness
    - Tested theme toggle functionality
  - **Status:** ✅ Fixed - Header menu properly respects authentication state and layout improved

#### Bad Gateway Error - File Permission Issues (2025-11-07)
- **Fixed:** Second Bad Gateway error on dev-pressograph.infra4.dev during Sprint 2 session
  - **Issue:** Turbopack crash with "Permission denied (os error 13)" on `/workspace/src/app/api/profile`
  - **Root Cause:** Profile and Settings features created directories/files as root user instead of developer
  - **Symptoms:**
    - Turbopack panic during file watching
    - Dev server restarting continuously (18 restarts)
    - Fork issues in container (resource temporarily unavailable)
    - Bad Gateway response from Traefik
  - **Affected Directories:**
    - `/workspace/src/app/(dashboard)/profile/` - owned by root
    - `/workspace/src/app/(dashboard)/settings/` - owned by root
    - `/workspace/src/app/api/profile/` - owned by root with 700 permissions
    - `/workspace/src/components/ui/` - Several files owned by root
  - **Solution Applied:**
    1. Container restart to clear zombie processes and fork issues
    2. Fixed permissions as root user: `chown -R developer:developer /workspace/src/app/api/`
    3. Fixed ownership on dashboard routes
    4. Fixed ownership on UI components
  - **Result:**
    - Dev server stabilized after permissions fix
    - Turbopack successfully watching all directories
    - Site responding with HTTP 200 OK
    - Ready in 3.8s on restart
  - **Prevention:**
    - Always create files inside container as developer user
    - Use `podman exec -u developer` for file operations
    - Verify permissions after creating new directories
  - **Commands Used:**
    ```bash
    # Restart container to clear processes
    podman restart pressograph-dev-workspace

    # Fix permissions as root
    podman exec -u root pressograph-dev-workspace bash -c 'chown -R developer:developer /workspace/src/app/api/'
    ```
  - **Status:** ✅ Fully resolved - Site operational at https://dev-pressograph.infra4.dev

#### User Profile Page (Issue #78) - 2025-11-07
- **Implemented:** Comprehensive user profile management with security features
  - **Components Created:**
    - `ProfileForm` - Edit name and email with validation (`src/components/profile/profile-form.tsx`)
    - `PasswordChangeForm` - Secure password change with requirements (`src/components/profile/password-change-form.tsx`)
    - Profile page with both forms (`src/app/(dashboard)/profile/page.tsx`)
  - **API Routes:**
    - `GET/PATCH /api/profile` - Profile information management
    - `POST /api/profile/password` - Secure password change endpoint
  - **Features:**
    - Display user information (username, email, name, role, dates)
    - Edit profile form with client/server validation
    - Password change with security requirements:
      - Minimum 8 characters
      - Uppercase, lowercase, and numbers required
      - Current password verification
      - Password confirmation matching
      - Visual strength indicators
    - Password visibility toggles
    - Email uniqueness validation
    - Toast notifications for all actions
    - Loading states during operations
    - Dark mode support throughout
    - Accessible forms with ARIA attributes
  - **Security:**
    - Server-side authentication checks
    - Password hashing with bcryptjs
    - Current password verification before change
    - Prevention of password reuse
    - Email validation and uniqueness check
  - **Integration:**
    - Profile link added to sidebar navigation
    - Protected route configuration updated
    - NextAuth types extended (createdAt, lastLoginAt)
    - bcryptjs dependency added
  - **Files Created:**
    - `src/app/(dashboard)/profile/page.tsx`
    - `src/app/api/profile/route.ts`
    - `src/app/api/profile/password/route.ts`
    - `src/components/profile/profile-form.tsx`
    - `src/components/profile/password-change-form.tsx`
  - **Files Modified:**
    - `src/components/layout/sidebar.tsx` - Added profile link
    - `src/lib/auth/config.ts` - Extended session types
    - `src/lib/auth/server-auth.ts` - Added to protected routes
    - `package.json` - Added bcryptjs
  - **Status:** ✅ Completed (Issue #78 closed - 5 SP)

#### Settings Page (Issue #79) - 2025-11-07
- **Implemented:** Comprehensive application settings with tabbed interface
  - **Components Created:**
    - `AppearanceSettings` - Theme and language preferences (`src/components/settings/appearance-settings.tsx`)
    - `NotificationSettings` - Email and in-app notifications (`src/components/settings/notification-settings.tsx`)
    - `DisplaySettings` - Graph and UI preferences (`src/components/settings/display-settings.tsx`)
    - `Tabs` - Radix UI tabs component (`src/components/ui/tabs.tsx`)
    - Settings page with three tabs (`src/app/(dashboard)/settings/page.tsx`)
  - **API Routes:**
    - `GET/PATCH /api/preferences` - User preferences management
  - **Appearance Settings:**
    - Visual theme selector (Light/Dark/System) with icons
    - Language selection (English/Russian)
    - Instant theme application with SSR cookie support
  - **Notification Settings:**
    - Email notifications toggle
    - In-app notifications toggle
    - Clear descriptions for each type
    - ARIA-compliant toggle switches
  - **Display Settings:**
    - Graph export format selection (PNG/SVG/PDF)
    - Graph resolution slider (1x-4x)
    - Sidebar collapse preference
    - Visual format cards with icons
  - **Features:**
    - Auto-save on every change
    - Toast notifications for confirmations
    - Loading states while fetching/saving
    - Default preferences for new users
    - Database persistence via userPreferences table
    - Responsive design for all screens
    - Dark mode support throughout
    - Accessible with ARIA attributes
  - **Database Integration:**
    - Uses existing `userPreferences` table
    - Fields: themePreference, languagePreference, sidebarCollapsed, graphDefaultFormat, graphDefaultResolution, emailNotifications, inAppNotifications
  - **Files Created:**
    - `src/app/(dashboard)/settings/page.tsx`
    - `src/app/api/preferences/route.ts`
    - `src/components/settings/appearance-settings.tsx`
    - `src/components/settings/notification-settings.tsx`
    - `src/components/settings/display-settings.tsx`
    - `src/components/ui/tabs.tsx`
  - **Status:** ✅ Completed (Issue #79 closed - 4 SP)

#### Toast Notification System (Issue #80) - 2025-11-07
- **Implemented:** Professional toast notification system using sonner@2.0.7
  - **Components Created:**
    - `Toaster` component with theme-aware styling (`src/components/ui/sonner.tsx`)
    - `ToastDemo` component showcasing all notification types (`src/components/toast-demo.tsx`)
  - **Features:**
    - Success, error, warning, and info variants with custom styling
    - Promise-based notifications for async operations
    - Action buttons support (e.g., undo functionality)
    - Auto-dismiss with configurable timeout (4s default)
    - Manual dismiss with close button
    - Queue management for multiple toasts
    - Rich colors and icons for better UX
    - Dark/light theme support
  - **Integration:**
    - Added Toaster to root Providers component
    - Added demo to dashboard for testing
  - **Usage Examples:**
    ```tsx
    import { toast } from 'sonner';

    toast.success('Profile updated successfully!');
    toast.error('Failed to save changes');
    toast.promise(saveData(), {
      loading: 'Saving...',
      success: 'Saved!',
      error: 'Failed to save'
    });
    ```
  - **Files Modified:**
    - `package.json` - Added sonner@2.0.7
    - `src/components/providers.tsx` - Integrated Toaster
    - `src/app/(dashboard)/dashboard/page.tsx` - Added demo
  - **Status:** ✅ Completed (Issue #80 closed)

#### Loading States and Skeleton Components (Issue #81) - 2025-11-07
- **Implemented:** Comprehensive loading state management system
  - **Skeleton Components Created:**
    - `Skeleton` - Base skeleton component (`src/components/ui/skeleton.tsx`)
    - `CardSkeleton` - Loading placeholder for cards
    - `TableSkeleton` - Loading placeholder for tables (configurable rows/columns)
    - `FormSkeleton` - Loading placeholder for forms (configurable fields)
    - `TextSkeleton` - Loading placeholder for text content
    - `StatsCardSkeleton` - Loading placeholder for stats/metrics cards
    - `AvatarSkeleton` - Loading placeholder for avatars (sm/md/lg sizes)
    - `ListItemSkeleton` - Loading placeholder for list items
    - `DashboardGridSkeleton` - Complete dashboard loading state
  - **Spinner Components Created:**
    - `Spinner` - Animated loading indicator with sizes (sm/md/lg/xl)
    - `LoadingOverlay` - Full-screen or container overlay with spinner
    - `InlineLoader` - Small inline loading indicator with text
    - `ButtonLoader` - Loading indicator for buttons
  - **Demo Component:**
    - `LoadingDemo` - Interactive showcase of all loading states
  - **Features:**
    - Smooth pulse animations
    - Theme-aware colors (adapts to dark/light mode)
    - Configurable sizes and dimensions
    - Responsive layouts
    - TypeScript type safety
  - **Integration:**
    - Added demo to dashboard
    - Ready for use in async components with Suspense
  - **Files Created:**
    - `src/components/ui/skeleton.tsx`
    - `src/components/ui/loading-skeletons.tsx`
    - `src/components/ui/spinner.tsx`
    - `src/components/loading-demo.tsx`
  - **Status:** ✅ Completed (Issue #81 closed)

#### Error Boundary System (Issue #82) - 2025-11-07
- **Implemented:** Multi-level error boundary system for graceful error handling
  - **Components Created:**
    - `ErrorBoundary` - Base React error boundary class component
    - `RootErrorBoundary` - For wrapping entire application
    - `PageErrorBoundary` - For wrapping individual pages
    - `ComponentErrorBoundary` - For wrapping individual components
  - **Next.js Error Pages Enhanced:**
    - Updated `error.tsx` - Application-level error page with improved UI
    - Existing `global-error.tsx` - Already configured for root layout errors
  - **Features:**
    - Three-level error handling (root, page, component)
    - Custom fallback UI with theme support
    - Error logging to console (development)
    - Error reporting ready (production)
    - Retry functionality
    - Home/Reload navigation options
    - Stack trace display (development only)
    - Error digest support
    - TypeScript type safety
  - **Error Levels:**
    - **Root Level:** Full-screen error with reload options
    - **Page Level:** Page-level error with home button
    - **Component Level:** Component-level error with retry
  - **Integration:**
    - Enhanced root error.tsx with Card-based UI
    - Ready for Sentry/error reporting integration
  - **Files Created:**
    - `src/components/error-boundary.tsx`
  - **Files Modified:**
    - `src/app/error.tsx` - Enhanced with shadcn/ui components
  - **Status:** ✅ Completed (Issue #82 closed)

### Fixed
- **Created** `src/lib/utils.ts` barrel export for cn utility function
  - Fixes import path for new UI components
  - Exports cn from `src/lib/utils/cn.ts`

### Enhanced

#### Chart Library Migration: Recharts → ECharts 6.0.0 (2025-11-07)
- **Migrated:** Complete chart visualization system from Recharts to ECharts
  - **Removed:** recharts@3.3.0 dependency
  - **Added:** echarts@6.0.0 - Industry-leading visualization library
  - **Added:** echarts-for-react@3.0.5 - React wrapper for ECharts
  - **Benefits:**
    - 🚀 Better performance with large datasets
    - 🎨 More chart types and customization options
    - 📊 Advanced features (mark lines, areas, gradients)
    - 🌐 Industry-standard visualization solution
    - 💪 Superior TypeScript support
    - 🎯 SVG rendering for crisp, scalable graphics
  - **New Components:**
    - `EChartsWrapper` - Type-safe wrapper component with sensible defaults
    - `ThemedChart` - Automatic theme detection with next-themes integration
    - `useChartColors` - Hook providing theme-aware color palette
  - **Migrated Components:**
    - `PressureGraph` - Completely rewritten with ECharts
      - Maintained all existing functionality
      - Improved visual design with gradients and smooth curves
      - Better tooltip formatting with custom HTML
      - Enhanced mark lines for thresholds
      - Dual Y-axis support (pressure + temperature)
      - Theme-aware colors that adapt to light/dark mode
  - **Theme Support:**
    - Automatic light/dark mode detection
    - Theme-aware color palette
    - Seamless integration with next-themes
    - Consistent colors across all chart types
  - **TypeScript:**
    - Full type safety with ECharts type definitions
    - Proper EChartsOption typing
    - Type-safe wrapper components
  - **Performance:**
    - SVG rendering by default (better quality)
    - Lazy update optimization
    - No merge operations (notMerge: true)
    - Smooth animations with customizable easing
  - **Files Changed:**
    - `/opt/projects/repositories/pressograph/package.json` - Updated dependencies
    - `/opt/projects/repositories/pressograph/src/components/charts/echarts-wrapper.tsx` - New wrapper component
    - `/opt/projects/repositories/pressograph/src/components/charts/themed-chart.tsx` - Theme integration
    - `/opt/projects/repositories/pressograph/src/components/charts/index.ts` - Exports
    - `/opt/projects/repositories/pressograph/src/components/pressure-test/pressure-graph.tsx` - Complete rewrite
  - **Status:** ✅ Completed and production-ready
  - **Breaking Change:** No - API remains compatible with previous implementation

#### Authentication Best Practices Study (2025-11-07)
- **Completed:** Comprehensive study of Next.js 16 authentication patterns
  - **Resources Reviewed (Initial Study):**
    1. Next.js Official Authentication Guide (App Router patterns)
    2. NextAuth.js Secure Authentication Guide (Strapi)
    3. NextAuth Issue #13302 (Next.js 16 compatibility)
    4. PeerDB PR #3634 (Real-world Next.js 16 + React 19 upgrade)
    5. PeerDB Authentication Implementation Commit
  - **Additional Resources Reviewed:**
    6. Next.js Server and Client Components Guide (Component boundaries)
    7. NextAuth Issue #7760 (SessionProvider unnecessary in App Router)
    8. NextAuth Issue #5647 Comment (Component separation pattern)
    9. NextAuth Discussion #11093 (Next.js 15/16 + React 19 compatibility)
  - **Key Findings:**
    - Server Components preferred for auth logic
    - Client Components limited to UI interactions
    - Data Access Layer (DAL) pattern recommended
    - NextAuth 4.24.13 works with Next.js 16 (unofficial support)
    - React 19 requires async params handling with `React.use()`
    - **CRITICAL:** SessionProvider should be unnecessary in most App Router cases
    - **CRITICAL:** Prefer `getServerSession()` in Server Components over SessionProvider
    - **CRITICAL:** Next.js 15/16 has stricter RSC enforcement (prevents context during prerender)
  - **Updated Understanding:**
    - SessionProvider only needed for client components using `useSession()` hook
    - Server Components should use `getServerSession(authOptions)` directly
    - Must separate SessionProvider into dedicated client boundary wrapper
    - Props passed to Client Components must be serializable
    - Context providers cannot run during server prerendering (architectural change)
  - **Current Implementation Assessment:**
    - ✅ Strong: Type safety, bcrypt hashing, JWT strategy
    - ✅ Strong: Custom session types, callback implementations
    - ⚠️ Improvement: Need Data Access Layer (DAL)
    - ⚠️ Improvement: Need middleware for route protection
    - ⚠️ Improvement: Consider React 19 async patterns
    - ⚠️ Improvement: Replace useSession() with getServerSession() in Server Components
    - ⚠️ Improvement: Audit all client/server component boundaries
  - **Recommendations:**
    - Priority 1: Implement `verifySession()` utility in DAL using `getServerSession()`
    - Priority 2: Create separate AuthProvider.tsx with "use client" directive
    - Priority 3: Replace useSession() with getServerSession() in Server Components
    - Priority 4: Add middleware for protected routes
    - Priority 5: Audit all components for proper client/server boundaries
    - Priority 6: Add server-only package to auth utilities
    - Priority 7: Review async params in Server Components
    - Priority 8: Consider OAuth providers (GitHub, Google)
  - **Documentation:**
    - Created comprehensive study findings document (318 lines)
    - **Updated:** Added "Additional Resources Study" section (335+ new lines)
    - Includes security best practices
    - Provides implementation examples with updated patterns
    - Lists action items with priorities
    - **NEW:** Migration checklist for proper Server/Client boundaries
    - **NEW:** Updated SessionProvider pattern for Next.js 15/16 + React 19
  - **Files Created/Updated:**
    - `/opt/projects/repositories/pressograph/docs/authentication/AUTH_STUDY_FINDINGS.md` (653 lines)
  - **Status:** ✅ Study completed with additional resources, comprehensive recommendations documented
  - **Next Steps:** Implement Data Access Layer and proper component boundaries (future sprint)

### Bug Fixes

#### SessionProvider Error on Landing Page (2025-11-07)
- **Fixed:** NextAuth SessionProvider error when accessing landing page
  - **Issue:** `useSession` hook in Header component threw error: "useSession must be wrapped in SessionProvider"
  - **Root Cause:** Next.js 16 App Router type system incompatibility when passing Session object from Server Component (layout.tsx) to Client Component (Providers) across React Server Components boundary
  - **Solution:** Simplified provider implementation to let SessionProvider fetch session client-side automatically instead of passing it as prop from server layout
  - **Changed Files:**
    - `/opt/projects/repositories/pressograph/src/app/layout.tsx` - Removed async function and getSession call, reverted to synchronous layout
    - `/opt/projects/repositories/pressograph/src/components/providers/index.tsx` - Removed session prop from Providers component interface
  - **TypeScript:** Compilation now passes with 0 errors
  - **Status:** ✅ Fixed and tested
  - **Breaking Change:** No - transparent change that maintains same functionality
  - **Performance Impact:** Minimal - session fetched once on client mount via SessionProvider's internal logic

### Landing Page Implementation (2025-11-07) - BACKLOG FEATURE
- **Added:** Professional landing page at root route (/)
  - **Hero Section:**
    - Compelling headline: "Visualize Pressure Tests With Precision"
    - Subheadline describing platform capabilities
    - Primary CTA buttons: "Get Started" and "View Documentation"
    - Statistics showcase: 10+ Export Formats, Real-time Visualization, 100% Type Safe
    - Gradient background with decorative elements
  - **Features Section:**
    - 6 feature cards with Lucide icons (LineChart, Download, Users, BarChart3, Zap, Shield)
    - Real-time Visualization: Advanced charting engine with smooth animations
    - Multiple Export Formats: PNG, PDF, SVG, JSON, CSV support
    - Collaborative Management: Team sharing with RBAC
    - Advanced Analytics: Built-in dashboard with insights
    - Lightning Fast: Next.js 16 and React 19 performance
    - Enterprise Security: Industry-standard authentication and encryption
  - **How It Works Section:**
    - 3-step process guide with numbered circles
    - Step 1: Create Your Project (with team collaboration)
    - Step 2: Upload Test Data (CSV, JSON, or manual input)
    - Step 3: Generate & Export (with customization options)
    - Feature checklist: No credit card, unlimited projects, team collaboration, 24/7 support
  - **Tech Stack Section:**
    - Showcase of modern technologies (Next.js 16, React 19, TypeScript, PostgreSQL)
    - Clean card layout highlighting version numbers
  - **Final CTA Section:**
    - "Ready to Get Started?" call-to-action
    - Primary: "Start Free Trial" → /projects
    - Secondary: "View Dashboard" → /dashboard
    - Background decoration with gradient circles
  - **Footer:**
    - 4-column layout: About, Product, Resources, Legal
    - Links to all major pages (projects, tests, dashboard, docs, api-docs, privacy, terms)
    - Copyright notice with current year
  - **Design Features:**
    - Fully responsive design (mobile-first approach)
    - Dark mode support throughout
    - Gradient backgrounds and decorative elements
    - Professional typography with proper hierarchy
    - Accessible with semantic HTML and ARIA attributes
    - Lucide React icons for visual appeal
  - **Technical Implementation:**
    - Server Component (no client-side JavaScript overhead)
    - Uses existing shadcn/ui components (Button, Card)
    - Integrated with Header component for navigation
    - TypeScript compilation passes with 0 errors
    - Tailwind CSS for styling
  - **Navigation Integration:**
    - Header component included at top
    - Sticky navigation with theme toggle
    - Authentication menu (Sign In/Sign Out)
    - Mobile-responsive menu
  - **SEO Ready:**
    - Semantic HTML structure
    - Proper heading hierarchy (h1 → h2 → h3)
    - Descriptive content for search engines
    - Metadata already configured in layout.tsx
  - **Status:** Fully implemented and ready for production
  - **Note:** This is a backlog feature, not part of Sprint 2 scope

### Authentication - Username-based Login Implementation (2025-11-07)
- **BREAKING CHANGE:** Authentication now uses username instead of email for login
  - **Added:** Username field to users table (varchar 50, NOT NULL, UNIQUE)
  - **Migration:** Existing users automatically assigned usernames from email prefix
  - **Updated:** CredentialsProvider now accepts username + password (not email)
  - **Updated:** NextAuth session types to include username field
  - **Updated:** JWT token to include username
  - **Updated:** Test credentials script to set username
  - **Updated:** Database seed script to include username
  - **Test credentials:**
    - Username: `testuser` (use this to login)
    - Password: `Test1234!`
    - Email: `test@pressograph.dev` (for recovery/notifications only)
  - **Rationale:** Email should be used only for recovery and notifications, not as login identifier
  - **Security:** Username stored in lowercase for case-insensitive login
  - **UX:** Login form now shows "Username" field instead of "Email"
  - **Database:** Added index on username field for query performance
  - **Breaking:** Users must now login with username, not email

### Authentication Strategy Change (2025-11-06)
- **BREAKING CHANGE:** Migrated from OAuth-only to Credentials Provider authentication
  - **Removed:** GitHub OAuth and Google OAuth providers
  - **Added:** Credentials Provider with bcrypt password hashing
  - **Added:** Password field to users table (varchar 255, nullable)
  - **Added:** Keycloak SSO provider configuration (commented, backlog/future enhancement)
  - **Security:** Passwords hashed with bcrypt (10 rounds)
  - **Security:** Account status validation (isActive check)
  - **Security:** Last login timestamp tracking
  - **Updated:** Environment variables (.env.local) with Keycloak examples
  - **Created:** Test password script (scripts/set-test-password.ts)
  - **Rationale:** Changed from OAuth-only to support internal authentication with option for future enterprise SSO via Keycloak
  - **Breaking:** Existing OAuth users will need password-based credentials
  - **Issue:** Modified #70 implementation from OAuth to Credentials-based authentication

### Critical Fix - Bad Gateway Errors (2025-11-06)
- **Fixed:** Multiple Bad Gateway errors on dev-pressograph.infra4.dev
  - **First issue:** Permission denied on `(dashboard)` directory (owned by root)
    - Route conflict between `/(dashboard)/dashboard` and `/dashboard`
    - Fixed directory ownership: `chown developer:developer /workspace/src/app/(dashboard)`
    - Removed old `/src/app/dashboard` directory to resolve routing conflict
    - Added `allowedDevOrigins` to next.config.ts for cross-origin dev access
  - **Second issue:** Permission denied on `docs/deployment` directory (owned by root)
    - Turbopack unable to watch directory during CSS processing
    - Fixed directory ownership: `chown developer:developer /workspace/docs/deployment`
    - Result: Site now returns HTTP 200 OK and renders correctly

### Sprint 2 Early Implementation - Navigation Complete (2025-11-06)
- ✅ **Issue #77 (P1):** Main navigation component - 100% complete (CLOSED)
  - Nested menu support with expand/collapse functionality
  - Breadcrumb navigation component with auto-path parsing
  - Custom labels support for breadcrumb routes
  - Active state highlighting for parent and child items
  - Keyboard accessible with proper ARIA attributes
  - Smooth animations for menu expansion
  - Integrated into DashboardHeader with optional display

### Sprint 2 Early Implementation - Phase 1 Complete (2025-11-06)
- ✅ **Issue #70 (P0):** Drizzle-compatible auth queries - 100% complete
  - Cleaned up NextAuth configuration, removed unused imports
  - OAuth-only authentication strategy documented (GitHub, Google)
  - No CredentialsProvider - intentional security decision
  - NextAuth API routes verified and functional
- ✅ **Issue #71 (P0):** Theme provider with 3-tier persistence - 100% complete
  - Activated AdvancedThemeProvider in app providers
  - Added SessionProvider for NextAuth integration
  - Cookie → Valkey → Database persistence chain operational
  - Theme syncs on login, works for authenticated and unauthenticated users
- ✅ **Issue #72 (P1):** Dark/light mode toggle component - 100% complete (ready to close)
  - ThemeToggle with dropdown and SimpleThemeToggle implemented
  - Full keyboard accessibility and ARIA support
  - Integrated with next-themes and AdvancedThemeProvider
- ✅ **Issue #73 (P1):** Base button components - 100% complete (ready to close)
  - Six variants: default, destructive, outline, secondary, ghost, link
  - Four sizes: default, sm, lg, icon
  - Full TypeScript types with VariantProps
  - React 19 native ref support (no forwardRef needed)
- ✅ **Issue #74 (P1):** Form input components with validation - 100% complete
  - NEW: Textarea component with auto-resize
  - NEW: Select component with Radix UI (keyboard nav, groups, search)
  - NEW: FormError component with ARIA alerts
  - NEW: FormDescription and FormField wrapper components
  - Input component already had error states via aria-invalid
  - Full integration with React Hook Form and Zod
- ✅ **Issue #75 (P1):** Card and container components - 100% complete (ready to close)
  - Card component with 7 sub-components
  - Header with grid layout and optional action button
  - Full dark mode support and responsive design
- ✅ **Issue #76 (P1):** Dashboard layout with sidebar - 100% complete
  - NEW: Sidebar component with collapsible desktop view
  - NEW: DashboardHeader with theme toggle and user menu
  - NEW: DashboardLayout with responsive behavior
  - NEW: Dashboard route group `(dashboard)` with dedicated layout
  - Mobile menu with overlay and slide-in animation
  - Active route highlighting
  - Updated dashboard page with stat cards and quick actions
- ✅ **Issue #83 (Tech Debt):** TypeScript errors fixed - 100% complete
  - Fixed theme vs themePreference schema mismatch
  - Fixed database seed file schema inconsistencies
  - Removed unused imports and variables
  - TypeScript type-check now passes with 0 errors
- ✅ **Issue #69 (P0):** Production build error fixed - 100% complete
  - Fixed Html import error in global-error.tsx
  - Applied NODE_ENV=production workaround
  - Production build completes successfully with all static pages

**Sprint 2 Progress:** 23/38 SP complete (60.5%)
**Closed Issues:** #69, #70, #71, #72, #73, #74, #75, #76, #77, #83 (10 issues)
**Remaining Issues:** #78 (5 SP), #79 (4 SP), #80 (2 SP), #81 (2 SP), #82 (2 SP) - all P2
**Status:** All P0 and P1 issues complete, 60.5% of sprint done, ahead of schedule

### Sprint 2 Readiness Assessment (2025-11-06)
- 📊 Comprehensive Sprint 2 readiness analysis completed
- ✅ Verified 40% of Sprint 2 work already complete (16/40 SP)
- ✅ All Sprint 1 prerequisites met and verified
- ✅ Issue-by-issue status analysis documented
- 🎯 Identified early-start opportunities for Sprint 2
- 📚 Created detailed readiness assessment (docs/planning/SPRINT_2_READINESS_ASSESSMENT.md)
- 🚀 Sprint 2 approved for early start (before official 2025-11-17 date)
- 📈 Projected completion: 2025-11-24 (1 week ahead of schedule)
- ✨ Issues #72, #73, #75 ready to close (100% complete)
- 🔧 Issues #70, #71, #74 partially complete (50-80% done)

### Deployment Configuration Review (2025-11-06)
- 🔍 Comprehensive deployment configuration audit completed
- ✅ Verified all 5 containers healthy and operational
- ✅ Production build tested successfully in containerized environment
- ✅ Environment variable configuration validated between .env.local and compose files
- ✅ Security hardening verified (network isolation, capability dropping, no-new-privileges)
- ✅ Resource limits assessed as adequate for development
- ✅ Traefik routing and SSL configuration validated
- 📚 Created comprehensive deployment review document (docs/deployment/DEPLOYMENT_REVIEW_2025-11-06.md)
- 🚀 Deployment infrastructure confirmed production-ready
- 📊 Monitoring stack (postgres-exporter, redis-exporter) operational
- 🔐 Production-grade secrets verified in .env.local

### Next.js 16 Proxy Migration (2025-11-06)
- 🔄 Migrated from middleware.ts to proxy.ts following Next.js 16 deprecation
- ⚠️ Edge Runtime not supported in proxy.ts - authentication moved to Server Components
- ✨ Created server-side auth utilities (src/lib/auth/server-auth.ts)
- 📚 Added comprehensive migration documentation (docs/development/NEXT16_PROXY_MIGRATION.md)
- 🔧 Simplified proxy.ts to handle theme injection and request logging only
- ✅ Authentication now handled via requireAuth() in Server Components and layouts
- ✅ Removed middleware.ts deprecation warning from build output
- 📝 Preserved middleware.ts.backup for reference during transition period
- 🚀 Ready for Sprint 2 authentication implementation (2025-11-17)

### Next.js 16.0.1 Build Fix - NODE_ENV Workaround (2025-11-07)
- 🐛 Fixed production build issue with global-error.tsx useContext error
- 🔧 Applied NODE_ENV=production workaround to build script
- 📚 Reference: https://stackoverflow.com/questions/74322410 (CC BY-SA 4.0)
- ✅ Production build now completes successfully with all 13 static pages
- ✅ Build command updated: `NODE_ENV=production next build`
- 🎯 Issue #69 fully resolved - Build system operational for production deployment

### Next.js 16 Upgrade & Build Fix (2025-11-06)
- ⬆️ Upgraded Next.js from 15.5.6 to 16.0.1 to fix production build error (Issue #69)
- 🔧 Migrated webpack externals configuration to Turbopack resolveAlias pattern
- 🐛 Fixed global-error.tsx: Implemented as proper client component with reset function
- 🔥 Removed unused React imports following React 19 patterns
- ✅ Production build now completes successfully with all 13 static pages generated
- ✅ TypeScript compilation continues to pass with 0 errors
- ✅ Issue #69 (P0-Critical) resolved - Build system fully operational
- 📚 Next.js 16 uses Turbopack by default for improved build performance

### React 19 & Next.js 15 Modernization (2025-11-06)
- ♻️ Applied React 19 modern patterns across codebase
- ♻️ Removed deprecated forwardRef usage in Button component
- ♻️ Verified Next.js 15 async APIs (cookies, headers) already implemented
- ♻️ Confirmed Tailwind CSS 4.0 @import pattern already in use
- 🐛 Fixed TypeScript errors: theme vs themePreference schema mismatch
- 🐛 Fixed database seed file schema inconsistencies
- 🐛 Removed unused imports and variables
- ✨ Created placeholder pages for navigation routes (docs, api-docs, privacy, terms, projects, tests, dashboard)
- ✅ TypeScript type-check now passes with no errors
- 📚 Codebase now aligned with React 19.2 and Next.js 15 best practices

### Sprint 2 Preparation (2025-11-06)
- 📚 Sprint 2 milestone already configured with 14 issues
- 📚 Technical debt identified and tracked (Issue #83)
- 📚 TypeScript errors in theme and database schema documented
- 📚 Application verified running successfully
- 📚 Sprint 2 focuses on Authentication & Core UI (40 SP)

### Sprint 2 Preparation (2025-11-06)
- ✅ Investigated Issue #69 (Production Build Error - P0-Critical)
- ✅ Created App Router error pages (error.tsx, global-error.tsx)
- ⚠️ Production build blocked by Next.js 15.5.6 Pages Router compatibility issue
- ⚠️ Html import error in static generation - requires Next.js version adjustment
- 📝 Issue #69 updated with investigation findings and next steps
- 🔄 Development server continues to work normally

### Post-Sprint 1 Cleanup (2025-11-06)
- ✅ Closed Issue #83 (Tech Debt) - Already resolved during React 19 modernization
- ✅ Verified TypeScript type-check: 0 errors
- ✅ All containers healthy and running
- ✅ Application responding correctly at https://dev-pressograph.infra4.dev
- 📚 Sprint 1-2 transition period - awaiting Sprint 2 start (2025-11-17)

### Sprint 1 Completion (2025-11-06)
- ✅ Sprint 1 Foundation Setup complete (86% - 19/22 SP)
- ✅ All critical and high-priority tasks completed
- ✅ Issue #35 closed - Environment fully operational
- ✅ 11 GitHub issues closed (#35-45, #47-48, #83)
- ✅ Issue #46 deferred (Drizzle Studio external routing not critical)
- ✅ TypeScript type-check: 27 errors → 0 errors
- ✅ Development velocity: 1.36 SP/day
- 📚 Ready for Sprint 2: Authentication & Core UI (starts 2025-11-17)

### Planned Features from v1.0 Migration
- Graph History Page route (planned for Sprint 2 or Sprint 3)
  - Comprehensive table view with pagination and search
  - Filter by format (PNG, PDF, JSON), test number, date
  - Actions: view, download, regenerate, share, delete
  - Edit comments on graphs
  - Preview modal with test settings
  - Status indicators (success, failed, pending)
  - Public share links with clipboard copy
- Admin Dashboard (planned for Sprints 3-4)
  - Backend API endpoints (Sprint 3 - December 2-15, 2025)
  - Frontend UI with tabs (Sprint 4 - December 16-29, 2025)
  - User management CRUD
  - Graph management
  - Analytics and reporting
  - System health monitoring
  - Admin role middleware with RBAC

### Added
- ✨ Valkey cache integration with Redis client (Issue #36)
- ✨ Cache utility functions for user preferences and themes
- ✨ Connection pooling and error handling for cache operations
- ✨ Three-tier caching support (Cookie → Valkey → Database)
- ✨ Comprehensive integration tests for cache operations
- ✨ Three-tier theme management system (Issue #38)
- ✨ Advanced theme provider with SSR support
- ✨ Theme toggle UI components
- ✨ Middleware for authentication and theme injection
- 📚 Technology stack analysis and documentation (Issue #39)
- 📚 Architecture Decision Records (ADRs)
- 📚 Technology comparison matrices
- ✨ Shadcn/ui components (dropdown-menu, button, card, input, label)
- ✨ Database seed script with test data

### Changed
- 🔄 Authentication approach: Removed Traefik-level BasicAuth in favor of application-level NextAuth authentication (Issue #45 closed)

### Deferred
- ⏸️ Drizzle Studio routing configuration deferred to later sprint (Issue #46 - 3 SP)

### Fixed
- 🐛 Theme toggle dropdown rendering issue
- 🐛 Test theme page 500 error
- 🐛 TypeScript JSX compilation error in theme script

### Documentation
- 📚 Sprint 1 completion status updated with retrospective
- 📚 Sprint 2 planning document created

---

## [2.0.0-alpha] - 2025-11-05

Major architectural redesign. Complete migration from Vite to Next.js 15.5.6 + React 19.

### Added
- ✨ **Next.js 15.5.6** architecture with App Router
- ✨ **React 19.2.0** with new features
- ✨ **Drizzle ORM 0.44.7** instead of Prisma
- ✨ **NextAuth v4.24** for authentication
- ✨ **TanStack Query 5.90** for data fetching
- ✨ **Zustand 5.0** for state management with Immer middleware
- ✨ **OpenTelemetry** integration with VictoriaMetrics stack
- ✨ **VictoriaMetrics** observability stack (metrics, logs, traces)
- ✨ **Valkey 9** (Redis-compatible) for caching
- ✨ **PostgreSQL 18** with optimized configuration
- ✨ Drizzle Studio UI at https://dbdev-pressograph.infra4.dev
- ✨ Full database schema with 13 tables (users, projects, tests, audit_logs, etc.)
- ✨ **Recharts 3.3** for pressure graphs
- ✨ Server-side theme management with cookies
- ✨ RBAC (Role-Based Access Control) in database schema
- ✨ Comprehensive sprint tracking structure

### Changed
- 🔄 **BREAKING**: Complete architecture overhaul from Vite to Next.js
- 🔄 Migration from Prisma to Drizzle ORM
- 🔄 Container-based development with Podman
- 🔄 Enhanced Traefik configuration with HTTPS routing
- 🔄 Network isolation with IPAM for all services
- 🔄 Resource limits (CPU/RAM) for all containers
- 🔄 Node.js 24 LTS in development container
- 🔄 TypeScript 5.9.3 with strict mode

### Fixed
- 🐛 SSR build issues resolved
- 🐛 Theme switching now works on server-side
- 🐛 Healthcheck IPv6 issues in all containers

### Security
- 🔒 Secure secrets generation with `task secrets:generate`
- 🔒 Network isolation between dev/uptrace/victoria stacks
- 🔒 PostgreSQL and Valkey not exposed in traefik-public network
- 🔒 CORS configuration for Drizzle Studio API

### Documentation
- 📚 Sprint tracking structure in `/sprints/`
- 📚 Architecture decisions documented
- 📚 Migration session reports
- 📚 Comprehensive handoff reports

**Migration Notes**: Old Vite+React stack archived in git history (commit `8d48f03a`). To revert to old version: `git checkout 8d48f03a`.

**GitHub Issues**: #35, #37, #40-#54

---

## [1.1.0] - 2025-10-29

Infrastructure modernization and observability stack.

### Added
- ✨ Observability stack with Grafana, VictoriaMetrics, Tempo
- ✨ Podman Compose for development environment
- ✨ Traefik reverse proxy integration
- ✨ Health check endpoints for all services
- ✨ Development environment with hot reload
- ✨ Comprehensive Makefile for common tasks

### Changed
- 🔄 Migration to Podman from Docker
- 🔄 Improved Compose configuration
- 🔄 Node.js 22 LTS in containers

### Fixed
- 🐛 Healthcheck IPv6 issues
- 🐛 Vite HMR configuration
- 🐛 i18n configuration issues

### Documentation
- 📚 Infrastructure deployment guide
- 📚 Observability setup documentation
- 📚 Development workflow documentation

---

## [1.0.2] - 2025-10-31

Critical fixes and performance improvements.

### Added
- ✨ Comment field in Test Parameters section ([#6](https://github.com/dantte-lp/pressograph/issues/6))
- ✨ Date column in History table ([#5](https://github.com/dantte-lp/pressograph/issues/5))
- ✨ Download JSON button ([#4](https://github.com/dantte-lp/pressograph/issues/4))
- ✨ PDF export endpoint ([#3](https://github.com/dantte-lp/pressograph/issues/3))
- ✨ Component tests (Phase 1.1)
- ✨ Export utilities tests
- ✨ Graph generator tests

### Fixed
- 🐛 PNG Cyrillic encoding issue
- 🐛 History table improvements
- 🐛 PDF orientation issues
- 🐛 Theme selection bugs
- 🐛 Authentication 401 errors
- 🐛 API integration issues
- 🐛 Theme switching performance lag ([#6](https://github.com/dantte-lp/pressograph/issues/6))

### Changed
- 🔄 Phase 1 dependency updates (safe updates)
- 🔄 Phase 2 dependency updates (Sprint 2)
- 🔄 ESLint v9 flat config migration

### Security
- 🔒 Restore admin password
- 🔒 Fix Traefik routing with /api prefix

### Performance
- ⚡ Theme switching optimized with useShallow
- ⚡ GraphCanvas optimization with React.memo
- ⚡ ExportButtons re-render optimization

**GitHub Issues**: #3, #4, #5, #6

---

## [1.0.1] - 2025-10-29

### Added
- ✨ Sprint 7: Frontend improvements
  - US-024: Accessibility improvements
  - US-023: Form validation improvements
  - US-022: Enhanced loading states
  - US-021: Error boundaries implementation
- ✨ Sprint 6: History Page
  - US-019/US-020: Interactive history features
  - US-018: Backend History API endpoints
- ✨ Sprint 5: Help Page
  - US-015: Help page structure
- ✨ Sprint 4: Export functionality
  - Backend PDF export endpoint
  - Frontend PNG export API integration
- ✨ Sprint 2: Backend PNG export
  - US-008: PNG export endpoint
  - US-007: File storage service
  - US-006: Canvas renderer on backend
  - US-005: node-canvas setup
- ✨ Sprint 1: Backend type definitions
  - US-001: Shared type definitions
  - US-002: Graph generator on backend
  - US-003: Validation service
  - US-004: Graph controller endpoints

### Documentation
- 📚 Sprint completion reports for Sprint 2, 5, 6, 7
- 📚 Progress reports
- 📚 Release notes

---

## [1.0.0] - 2025-10-28

First production release! 🎉

### Added
- ✨ Pressure test visualization
- ✨ Graph generation with customizable parameters
- ✨ Export to PNG format
- ✨ User authentication and authorization
- ✨ History page with saved tests
- ✨ Setup page for initial configuration
- ✨ Database schema with Prisma
- ✨ Admin panel with user management
- ✨ i18n support (Russian/English)
- ✨ Theme switching (Light/Dark)
- ✨ Zustand state management
- ✨ Comprehensive Makefile

### Features
- 🎨 Modern React 19 UI with HeroUI components
- 🎨 Responsive design
- 🎨 Dark/Light theme support
- 🔐 JWT-based authentication
- 🔐 Role-based access control
- 📊 Real-time graph generation
- 📊 Test parameters validation
- 💾 PostgreSQL database
- 🌐 Bilingual interface (RU/EN)

### Infrastructure
- 🐳 Nginx reverse proxy
- 🐳 Docker Compose setup
- 🐳 Production-ready configuration
- 📈 Monitoring and logging

### Documentation
- 📚 Setup guide
- 📚 API documentation
- 📚 User guide
- 📚 Development guide
- 📚 Deployment guide

### Technical Stack
- **Frontend**: React 19.2.0, TypeScript 5.9, Vite 7.1.12, HeroUI 2.8.5
- **Backend**: Node.js 22, Express, PostgreSQL 16
- **Deployment**: Nginx, Docker Compose
- **Testing**: Vitest, Testing Library

---

## Change Types

This changelog uses the following change types:

- `Added` ✨ - new features
- `Changed` 🔄 - changes in existing functionality
- `Deprecated` ⚠️ - features to be removed soon
- `Removed` 🗑️ - removed features
- `Fixed` 🐛 - bug fixes
- `Security` 🔒 - vulnerability fixes
- `Performance` ⚡ - performance improvements
- `Documentation` 📚 - documentation changes

---

## Links

- [Unreleased]: https://github.com/dantte-lp/pressograph/compare/v2.0.0-alpha...HEAD
- [2.0.0-alpha]: https://github.com/dantte-lp/pressograph/compare/v1.1.0...v2.0.0-alpha
- [1.1.0]: https://github.com/dantte-lp/pressograph/compare/v1.0.2...v1.1.0
- [1.0.2]: https://github.com/dantte-lp/pressograph/compare/v1.0.1...v1.0.2
- [1.0.1]: https://github.com/dantte-lp/pressograph/compare/v1.0.0...v1.0.1
- [1.0.0]: https://github.com/dantte-lp/pressograph/releases/tag/v1.0.0

---

## GitHub Issues Reference

### Sprint 1: Foundation Setup
- [#35](https://github.com/dantte-lp/pressograph/issues/35) - Environment Setup Complete
- [#36](https://github.com/dantte-lp/pressograph/issues/36) - Valkey Cache Integration
- [#37](https://github.com/dantte-lp/pressograph/issues/37) - NextAuth Configuration ✅
- [#38](https://github.com/dantte-lp/pressograph/issues/38) - Theme Provider
- [#39](https://github.com/dantte-lp/pressograph/issues/39) - Technology Stack Analysis

### Infrastructure Hardening
- [#40](https://github.com/dantte-lp/pressograph/issues/40) - Node.js 24 LTS ✅
- [#41](https://github.com/dantte-lp/pressograph/issues/41) - Traefik Configuration ✅
- [#42](https://github.com/dantte-lp/pressograph/issues/42) - PostCSS Configuration ✅
- [#43](https://github.com/dantte-lp/pressograph/issues/43) - Auto-start Next.js ✅
- [#44](https://github.com/dantte-lp/pressograph/issues/44) - Auto-start Drizzle Studio ✅
- [#45](https://github.com/dantte-lp/pressograph/issues/45) - Traefik Security
- [#46](https://github.com/dantte-lp/pressograph/issues/46) - Drizzle Studio Routing
- [#47](https://github.com/dantte-lp/pressograph/issues/47) - Node.js Configuration ✅
- [#48](https://github.com/dantte-lp/pressograph/issues/48) - Traefik Entrypoints ✅
- [#49](https://github.com/dantte-lp/pressograph/issues/49) - Architecture Redesign ✅
- [#50](https://github.com/dantte-lp/pressograph/issues/50) - OpenTelemetry Integration ✅
- [#51](https://github.com/dantte-lp/pressograph/issues/51) - Network Isolation ✅
- [#52](https://github.com/dantte-lp/pressograph/issues/52) - Resource Limits ✅
- [#53](https://github.com/dantte-lp/pressograph/issues/53) - Database Configuration ✅
- [#54](https://github.com/dantte-lp/pressograph/issues/54) - PostgreSQL Client ✅
- [#55](https://github.com/dantte-lp/pressograph/issues/55) - Infrastructure Deployment
- [#56](https://github.com/dantte-lp/pressograph/issues/56) - Drizzle ORM Configuration
- [#57](https://github.com/dantte-lp/pressograph/issues/57) - VictoriaMetrics Configuration
- [#58](https://github.com/dantte-lp/pressograph/issues/58) - Uptrace Configuration

### v1.2.0 Milestone
- [#3](https://github.com/dantte-lp/pressograph/issues/3) - PNG Export Authentication ✅
- [#4](https://github.com/dantte-lp/pressograph/issues/4) - Public Share Link
- [#5](https://github.com/dantte-lp/pressograph/issues/5) - Real API Authentication ✅
- [#6](https://github.com/dantte-lp/pressograph/issues/6) - Theme Switching Performance ✅
- [#7](https://github.com/dantte-lp/pressograph/issues/7) - GraphCanvas Optimization
- [#8](https://github.com/dantte-lp/pressograph/issues/8) - ExportButtons Optimization

### Documentation & Quality
- [#9](https://github.com/dantte-lp/pressograph/issues/9) - Create CHANGELOG.md 🎯 (this file!)
- [#10](https://github.com/dantte-lp/pressograph/issues/10) - Link Swagger UI

✅ = Closed | 🎯 = In Progress

---

**Note**: For complete change history, see [Git commit log](https://github.com/dantte-lp/pressograph/commits/main).