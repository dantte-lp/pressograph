# Pressograph 2.0 - Next Steps Quick Reference

**Last Updated:** 2025-11-03
**Current Status:** Architecture Complete, Ready for Implementation

---

## Immediate Actions (Do These First)

### 1. Generate and Apply Database Migration

```bash
# Step 1: Generate migration from schema
pnpm db:generate

# Step 2: Review the generated SQL (IMPORTANT!)
# Check: drizzle/[timestamp]_*.sql
# Look for:
# - Correct table names
# - Proper relationships (foreign keys)
# - Indexes created
# - No unexpected changes

# Step 3: Apply migration to development database
pnpm db:migrate

# Step 4: Verify in database
pnpm db:studio
# Open: http://localhost:5555
# Check all 13 tables are created
```

### 2. Setup TanStack Query

**Create:** `src/lib/query/query-client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true,
        retry: 3,
      },
    },
  });
}
```

**Update:** `src/app/layout.tsx`

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createQueryClient } from '@/lib/query/query-client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const queryClient = createQueryClient();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>{children}</ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### 3. Enhance Zustand Store with Middleware

**Create:** `src/store/use-store.ts`

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

export const useStore = create<UIState>()(
  devtools(
    immer((set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapsed: () => set((state) => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
      }),
    })),
    { name: 'Pressograph UI Store' }
  )
);
```

**Usage with useShallow:**

```typescript
import { useStore } from '@/store/use-store';
import { useShallow } from 'zustand/react/shallow';

function Sidebar() {
  const { open, collapsed, toggleCollapsed } = useStore(
    useShallow((state) => ({
      open: state.sidebarOpen,
      collapsed: state.sidebarCollapsed,
      toggleCollapsed: state.toggleSidebarCollapsed,
    }))
  );
}
```

---

## Priority Tasks (This Week)

### Day 1: Database & State Management

- [x] Database schema complete
- [ ] Generate and apply migration
- [ ] Setup TanStack Query
- [ ] Enhance Zustand store
- [ ] Test database connectivity

### Day 2: Theme Management

- [ ] Implement cookie-based theme
- [ ] Create theme Server Actions
- [ ] Integrate with user preferences table
- [ ] Add Valkey caching for preferences
- [ ] Test theme persistence

### Day 3: Base Components

- [ ] Create PressureGraph component (Recharts)
- [ ] Create Layout components
- [ ] Create Form components (react-hook-form + Zod)
- [ ] Test component library

### Day 4: Error Monitoring

- [ ] Setup Sentry client config
- [ ] Setup Sentry server config
- [ ] Configure source maps
- [ ] Test error tracking
- [ ] Setup alerts

### Day 5: Documentation & Testing

- [ ] Component documentation
- [ ] API documentation
- [ ] Write unit tests
- [ ] Integration tests
- [ ] E2E tests (critical paths)

---

## Key Files Reference

### Architecture Documentation

- **Main Doc:** `sprints/sprint-01/ARCHITECTURE_DECISIONS.md` (68KB)
  - Complete technical specification
  - All decisions justified
  - Implementation examples

- **Session Summary:** `sprints/sprint-01/SESSION_SUMMARY_2025-11-03_ARCHITECTURE.md`
  - What was done today
  - Files changed
  - Handoff notes

### Database Schema

All files in: `src/lib/db/schema/`

**Core Entities:**
- `users.ts` - Enhanced with RBAC
- `user-preferences.ts` - Theme, language, UI settings
- `organizations.ts` - Multi-tenancy
- `projects.ts` - Group related tests
- `pressure-tests.ts` - Main entity
- `test-runs.ts` - Execution data
- `file-uploads.ts` - Graph exports, imports

**Supporting:**
- `audit-logs.ts` - Compliance tracking
- `api-keys.ts` - Programmatic access
- `notifications.ts` - In-app alerts

**Auth:**
- `nextauth.ts` - accounts, sessions, verification_tokens

### Design System

- **Colors:** `src/styles/globals.css`
  - Light theme (industrial)
  - Dark theme (control room)
  - Typography scale
  - Spacing system

### Packages Installed

```json
{
  "@tanstack/react-query": "5.90.6",
  "@tanstack/react-query-devtools": "5.90.2",
  "recharts": "3.3.0",
  "immer": "10.2.0",
  "react-dropzone": "14.3.8",
  "papaparse": "5.5.3",
  "jspdf": "3.0.3",
  "jspdf-autotable": "5.0.2",
  "@sentry/nextjs": "10.22.0"
}
```

---

## Implementation Patterns

### 1. TanStack Query Usage

**Fetching Data:**

```typescript
// hooks/use-pressure-tests.ts
import { useQuery } from '@tanstack/react-query';

export function usePressureTests(projectId: string) {
  return useQuery({
    queryKey: ['pressure-tests', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/tests`);
      if (!res.ok) throw new Error('Failed to fetch tests');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**Mutations:**

```typescript
export function useCreatePressureTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewPressureTest) => {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['pressure-tests'] });
    },
  });
}
```

### 2. Server Actions with Zod

```typescript
'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { pressureTests } from '@/lib/db/schema';

const createTestSchema = z.object({
  name: z.string().min(1).max(255),
  projectId: z.string().uuid(),
  config: z.object({
    workingPressure: z.number().positive(),
    maxPressure: z.number().positive(),
    testDuration: z.number().positive(),
    temperature: z.number(),
    // ... rest of config
  }),
});

export async function createPressureTest(formData: FormData) {
  const parsed = createTestSchema.parse({
    name: formData.get('name'),
    projectId: formData.get('projectId'),
    config: JSON.parse(formData.get('config') as string),
  });

  const test = await db.insert(pressureTests).values({
    ...parsed,
    createdBy: userId, // from session
    organizationId: orgId, // from session
    status: 'draft',
  }).returning();

  return { success: true, test };
}
```

### 3. Theme Toggle Component

```typescript
'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

---

## Testing Strategy

### Unit Tests

```bash
pnpm test

# Test files:
# - src/lib/db/schema/*.test.ts (schema validation)
# - src/lib/utils/*.test.ts (utility functions)
# - src/hooks/*.test.ts (custom hooks)
```

### Integration Tests

```bash
# Test API routes
pnpm test:integration

# Test files:
# - src/app/api/**/*.test.ts (route handlers)
# - src/actions/**/*.test.ts (server actions)
```

### E2E Tests (Future)

```bash
pnpm add -D @playwright/test
npx playwright install

# Test critical paths:
# - User login
# - Create pressure test
# - View graph
# - Export PDF
```

---

## Environment Variables Needed

```bash
# .env.local (add these)

# Database (already configured)
DATABASE_URL=postgresql://...

# Valkey/Redis (already configured)
REDIS_URL=redis://cache:6379
REDIS_DB=0
REDIS_PREFIX=pressograph:

# NextAuth (needed for auth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=... # Generate: openssl rand -base64 32

# Sentry (for error monitoring)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=... # From Sentry dashboard

# Feature flags (optional)
NEXT_PUBLIC_ENABLE_REAL_TIME=false
NEXT_PUBLIC_ENABLE_PUBLIC_SHARING=true
```

---

## Common Commands

```bash
# Development
pnpm dev                  # Start dev server (with Turbopack)
pnpm build                # Production build
pnpm start                # Start production server

# Database
pnpm db:generate          # Generate migration from schema
pnpm db:migrate           # Apply migrations
pnpm db:push              # Push schema (dev only, skip migrations)
pnpm db:studio            # Open Drizzle Studio (port 5555)

# Testing
pnpm test                 # Run unit tests
pnpm test:ui              # Run tests with UI

# Code Quality
pnpm lint                 # Run ESLint
pnpm type-check           # TypeScript check
pnpm format               # Format with Prettier
pnpm format:check         # Check formatting
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check database is running
docker ps | grep postgres

# Check connection
psql $DATABASE_URL -c "SELECT 1"

# Reset database (WARNING: deletes all data)
pnpm db:push --force
```

### Valkey Connection Issues

```bash
# Check Valkey is running
docker ps | grep valkey

# Test connection
redis-cli -u $REDIS_URL ping
# Should return: PONG

# Clear cache
redis-cli -u $REDIS_URL FLUSHDB
```

### TypeScript Errors

```bash
# Regenerate types
pnpm db:generate

# Clean build
rm -rf .next
pnpm build
```

---

## Resources

### Documentation

- [Architecture Decisions](sprints/sprint-01/ARCHITECTURE_DECISIONS.md)
- [Session Summary](sprints/sprint-01/SESSION_SUMMARY_2025-11-03_ARCHITECTURE.md)
- [Next.js 16 Docs](https://nextjs.org/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Recharts Docs](https://recharts.org/)

### UI/UX Requirements

- [Migration Plan](docs/development/architecture/Pressograph Next.js Migration & UI_UX Overhaul Plan.docx.md)
- [Technical Manifesto](docs/development/architecture/Technical Upgrade Manifesto_ Pressure Test Graph Generation System.docx.md)

---

## Questions?

**Architecture Questions:** See `ARCHITECTURE_DECISIONS.md`
**Implementation Questions:** Check examples in this file
**Database Questions:** Check schema comments in `src/lib/db/schema/`
**Design Questions:** Check `src/styles/globals.css` comments

---

**Last Updated:** 2025-11-03
**Next Review:** After Day 1 implementation

---

END OF QUICK REFERENCE
