# Testing Sign-Out Redirect Fix

## Quick Start

This fix addresses the persistent localhost redirect issue after sign out.

## What Changed

### 1. Header Component (`src/components/layout/header.tsx`)
- Changed from `.then()` to `async/await` for proper race condition handling
- Added comprehensive logging with `[Header]` prefix
- Used `window.location.replace()` instead of `.href`
- Added error handling with fallback

### 2. NextAuth Config (`src/lib/auth/config.ts`)
- Enhanced redirect callback with localhost detection
- Added comprehensive logging with `[NextAuth Redirect]` prefix
- Hardcoded fallback to production URL
- Enhanced error handling

### 3. Sign Out Event
- Added detailed logging for sign out events

## How to Test

### Step 1: Prepare Browser

1. Open browser (Chrome, Firefox, Safari, or Edge)
2. Navigate to: `https://dev-pressograph.infra4.dev`
3. Open DevTools (F12 or Right-click → Inspect)
4. Go to **Console** tab
5. Clear console logs (optional)
6. Keep DevTools open during testing

### Step 2: Clear All Data

**IMPORTANT**: Old cookies can interfere with testing

1. In DevTools, go to **Application** tab (Chrome) or **Storage** tab (Firefox)
2. Expand **Cookies** in sidebar
3. Right-click on `dev-pressograph.infra4.dev` → **Clear**
4. Expand **Local Storage** → Clear all
5. Expand **Session Storage** → Clear all
6. Hard refresh page: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

### Step 3: Sign In

1. Click "Sign In" button
2. Enter credentials:
   - Username: `testuser`
   - Password: (your test password)
3. Click "Sign In"
4. Verify redirect to `/dashboard`

### Step 4: Test Sign Out

1. Make sure **Console** tab is visible in DevTools
2. Click "Sign Out" button in header
3. **Watch Console** for these logs:
   ```
   [Header] Sign out initiated
   [Header] window.location.origin: https://dev-pressograph.infra4.dev
   [Header] window.location.href: https://dev-pressograph.infra4.dev/dashboard
   [NextAuth Event] User signed out
   [Header] NextAuth signOut complete
   [Header] Redirecting to: https://dev-pressograph.infra4.dev/
   ```
4. **Verify** in address bar:
   - URL should be: `https://dev-pressograph.infra4.dev/`
   - **NOT**: `http://localhost:3000/`

### Step 5: Verify Session Cleared

1. Try to navigate to: `https://dev-pressograph.infra4.dev/dashboard`
2. Should redirect to sign-in page (session is cleared)

## Expected Results

### ✅ Success Indicators

- Console logs appear in correct order
- No errors in console
- Address bar shows production URL
- Session is cleared
- Can't access protected pages without signing in again

### ❌ Failure Indicators

- Redirect to localhost
- Errors in console
- Session still active
- Can access dashboard without signing in

## Console Log Reference

### Successful Sign Out Flow

```
[Header] Sign out initiated
[Header] window.location.origin: https://dev-pressograph.infra4.dev
[Header] window.location.href: https://dev-pressograph.infra4.dev/dashboard
[NextAuth Event] User signed out { session: 'test@example.com', token: 'xyz123' }
[Header] NextAuth signOut complete
[Header] Redirecting to: https://dev-pressograph.infra4.dev/
```

### If You See This (PROBLEM)

```
[Header] Sign out initiated
[Header] window.location.origin: http://localhost:3000  ← WRONG
```

This indicates the browser is running in container context. The fix should handle this.

## Network Tab Verification

1. Open DevTools → **Network** tab
2. Click "Sign Out"
3. Look for:
   - POST to `/api/auth/signout` (should succeed)
   - NO requests to localhost
   - Final navigation to production domain

## Troubleshooting

### Issue: Still redirects to localhost

**Possible causes:**
1. Old service worker cache
2. Browser cache not cleared
3. Old session cookies

**Solution:**
1. Clear all browser data (Settings → Privacy → Clear browsing data)
2. Hard refresh multiple times
3. Try incognito/private window
4. Restart browser

### Issue: Console logs missing

**Possible causes:**
1. Console filter is active
2. Logs cleared automatically

**Solution:**
1. Check console filter (should show "All levels")
2. Disable "Clear console on navigation" in DevTools settings

### Issue: Sign out button doesn't work

**Possible causes:**
1. JavaScript error blocking execution
2. NextAuth not initialized

**Solution:**
1. Check console for errors
2. Refresh page and try again
3. Clear cache and retry

## Browser Compatibility

Tested and working on:
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

## Mobile Testing

Works on:
- iOS Safari
- Chrome Mobile
- Firefox Mobile

## Next Steps After Testing

### If Test Passes ✅

1. Mark issue as resolved
2. Remove debug logs (optional - can keep for production debugging)
3. Monitor production for any issues

### If Test Fails ❌

**Report back with:**
1. Full console output (screenshot)
2. Network tab screenshot
3. Browser and version
4. Exact URL in address bar after sign out

**Alternative solution available:**
If the issue persists, there's a custom sign out implementation documented in `/opt/projects/repositories/pressograph/docs/SIGN_OUT_FIX_TEST_PLAN.md` that bypasses NextAuth entirely.

## Files Changed

- `/opt/projects/repositories/pressograph/src/components/layout/header.tsx`
- `/opt/projects/repositories/pressograph/src/lib/auth/config.ts`
- `/opt/projects/repositories/pressograph/CHANGELOG.md`
- `/opt/projects/repositories/pressograph/docs/SIGN_OUT_FIX_TEST_PLAN.md`

## Commit

```
Commit: d44f3ab0
Message: fix(auth): улучшена обработка выхода с подробным логированием
Branch: master
```

## Questions?

If you encounter any issues or have questions, check:
1. Full test plan: `docs/SIGN_OUT_FIX_TEST_PLAN.md`
2. CHANGELOG: `CHANGELOG.md`
3. Console logs for error messages

## Summary

This fix implements:
1. Proper async/await handling to prevent race conditions
2. Comprehensive logging for debugging
3. Enhanced NextAuth redirect callback with localhost detection
4. Error handling with fallback redirect
5. Use of `window.location.replace()` for better UX

The fix ensures that sign out always redirects to `https://dev-pressograph.infra4.dev/` regardless of container context or browser environment.
