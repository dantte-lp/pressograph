# Pressograph Next.js Migration - Getting Started Guide

**Version**: 2.0.0
**Date**: 2025-11-03
**Status**: Ready to Start

---

## Overview

This guide provides step-by-step instructions for completing the Pressograph migration from Vite+React to Next.js 16.

## Current Progress

- [x] **Backup created**: `/opt/backup/pressograph-20251103-051742`
- [x] **Git tagged**: `v1.2.0-legacy` (current stable version archived)
- [x] **Migration plan**: `docs/development/architecture/NEXT_JS_MIGRATION_PLAN.md`
- [x] **GitHub milestones**: 8 sprints created (#9-#16)
- [x] **Sprint 1 issues**: 6 user stories created (#29-#34)

## Next Steps

### Step 1: Initialize Next.js 16 Project

```bash
# Navigate to project directory
cd /opt/projects/repositories/pressograph

# Remove old frontend (BACKUP EXISTS!)
# DO NOT DELETE backend yet - we'll migrate logic first
rm -rf src dist public index.html vite.config.ts

# Initialize Next.js 16
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Answer prompts:
# ✔ Would you like to use TypeScript? › Yes
# ✔ Would you like to use ESLint? › Yes
# ✔ Would you like to use Tailwind CSS? › Yes
# ✔ Would you like your code inside a `src/` directory? › No
# ✔ Would you like to use App Router? › Yes
# ✔ Would you like to use Turbopack for next dev? › Yes
# ✔ Would you like to customize the import alias (@/* by default)? › No
```

### Step 2: Install Required Dependencies

```bash
# UI Components
npm install --save-exact \
  @radix-ui/react-slot@1.1.1 \
  class-variance-authority@0.7.1 \
  clsx@2.1.1 \
  tailwind-merge@2.7.1 \
  lucide-react@0.469.0

# shadcn/ui CLI
npx shadcn@latest init

# Answer prompts:
# ✔ Preflight check... Done
# ✔ Verifying framework... Done
# ✔ Validating Tailwind CSS... Done
# ✔ Validating import alias... Done
# ✔ Which style would you like to use? › New York
# ✔ Which color would you like to use as base color? › Zinc
# ✔ Do you want to use CSS variables for theming? › yes

# Database & ORM
npm install --save-exact \
  drizzle-orm@0.38.3 \
  postgres@3.4.5 \
  @neondatabase/serverless@0.10.5

npm install --save-dev --save-exact \
  drizzle-kit@0.29.1

# Authentication
npm install --save-exact \
  next-auth@5.0.0-beta.25 \
  @auth/drizzle-adapter@1.7.3

# Internationalization
npm install --save-exact \
  next-intl@3.26.2

# State Management (client-side only)
npm install --save-exact \
  zustand@5.0.2

# Canvas & Export
npm install --save-exact \
  jspdf@2.5.2

# Forms & Validation
npm install --save-exact \
  react-hook-form@7.54.2 \
  zod@3.24.1 \
  @hookform/resolvers@3.9.1

# Toast notifications
npm install --save-exact \
  sonner@1.7.3
```

### Step 3: Pin All Versions in package.json

**CRITICAL**: After installation, ensure ALL versions are pinned (no `^` or `~`):

```json
{
  "dependencies": {
    "next": "16.0.0", // NOT "^16.0.0"
    "react": "19.0.0",
    "typescript": "5.9.3"
  }
}
```

### Step 4: Configure TypeScript (tsconfig.json)

Update `tsconfig.json` for strict mode:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 5: Configure TailwindCSS 4.1

Update `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### Step 6: Setup Project Structure

Create the following directory structure:

```
/opt/projects/repositories/pressograph/
├── app/
│   ├── [locale]/              # Internationalization
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── setup/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx     # Dashboard layout with nav
│   │   │   ├── page.tsx       # Home/graph config
│   │   │   ├── history/
│   │   │   │   └── page.tsx
│   │   │   ├── admin/
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── help/
│   │   │       └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── graphs/
│   │   │   └── route.ts
│   │   └── admin/
│   │       └── route.ts
│   ├── layout.tsx             # Root layout
│   └── globals.css
├── components/
│   ├── ui/                    # shadcn components
│   ├── graph/
│   │   ├── GraphCanvas.tsx
│   │   └── GraphConfig.tsx
│   ├── forms/
│   └── layout/
│       ├── Header.tsx
│       ├── Nav.tsx
│       └── ThemeProvider.tsx
├── lib/
│   ├── db/
│   │   ├── drizzle.ts
│   │   └── schema.ts
│   ├── auth/
│   │   └── auth.config.ts
│   └── utils.ts
├── messages/                  # i18n translations
│   ├── en.json
│   └── ru.json
├── server/                    # Keep temporarily for reference
├── public/
├── next.config.ts
├── drizzle.config.ts
├── middleware.ts
└── package.json
```

### Step 7: Configure Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pressograph"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 8: Initialize Drizzle ORM

Create `drizzle.config.ts`:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### Step 9: Setup Internationalization

Create `i18n/routing.ts`:

```typescript
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'ru'],
  defaultLocale: 'en',
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

Create `middleware.ts`:

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(ru|en)/:path*'],
};
```

### Step 10: Create Base Layout

Create `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Pressograph",
  description: "Pressure Test Graph Generation System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

---

## Testing Migration

```bash
# Start development server
npm run dev

# Open http://localhost:3000

# Expected: Next.js default page loads successfully
```

---

## Containerization (Sprint 7)

After completing Sprints 1-6, create production container:

### Containerfile

See `Containerfile.next` (created separately)

### compose.yaml

See `compose.next.yaml` (created separately)

### Taskfile

See `Taskfile.yml` (created separately)

---

## Migration Checklist

### Sprint 1: Foundation (Current)

- [ ] Initialize Next.js 16
- [ ] Configure TypeScript strict mode
- [ ] Setup TailwindCSS 4.1 + shadcn v3.5
- [ ] Configure ESLint + Prettier
- [ ] Setup i18n (Russian/English)
- [ ] Create base layout with theme

### Sprint 2: Database & Auth

- [ ] Setup Drizzle ORM
- [ ] Migrate database schema
- [ ] Implement NextAuth.js v5
- [ ] Create auth middleware
- [ ] Build login/logout pages

### Sprint 3: Core Features

- [ ] Migrate Canvas rendering logic
- [ ] Create graph config form
- [ ] Implement graph generation
- [ ] Add template presets
- [ ] Support intermediate stages

### Sprint 4: Export & History

- [ ] PNG export (high-res)
- [ ] PDF export (jsPDF)
- [ ] History page with table
- [ ] Save functionality
- [ ] Pagination & filters

### Sprint 5: Admin & Setup

- [ ] Admin dashboard
- [ ] User management
- [ ] Setup wizard
- [ ] System settings
- [ ] Audit logging

### Sprint 6: UI/UX

- [ ] 4-step guided flow
- [ ] Contextual help
- [ ] Theme optimization
- [ ] Progressive disclosure
- [ ] Accessibility (WCAG 2.1 AA)

### Sprint 7: Deployment

- [ ] Production Containerfile
- [ ] Podman Compose configs
- [ ] Turbopack optimization
- [ ] Health checks
- [ ] Taskfile automation

### Sprint 8: Testing & Docs

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Developer documentation
- [ ] Deployment guide

---

## Important Notes

1. **DO NOT delete `/opt/backup/pressograph-20251103-051742`** until migration is 100% complete
2. **Keep `server/` directory** for reference during backend migration (Sprints 2-3)
3. **Pin ALL versions** in package.json (no ^ or ~)
4. **Use Node.js 24 LTS** for development and production
5. **Test incrementally** after each sprint

---

## References

- Migration Plan: `docs/development/architecture/NEXT_JS_MIGRATION_PLAN.md`
- GitHub Project: https://github.com/dantte-lp/pressograph
- Sprint 1 Milestone: https://github.com/dantte-lp/pressograph/milestone/9
- Issues #29-#34: Sprint 1 user stories

---

**Last Updated**: 2025-11-03
**Status**: Ready for Sprint 1
**Backup**: `/opt/backup/pressograph-20251103-051742`
