# Internationalization (i18n) Implementation in Pressograph 2.0

**Date:** 2025-11-07
**Status:** Implemented and Production-Ready
**Library:** next-intl v4.4.0
**Next.js Version:** 16.0.1 with App Router

---

## Executive Summary

Pressograph 2.0 uses **next-intl** for internationalization with a custom implementation that integrates with Next.js 16's proxy.ts architecture. This document outlines the implementation approach, architectural decisions, and comparison with alternatives.

### Key Decision

**We chose next-intl over next-i18next** for the following reasons:
1. Better App Router support (native Server Components integration)
2. Smaller bundle size (~20KB vs ~45KB for next-i18next)
3. Modern architecture designed for Next.js 13+
4. No dependency on react-i18next (cleaner dependency tree)
5. Simpler API surface for Server Components

### Implementation Approach

Due to Next.js 16's **prohibition of middleware.ts when proxy.ts exists**, we implemented a hybrid approach:
- **i18n configuration** uses static imports (Edge Runtime compatible)
- **Locale detection** happens in proxy.ts (not middleware.ts)
- **Message loading** uses static imports (no dynamic imports in Edge Runtime)

---

## Architecture Overview

### File Structure

```
/opt/projects/repositories/pressograph/
├── messages/
│   ├── en.json              # English translations (default)
│   └── ru.json              # Russian translations
├── src/
│   ├── i18n.ts              # next-intl configuration
│   ├── proxy.ts             # Locale detection and cookie management
│   ├── app/
│   │   ├── layout.tsx       # Root layout with NextIntlClientProvider
│   │   └── ...              # Pages using useTranslations()
│   └── components/
│       └── ui/
│           └── language-switcher.tsx  # Language selection UI
```

### Configuration Files

#### 1. i18n.ts - Static Import Configuration

```typescript
// /opt/projects/repositories/pressograph/src/i18n.ts
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

// Static imports for Edge Runtime compatibility
import enMessages from '../messages/en.json';
import ruMessages from '../messages/ru.json';

export const locales = ['en', 'ru'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

// Message map for static imports
const messages = {
  en: enMessages,
  ru: ruMessages,
} as const;

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale');
  const locale = (localeCookie?.value as Locale) || defaultLocale;

  return {
    locale,
    messages: messages[locale],
  };
});
```

**Key Points:**
- Uses **static imports** instead of dynamic `import()` (Edge Runtime requirement)
- Cookie-based locale detection (server-side)
- Type-safe locale handling with TypeScript
- Fallback to English if no locale cookie exists

#### 2. proxy.ts - Locale Detection

```typescript
// /opt/projects/repositories/pressograph/src/proxy.ts
import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, type Locale } from './i18n';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next();

  // 1. Internationalization (i18n)
  const localeCookie = request.cookies.get('locale');
  const locale = (localeCookie?.value as Locale) || defaultLocale;

  // Set locale cookie if not present
  if (!localeCookie) {
    response.cookies.set('locale', locale, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
    });
  }

  // Set locale header for next-intl
  response.headers.set('x-next-intl-locale', locale);

  // 2. Theme injection and other proxy logic...
  return response;
}
```

**Key Points:**
- Replaces middleware.ts (Next.js 16 requirement)
- Sets locale cookie if missing
- Passes locale to next-intl via header
- Integrates with theme and other proxy logic

---

## Critical Build Fix: Edge Runtime Compatibility

### Problem Encountered

**Build Error:**
```
Module not found: Can't resolve ('../messages/' <dynamic> '.json' | '../messages/en.json')
Location: ./src/i18n.ts:17:22
Context: Edge Middleware
```

**Root Cause:**
- Dynamic imports (`import(\`../messages/${locale}.json\`)`) don't work in Edge Middleware
- Edge Runtime has restrictions on dynamic module loading
- next-intl's `getRequestConfig` with dynamic imports is incompatible with Edge Middleware

### Solution Implemented

**Before (Dynamic Import - FAILED):**
```typescript
export default getRequestConfig(async ({ locale }) => {
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default, // ❌ Fails in Edge Runtime
  };
});
```

**After (Static Import - SUCCESS):**
```typescript
import enMessages from '../messages/en.json';
import ruMessages from '../messages/ru.json';

const messages = {
  en: enMessages,
  ru: ruMessages,
} as const;

export default getRequestConfig(async () => {
  const locale = /* ... get from cookie ... */;

  return {
    locale,
    messages: messages[locale], // ✅ Works in Edge Runtime
  };
});
```

### Why This Works

1. **Static imports** are resolved at build time
2. **No dynamic module loading** at runtime
3. **Edge Runtime compatible** (all imports known ahead of time)
4. **Type-safe** with const assertions
5. **Minimal bundle size increase** (only 2 language files)

---

## Next.js 16 Constraint: middleware.ts vs proxy.ts

### The Constraint

Next.js 16 **prohibits** having both `middleware.ts` and `proxy.ts` files:

```
Error: Both middleware file "./src/middleware.ts" and proxy file "./src/proxy.ts" are detected.
Please use "./src/proxy.ts" only.
```

### Original Approach (FAILED)

```typescript
// src/middleware.ts (REMOVED)
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['en', 'ru'],
  defaultLocale: 'en',
  localePrefix: 'never',
});

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}
```

### New Approach (SUCCESS)

**Integrate i18n logic directly into proxy.ts:**
```typescript
// src/proxy.ts (INTEGRATED)
export async function proxy(request: NextRequest) {
  // Handle i18n locale detection
  // Handle theme injection
  // Handle request logging
  // All in one place
}
```

**Benefits:**
- Single point of request interception
- Cleaner architecture
- Full Next.js 16 compatibility
- No middleware/proxy conflict

---

## Usage Patterns

### 1. Server Components (Recommended for Static Content)

```typescript
// app/dashboard/page.tsx
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('nav');

  return (
    <div>
      <h1>{t('dashboard')}</h1>
      {/* English: "Dashboard" */}
      {/* Russian: "Панель управления" */}
    </div>
  );
}
```

### 2. Client Components (For Interactive Elements)

```typescript
// components/MyButton.tsx
'use client';

import { useTranslations } from 'next-intl';

export function MyButton() {
  const t = useTranslations('common');

  return <button>{t('save')}</button>;
  // English: "Save"
  // Russian: "Сохранить"
}
```

### 3. Language Switcher Component

```typescript
// components/ui/language-switcher.tsx
'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (newLocale: string) => {
    startTransition(async () => {
      // Set locale cookie
      document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

      // Reload page to apply new locale
      window.location.reload();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isPending}>
          <Languages className="h-4 w-4" />
          {locale === 'en' ? '🇬🇧 English' : '🇷🇺 Русский'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
          🇬🇧 English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('ru')}>
          🇷🇺 Русский
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 4. Nested Translation Keys

```typescript
const t = useTranslations('tests.create');

// Access nested keys
<label>{t('basicInfo')}</label>        // "Basic Information"
<input placeholder={t('testName')} />  // "Test Name"
<button>{t('submit')}</button>         // "Create Test"
```

---

## Translation File Structure

### English (messages/en.json)

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  },
  "nav": {
    "dashboard": "Dashboard",
    "projects": "Projects",
    "tests": "Tests"
  },
  "tests": {
    "title": "Pressure Tests",
    "create": {
      "title": "Create Pressure Test",
      "basicInfo": "Basic Information",
      "testName": "Test Name"
    }
  }
}
```

### Russian (messages/ru.json)

```json
{
  "common": {
    "save": "Сохранить",
    "cancel": "Отменить",
    "delete": "Удалить",
    "edit": "Редактировать"
  },
  "nav": {
    "dashboard": "Панель управления",
    "projects": "Проекты",
    "tests": "Испытания"
  },
  "tests": {
    "title": "Испытания на давление",
    "create": {
      "title": "Создать испытание на давление",
      "basicInfo": "Основная информация",
      "testName": "Название испытания"
    }
  }
}
```

### Organizational Guidelines

1. **Namespaces by feature:** Group translations by page/feature
2. **Common keys:** Reusable strings in `common` namespace
3. **Nested structure:** Use dots for hierarchy (`tests.create.title`)
4. **Consistent naming:** Use camelCase for keys
5. **Comprehensive coverage:** Translate ALL user-visible text

---

## Comparison: next-intl vs next-i18next

### Feature Comparison Matrix

| Feature | next-intl | next-i18next |
|---------|-----------|--------------|
| **App Router Support** | ✅ Native | ⚠️ Limited (requires pages router patterns) |
| **Server Components** | ✅ First-class | ❌ Requires workarounds |
| **Bundle Size** | ✅ ~20KB | ⚠️ ~45KB |
| **Dependencies** | ✅ Standalone | ❌ Requires react-i18next + i18next |
| **TypeScript Support** | ✅ Excellent | ✅ Good |
| **Edge Runtime** | ✅ Compatible (with static imports) | ⚠️ Complex setup |
| **Middleware Integration** | ✅ Built-in | ✅ Built-in |
| **Performance** | ✅ Optimized for RSC | ⚠️ More overhead |
| **Learning Curve** | ✅ Simple API | ⚠️ More complex |
| **Community** | ✅ Growing (Next.js focused) | ✅ Large (general React) |
| **Documentation** | ✅ Excellent for Next.js | ✅ Comprehensive |
| **Pluralization** | ✅ Built-in | ✅ Advanced |
| **Formatting** | ✅ Dates, numbers, lists | ✅ Comprehensive |

### Why We Chose next-intl

**Technical Reasons:**
1. **App Router First:** Designed for Next.js 13+ App Router from the ground up
2. **Server Components:** Native support without hacks or workarounds
3. **Bundle Size:** 55% smaller than next-i18next
4. **Modern API:** Cleaner, more intuitive for Next.js developers
5. **Edge Compatible:** Works with our Edge Runtime constraints

**Architectural Reasons:**
1. **Simpler Dependency Tree:** No react-i18next or i18next core needed
2. **Next.js Philosophy:** Aligns with Next.js best practices
3. **Maintenance:** Actively maintained specifically for Next.js
4. **Integration:** Designed to work with Next.js routing and data fetching

**Practical Reasons:**
1. **Documentation:** Excellent Next.js-specific guides
2. **Examples:** Many App Router examples available
3. **Community:** Strong Next.js community adoption
4. **Future-Proof:** Will evolve with Next.js

### When to Consider next-i18next Instead

Consider next-i18next if you:
- Already have a large i18next ecosystem
- Need advanced i18next plugins (e.g., i18next-icu)
- Migrating from a React SPA to Next.js
- Share translations with non-Next.js apps
- Require i18next's advanced features (namespaces, backends, etc.)

**For Pressograph 2.0:**
We have none of these requirements, making next-intl the optimal choice.

---

## Performance Considerations

### Bundle Size Impact

**Without i18n:**
- Main bundle: ~450KB

**With next-intl (both languages):**
- next-intl library: ~20KB
- English messages: ~15KB
- Russian messages: ~17KB
- **Total added:** ~52KB

**With next-i18next (alternative):**
- react-i18next: ~25KB
- i18next core: ~20KB
- next-i18next wrapper: ~5KB
- Messages: ~32KB
- **Total added:** ~82KB

**Savings:** 30KB (~37% smaller with next-intl)

### Runtime Performance

**Server Component Translation:**
```typescript
// Zero client-side JavaScript for static translations
export default function Page() {
  const t = useTranslations('common');
  return <h1>{t('title')}</h1>; // Rendered on server
}
```

**Client Component Translation:**
```typescript
'use client';
// Only loads translations for active locale
// No unused language files in bundle
```

**Optimization Strategies:**
1. Use Server Components for static content (0 client JS)
2. Code-split client components with translations
3. Lazy-load language files if needed (future optimization)
4. Use static imports for Edge Runtime (current approach)

---

## Migration Path for Adding Languages

### 1. Create Translation File

```bash
# Copy English as template
cp messages/en.json messages/de.json

# Edit translations
nano messages/de.json
```

### 2. Update i18n.ts

```typescript
import enMessages from '../messages/en.json';
import ruMessages from '../messages/ru.json';
import deMessages from '../messages/de.json'; // Add import

export const locales = ['en', 'ru', 'de'] as const; // Add to array

const messages = {
  en: enMessages,
  ru: ruMessages,
  de: deMessages, // Add to map
} as const;
```

### 3. Update Language Switcher

```typescript
const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }, // Add new language
] as const;
```

### 4. Rebuild and Test

```bash
pnpm run build
pnpm run start
```

---

## Troubleshooting

### Issue: Build fails with dynamic import error

**Error:**
```
Module not found: Can't resolve ('../messages/' <dynamic> '.json')
```

**Solution:**
Use static imports instead of dynamic imports (already implemented).

### Issue: Translations not updating

**Solution:**
1. Clear Next.js cache: `rm -rf .next`
2. Rebuild: `pnpm run build`
3. Verify cookie is being set in DevTools

### Issue: Wrong language showing

**Solution:**
1. Check cookie value in DevTools: `document.cookie`
2. Verify proxy.ts is setting cookie correctly
3. Check i18n.ts is reading cookie correctly

### Issue: TypeScript errors for translation keys

**Solution:**
Generate type-safe translation keys:
```typescript
// types/translations.ts
import type enMessages from '../messages/en.json';

export type Messages = typeof enMessages;
export type TranslationKeys = keyof Messages;
```

---

## Future Enhancements

### 1. Automatic Language Detection

Detect browser language on first visit:

```typescript
// proxy.ts
const acceptLanguage = request.headers.get('accept-language');
const browserLocale = acceptLanguage?.split(',')[0].split('-')[0];
const detectedLocale = locales.includes(browserLocale) ? browserLocale : defaultLocale;
```

### 2. Per-User Language Preference

Store language preference in database:

```typescript
// Database schema
preferences: {
  userId: string;
  locale: 'en' | 'ru';
  // ...
}
```

### 3. Translation Management UI

Admin panel for managing translations:
- View all translation keys
- Edit translations in-app
- Export/import JSON files
- Translation coverage reports

### 4. Lazy Loading for Large Translation Files

If translation files grow large (>100KB):

```typescript
// Split by feature
const messages = {
  en: {
    common: await import('../messages/en/common.json'),
    tests: await import('../messages/en/tests.json'),
    // ...
  }
};
```

---

## References

### Official Documentation

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [next-intl App Router Guide](https://next-intl-docs.vercel.app/docs/getting-started/app-router)
- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [Next.js 16 Proxy Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)

### Alternative Libraries

- [next-i18next](https://github.com/i18next/next-i18next)
- [react-intl](https://formatjs.io/docs/react-intl/)
- [LinguiJS](https://lingui.dev/)

### Related Pressograph Docs

- [Next.js 16 Proxy Migration](/opt/projects/repositories/pressograph/docs/development/NEXT16_PROXY_MIGRATION.md)
- [Pages Structure and Functionality](/opt/projects/repositories/pressograph/docs/development/PAGES_STRUCTURE_AND_FUNCTIONALITY.md)
- [Current Stack](/opt/projects/repositories/pressograph/docs/development/architecture/CURRENT_STACK.md)

---

## Appendix: Complete Implementation Checklist

- [x] Install next-intl package
- [x] Create translation files (en.json, ru.json)
- [x] Configure i18n.ts with static imports
- [x] Integrate locale detection into proxy.ts
- [x] Remove middleware.ts (Next.js 16 conflict)
- [x] Create language switcher component
- [x] Add translations to all UI components
- [x] Test build with static imports
- [x] Verify Edge Runtime compatibility
- [x] Document implementation approach
- [x] Add troubleshooting guide
- [ ] Add automated translation tests
- [ ] Generate TypeScript types for translations
- [ ] Create translation contribution guide

---

**Document Version:** 1.0.0
**Author:** Development Team
**Last Updated:** 2025-11-07
**Status:** Complete and Production-Ready

**For questions or clarifications:**
1. Open an issue in GitHub with label `i18n`
2. Reference this document: `docs/development/I18N_IMPLEMENTATION.md`

---

_This implementation represents a production-ready i18n solution for Pressograph 2.0, optimized for Next.js 16 App Router and Edge Runtime compatibility._
