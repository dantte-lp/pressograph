# Setup Flow Documentation

## Overview

The Pressograph 2.0 setup flow provides a user-friendly initialization wizard for first-time deployment. This document describes the architecture, implementation, and usage of the setup system.

## Architecture

### Components

The setup system consists of four main components:

1. **Validation Layer** (`src/lib/setup/validation.ts`)
   - Zod schemas for type-safe validation
   - Input sanitization and error messages
   - Type inference for TypeScript

2. **Database Layer** (`src/lib/db/setup.ts`)
   - Setup status checking
   - Admin user creation with bcrypt password hashing
   - Organization creation with default settings
   - Database health checks

3. **API Layer** (`src/app/api/setup/`)
   - `GET /api/setup/status` - Check setup status
   - `POST /api/setup/init` - Initialize application

4. **UI Layer** (`src/app/(auth)/setup/page.tsx`)
   - Multi-step wizard interface
   - Real-time validation
   - Progress tracking
   - Responsive design with Radix UI components

### Middleware Protection

The middleware (`src/middleware.ts`) ensures:
- Users are redirected to `/setup` if setup is incomplete
- Setup page is inaccessible after initialization
- API routes remain functional during setup

## Setup Flow

### Step-by-Step Process

```
┌─────────────┐
│   Welcome   │  Introduction and prerequisites
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Health    │  Database connection verification
│    Check    │  System requirements check
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Admin     │  Administrator account creation
│   User      │  Name, username, email, password
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Organization │  Organization details
│    Setup    │  Name, slug, language
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Complete   │  Success confirmation
│             │  Redirect to sign-in
└─────────────┘
```

### Database Schema

The setup process creates:

**Admin User:**
```typescript
{
  id: uuid (auto-generated)
  name: string
  username: string (unique)
  email: string (unique)
  password: string (bcrypt hashed)
  role: "admin"
  organizationId: uuid (links to organization)
  isActive: true
  emailVerified: Date (auto-verified for admin)
}
```

**Organization:**
```typescript
{
  id: uuid (auto-generated)
  name: string
  slug: string (unique, auto-generated from name)
  settings: {
    defaultLanguage: "en" | "ru"
    allowPublicSharing: false
    requireApprovalForTests: false
    maxTestDuration: 48
    customBranding: { enabled: false }
  }
  planType: "free"
  subscriptionStatus: "active"
}
```

## API Reference

### GET /api/setup/status

Check if application setup is required.

**Response:**
```json
{
  "success": true,
  "data": {
    "isSetupRequired": false,
    "isSetupComplete": true,
    "database": {
      "isConnected": true,
      "version": "PostgreSQL 18.0",
      "name": "pressograph",
      "tableCount": 13
    },
    "adminUserExists": true,
    "organizationCount": 1
  }
}
```

### POST /api/setup/init

Initialize the application with admin user and organization.

**Request:**
```json
{
  "admin": {
    "name": "John Doe",
    "username": "admin",
    "email": "admin@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123"
  },
  "organization": {
    "name": "My Organization",
    "slug": "my-organization",
    "defaultLanguage": "en"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Application initialized successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    },
    "organization": {
      "id": "uuid",
      "name": "My Organization",
      "slug": "my-organization"
    }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "admin.password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

## Usage

### First-Time Setup

1. **Start the application:**
   ```bash
   pnpm dev
   ```

2. **Navigate to any route:**
   - Middleware automatically redirects to `/setup`

3. **Complete the wizard:**
   - Click "Get Started"
   - Verify database connection
   - Fill in admin user details
   - Configure organization settings
   - Submit initialization

4. **Sign in:**
   - Redirected to `/auth/signin`
   - Use admin credentials to log in

### Resetting Setup

To reset the application for development/testing:

```bash
# Drop all users (will trigger setup requirement)
pnpm db:studio
# Delete all users from the users table

# OR use psql
psql $DATABASE_URL -c "DELETE FROM users WHERE role = 'admin';"

# OR reset entire database
pnpm db:drop
pnpm db:push
```

### Manual Setup Check

Check setup status programmatically:

```typescript
import { isSetupRequired, getSetupStatus } from "@/lib/db/setup";

// Simple check
const required = await isSetupRequired();
console.log("Setup required:", required);

// Detailed status
const status = await getSetupStatus();
console.log("Setup status:", status);
```

## Validation Rules

### Admin User

- **Name:** 2-255 characters
- **Username:**
  - 3-50 characters
  - Letters, numbers, underscores, hyphens only
  - Must be unique
- **Email:**
  - Valid email format
  - Max 255 characters
  - Must be unique
- **Password:**
  - Minimum 8 characters
  - Must contain uppercase letter
  - Must contain lowercase letter
  - Must contain number

### Organization

- **Name:** 2-255 characters
- **Slug:**
  - 2-255 characters
  - Lowercase letters, numbers, hyphens only
  - Auto-generated from name if not provided
  - Must be unique
- **Language:** "en" or "ru"

## Security Features

### Password Security

- **Hashing:** bcrypt with cost factor 10
- **Strength Requirements:** Enforced via regex validation
- **Confirmation:** Password must be entered twice

### Input Sanitization

- **Trimming:** All string inputs are trimmed
- **Normalization:** Email addresses are lowercased
- **Validation:** Zod schemas prevent SQL injection and XSS

### Access Control

- **One-Time Setup:** Cannot re-run setup once initialized
- **Public Endpoint:** Setup endpoints are public by design
- **Database Check:** Always verifies no admin exists before creating

## Error Handling

### Common Errors

**Database Connection Failed:**
```
Error: Failed to connect to server
Solution: Ensure PostgreSQL is running and DATABASE_URL is correct
```

**User Already Exists:**
```
Error: User with email "admin@example.com" already exists
Solution: Use a different email or reset the database
```

**Validation Failed:**
```
Error: Password must contain at least one uppercase letter
Solution: Follow password requirements
```

### Debugging

Enable detailed logging:

```bash
# Environment variables
DRIZZLE_LOG_QUERIES=true
POSTGRES_DEBUG=true
NODE_ENV=development
```

Check logs in terminal for detailed error messages.

## Testing

### Manual Testing Checklist

- [ ] Fresh database redirects to `/setup`
- [ ] Welcome screen displays correctly
- [ ] Health check shows database connection
- [ ] Admin form validation works
- [ ] Organization form validation works
- [ ] Initialization creates user and org
- [ ] Success screen redirects to sign-in
- [ ] Revisiting `/setup` redirects to sign-in
- [ ] Protected routes accessible after setup
- [ ] Sign-in works with created credentials

### Automated Tests

```bash
# Run all tests
pnpm test

# Run setup-specific tests
pnpm test setup
```

## Troubleshooting

### Middleware Loop

**Symptom:** Infinite redirects between `/setup` and `/auth/signin`

**Causes:**
- Setup status API failing
- Database connection issues
- Middleware timeout

**Solution:**
```bash
# Check database connection
pnpm db:health

# Check setup status
curl http://localhost:3000/api/setup/status

# Verify middleware logs in terminal
```

### Setup Page Not Rendering

**Symptom:** Blank page or 404 error

**Causes:**
- Missing file: `src/app/(auth)/setup/page.tsx`
- Build errors
- Route group misconfiguration

**Solution:**
```bash
# Rebuild application
pnpm build

# Check for TypeScript errors
pnpm type-check

# Verify file exists
ls src/app/\(auth\)/setup/page.tsx
```

### Database Errors

**Symptom:** "Table does not exist" errors

**Causes:**
- Migrations not applied
- Wrong database connection

**Solution:**
```bash
# Apply migrations
pnpm db:push

# OR regenerate and migrate
pnpm db:generate
pnpm db:migrate

# Verify tables exist
pnpm db:studio
```

## Performance Considerations

- **Middleware Caching:** Setup status is cached to reduce DB calls
- **Connection Pooling:** PostgreSQL connection pool configured in `lib/db/index.ts`
- **Timeout Protection:** Middleware has 3-second timeout for setup check
- **Progressive Enhancement:** UI works without JavaScript for basic functionality

## Migration from v1

If migrating from Pressograph v1:

1. **Export existing users:**
   ```bash
   # Old database
   pg_dump -t users old_db > users_backup.sql
   ```

2. **Transform schema:**
   - Add `username` field to users
   - Hash passwords with bcrypt
   - Create organization records
   - Link users to organizations

3. **Skip setup:**
   - Setup is only required for fresh installs
   - Existing databases with admin users skip setup automatically

## Future Enhancements

Planned improvements:

- [ ] Multi-language support in setup wizard
- [ ] Custom branding during setup
- [ ] Email verification for admin user
- [ ] SMTP configuration in setup
- [ ] Database seeding options
- [ ] Backup/restore functionality
- [ ] Setup progress persistence (resume interrupted setup)

## Related Documentation

- [Database Schema](/docs/development/DATABASE.md)
- [Authentication](/docs/development/AUTH.md)
- [Middleware](/docs/development/MIDDLEWARE.md)
- [API Routes](/docs/development/API.md)

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/pressograph/issues
- Documentation: https://pressograph.dev/docs
- Community: https://discord.gg/pressograph
