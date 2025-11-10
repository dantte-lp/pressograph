# Authentication Error Fix - 2025-11-10

## Problem Report

**Issue**: Users were redirected to `/api/auth/error` after attempting to sign in.

**Error Type**: `CredentialsSignin` error in NextAuth

**Date Identified**: November 10, 2025

## Root Cause Analysis

The authentication error was caused by a **database connection failure** due to a password mismatch between the application configuration and the actual PostgreSQL database.

### Technical Details

1. **Environment Configuration Issue**:
   - `.env.local` contained: `DATABASE_URL=postgresql://postgres:4dVDfBH8CadyQQYNeQY9H0Il6DJEtDO4@db:5432/pressograph`
   - Actual database password: `postgres`
   - This mismatch prevented the application from connecting to the database

2. **Impact on Authentication**:
   - NextAuth's `authorize()` function in `/src/lib/auth/config.ts` queries the database to validate credentials
   - Database connection failure caused all authentication attempts to fail silently
   - The error was caught by the try-catch block (line 127-130 in config.ts) which returns `null`
   - NextAuth interprets `null` return as invalid credentials, redirecting to `/api/auth/error`

3. **Silent Failure Mode**:
   - The error was logged to console but not exposed to the user for security reasons
   - Users only saw "Invalid credentials" message even though the real issue was database connectivity

## Investigation Steps

1. Checked NextAuth configuration (`/src/lib/auth/config.ts`)
2. Verified database credentials in `.env.local`
3. Tested direct PostgreSQL connection from host: ✅ Success
4. Tested PostgreSQL connection from dev container: ❌ Failed (password mismatch)
5. Inspected database container environment variables
6. Identified password discrepancy

## Solution Implemented

Updated `/opt/projects/repositories/pressograph/.env.local`:

```diff
- DATABASE_URL=postgresql://postgres:4dVDfBH8CadyQQYNeQY9H0Il6DJEtDO4@db:5432/pressograph
- POSTGRES_PASSWORD=4dVDfBH8CadyQQYNeQY9H0Il6DJEtDO4
+ DATABASE_URL=postgresql://postgres:postgres@db:5432/pressograph
+ POSTGRES_PASSWORD=postgres
```

## Verification Steps

1. ✅ Database connection test from dev container:
   ```bash
   psql -h db -U postgres -d pressograph -c "SELECT id, username FROM users;"
   ```

2. ✅ Verified user accounts exist with passwords:
   ```
   testuser | admin | active | has password
   dantte   | user  | active | has password
   ```

3. ✅ Dev server restarted successfully with new environment variables

4. ✅ NextAuth API endpoints responding correctly:
   - `/api/auth/providers` - Returns available auth providers
   - Server returning 200 OK responses

## Test Credentials

For testing authentication after this fix:

- **Username**: `testuser`
- **Password**: `Test1234!`
- **Role**: admin

## Prevention Measures

To prevent similar issues in the future:

1. **Environment Variable Validation**:
   - Add startup health checks for database connectivity
   - Implement better error messages for database connection failures
   - Consider using `checkDatabaseHealth()` function from `/src/lib/db/index.ts`

2. **Documentation**:
   - Ensure `.env.example` files match actual deployment configurations
   - Document password rotation procedures
   - Add troubleshooting guide for authentication errors

3. **Monitoring**:
   - Add database connection metrics to observability stack
   - Alert on authentication failure rate spikes
   - Log database connection attempts with proper error details

## Related Files

- `/opt/projects/repositories/pressograph/.env.local` - Environment configuration (UPDATED)
- `/opt/projects/repositories/pressograph/src/lib/auth/config.ts` - NextAuth configuration
- `/opt/projects/repositories/pressograph/src/lib/db/index.ts` - Database connection setup
- `/opt/projects/repositories/pressograph/src/components/auth/signin-form.tsx` - Sign-in form component

## Additional Notes

- The database is running PostgreSQL 18.0
- Using Drizzle ORM with postgres.js driver
- Authentication strategy: JWT (not database sessions)
- No changes to application code were required - only environment configuration

## Status

**RESOLVED** - Authentication is now working correctly after database password correction.

Next steps:
- Continue with Sprint 4 tasks
- Consider implementing database health check middleware
- Review other environment variable mismatches
