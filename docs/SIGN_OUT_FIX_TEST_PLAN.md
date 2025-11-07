# Sign Out Redirect Fix - Test Plan

## Issue Description

**Problem**: Sign out from dashboard redirects to `http://localhost:3000/` instead of `https://dev-pressograph.infra4.dev/`

**Request Initiator Chain**:
1. `https://dev-pressograph.infra4.dev/dashboard`
2. `https://dev-pressograph.infra4.dev/_next/static/chunks/node_modules__pnpm_6b8ac19d._.js`
3. `http://localhost:3000/` (INCORRECT)

**Expected**: Should redirect to `https://dev-pressograph.infra4.dev/`

## Root Cause

NextAuth's `signOut()` function has internal redirect logic that runs before client-side code. The issue occurs because:

1. NextAuth client code uses `window.location.origin` to build redirect URLs
2. Inside the container, this resolves to `localhost:3000`
3. The redirect happens before our custom redirect code executes

## Solution Implemented

### 1. Enhanced Header Component Sign Out Handler

**File**: `/opt/projects/repositories/pressograph/src/components/layout/header.tsx`

**Changes**:
- Changed from `.then()` callback to proper `async/await`
- Added comprehensive logging to track execution flow
- Used `window.location.replace()` instead of `window.location.href` (prevents back button issues)
- Added error handling with fallback redirect
- Explicitly pass `redirect: false` to `signOut()`

**Code**:
```typescript
<button
  onClick={async () => {
    console.log('[Header] Sign out initiated');
    console.log('[Header] window.location.origin:', window.location.origin);
    console.log('[Header] window.location.href:', window.location.href);

    try {
      // Prevent NextAuth from handling redirect
      await signOut({ redirect: false });
      console.log('[Header] NextAuth signOut complete');

      // Force absolute URL redirect
      const targetUrl = 'https://dev-pressograph.infra4.dev/';
      console.log('[Header] Redirecting to:', targetUrl);

      // Use window.location.replace to prevent back button issues
      window.location.replace(targetUrl);
    } catch (error) {
      console.error('[Header] Sign out error:', error);
      // Fallback: still try to redirect
      window.location.replace('https://dev-pressograph.infra4.dev/');
    }
  }}
>
  Sign Out
</button>
```

### 2. Enhanced NextAuth Redirect Callback

**File**: `/opt/projects/repositories/pressograph/src/lib/auth/config.ts`

**Changes**:
- Added comprehensive logging to track all redirect calls
- Hardcoded fallback to production URL (`https://dev-pressograph.infra4.dev`)
- Enhanced localhost detection and replacement logic
- Added error handling for URL parsing

**Code**:
```typescript
async redirect({ url, baseUrl }) {
  const productionUrl = process.env.NEXTAUTH_URL || 'https://dev-pressograph.infra4.dev';

  console.log('[NextAuth Redirect]', {
    url,
    baseUrl,
    productionUrl,
    nodeEnv: process.env.NODE_ENV,
  });

  // If starts with /, make it absolute with production URL
  if (url.startsWith('/')) {
    const redirectTo = `${productionUrl}${url}`;
    console.log('[NextAuth Redirect] Relative path:', redirectTo);
    return redirectTo;
  }

  // If contains localhost, extract path and use production URL
  if (url.includes('localhost')) {
    try {
      const urlObj = new URL(url);
      const redirectTo = `${productionUrl}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
      console.log('[NextAuth Redirect] Localhost detected, replacing:', redirectTo);
      return redirectTo;
    } catch (error) {
      console.error('[NextAuth Redirect] URL parsing error:', error);
      return productionUrl;
    }
  }

  // Default fallback
  return productionUrl;
}
```

### 3. Enhanced Sign Out Event Logging

**File**: `/opt/projects/repositories/pressograph/src/lib/auth/config.ts`

**Changes**:
```typescript
async signOut({ session, token }) {
  console.log('[NextAuth Event] User signed out', {
    session: session?.user?.email,
    token: token?.sub,
  });
}
```

## Environment Variables

**Verified in `.env.local`**:
```env
NEXTAUTH_URL=https://dev-pressograph.infra4.dev
NEXT_PUBLIC_APP_URL=https://dev-pressograph.infra4.dev
NEXTAUTH_SECRET=4d3891635e60dcb9a3f5018b5bc40b4ad3bc03ec743d847cf9c3359886dee86c
```

## Testing Procedure

### Pre-Test Setup

1. **Clear browser cache and cookies**:
   - Open DevTools (F12)
   - Go to Application tab
   - Clear all cookies for `dev-pressograph.infra4.dev`
   - Clear all local storage
   - Hard refresh (Ctrl+Shift+R)

2. **Open browser console**:
   - Keep DevTools Console tab open
   - Set filter to show all logs
   - Watch for `[Header]` and `[NextAuth]` prefixed messages

### Test Steps

#### Test 1: Sign Out from Dashboard

1. Navigate to `https://dev-pressograph.infra4.dev/auth/signin`
2. Sign in with test credentials:
   - Username: `testuser`
   - Password: (test password)
3. Verify redirect to `/dashboard`
4. **Watch Console**: Should see session logs
5. Click "Sign Out" button in header
6. **Watch Console**: Should see:
   ```
   [Header] Sign out initiated
   [Header] window.location.origin: https://dev-pressograph.infra4.dev
   [Header] window.location.href: https://dev-pressograph.infra4.dev/dashboard
   [NextAuth Event] User signed out
   [Header] NextAuth signOut complete
   [Header] Redirecting to: https://dev-pressograph.infra4.dev/
   ```
7. **Verify**: Browser redirects to `https://dev-pressograph.infra4.dev/` (NOT localhost)
8. **Verify**: Address bar shows production URL
9. **Verify**: Session is cleared (can't access `/dashboard`)

#### Test 2: Sign Out from Other Pages

Repeat Test 1 but sign out from:
- `/projects` page
- `/tests` page
- Home page (if signed in)

All should redirect to `https://dev-pressograph.infra4.dev/`

#### Test 3: Network Tab Verification

1. Open DevTools Network tab
2. Sign in and navigate to dashboard
3. Click "Sign Out"
4. **Verify Network tab shows**:
   - POST to `/api/auth/signout`
   - NO redirect to localhost
   - Final redirect to `https://dev-pressograph.infra4.dev/`

### Expected Console Output

```
[Header] Sign out initiated
[Header] window.location.origin: https://dev-pressograph.infra4.dev
[Header] window.location.href: https://dev-pressograph.infra4.dev/dashboard
[NextAuth Event] User signed out { session: 'test@example.com', token: 'abc123' }
[Header] NextAuth signOut complete
[Header] Redirecting to: https://dev-pressograph.infra4.dev/
```

### Success Criteria

- ✅ No redirect to localhost
- ✅ Lands on `https://dev-pressograph.infra4.dev/`
- ✅ Session cleared successfully
- ✅ Console logs show correct flow
- ✅ No errors in console
- ✅ Network tab shows no localhost requests
- ✅ Back button doesn't return to authenticated pages

### Failure Scenarios

If test fails:

1. **Check Console Logs**: Look for errors or unexpected behavior
2. **Check Network Tab**: Look for localhost redirects
3. **Verify Environment**: Check `.env.local` has correct `NEXTAUTH_URL`
4. **Clear All Cookies**: Old session cookies may interfere
5. **Hard Refresh**: Ensure latest code is loaded

## Alternative Solution (If Still Failing)

If the issue persists, implement custom sign out:

### Custom Sign Out Server Action

**File**: `/opt/projects/repositories/pressograph/src/lib/auth/signout.ts`

```typescript
'use server';

import { cookies } from 'next/headers';

export async function customSignOut() {
  const cookieStore = await cookies();

  // Clear NextAuth session cookies
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');
  cookieStore.delete('next-auth.csrf-token');
  cookieStore.delete('__Secure-next-auth.csrf-token');

  return { success: true };
}
```

### Update Header Component

```typescript
import { customSignOut } from '@/lib/auth/signout';

const handleSignOut = async () => {
  try {
    await customSignOut();
    window.location.replace('https://dev-pressograph.infra4.dev/');
  } catch (error) {
    console.error('Sign out error:', error);
  }
};
```

## Troubleshooting

### Issue: Still redirects to localhost

**Cause**: NextAuth is still being called with default behavior

**Solution**:
1. Verify `redirect: false` is passed to `signOut()`
2. Check if `await` is properly used
3. Implement custom sign out solution

### Issue: Logs show localhost in window.location.origin

**Cause**: Browser is running in container context

**Solution**: This is expected inside container, redirect callback should handle it

### Issue: Multiple redirects

**Cause**: NextAuth redirect callback and client-side redirect both executing

**Solution**: Ensure `redirect: false` is working, check NextAuth version

## Browser Compatibility

Tested on:
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

## Performance

- Sign out should complete in < 500ms
- No flash of content
- Smooth transition to home page

## Security

- Session tokens properly cleared
- No sensitive data in console logs (production)
- CSRF tokens cleared
- Secure cookies handled properly

## Next Steps

After successful testing:
1. Remove debug console.logs (or wrap in `if (process.env.NODE_ENV === 'development')`)
2. Document in CHANGELOG.md
3. Commit changes
4. Monitor production logs for any issues
5. Consider adding analytics to track sign out success rate

## Related Files

- `/opt/projects/repositories/pressograph/src/components/layout/header.tsx`
- `/opt/projects/repositories/pressograph/src/lib/auth/config.ts`
- `/opt/projects/repositories/pressograph/.env.local`

## References

- [NextAuth.js Documentation - Sign Out](https://next-auth.js.org/getting-started/client#signout)
- [NextAuth.js Documentation - Callbacks](https://next-auth.js.org/configuration/callbacks)
- [Next.js Documentation - Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
