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

#### 4. Installed Components (30 total)
**Core UI Components:**
- button.tsx ✅ - Primary action component
- input.tsx ✅ - Text input fields
- label.tsx ✅ - Form labels
- textarea.tsx ✅ - Multi-line text input
- select.tsx ✅ - Dropdown selection
- checkbox.tsx ✅ - Boolean selection
- radio-group.tsx ✅ - Single choice from multiple options
- switch.tsx ✅ - Toggle component

**Layout & Organization:**
- card.tsx ✅ - Content containers
- separator.tsx ✅ - Visual dividers
- tabs.tsx ✅ - Tabbed interfaces
- collapsible.tsx ✅ - Expandable sections
- scroll-area.tsx ✅ - Custom scrollbars
- table.tsx ✅ - Data tables

**Feedback & Notifications:**
- sonner.tsx ✅ - Toast notifications
- alert.tsx ✅ - Inline alerts
- alert-dialog.tsx ✅ - Confirmation dialogs
- skeleton.tsx ✅ - Loading placeholders
- spinner.tsx ✅ - Loading indicators
- loading-skeletons.tsx ✅ - Custom loading states

**Navigation & Overlays:**
- dialog.tsx ✅ - Modal dialogs
- dropdown-menu.tsx ✅ - Context menus
- popover.tsx ✅ - Floating content

**Forms:**
- form.tsx ✅ - Form wrapper component
- form-error.tsx ✅ - Error display

**Display:**
- badge.tsx ✅ - Status indicators
- avatar.tsx ✅ - User profile images

**Utilities:**
- theme-toggle.tsx ✅ - Dark mode switcher
- language-switcher.tsx ✅ - i18n support

**Custom Components (Pressograph-specific):**
- date-time-picker.tsx ✅ - Enhanced date/time selection

**Assessment:** ✅ **EXCELLENT** - Comprehensive component library, all React 19 compatible

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

## Custom Components & Enhancements

### Date-Time Picker
**Location:** `/src/components/ui/date-time-picker.tsx`

Enhanced date and time selection component built with shadcn/ui primitives:

```typescript
import { DateTimePicker } from '@/components/ui/date-time-picker';

<DateTimePicker
  value={startDateTime}
  onChange={(date) => setStartDateTime(date)}
  placeholder="Select start date and time"
/>
```

**Features:**
- Calendar-based date selection
- Separate time input (HH:mm format)
- "Now" and "Clear" quick actions
- Formatted display (e.g., "Apr 29, 2023, 9:30 AM")
- Full keyboard navigation
- Accessible ARIA labels
- Compatible with react-hook-form

**Implementation Details:**
- Uses Popover for overlay
- Combines date input with time input
- Hidden datetime-local input for form compatibility
- Auto-formats display value
- Validates time input

### Preview Dialog
**Location:** `/src/components/tests/preview-dialog.tsx`

Full-screen modal for viewing pressure test graphs:

```typescript
import { PreviewDialog } from '@/components/tests/preview-dialog';

<PreviewDialog
  workingPressure={10}
  maxPressure={15}
  testDuration={24}
  intermediateStages={stages}
  pressureUnit="MPa"
/>
```

**Features:**
- Full-screen (90vh) modal
- Close button and ESC key support
- Responsive layout
- Maintains graph aspect ratio
- Scrollable content
- Clean header with title

**Use Cases:**
- Detailed graph inspection
- Presentation mode
- Mobile-friendly viewing
- Print-optimized display

### Form Caching Hook
**Location:** `/src/lib/hooks/use-form-cache.ts`

Three-tier caching strategy for form state persistence:

```typescript
import { useFormCache } from '@/lib/hooks/use-form-cache';

const { saveDraft, clearCache } = useFormCache({
  key: 'my-form-draft',
  form: reactHookFormInstance,
  autosaveInterval: 30000, // 30 seconds
});
```

**Features:**
- Tier 1: React state (react-hook-form)
- Tier 2: LocalStorage (automatic)
- Tier 3: Database (on submit)
- Auto-save every 30 seconds
- Save before page unload
- 7-day cache expiration
- Silent autosave (no toast spam)
- Manual save with toast notification

**Benefits:**
- Prevents data loss
- Restores drafts on page reload
- Works offline
- Minimal user interruption
- Automatic cleanup

---

## shadcn Studio Extended Components

### Overview

**shadcn Studio** (https://shadcnstudio.com) is an open-source collection of 40+ enhanced component variants built on top of shadcn/ui. Unlike traditional npm packages, shadcn Studio follows a copy-paste philosophy where you browse, copy, and customize components directly in your project.

**Installation Method:**
- Browse component library at https://shadcnstudio.com/components
- View component code and copy directly into project
- Customize as needed (you own the code)
- No dependency on external packages

**Integration Status:** Analyzed and documented for future use

### Component Categories Analysis

The following analysis covers shadcn Studio components most relevant to Pressograph 2.0's pressure test visualization and management platform.

#### Dialog Components (26 variants)

**Fullscreen Dialog (dialog-07) - IMPLEMENTED**
- **Status:** Custom implementation created
- **Location:** `/src/components/ui/dialog.tsx` (DialogContentFullscreen)
- **Use Case:** Graph preview in fullscreen A4 landscape format
- **Priority:** High
- **Implementation:** Custom variant based on shadcn/ui dialog primitives
- **Features:**
  - Near-fullscreen display: `calc(100vh-2rem) × calc(100vw-2rem)`
  - Flexible header/footer layout with sticky positioning
  - ScrollArea integration for overflow content
  - Perfect for immersive graph viewing and detailed inspection
- **Usage:** Implemented in `/src/components/tests/fullscreen-preview-dialog.tsx`

**Other Dialog Variants of Interest:**
- **Scrollable Dialog (dialog-04):** For lengthy content with fixed dimensions
- **Sticky Header Dialog (dialog-05):** Header remains visible during scroll
- **Sticky Footer Dialog (dialog-06):** Footer remains visible during scroll
- **Alert Dialogs (dialog-01 to dialog-03):** Standard, with icon, destructive variants
- **Animated Dialogs (dialog-24 to dialog-26):** Slide and zoom animations

**Recommendation:** Current fullscreen implementation meets requirements. Consider alert dialog variants for confirmation workflows.

#### Data Table Components (13 variants)

**High-Value Variants for Pressograph:**

1. **Column Visibility Data Table**
   - Allow users to toggle columns in test history tables
   - Priority: Medium
   - Use Case: Test listing with customizable columns

2. **Data Table with Sortable Columns**
   - Essential for test history and results browsing
   - Priority: High
   - Use Case: Sort by date, pressure, duration, status

3. **Data Table with Export (CSV, Excel, JSON)**
   - Critical for test data portability
   - Priority: High
   - Use Case: Export test results for external analysis

4. **Paginated Data Table**
   - Handle large test datasets efficiently
   - Priority: High
   - Use Case: Test history with 100+ records

5. **Data Table with Expanding Sub-rows**
   - Show test details without leaving table view
   - Priority: Medium
   - Use Case: Expand to show intermediate stages

6. **Editable Data Table**
   - Inline editing for quick test parameter adjustments
   - Priority: Low
   - Use Case: Batch editing of test configurations

**Recommendation:** Implement sortable, paginated, and export variants first. Column visibility and sub-rows for enhanced UX.

#### Button Components (47 variants)

**Recommended Variants:**

1. **Loading State Buttons**
   - Show async operation feedback during test execution
   - Priority: High
   - Use Case: "Start Test", "Export", "Save"

2. **State Indicator Buttons**
   - Display counts (e.g., "Active Tests 5", "Alerts 3")
   - Priority: Medium
   - Use Case: Dashboard navigation

3. **Multi-Action Button Groups**
   - "Cancel/Save Changes", "Reject/Approve"
   - Priority: Medium
   - Use Case: Test approval workflows

4. **Icon + Text Combinations**
   - Download, duplicate, bookmark actions
   - Priority: Medium
   - Use Case: Test management operations

**Recommendation:** Implement loading states immediately. State indicators for dashboard. Multi-action groups for workflows.

#### Card Components (17 variants)

**Recommended Variants:**

1. **Product Card**
   - Display test templates with "Use Template" action
   - Priority: Medium
   - Use Case: Template selection interface

2. **Testimonial Card**
   - User quotes or system notifications
   - Priority: Low
   - Use Case: Dashboard announcements

3. **Social Feed Card**
   - Tab-based test history (Recent, Favorites, Archived)
   - Priority: Low
   - Use Case: Test organization

4. **3D Hover Card**
   - Interactive test result cards
   - Priority: Low
   - Use Case: Visual enhancement

**Recommendation:** Product card pattern for templates. Others are nice-to-have.

#### Form Components (10 variants)

**Recommended Variants:**

1. **OTP Verification Form**
   - Two-factor authentication
   - Priority: Low (future enhancement)
   - Use Case: Enhanced security

2. **Date Input Form**
   - Test scheduling
   - Priority: Medium
   - Use Case: Already using DateTimePicker, can enhance

3. **Issue Reporting Form**
   - Bug reports, feedback
   - Priority: Medium
   - Use Case: User support

**Recommendation:** Current form implementation is sufficient. Issue reporting form for feedback feature.

#### Input Components (46 variants)

**Recommended Variants:**

1. **Input with Character Limit**
   - Show remaining characters for test descriptions
   - Priority: Medium
   - Use Case: Test name, description fields

2. **Password Strength Validator**
   - User registration/password change
   - Priority: Medium
   - Use Case: Already implemented in auth

3. **Input with Plus/Minus Buttons**
   - Numeric input for pressure values
   - Priority: High
   - Use Case: Pressure, duration configuration

4. **Input with Clear Button**
   - Quick field reset
   - Priority: Medium
   - Use Case: Search, filter inputs

5. **Search Input with Loader**
   - Async search feedback
   - Priority: Medium
   - Use Case: Test search

6. **File Input**
   - CSV import for batch test creation
   - Priority: Medium
   - Use Case: Already using for test data import

**Recommendation:** Plus/minus numeric inputs for pressure configuration. Character limit for text fields.

#### Other Components of Interest

**Calendar (25 variants)**
- Enhanced date pickers for test scheduling
- Priority: Low (current DateTimePicker is sufficient)

**Badge (24 variants)**
- Test status indicators (Running, Passed, Failed, Pending)
- Priority: High
- Use Case: Status display throughout UI

**Avatar (21 variants)**
- User profile display
- Priority: Low (basic avatar already installed)

**Tabs (29 variants)**
- Enhanced tab interfaces for multi-section forms
- Priority: Low (current tabs component is sufficient)

**Pagination (15 variants)**
- Enhanced pagination with page size selector
- Priority: Medium
- Use Case: Test history, results browsing

### Component Recommendations by Feature

#### Test Management
- **Data Table with Export:** Export test results to CSV/Excel/JSON
- **Data Table with Sortable Columns:** Sort test history by various fields
- **Paginated Data Table:** Handle large test datasets
- **Loading State Buttons:** Show test execution progress
- **Badge Variants:** Test status indicators (Running, Passed, Failed)

#### Graph Visualization
- **Fullscreen Dialog (IMPLEMENTED):** Full viewport graph preview in A4 landscape
- **Scrollable Dialog:** Alternative for constrained viewport previews
- **Card Variants:** Test result summaries with graph thumbnails

#### Data Entry & Configuration
- **Input with Plus/Minus Buttons:** Numeric pressure/duration inputs
- **Input with Character Limit:** Test name and description fields
- **Input with Clear Button:** Quick field reset in search/filter
- **Date Input Form:** Enhanced test scheduling

#### User Interface Enhancement
- **State Indicator Buttons:** Dashboard navigation with counts
- **Multi-Action Button Groups:** Workflow actions (Approve/Reject)
- **Column Visibility Data Table:** Customizable table views
- **Expanding Sub-rows Data Table:** Detailed test information

### Implementation Roadmap

#### Phase 1: Immediate Priorities (Sprint 4)
- [x] **Fullscreen Dialog:** Implemented for graph preview
- [ ] **Loading State Buttons:** Add to async operations (Start Test, Export, Save)
- [ ] **Badge Variants:** Implement test status indicators
- [ ] **Input Plus/Minus:** Add to numeric pressure inputs

**Estimated Effort:** 4-6 hours
**Impact:** High - improves core user workflows

#### Phase 2: Short-term Enhancements (Sprint 5-6)
- [ ] **Data Table with Export:** CSV/Excel/JSON export functionality
- [ ] **Data Table with Sortable Columns:** Test history sorting
- [ ] **Paginated Data Table:** Large dataset handling
- [ ] **Input with Character Limit:** Text field constraints
- [ ] **Search Input with Loader:** Async search feedback

**Estimated Effort:** 8-12 hours
**Impact:** Medium-High - enhances data management

#### Phase 3: Long-term Improvements (Sprint 7+)
- [ ] **Column Visibility Data Table:** Customizable table columns
- [ ] **Expanding Sub-rows Data Table:** Nested test details
- [ ] **Multi-Action Button Groups:** Workflow enhancements
- [ ] **Product Card:** Test template selection
- [ ] **Issue Reporting Form:** User feedback system

**Estimated Effort:** 12-16 hours
**Impact:** Medium - quality of life improvements

#### Phase 4: Nice-to-Have Features (Backlog)
- [ ] **Animated Dialogs:** Enhanced transitions
- [ ] **3D Hover Cards:** Visual polish
- [ ] **OTP Verification:** Enhanced security
- [ ] **Advanced Calendar Variants:** Scheduling enhancements

**Estimated Effort:** 8-10 hours
**Impact:** Low - visual and UX polish

### Best Practices for shadcn Studio Integration

#### 1. Component Selection Criteria

**Prioritize components that:**
- Solve specific user pain points
- Enhance core workflows (test management, visualization)
- Improve data entry efficiency
- Provide clear visual feedback
- Are accessible and keyboard-navigable

**Avoid components that:**
- Add visual complexity without functional value
- Duplicate existing functionality
- Require significant customization
- Have accessibility issues
- Don't fit Pressograph's industrial design aesthetic

#### 2. Integration Patterns

**Step 1: Browse and Evaluate**
```bash
# Visit shadcn Studio
https://shadcnstudio.com/components

# View component demo
# Click "View code" to inspect implementation
```

**Step 2: Copy Component Code**
- Copy component code from shadcn Studio
- Paste into appropriate location (`/src/components/ui/` or `/src/components/`)
- Adjust imports to match Pressograph's structure

**Step 3: Customize for Pressograph**
- Apply industrial design color palette
- Ensure dark mode compatibility
- Add proper TypeScript types
- Implement accessibility features (ARIA labels, keyboard nav)
- Test with real data

**Step 4: Document Usage**
```typescript
/**
 * Component Description
 *
 * Source: shadcn Studio [component-name]
 * Customizations: [list changes]
 *
 * @example
 * ```tsx
 * <Component prop="value" />
 * ```
 */
```

#### 3. Customization Guidelines

**Color Adjustments:**
- Replace hardcoded colors with CSS variables
- Use Tailwind theme colors (primary, secondary, destructive, etc.)
- Ensure WCAG AA contrast ratios

**Responsive Design:**
- Test on mobile (375px), tablet (768px), desktop (1024px+)
- Use Tailwind responsive prefixes (sm:, md:, lg:)
- Ensure touch targets are 44×44px minimum

**Performance:**
- Lazy load heavy components with `next/dynamic`
- Minimize re-renders with `useMemo`, `useCallback`
- Use virtualization for long lists (react-virtual)

**Accessibility:**
- Add ARIA labels and roles
- Ensure keyboard navigation works
- Test with screen readers
- Provide focus indicators
- Support reduced motion preferences

#### 4. Testing Requirements

**Before Integration:**
- [ ] Component displays correctly in light/dark mode
- [ ] All interactive elements are keyboard accessible
- [ ] Component is responsive across breakpoints
- [ ] TypeScript types are complete and correct
- [ ] No console errors or warnings

**After Integration:**
- [ ] Component works with real Pressograph data
- [ ] Integration doesn't break existing functionality
- [ ] Performance is acceptable (no jank)
- [ ] Component follows Pressograph design patterns

#### 5. Performance Considerations

**Component Size:**
- Keep component files under 500 lines
- Split complex components into smaller pieces
- Use composition over configuration

**Bundle Size:**
- Avoid importing entire icon libraries
- Tree-shake unused code
- Lazy load non-critical components

**Runtime Performance:**
- Debounce expensive operations (search, validation)
- Virtualize long lists (100+ items)
- Memoize computed values
- Avoid unnecessary re-renders

### shadcn Studio vs shadcn/ui

| Aspect | shadcn/ui | shadcn Studio |
|--------|-----------|---------------|
| **Philosophy** | Core primitives | Enhanced variants |
| **Component Count** | ~40 base components | ~40 categories, 500+ variants |
| **Customization** | High | Very High (you own code) |
| **Installation** | `pnpm dlx shadcn@latest add [component]` | Copy-paste from website |
| **Registry** | Official registry | Community-driven |
| **Documentation** | Comprehensive | Example-based |
| **Maintenance** | Official Shadcn team | Community contributions |
| **Use Case** | Foundation | Specialized implementations |

**Recommendation:** Use shadcn/ui for core primitives (already installed). Use shadcn Studio for specialized variants that solve specific UX challenges.

### Additional Resources

- **shadcn Studio Website:** https://shadcnstudio.com
- **shadcn Studio Components:** https://shadcnstudio.com/components
- **shadcn Studio GitHub:** Check for official repository
- **v0.dev Integration:** Some components link to v0.dev for interactive editing
- **Theme Generator:** https://shadcnstudio.com/theme (customize color palette)
- **Figma Plugin:** Convert Figma designs to shadcn Studio components

### Conclusion on shadcn Studio

shadcn Studio provides a valuable **extension to shadcn/ui** with specialized component variants that address common UX patterns. For Pressograph 2.0, the most valuable components are:

1. **Fullscreen Dialog (IMPLEMENTED):** Enhanced graph viewing experience
2. **Data Table Variants:** Export, sorting, pagination for test management
3. **Loading State Buttons:** Clear feedback for async operations
4. **Input Enhancements:** Plus/minus buttons, character limits, clear buttons
5. **Badge Variants:** Status indicators throughout UI

**Integration Strategy:**
- Copy relevant components from shadcn Studio
- Customize to match Pressograph's industrial design
- Ensure accessibility and dark mode support
- Document source and customizations
- Follow established patterns from shadcn/ui integration

**Next Steps:**
1. Implement Phase 1 priorities (loading buttons, badges, numeric inputs)
2. Monitor shadcn Studio for new component releases
3. Collect user feedback on current implementations
4. Iterate based on actual usage patterns

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
