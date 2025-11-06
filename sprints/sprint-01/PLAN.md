# Sprint 1: Foundation Setup - Detailed Plan

**Sprint Period:** 2025-11-03 to 2025-11-17 (2 weeks)
**Sprint Goal:** Complete core infrastructure and establish development baseline
**GitHub Milestone:** [Sprint 1: Foundation Setup](https://github.com/dantte-lp/pressograph/milestone/9)

---

## Sprint Overview

### Sprint Objectives

1. ✅ Establish stable Next.js 15 environment
2. ✅ Configure Valkey cache integration
3. ✅ Configure NextAuth with Drizzle adapter
4. 🚧 Implement theme provider with dark mode
5. ⏸️ Create base UI component structure
6. ⏸️ Set up development workflows

### Sprint Statistics

- **Planned Story Points:** 22 SP (reduced from 27 SP - removed Traefik BasicAuth)
- **Completed Story Points:** 9 SP (as of 2025-11-06)
- **Remaining Story Points:** 13 SP
- **Completion Rate:** 41%
- **Days Elapsed:** 3 of 14 days
- **Days Remaining:** 11 days
- **Required Velocity:** 1.2 SP/day
- **Historical Velocity:** 2.1 SP/day (infrastructure sprint)

**Sprint Status:** 🟢 On Track

---

## Task Breakdown

### Completed Tasks (9 SP)

| ID | Task | Issue | Priority | SP | Status | Completed |
|----|------|-------|----------|----|----|-----------|
| S01-T001 | Environment Setup | #35 | P0 | 2 | ✅ | 2025-11-03 |
| S01-T003 | NextAuth Configuration | #37 | P0 | 8 | ✅ | 2025-11-05 |
| S01-T006 | PM2 Auto-start | #43, #44 | P1 | 1 | ✅ | 2025-11-03 |
| S01-T007 | Traefik HTTPS Routing | #41, #48 | P1 | 1 | ✅ | 2025-11-03 |
| S01-T008 | PostCSS Configuration | #42 | P1 | 1 | ✅ | 2025-11-03 |
| S01-T009 | Node.js 24 LTS Verification | #40, #47 | P1 | 1 | ✅ | 2025-11-03 |
| S01-T012 | Package Version Updates | - | P2 | 1 | ✅ | 2025-11-03 |
| S01-T013 | Next.js Downgrade (16→15.5.6) | - | P0 | 2 | ✅ | 2025-11-03 |

### In Progress Tasks (5 SP)

| ID | Task | Issue | Priority | SP | Status | Assignee |
|----|------|-------|----------|----|--------|----------|
| S01-T002 | Valkey Cache Integration | #36 | P0 | 2 | 🚧 | TBD |
| S01-T004 | Theme Provider | #38 | P1 | 3 | 🚧 | TBD |
| S01-T005 | Tech Stack Analysis | #39 | P2 | 2 | 🚧 | TBD |

### Not Started Tasks (3 SP)

| ID | Task | Issue | Priority | SP | Status | Notes |
|----|------|-------|----------|----|--------|-------|
| S01-T011 | Drizzle Studio Routing | #46 | P1 | 3 | ⏸️ Not Started | May not need auth - evaluating |

---

## Detailed Task Specifications


### S01-T011: Drizzle Studio Routing (Under Review)

**GitHub Issue:** [#46](https://github.com/dantte-lp/pressograph/issues/46)
**Priority:** P1 (High) - May be reduced to P2 or closed
**Estimate:** 3 SP
**Status:** ⏸️ Under Review
**Dependencies:** None

#### Current Assessment
This task is being reviewed to determine if external access to Drizzle Studio is needed. Since Traefik-level BasicAuth has been removed from the scope, we need to evaluate whether:
1. Drizzle Studio needs external access at all
2. If it does, authentication should be handled at the application level (NextAuth)
3. For development purposes, local port-forwarding might be sufficient

#### Original Acceptance Criteria (Under Review)
- [ ] DNS A record created for dbdev-pressograph.infra4.dev
- [ ] HTTP redirects to HTTPS
- [ ] Valid Let's Encrypt certificate issued
- [ ] ~~BasicAuth authentication required~~ (removed from scope)
- [ ] Accessible from remote locations
- [ ] Traefik dashboard shows router: drizzle-studio@docker

#### Implementation Steps

1. **Create DNS Record** (15 minutes)
   ```bash
   # Add A record in Cloudflare
   # dbdev-pressograph.infra4.dev → SERVER_IP
   ```

2. **Configure Traefik Labels** (1 hour)
   ```yaml
   # deploy/compose/compose.dev.yaml
   services:
     workspace:
       labels:
         # Drizzle Studio HTTP router (redirect to HTTPS)
         - "traefik.http.routers.drizzle-studio-http.rule=Host(`dbdev-pressograph.infra4.dev`)"
         - "traefik.http.routers.drizzle-studio-http.entrypoints=http"
         - "traefik.http.routers.drizzle-studio-http.middlewares=https-redirect@file"

         # Drizzle Studio HTTPS router
         - "traefik.http.routers.drizzle-studio.rule=Host(`dbdev-pressograph.infra4.dev`)"
         - "traefik.http.routers.drizzle-studio.entrypoints=https"
         - "traefik.http.routers.drizzle-studio.tls.certresolver=cloudflare"
         - "traefik.http.routers.drizzle-studio.middlewares=dev-basic-auth@file,dev-rate-limit@file"

         # Drizzle Studio service (port 5555)
         - "traefik.http.services.drizzle-studio.loadbalancer.server.port=5555"
   ```

3. **Test Remote Access** (1 hour)
   ```bash
   # Test HTTP redirect
   curl -I http://dbdev-pressograph.infra4.dev
   # Should return 301/302 to HTTPS

   # Test HTTPS with auth
   curl -u admin:password https://dbdev-pressograph.infra4.dev
   # Should return 200
   ```

#### Dependencies
- S01-T010 (BasicAuth middleware must be created first)
- DNS propagation (may take up to 24 hours)

---

### S01-T002: Valkey Cache Integration

**GitHub Issue:** [#36](https://github.com/dantte-lp/pressograph/issues/36)
**Priority:** P0 (Critical)
**Estimate:** 2 SP
**Status:** 🚧 In Progress

#### Acceptance Criteria
- [ ] Valkey client configured and connected
- [ ] Connection pooling implemented
- [ ] Error handling with retry logic
- [ ] Cache utility functions created
- [ ] Integration tests passing

#### Implementation Steps

1. **Configure Valkey Client** (1 hour)
   ```typescript
   // src/lib/cache/valkey-client.ts
   import { createClient } from 'redis';

   const valkeyClient = createClient({
     socket: {
       host: process.env.VALKEY_HOST || 'cache',
       port: parseInt(process.env.VALKEY_PORT || '6379'),
     },
     password: process.env.VALKEY_PASSWORD,
     database: 0,
   });

   valkeyClient.on('error', (err) => console.error('Valkey error:', err));

   export async function getValkeyClient() {
     if (!valkeyClient.isOpen) {
       await valkeyClient.connect();
     }
     return valkeyClient;
   }
   ```

2. **Create Cache Utilities** (2 hours)
   ```typescript
   // src/lib/cache/strategies.ts
   export async function cacheUserPreferences(userId: string, preferences: any) {
     const client = await getValkeyClient();
     const key = `user_preferences:${userId}`;
     await client.setEx(key, 3600, JSON.stringify(preferences));
   }

   export async function getCachedUserPreferences(userId: string) {
     const client = await getValkeyClient();
     const key = `user_preferences:${userId}`;
     const cached = await client.get(key);
     return cached ? JSON.parse(cached) : null;
   }
   ```

3. **Test Integration** (1 hour)
   - Test connection to Valkey
   - Test set/get operations
   - Test TTL expiration
   - Test error handling

---

### S01-T004: Theme Provider Implementation

**GitHub Issue:** [#38](https://github.com/dantte-lp/pressograph/issues/38)
**Priority:** P1 (High)
**Estimate:** 3 SP
**Status:** 🚧 In Progress

#### Acceptance Criteria
- [ ] Theme cookie set on first visit
- [ ] Theme stored in user_preferences table
- [ ] Theme cached in Valkey (1h TTL)
- [ ] No FOUC (Flash of Unstyled Content)
- [ ] Dark/Light mode toggle component
- [ ] Theme syncs across devices for logged-in users
- [ ] System theme detection (prefers-color-scheme)

#### Implementation Steps

1. **Create Theme Middleware** (1 hour)
   ```typescript
   // src/middleware.ts
   import { NextRequest, NextResponse } from 'next/server';

   export function middleware(request: NextRequest) {
     const response = NextResponse.next();

     // Get theme from cookie or default to 'system'
     const theme = request.cookies.get('theme')?.value || 'system';

     // Inject theme into HTML before hydration
     response.headers.set('x-theme', theme);

     return response;
   }
   ```

2. **Create ThemeProvider Component** (2 hours)
   ```typescript
   // src/components/providers/theme-provider.tsx
   'use client';

   import { createContext, useContext, useEffect, useState } from 'react';
   import { useSession } from 'next-auth/react';

   type Theme = 'light' | 'dark' | 'system';

   const ThemeContext = createContext<{
     theme: Theme;
     setTheme: (theme: Theme) => void;
   }>({
     theme: 'system',
     setTheme: () => {},
   });

   export function ThemeProvider({ children }: { children: React.ReactNode }) {
     const [theme, setThemeState] = useState<Theme>('system');
     const { data: session } = useSession();

     const setTheme = async (newTheme: Theme) => {
       // Update cookie
       document.cookie = `theme=${newTheme}; path=/; max-age=31536000`;

       // Update state
       setThemeState(newTheme);

       // If logged in, update database
       if (session) {
         await fetch('/api/preferences/theme', {
           method: 'POST',
           body: JSON.stringify({ theme: newTheme }),
         });
       }
     };

     return (
       <ThemeContext.Provider value={{ theme, setTheme }}>
         {children}
       </ThemeContext.Provider>
     );
   }

   export const useTheme = () => useContext(ThemeContext);
   ```

3. **Create Theme Toggle UI** (1 hour)
   ```typescript
   // src/components/ui/theme-toggle.tsx
   'use client';

   import { useTheme } from '@/components/providers/theme-provider';

   export function ThemeToggle() {
     const { theme, setTheme } = useTheme();

     return (
       <button
         onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
         className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
       >
         {theme === 'light' ? '🌙' : '☀️'}
       </button>
     );
   }
   ```

4. **Test SSR Theme Injection** (1 hour)
   - Test no FOUC on page load
   - Test theme persistence across reloads
   - Test theme sync for logged-in users

---

## Sprint Risks

### Critical Risks

| Risk | Probability | Impact | Mitigation | Status |
|------|------------|--------|------------|--------|
| R-S01-001: ~~Public dev environment~~ | ~~High~~ | ~~Critical~~ | NextAuth handles app-level auth | ✅ Resolved |
| R-S01-002: Theme FOUC issues | Medium | Medium | Use cookies + middleware | 🟡 Monitor |
| R-S01-003: NextAuth + Drizzle bugs | Low | High | Extensive testing | ✅ Mitigated |

### Action Items

1. **[HIGH]** Complete Valkey integration by 2025-11-08
2. **[HIGH]** Complete Theme Provider by 2025-11-10
3. **[MEDIUM]** Review Drizzle Studio routing need by 2025-11-08
4. **[MEDIUM]** Create Sprint 2 issues by 2025-11-15

---

## Sprint Velocity Tracking

### Burndown Chart Data

| Date | Remaining SP | Completed SP | Notes |
|------|-------------|--------------|-------|
| 2025-11-03 | 27 | 0 | Sprint start |
| 2025-11-03 | 21 | 6 | Environment + PM2 + Traefik |
| 2025-11-05 | 13 | 14 | NextAuth completed |
| 2025-11-06 | 18 | 9 | Current state |
| 2025-11-08 | TBD | TBD | Target: 13 SP |
| 2025-11-10 | TBD | TBD | Target: 18 SP |
| 2025-11-15 | TBD | TBD | Target: 24 SP |
| 2025-11-17 | 0 | 27 | Sprint end (target) |

### Daily Velocity

- Day 1 (2025-11-03): 6 SP (high)
- Day 2 (2025-11-04): 0 SP
- Day 3 (2025-11-05): 8 SP (very high)
- Day 4 (2025-11-06): 0 SP

**Average Velocity:** 3.5 SP/day (based on first 4 days)
**Required Velocity:** 1.2 SP/day (to complete sprint)

**Assessment:** 🟢 Sprint is tracking well. With reduced scope (22 SP total), the team is on track to complete all remaining work.

---

## Sprint Ceremonies

### Sprint Planning
- **Date:** 2025-11-03
- **Duration:** 2 hours
- **Participants:** Product Owner, Development Team
- **Outcome:** 27 SP committed

### Daily Standups
- **Frequency:** Daily (async via daily log files)
- **Format:** What did I do? What will I do? Any blockers?
- **Location:** `/sprints/sprint-01/daily/YYYY-MM-DD.md`

### Sprint Review
- **Date:** 2025-11-17
- **Duration:** 1 hour
- **Agenda:** Demo completed work, review sprint goal

### Sprint Retrospective
- **Date:** 2025-11-17
- **Duration:** 1 hour
- **Agenda:** What went well? What didn't? What to improve?

---

## Definition of Done

For this sprint, a task is "Done" when:

- [ ] Code written and follows coding standards
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no warnings
- [ ] Manually tested and working
- [ ] Committed with conventional commit message
- [ ] Merged to main branch
- [ ] Deployed to dev environment
- [ ] Verified in dev environment
- [ ] Documentation updated (if applicable)

---

## Sprint Completion Checklist

- [ ] All P0 tasks completed (S01-T001, S01-T003, S01-T002)
- [ ] All P1 tasks completed (S01-T004, S01-T011 if needed)
- [ ] 90%+ story points completed (20/22 SP minimum)
- [ ] Zero critical security issues (handled by NextAuth)
- [ ] Development environment stable
- [ ] All tests passing
- [ ] Sprint review completed
- [ ] Sprint retrospective completed
- [ ] Action items for Sprint 2 captured

---

## Related Documents

- [Sprint 1 README](./README.md)
- [Architecture Decisions](./ARCHITECTURE_DECISIONS.md)
- [Development Roadmap](/opt/projects/repositories/pressograph/docs/planning/DEVELOPMENT_ROADMAP.md)
- [Development Plan](/opt/projects/repositories/pressograph/docs/development/DEVELOPMENT_PLAN.md)

---

**Last Updated:** 2025-11-06
**Next Update:** 2025-11-08 (mid-sprint check-in)
