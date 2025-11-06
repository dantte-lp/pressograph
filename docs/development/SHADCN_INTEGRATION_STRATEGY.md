# shadcn/ui Integration Strategy

**Project:** Pressograph 2.0
**Next.js Version:** 16.0.1
**React Version:** 19.2.0
**Tailwind CSS Version:** 4.1.16
**shadcn/ui Version:** Latest (3.5.0+)
**Document Date:** 2025-11-07
**Status:** Comprehensive Analysis & Strategic Guide

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Assessment](#current-state-assessment)
3. [Compatibility Analysis](#compatibility-analysis)
4. [Installation & Setup](#installation--setup)
5. [Theming Strategy](#theming-strategy)
6. [Component Usage Patterns](#component-usage-patterns)
7. [Form Integration](#form-integration)
8. [Best Practices](#best-practices)
9. [Migration Checklist](#migration-checklist)
10. [Next.js 16 + React 19 Considerations](#nextjs-16--react-19-considerations)
11. [Troubleshooting](#troubleshooting)
12. [References](#references)

---

## Executive Summary

### Current State
Pressograph 2.0 has a **well-configured shadcn/ui integration** with the following strengths:

- ✅ **components.json properly configured** with new-york style
- ✅ **Tailwind CSS v4** fully configured with @theme inline directives
- ✅ **CSS variables system** implemented with comprehensive light/dark themes
- ✅ **Dark mode** properly set up with next-themes
- ✅ **Path aliases** correctly configured in tsconfig.json
- ✅ **React 19 compatibility** - using latest patterns without forwardRef
- ✅ **14 UI components** installed and operational

### Recommendations
1. **No major changes required** - current implementation follows best practices
2. **Minor enhancement:** Add Field component from latest shadcn/ui release
3. **Documentation:** Maintain this strategy document for team reference
4. **Future:** Consider additional components as needed (Badge, Avatar, etc.)

### Compatibility Status
**FULLY COMPATIBLE** with Next.js 16.0.1 + React 19.2.0 + Tailwind CSS v4.1.16

---

## Current State Assessment

### Configuration Files Analysis

#### 1. components.json
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",           // ✅ Modern style (default deprecated)
  "rsc": true,                   // ✅ React Server Components enabled
  "tsx": true,                   // ✅ TypeScript enabled
  "tailwind": {
    "config": "",                // ✅ Correct for Tailwind v4
    "css": "src/styles/globals.css",
    "baseColor": "slate",        // ✅ Industrial design appropriate
    "cssVariables": true,        // ✅ Proper theming approach
    "prefix": ""                 // ✅ No prefix needed
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks",
    "types": "@/types",
    "config": "@/config"
  }
}
```

**Assessment:** ✅ **EXCELLENT** - Follows all shadcn/ui best practices

#### 2. Tailwind Configuration (tailwind.config.ts)
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",           // ✅ Matches next-themes
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},                 // ✅ All in CSS (Tailwind v4 pattern)
  },
  plugins: [],                  // ✅ No plugins needed for v4
};
```

**Assessment:** ✅ **EXCELLENT** - Proper Tailwind CSS v4 configuration

#### 3. CSS Variables (globals.css)
```css
/* TailwindCSS v4 Import */
@import "tailwindcss";

/* Animations */
@import "tw-animate-css";

/* Theme variables... */
:root { /* Light theme */ }
.dark { /* Dark theme */ }

/* CRITICAL: @theme inline for TailwindCSS v4 */
@theme inline {
  --color-background: hsl(var(--background));
  /* ... complete color mappings ... */
}
```

**Assessment:** ✅ **EXCELLENT** - Comprehensive theming with:
- Industrial design color palette
- Custom success/warning states
- Graph-specific colors
- Proper @theme inline for Tailwind v4
- Typography and spacing scales

#### 4. Installed Components (14 total)
- button.tsx ✅
- card.tsx ✅
- dropdown-menu.tsx ✅
- form-error.tsx ✅
- input.tsx ✅
- label.tsx ✅
- loading-skeletons.tsx ✅
- select.tsx ✅
- skeleton.tsx ✅
- sonner.tsx ✅ (Toast replacement)
- spinner.tsx ✅
- tabs.tsx ✅
- textarea.tsx ✅
- theme-toggle.tsx ✅

**Assessment:** ✅ **GOOD** - Core components in place, React 19 compatible

#### 5. Theme Provider Setup
```typescript
// src/components/providers.tsx
export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SimpleQueryProvider>
          {children}
          <Toaster />
        </SimpleQueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
```

**Assessment:** ✅ **EXCELLENT** - Proper provider hierarchy with:
- suppressHydrationWarning on <html> in layout.tsx
- next-themes integration
- Sonner toast notifications
- Query provider for data management

### Issues Found
**NONE** - Implementation follows all current best practices

---

## Compatibility Analysis

### Next.js 16.0.1 Compatibility
✅ **FULLY COMPATIBLE**

- shadcn/ui officially supports Next.js 15+ (documented October 2024)
- Next.js 16 uses same App Router architecture as 15
- All components work with Server Components (rsc: true)
- Turbopack support confirmed working

### React 19.2.0 Compatibility
✅ **FULLY COMPATIBLE**

- shadcn/ui updated for React 19 in October 2024
- Removed forwardRef usage (React 19 native ref support)
- Button component correctly uses ref as prop
- Type definitions updated for React 19

### Tailwind CSS 4.1.16 Compatibility
✅ **FULLY COMPATIBLE**

- shadcn/ui added Tailwind v4 preview support in February 2025
- @theme inline directive properly configured
- HSL colors converted to CSS variables
- data-slot attributes supported (not currently used)

### Known Compatibility Issues
**NONE IDENTIFIED** for current stack

---

## Installation & Setup

### Initial Setup (Already Complete)
The project was initialized with:
```bash
pnpm dlx shadcn@latest init
```

Configuration choices made:
- Style: **new-york** (modern, recommended)
- Base color: **slate** (industrial design)
- CSS variables: **true** (flexible theming)
- RSC: **true** (Server Components)
- TypeScript: **true**

### Adding New Components
To add additional components:

```bash
# Single component
pnpm dlx shadcn@latest add [component-name]

# Multiple components
pnpm dlx shadcn@latest add button card dialog

# View component before adding
pnpm dlx shadcn@latest view button

# Add all components (not recommended)
pnpm dlx shadcn@latest add --all
```

### Component Installation Best Practices

1. **Review before installing:**
   ```bash
   pnpm dlx shadcn@latest view avatar
   ```

2. **Install with dependencies:**
   shadcn CLI automatically installs required Radix UI packages

3. **Verify imports work:**
   ```typescript
   import { Avatar } from "@/components/ui/avatar"
   ```

4. **Check for React 19 compatibility:**
   - Newer components should not use forwardRef
   - Use ref as a regular prop

---

## Theming Strategy

### Color System Philosophy
Pressograph uses an **industrial design** color palette:

**Light Mode:**
- Background: Clean white (#FFFFFF)
- Primary: Deep blue (#3B82F6) - trust, technology
- Secondary: Steel gray (#64748B) - professional
- Success: Green (#17A34A) - normal operation
- Warning: Orange (#F59E0B) - attention needed
- Destructive: Red (#EF4444) - critical states

**Dark Mode:**
- Background: Dark gray (#1E1E2E) - reduced eye strain
- Primary: Lighter blue (#60A5FA) - better contrast
- Adjusted colors for visibility in control rooms

### CSS Variables Structure

#### 1. Core Pattern
All colors follow `background` + `foreground` pattern:
```css
--primary: 217 91% 60%;              /* Color value (HSL) */
--primary-foreground: 0 0% 100%;     /* Text color on primary */
```

Usage:
```tsx
<div className="bg-primary text-primary-foreground">
  Primary Button
</div>
```

#### 2. Adding Custom Colors

**Step 1:** Define in both :root and .dark
```css
:root {
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;
}

.dark {
  --warning: 38 92% 60%;          /* Brighter for dark mode */
  --warning-foreground: 222 47% 11%;
}
```

**Step 2:** Expose via @theme inline
```css
@theme inline {
  --color-warning: hsl(var(--warning));
  --color-warning-foreground: hsl(var(--warning-foreground));
}
```

**Step 3:** Use in components
```tsx
<div className="bg-warning text-warning-foreground">
  Warning message
</div>
```

### Dark Mode Implementation

#### Current Setup (Working Perfectly)
```typescript
// app/layout.tsx
<html lang="en" suppressHydrationWarning>
  <body>
    <Providers>{children}</Providers>
  </body>
</html>

// components/providers.tsx
<ThemeProvider
  attribute="class"           // Uses .dark class
  defaultTheme="system"       // Respects OS preference
  enableSystem                // Allows system detection
  disableTransitionOnChange   // Prevents flash
>
```

#### Theme Toggle Component
Already implemented at `src/components/ui/theme-toggle.tsx`:
- Uses lucide-react icons
- Dropdown with Light/Dark/System options
- Integrates with next-themes

#### Server-Side Theme Detection
For Server Components that need theme info:
```typescript
import { cookies } from 'next/headers';

async function getServerTheme() {
  const cookieStore = await cookies();
  return cookieStore.get('theme')?.value ?? 'system';
}
```

---

## Component Usage Patterns

### General Patterns

#### 1. Server Component (Default)
```typescript
// app/page.tsx
import { Button } from "@/components/ui/button"

export default function Page() {
  return <Button>Click me</Button>
}
```

#### 2. Client Component (When Needed)
```typescript
'use client'

import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <Button onClick={() => setCount(count + 1)}>
      Count: {count}
    </Button>
  )
}
```

### Component-Specific Patterns

#### Button
```typescript
import { Button } from "@/components/ui/button"

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">🎨</Button>

// As child (polymorphic)
<Button asChild>
  <Link href="/about">About</Link>
</Button>
```

#### Input + Label
```typescript
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
  />
</div>
```

#### Select
```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="light">Light</SelectItem>
    <SelectItem value="dark">Dark</SelectItem>
    <SelectItem value="system">System</SelectItem>
  </SelectContent>
</Select>
```

#### Card
```typescript
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Dropdown Menu
```typescript
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### Tabs
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    Account settings
  </TabsContent>
  <TabsContent value="password">
    Password settings
  </TabsContent>
</Tabs>
```

#### Toast (Sonner)
```typescript
'use client'

import { toast } from "sonner"

// In component
toast.success("Operation successful")
toast.error("Operation failed")
toast.warning("Warning message")
toast.info("Information")

// With description
toast.success("Success", {
  description: "Your changes have been saved",
})

// With action
toast("Event created", {
  action: {
    label: "Undo",
    onClick: () => console.log("Undo"),
  },
})
```

### Loading States

#### Skeleton
```typescript
import { Skeleton } from "@/components/ui/skeleton"

<div className="space-y-2">
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[200px]" />
</div>
```

#### Spinner
```typescript
import { Spinner } from "@/components/ui/spinner"

<Spinner size="sm" />
<Spinner size="default" />
<Spinner size="lg" />
```

#### Loading Skeletons (Custom)
```typescript
import { CardSkeleton, FormSkeleton, TableSkeleton } from "@/components/ui/loading-skeletons"

// Use in loading.tsx
export default function Loading() {
  return <CardSkeleton />
}
```

---

## Form Integration

### React Hook Form Pattern (Recommended)

Pressograph uses **React Hook Form + Zod** for form validation.

#### Complete Form Example
```typescript
'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type FormData = z.infer<typeof schema>

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    // Handle form submission
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <FormError message={errors.email.message} />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <FormError message={errors.password.message} />
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </Button>
    </form>
  )
}
```

#### Select with React Hook Form
```typescript
import { Controller } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<Controller
  name="theme"
  control={form.control}
  render={({ field }) => (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <SelectTrigger>
        <SelectValue placeholder="Select theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
      </SelectContent>
    </Select>
  )}
/>
```

#### Textarea with React Hook Form
```typescript
import { Textarea } from "@/components/ui/textarea"

<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <Textarea
    id="description"
    {...register("description")}
    aria-invalid={!!errors.description}
  />
  {errors.description && (
    <FormError message={errors.description.message} />
  )}
</div>
```

### Server Actions Pattern (Next.js 15+)

```typescript
// app/actions.ts
'use server'

import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function loginAction(formData: FormData) {
  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const result = schema.safeParse(data)

  if (!result.success) {
    return { error: result.error.flatten() }
  }

  // Process login
  return { success: true }
}

// app/login/page.tsx
'use client'

import { useActionState } from 'react'
import { loginAction } from './actions'

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, null)

  return (
    <form action={formAction}>
      <Input name="email" />
      {state?.error?.fieldErrors.email && (
        <FormError message={state.error.fieldErrors.email[0]} />
      )}
      <Button type="submit">Login</Button>
    </form>
  )
}
```

### Form Error Component
Already implemented at `src/components/ui/form-error.tsx`:
```typescript
import { FormError } from "@/components/ui/form-error"

<FormError message="This field is required" />
```

---

## Best Practices

### 1. Component Composition
**DO:**
```typescript
// Compose smaller components
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Input />
  </CardContent>
</Card>
```

**DON'T:**
```typescript
// Don't create monolithic components
<BigFormComponent withEverything={true} />
```

### 2. Server Components First
**DO:**
```typescript
// Default to Server Components
export default function Page() {
  return <StaticContent />
}
```

**DON'T:**
```typescript
// Don't add 'use client' unless needed
'use client'

export default function Page() {
  return <StaticContent />  // No interactivity!
}
```

### 3. Type Safety
**DO:**
```typescript
import { type ButtonProps } from "@/components/ui/button"

interface CustomButtonProps extends ButtonProps {
  label: string
}
```

**DON'T:**
```typescript
function CustomButton(props: any) {  // ❌ No any types
  return <Button {...props} />
}
```

### 4. Accessibility

**DO:**
```typescript
<Label htmlFor="email">Email</Label>
<Input
  id="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : undefined}
/>
{errors.email && (
  <p id="email-error" className="text-destructive">
    {errors.email.message}
  </p>
)}
```

**DON'T:**
```typescript
<div>Email</div>  {/* ❌ Not a proper label */}
<Input />  {/* ❌ No association */}
```

### 5. Responsive Design
**DO:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>
```

**DON'T:**
```typescript
<div className="grid-cols-3">  {/* ❌ No mobile consideration */}
  {items.map(item => <Card>{item.name}</Card>)}
</div>
```

### 6. Performance Optimization

**DO:**
```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <Spinner />,
  ssr: false,
})
```

**DON'T:**
```typescript
// Don't import everything upfront
import { AllComponents } from "@/components/everything"
```

### 7. Error Handling

**DO:**
```typescript
'use client'

import { toast } from "sonner"

async function handleSubmit(data: FormData) {
  try {
    await submitForm(data)
    toast.success("Form submitted successfully")
  } catch (error) {
    toast.error("Failed to submit form")
    console.error(error)
  }
}
```

**DON'T:**
```typescript
async function handleSubmit(data: FormData) {
  await submitForm(data)  // ❌ No error handling
}
```

### 8. Consistent Styling

**DO:**
```typescript
// Use design system spacing
<div className="space-y-4">
  <Card />
  <Card />
</div>

// Use semantic color names
<Button variant="destructive">Delete</Button>
```

**DON'T:**
```typescript
// Don't use arbitrary values excessively
<div className="mt-[13px] mb-[17px]">  {/* ❌ Use space-y-4 */}
  <Card />
</div>

// Don't use raw colors
<Button className="bg-red-500">Delete</Button>  {/* ❌ Use variant */}
```

---

## Migration Checklist

### Current Status: ✅ FULLY COMPLIANT

No migration needed! The current implementation follows all best practices.

### Optional Enhancements

#### 1. Add Latest Components (Optional)
```bash
# Field component (new in October 2025)
pnpm dlx shadcn@latest add field

# Kbd component (keyboard shortcuts)
pnpm dlx shadcn@latest add kbd

# Badge component (status indicators)
pnpm dlx shadcn@latest add badge

# Avatar component (user profiles)
pnpm dlx shadcn@latest add avatar

# Dialog component (modals)
pnpm dlx shadcn@latest add dialog

# Alert component (notifications)
pnpm dlx shadcn@latest add alert
```

#### 2. Component Audit (Completed)
- ✅ All components use React 19 patterns
- ✅ No forwardRef usage (Button uses ref prop)
- ✅ TypeScript strict mode compatible
- ✅ Server Component compatible

#### 3. Documentation (This Document)
- ✅ Integration strategy documented
- ✅ Usage patterns defined
- ✅ Best practices established

---

## Next.js 16 + React 19 Considerations

### React 19 Changes

#### 1. ref as Prop (Already Implemented)
**Old (React 18):**
```typescript
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return <button ref={ref} className={className} {...props} />
  }
)
```

**New (React 19):**
```typescript
function Button({ className, ref, ...props }: ButtonProps) {
  return <button ref={ref} className={className} {...props} />
}
```

Our button.tsx already uses this pattern ✅

#### 2. useActionState Hook
```typescript
'use client'

import { useActionState } from 'react'

function Form() {
  const [state, formAction] = useActionState(serverAction, initialState)

  return <form action={formAction}>...</form>
}
```

#### 3. use Hook for Promises
```typescript
import { use } from 'react'

function Component({ dataPromise }) {
  const data = use(dataPromise)  // Suspends until resolved
  return <div>{data}</div>
}
```

### Next.js 16 Features

#### 1. Turbopack (Enabled)
```json
// package.json
{
  "scripts": {
    "dev": "next dev --turbopack"  // ✅ Already using
  }
}
```

#### 2. Improved Caching
- Automatic request deduplication
- Enhanced fetch cache
- Static/Dynamic rendering optimizations

#### 3. Enhanced Error Handling
```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Something went wrong!</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{error.message}</p>
        <Button onClick={reset}>Try again</Button>
      </CardContent>
    </Card>
  )
}
```

### Compatibility Matrix

| Feature | Next.js 16 | React 19 | shadcn/ui | Pressograph |
|---------|-----------|----------|-----------|-------------|
| Server Components | ✅ | ✅ | ✅ | ✅ |
| ref as prop | ✅ | ✅ | ✅ | ✅ |
| useActionState | ✅ | ✅ | ✅ | Ready |
| Turbopack | ✅ | N/A | ✅ | ✅ |
| Tailwind v4 | ✅ | N/A | ✅ | ✅ |
| CSS Variables | ✅ | N/A | ✅ | ✅ |
| Dark Mode | ✅ | ✅ | ✅ | ✅ |

---

## Troubleshooting

### Common Issues & Solutions

#### 1. "Module not found: @/components/ui/..."
**Cause:** Path alias not configured

**Solution:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]  // ✅ Already configured
    }
  }
}
```

#### 2. "forwardRef is deprecated" warning
**Cause:** Using React 18 patterns in React 19

**Solution:** Update to ref as prop:
```typescript
// ❌ Old
const Component = forwardRef((props, ref) => ...)

// ✅ New
function Component({ ref, ...props }) { ... }
```

#### 3. CSS variables not working
**Cause:** Missing @theme inline directive

**Solution:**
```css
/* globals.css */
@theme inline {
  --color-primary: hsl(var(--primary));
  /* ... */
}
```
✅ Already implemented in Pressograph

#### 4. Dark mode flashing
**Cause:** Missing suppressHydrationWarning

**Solution:**
```tsx
<html lang="en" suppressHydrationWarning>  {/* ✅ Already added */}
```

#### 5. Turbopack crashes (Permission Denied)
**Cause:** File/directory permissions issue

**Solution:**
```bash
# Fix permissions (as root in container)
chown -R developer:developer /workspace/src/
```
✅ Fixed in this session

#### 6. Component styles not applying
**Cause:** Class name conflicts or missing imports

**Solution:**
1. Verify cn utility is imported:
   ```typescript
   import { cn } from "@/lib/utils"
   ```

2. Check Tailwind content paths:
   ```typescript
   // tailwind.config.ts
   content: [
     "./src/components/**/*.{js,ts,jsx,tsx}",
     // ...
   ]
   ```

#### 7. Toast not appearing
**Cause:** Toaster component not in layout

**Solution:**
```tsx
// components/providers.tsx
<Providers>
  {children}
  <Toaster />  {/* ✅ Already added */}
</Providers>
```

---

## References

### Official Documentation
- [shadcn/ui](https://ui.shadcn.com/)
- [shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [shadcn/ui Dark Mode](https://ui.shadcn.com/docs/dark-mode/next)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

### Internal Documentation
- `/docs/development/ARCHITECTURE.md` - System architecture
- `/docs/development/DEPLOYMENT.md` - Deployment guide
- `/components.json` - shadcn/ui configuration
- `/tailwind.config.ts` - Tailwind configuration
- `/src/styles/globals.css` - Theme variables

### Changelog References
- shadcn/ui 2.5.0 (March 2025) - Resolve anywhere functionality
- shadcn/ui React 19 Update (October 2024) - forwardRef removal
- shadcn/ui Tailwind v4 Preview (February 2025) - @theme directive
- shadcn/ui October 2025 - Field, Spinner, Kbd components

---

## Conclusion

Pressograph 2.0 has an **excellent shadcn/ui integration** that follows all current best practices and is fully compatible with Next.js 16.0.1, React 19.2.0, and Tailwind CSS 4.1.16.

### Key Strengths
1. ✅ Modern configuration (new-york style, CSS variables)
2. ✅ Proper Tailwind v4 setup with @theme inline
3. ✅ Comprehensive theming (light/dark with industrial design)
4. ✅ React 19 compatible components (no forwardRef)
5. ✅ Server Component support enabled
6. ✅ TypeScript strict mode compliant
7. ✅ Proper dark mode implementation with next-themes
8. ✅ Form integration ready (React Hook Form + Zod)

### No Critical Issues Found
The current implementation requires **no changes** for compatibility or best practices.

### Recommended Next Steps
1. ✅ Keep this strategy document as team reference
2. 🔄 Add components as needed (Badge, Avatar, Dialog, etc.)
3. 🔄 Consider Field component for advanced forms
4. 🔄 Monitor shadcn/ui changelog for new features
5. ✅ Continue following established patterns in new development

---

**Document Maintained By:** Claude (AI Development Assistant)
**Last Updated:** 2025-11-07
**Next Review:** When shadcn/ui or Next.js major version changes
