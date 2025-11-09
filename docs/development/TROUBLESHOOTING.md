# Troubleshooting Guide - Pressograph 2.0

Common issues and their solutions for Pressograph development.

---

## Table of Contents

1. [Build & Runtime Issues](#build--runtime-issues)
   - [Internal Server Error - Corrupted Turbopack Cache](#internal-server-error---corrupted-turbopack-cache)
   - [Port Already in Use](#port-already-in-use)
2. [Permission Issues](#permission-issues)
3. [Authentication Issues](#authentication-issues)
4. [Database Issues](#database-issues)

---

## Build & Runtime Issues

### Internal Server Error - Corrupted Turbopack Cache

**Date:** 2025-11-10
**Severity:** Critical (P0)
**Status:** Resolved

#### Symptoms

- Website returns HTTP 500 Internal Server Error on all routes
- Dev server logs show module not found errors
- Build cache corruption errors

#### Error Messages

```
⨯ Error: Cannot find module ../chunks/ssr/[turbopack]_runtime.js
Error: ENOENT: no such file or directory, open .next/dev/routes-manifest.json
```

#### Root Cause

Corrupted Next.js 16 Turbopack build cache in `.next` directory. This can happen due to:
- Interrupted builds
- File system errors
- Git operations that affect .next directory
- Container restarts during build
- Turbopack development instabilities

#### Solution

```bash
# Quick fix - clear the build cache
rm -rf .next

# Then restart the dev server
pnpm dev
```

#### Prevention

1. Add `.next` to `.gitignore` (already configured)
2. Clear cache when switching branches with significant changes
3. Clear cache after container restarts
4. Clear cache if seeing module not found errors

#### Additional Notes

- This is a common issue with Next.js 16 + Turbopack in development
- The fix is safe and fast (<5 seconds to clear cache)
- No code changes needed
- Fresh build cache regenerates automatically on next dev server start

---

### Port Already in Use

#### Symptoms

```
⚠ Port 3000 is in use by an unknown process, using available port 3002 instead.
```

#### Solution

```bash
# Find the process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use killall
killall -9 node
```

---

## Permission Issues

### File System Permission Errors

**Date:** 2025-11-06
**Severity:** Critical (P0)
**Status:** Resolved

See [HOTFIX_INTERNAL_SERVER_ERROR.md](../HOTFIX_INTERNAL_SERVER_ERROR.md) for detailed analysis.

#### Common Symptoms

- Turbopack cannot read directories
- Permission denied errors
- Files owned by root instead of developer

#### Solution

```bash
# Fix ownership of workspace files
sudo chown -R developer:developer /workspace

# Fix directory permissions
sudo chmod -R 755 /workspace/docs
sudo chmod -R 755 /workspace/src
sudo chmod 644 /workspace/.env.local

# Fix .next directory
sudo chown -R developer:developer /workspace/.next
sudo chmod -R 755 /workspace/.next
```

---

## Authentication Issues

### SessionProvider Missing

#### Symptoms

```
[next-auth]: useSession must be wrapped in a <SessionProvider />
```

#### Solution

Ensure `SessionProvider` is added to `src/components/providers.tsx`:

```tsx
import { SessionProvider } from next-auth/react

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* Other providers */}
      {children}
    </SessionProvider>
  )
}
```

---

## Database Issues

### Prisma Connection Errors

#### Symptoms

- Database connection refused
- Prisma client initialization errors

#### Solution

```bash
# Check PostgreSQL is running
podman ps | grep postgres

# Check database connection
psql -h localhost -U pressograph -d pressograph

# Regenerate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev
```

---

## Quick Reference

### Common Commands

```bash
# Clear all caches and restart fresh
rm -rf .next node_modules/.cache
pnpm dev

# Fix permissions
sudo chown -R developer:developer /workspace

# Restart all services
pm2 restart all

# View logs
pm2 logs nextjs-dev
podman logs pressograph-dev-workspace

# Check process status
pm2 status
podman ps
```

### Environment Variables

Check `.env.local` for correct configuration:

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
```

---

## Getting Help

1. Check this troubleshooting guide first
2. Search existing issues in GitHub
3. Check the [HAR Analysis](../HAR_ANALYSIS_SUMMARY.md) for network issues
4. Review [Development Documentation](./README.md)
5. Check container logs: `podman logs pressograph-dev-workspace`

---

## Related Documentation

- [HOTFIX_INTERNAL_SERVER_ERROR.md](../HOTFIX_INTERNAL_SERVER_ERROR.md) - Permission and SessionProvider issues (2025-11-06)
- [NEXT16_PROXY_MIGRATION.md](./NEXT16_PROXY_MIGRATION.md) - Next.js 16 proxy configuration
- [PAGES_STRUCTURE_AND_FUNCTIONALITY.md](./PAGES_STRUCTURE_AND_FUNCTIONALITY.md) - Application architecture
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) - Development guidelines
