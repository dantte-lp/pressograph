---
id: next16-proxy-migration
title: Next.js 16 Proxy Migration
sidebar_label: Proxy Migration
---

# Next.js 16 Middleware to Proxy Migration

**Date:** 2025-11-06
**Status:** Partial Migration (with workaround)
**Issue:** Edge Runtime not supported in proxy.ts

## Overview

Next.js 16 deprecates the `middleware.ts` file convention in favor of `proxy.ts`. However, this migration introduces a critical limitation: **Edge Runtime is NOT supported in proxy.ts** (Node.js runtime only).

## The Problem

Our original `middleware.ts` used `next-auth/jwt`'s `getToken()` function for authentication checks, which requires Edge Runtime. This is incompatible with the new `proxy.ts` approach.

### Original Middleware Pattern

```typescript
// middleware.ts (Edge Runtime)
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    // Redirect to login
  }
}
```

### New Proxy Limitation

```typescript
// proxy.ts (Node.js Runtime ONLY - no Edge Runtime)
// ❌ Cannot use getToken() from next-auth/jwt
// ❌ Cannot use Edge Runtime APIs
```

## Our Solution

We've implemented a hybrid approach that maintains security while working within Next.js 16 constraints:

### 1. Simplified proxy.ts

The proxy now handles only non-auth concerns:

```typescript
// src/proxy.ts
export async function proxy(request: NextRequest) {
  // Theme injection for SSR
  const theme = request.cookies.get('theme')?.value || 'system';
  response.headers.set('x-theme', theme);

  // Request logging
  console.log(`[Proxy] ${request.method} ${pathname}`);

  return response;
}
```

### 2. Server-Side Auth Utilities

Authentication is now handled in Server Components using `getServerSession()`:

```typescript
// src/lib/auth/server-auth.ts
import { getServerSession } from 'next-auth';

export async function requireAuth(callbackUrl?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/auth/login');
  }
  return session;
}
```

### 3. Protected Layout Pattern

We use Next.js App Router layouts to protect routes:

```typescript
// src/app/(protected)/layout.tsx
export default async function ProtectedLayout({ children }) {
  await requireAuth(); // Checks auth, redirects if not authenticated
  return <>{children}</>;
}
```

### 4. Route Organization

```
src/app/
├── (protected)/              # Protected routes group
│   ├── layout.tsx           # Requires authentication
│   ├── dashboard/
│   ├── projects/
│   ├── tests/
│   └── settings/
├── (admin)/                 # Admin-only routes
│   ├── layout.tsx           # Requires admin role
│   └── admin/
├── (public)/                # Public routes
│   ├── auth/
│   └── share/
└── api/                     # API routes with inline auth
    └── [...routes]/
```

## Implementation Details

### Protected Routes

Protected routes use the `requireAuth()` helper in their layouts:

```typescript
// Example: Dashboard page
export default async function DashboardPage() {
  const session = await requireAuth(); // Ensures authentication
  return <div>Welcome, {session.user.name}</div>;
}
```

### API Routes

API routes check authentication inline:

```typescript
// Example: API route
import { getSession } from '@/lib/auth/server-auth';

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Handle authenticated request
}
```

### Admin Routes

Admin routes use `requireAdmin()`:

```typescript
// src/app/(admin)/layout.tsx
export default async function AdminLayout({ children }) {
  await requireAdmin(); // Checks admin role, redirects if not admin
  return <>{children}</>;
}
```

## Trade-offs

### What We Gained

- ✅ Next.js 16 compatibility with `proxy.ts`
- ✅ No deprecation warnings
- ✅ Server Components leverage for auth
- ✅ Better separation of concerns
- ✅ Type-safe auth utilities

### What We Lost (temporarily)

- ❌ Single middleware auth check point
- ❌ Edge Runtime performance for auth
- ❌ Unified request interception

### What We Maintained

- ✅ Full authentication security
- ✅ Protected routes functionality
- ✅ Admin role checks
- ✅ Theme injection
- ✅ Request logging

## Migration Checklist

- [x] Create `proxy.ts` with simplified logic
- [x] Create `src/lib/auth/server-auth.ts` utilities
- [x] Create `(protected)/layout.tsx` for route protection
- [x] Create `(admin)/layout.tsx` for admin routes
- [x] Update API routes to use inline auth checks
- [x] Remove old `middleware.ts` file
- [x] Test all protected routes
- [x] Test admin routes
- [x] Test API authentication
- [x] Update documentation

## Testing

### Test Protected Routes

1. Navigate to `/dashboard` without auth → Should redirect to `/auth/login`
2. Navigate to `/dashboard` with auth → Should show dashboard
3. Navigate to `/admin` without admin role → Should redirect to `/unauthorized`
4. Navigate to `/admin` with admin role → Should show admin panel

### Test API Routes

```bash
# Without auth
curl https://dev-pressograph.infra4.dev/api/projects
# Expected: 401 Unauthorized

# With auth (in browser with session)
fetch('/api/projects').then(r => r.json())
# Expected: Project data
```

## Future Considerations

### When Next.js Adds Edge Runtime to Proxy

Once Next.js team provides proper Edge Runtime support in `proxy.ts`, we can:

1. Move auth checks back to proxy
2. Simplify layout files
3. Restore single auth checkpoint pattern

### Alternative Approaches

The Next.js team has stated they're developing "better APIs with better ergonomics" for common use cases. Monitor:

- [Next.js 16 Proxy Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [Next.js Blog](https://nextjs.org/blog) for announcements

## References

- [Next.js 16 Middleware to Proxy Guide](https://nextjs.org/docs/messages/middleware-to-proxy)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [NextAuth Server Session](https://next-auth.js.org/configuration/nextjs#getserversession)
- [App Router Authentication](https://nextjs.org/docs/app/building-your-application/authentication)

## Support

For questions or issues:

1. Check this documentation
2. Review `/opt/projects/repositories/pressograph/src/lib/auth/server-auth.ts`
3. Open a GitHub issue with label `authentication` or `next16-migration`

---

**Last Updated:** 2025-11-06
**Author:** Development Team
**Status:** Production Ready
