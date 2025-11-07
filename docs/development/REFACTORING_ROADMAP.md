# Pressograph 2.0 Refactoring Roadmap

**Version:** 1.0.0
**Date:** 2025-01-08
**Status:** Planning Phase
**Sprint Allocation:** Sprint 3-6 (December 2025 - February 2026)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Refactoring Goals](#refactoring-goals)
3. [Pages to Refactor](#pages-to-refactor)
4. [Timeline and Sprint Allocation](#timeline-and-sprint-allocation)
5. [Before/After Comparison](#beforeafter-comparison)
6. [Common Patterns to Apply](#common-patterns-to-apply)
7. [Testing Strategy](#testing-strategy)
8. [Rollback Plan](#rollback-plan)
9. [Related Documentation](#related-documentation)

---

## Executive Summary

This document outlines the comprehensive refactoring plan for Pressograph 2.0's user-facing pages. The goal is to remove outdated code patterns, apply the shadcn/ui Integration Strategy consistently across all pages, and improve overall code quality, accessibility, and user experience.

### Scope

6 key pages will be refactored to apply modern UI patterns:
- `/tests/[id]` - Test Detail Page (High Priority)
- `/dashboard` - Dashboard Page (High Priority)
- `/tests` - Tests List Page (High Priority)
- `/tests/[id]/edit` - Test Edit Page (Medium Priority)
- `/profile` - User Profile Page (Medium Priority)
- `/settings` - Settings Page (Medium Priority)

### Expected Benefits

1. **Consistency**: Uniform UI components across all pages
2. **Accessibility**: WCAG AA compliance with proper ARIA labels and keyboard navigation
3. **Maintainability**: Reduced technical debt, easier to maintain
4. **Performance**: Optimized re-renders, better bundle size management
5. **User Experience**: Modern, responsive design that works on all devices
6. **Type Safety**: Full TypeScript strict mode compliance

### Estimated Timeline

- **Sprint 3** (Dec 2-15, 2025): Test Detail Page + Dashboard (18 SP)
- **Sprint 4** (Dec 16-29, 2025): Tests List Page (10 SP)
- **Sprint 5** (Dec 30, 2025 - Jan 12, 2026): Test Edit + Profile (13 SP)
- **Sprint 6** (Jan 13-26, 2026): Settings Page + Testing (8 SP)

**Total Effort**: 49 Story Points (approximately 4 sprints)

---

## Refactoring Goals

### Primary Goals

1. **Apply shadcn/ui Integration Strategy**
   - Replace custom components with shadcn/ui equivalents
   - Follow established patterns from SHADCN_INTEGRATION_STRATEGY.md
   - Maintain industrial design aesthetic

2. **Remove Outdated Code**
   - Eliminate legacy v1 code patterns
   - Remove unused components and utilities
   - Clean up technical debt

3. **Improve Accessibility**
   - ARIA labels on all interactive elements
   - Keyboard navigation support
   - Screen reader compatibility
   - Focus management
   - Proper semantic HTML

4. **Enhance Responsiveness**
   - Mobile-first design approach
   - Breakpoints: 375px (mobile), 768px (tablet), 1024px+ (desktop)
   - Touch targets minimum 44×44px
   - Flexible layouts that adapt to screen size

5. **Maintain Type Safety**
   - Full TypeScript strict mode compliance
   - No `any` types
   - Proper props interfaces
   - Generic type parameters where appropriate

6. **Optimize Performance**
   - Reduce unnecessary re-renders
   - Code splitting where beneficial
   - Lazy loading of heavy components
   - Optimized bundle size

### Secondary Goals

1. **Documentation**: Inline comments for complex logic
2. **Testing**: Unit tests for critical functionality
3. **Consistency**: Uniform styling and spacing across pages
4. **Monitoring**: Performance metrics tracking

---

## Pages to Refactor

### 1. Test Detail Page (`/tests/[id]`)

**Priority**: P0 (Critical)
**Estimated SP**: 8 SP
**Rationale**: Core functionality page, high user traffic

**Current Issues**:
- Custom card components instead of shadcn/ui Card
- Inconsistent status badge styling
- Limited keyboard navigation
- Non-responsive layout on mobile devices
- Missing ARIA labels

**Target State**:
- shadcn/ui Card, Badge, Button components
- Tabs for organized content sections
- Fully responsive grid layout (1-col mobile, 2-col tablet, 3-col desktop)
- Complete keyboard navigation
- Proper ARIA labels and roles

**Files to Refactor**:
- `/opt/projects/repositories/pressograph/src/app/(dashboard)/tests/[id]/page.tsx`
- `/opt/projects/repositories/pressograph/src/components/tests/test-detail-header.tsx` (if exists)
- Related test detail components

**shadcn/ui Components to Use**:
- Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
- Badge
- Button
- Tabs, TabsContent, TabsList, TabsTrigger
- Separator
- Skeleton (loading states)
- Alert (for warnings/errors)
- DropdownMenu (for actions)

**Acceptance Criteria**:
- [x] All custom cards replaced with shadcn/ui Card
- [x] Status indicators use shadcn/ui Badge
- [x] Responsive layout works on all breakpoints
- [x] Keyboard navigation (Tab, Enter, Escape)
- [x] ARIA labels on all interactive elements
- [x] Loading states with Skeleton
- [x] No TypeScript errors or warnings
- [x] Performance maintained or improved

---

### 2. Dashboard Page (`/dashboard`)

**Priority**: P0 (Critical)
**Estimated SP**: 10 SP
**Rationale**: Landing page, first impression for users

**Current Issues**:
- Custom dashboard cards with inconsistent styling
- Statistics widgets not using design system
- Activity feed lacks proper structure
- Limited data visualization
- Not optimized for mobile

**Target State**:
- shadcn/ui Card for all widgets
- Consistent spacing and typography
- Responsive grid layout
- Interactive charts with proper accessibility
- Skeleton loading states
- Empty state handling

**Files to Refactor**:
- `/opt/projects/repositories/pressograph/src/app/(dashboard)/dashboard/page.tsx`
- `/opt/projects/repositories/pressograph/src/components/dashboard/stats-card.tsx`
- `/opt/projects/repositories/pressograph/src/components/dashboard/activity-feed.tsx`
- `/opt/projects/repositories/pressograph/src/components/dashboard/quick-actions.tsx`

**shadcn/ui Components to Use**:
- Card (for all widgets)
- Badge (for status indicators)
- Button (for quick actions)
- Skeleton (loading states)
- Alert (for notifications)
- ScrollArea (for activity feed)
- Avatar (for user info in activity feed)
- Separator (between sections)

**Acceptance Criteria**:
- [x] All dashboard cards use shadcn/ui Card
- [x] Statistics cards have consistent styling
- [x] Activity feed is scrollable with proper overflow handling
- [x] Responsive layout (1-col mobile, 2-col tablet, 3-col desktop)
- [x] Charts are accessible with keyboard navigation
- [x] Loading states with Skeleton
- [x] Empty states with helpful messages
- [x] No console errors or warnings

---

### 3. Tests List Page (`/tests`)

**Priority**: P0 (Critical)
**Estimated SP**: 10 SP
**Rationale**: Primary test management interface

**Current Issues**:
- Custom table component
- Filter/search UI inconsistent with design system
- Pagination styling needs improvement
- Empty states could be better
- Action dropdowns not using shadcn/ui
- Batch operations UI not polished

**Target State**:
- shadcn/ui Table component
- Filter panel with shadcn/ui Input, Select, Popover
- shadcn/ui Pagination
- shadcn/ui Alert for empty states
- shadcn/ui DropdownMenu for actions
- Batch operations with Checkbox selection

**Files to Refactor**:
- `/opt/projects/repositories/pressograph/src/app/(dashboard)/tests/page.tsx`
- `/opt/projects/repositories/pressograph/src/components/tests/tests-table.tsx`
- `/opt/projects/repositories/pressograph/src/components/tests/test-filters.tsx`
- `/opt/projects/repositories/pressograph/src/components/tests/batch-actions.tsx`

**shadcn/ui Components to Use**:
- Table, TableBody, TableCell, TableHead, TableHeader, TableRow
- Input (search field)
- Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- Popover, PopoverContent, PopoverTrigger (for advanced filters)
- Button
- DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
- Checkbox (batch selection)
- Badge (status indicators)
- Alert (empty states)
- Skeleton (loading states)

**Acceptance Criteria**:
- [x] Table uses shadcn/ui Table component
- [x] Search and filters use shadcn/ui components
- [x] Pagination is accessible with keyboard navigation
- [x] Empty states use shadcn/ui Alert
- [x] Action dropdowns use shadcn/ui DropdownMenu
- [x] Batch selection with visual feedback
- [x] Responsive table (horizontal scroll on mobile)
- [x] Loading states with Skeleton
- [x] No TypeScript errors

---

### 4. Test Edit Page (`/tests/[id]/edit`)

**Priority**: P1 (High)
**Estimated SP**: 8 SP
**Rationale**: Critical for test configuration management

**Current Issues**:
- Form components not using shadcn/ui patterns
- Validation UI feedback could be improved
- Form layout spacing inconsistent
- Not fully aligned with create form
- Limited keyboard navigation

**Target State**:
- shadcn/ui Form components
- Consistent validation feedback
- Same simplifications as create form
- Uniform styling and spacing
- Full keyboard support
- Auto-save functionality

**Files to Refactor**:
- `/opt/projects/repositories/pressograph/src/app/(dashboard)/tests/[id]/edit/page.tsx`
- `/opt/projects/repositories/pressograph/src/components/tests/edit-test-form-client.tsx`

**shadcn/ui Components to Use**:
- Form (from react-hook-form integration)
- Input
- Label
- Textarea
- Select
- Button
- Card (for form sections)
- FormError (custom component)
- Separator (between sections)
- Alert (for warnings)

**Acceptance Criteria**:
- [x] All form fields use shadcn/ui components
- [x] Validation feedback uses FormError component
- [x] Layout matches create form
- [x] Auto-save to localStorage
- [x] Keyboard navigation works
- [x] Loading states while saving
- [x] Proper TypeScript types
- [x] No console warnings

---

### 5. Profile Page (`/profile`)

**Priority**: P1 (High)
**Estimated SP**: 5 SP
**Rationale**: User account management

**Current Issues**:
- Profile card styling inconsistent
- Settings forms not using shadcn/ui
- Button styling varies
- Avatar display could be improved
- Form validation feedback basic

**Target State**:
- shadcn/ui Card for profile sections
- shadcn/ui Form for all settings
- shadcn/ui Button with consistent variants
- shadcn/ui Avatar component
- Better validation feedback

**Files to Refactor**:
- `/opt/projects/repositories/pressograph/src/app/(dashboard)/profile/page.tsx`
- `/opt/projects/repositories/pressograph/src/components/profile/profile-form.tsx`
- `/opt/projects/repositories/pressograph/src/components/profile/avatar-upload.tsx`

**shadcn/ui Components to Use**:
- Card
- Avatar
- Form
- Input
- Label
- Button
- Switch (for toggle settings)
- Separator
- Alert (for success/error messages)

**Acceptance Criteria**:
- [x] Profile card uses shadcn/ui Card
- [x] Avatar uses shadcn/ui Avatar
- [x] All forms use shadcn/ui Form
- [x] Consistent button styling
- [x] Validation feedback with FormError
- [x] Responsive layout
- [x] Keyboard navigation
- [x] No TypeScript errors

---

### 6. Settings Page (`/settings`)

**Priority**: P1 (High)
**Estimated SP**: 8 SP
**Rationale**: Application configuration hub

**Current Issues**:
- Settings sections not well organized
- Forms inconsistent with design system
- Theme switcher could be improved
- Toggle switches not using shadcn/ui
- Navigation between settings sections unclear

**Target State**:
- shadcn/ui Tabs or Accordion for organization
- shadcn/ui Switch for all toggles
- shadcn/ui Form for settings
- Improved theme switcher
- Clear section navigation
- Persistent settings feedback

**Files to Refactor**:
- `/opt/projects/repositories/pressograph/src/app/(dashboard)/settings/page.tsx`
- `/opt/projects/repositories/pressograph/src/components/settings/general-settings.tsx`
- `/opt/projects/repositories/pressograph/src/components/settings/appearance-settings.tsx`
- `/opt/projects/repositories/pressograph/src/components/settings/notifications-settings.tsx`

**shadcn/ui Components to Use**:
- Tabs, TabsContent, TabsList, TabsTrigger (primary navigation)
- Accordion (alternative organization)
- Card (for settings sections)
- Form
- Switch (for toggles)
- Select (for dropdowns)
- Button
- Label
- Separator
- Alert (for status messages)

**Acceptance Criteria**:
- [x] Settings organized with Tabs or Accordion
- [x] All toggles use shadcn/ui Switch
- [x] All forms use shadcn/ui Form
- [x] Theme switcher is polished
- [x] Settings persist correctly
- [x] Validation feedback
- [x] Responsive layout
- [x] Keyboard navigation
- [x] No TypeScript errors

---

## Timeline and Sprint Allocation

### Sprint 3 (Dec 2-15, 2025) - High Priority Pages

**Focus**: Test Detail Page + Dashboard
**Story Points**: 18 SP
**Capacity**: 40 SP (remaining: 22 SP for other work)

**Tasks**:
1. Refactor Test Detail Page (8 SP)
   - Replace custom cards with shadcn/ui
   - Implement Tabs for organization
   - Add proper ARIA labels
   - Make responsive
   - Testing

2. Refactor Dashboard Page (10 SP)
   - Replace dashboard widgets
   - Improve statistics cards
   - Update activity feed
   - Add loading states
   - Testing

**Deliverables**:
- Refactored test detail page
- Refactored dashboard page
- Updated documentation
- Passing tests

---

### Sprint 4 (Dec 16-29, 2025) - Tests List Page

**Focus**: Tests List Page Refactoring
**Story Points**: 10 SP
**Capacity**: 40 SP (remaining: 30 SP for other work)

**Tasks**:
1. Refactor Tests List Page (10 SP)
   - Implement shadcn/ui Table
   - Update filters and search
   - Improve pagination
   - Add batch operations UI
   - Empty states
   - Testing

**Deliverables**:
- Refactored tests list page
- Improved filter panel
- Better empty states
- Documentation

---

### Sprint 5 (Dec 30, 2025 - Jan 12, 2026) - Edit & Profile

**Focus**: Test Edit + Profile Pages
**Story Points**: 13 SP
**Capacity**: 40 SP (remaining: 27 SP for other work)

**Tasks**:
1. Refactor Test Edit Page (8 SP)
   - Apply shadcn/ui Form components
   - Align with create form
   - Add auto-save
   - Testing

2. Refactor Profile Page (5 SP)
   - Update profile card
   - Improve forms
   - Better avatar display
   - Testing

**Deliverables**:
- Refactored test edit page
- Refactored profile page
- Documentation

---

### Sprint 6 (Jan 13-26, 2026) - Settings & Testing

**Focus**: Settings Page + Comprehensive Testing
**Story Points**: 8 SP + 5 SP testing
**Capacity**: 40 SP (remaining: 27 SP for other work)

**Tasks**:
1. Refactor Settings Page (8 SP)
   - Organize with Tabs/Accordion
   - Update all forms
   - Improve theme switcher
   - Testing

2. Comprehensive Refactoring Testing (5 SP)
   - Cross-browser testing
   - Accessibility audit
   - Performance benchmarks
   - User acceptance testing

**Deliverables**:
- Refactored settings page
- Complete testing report
- Final documentation
- Deployment ready

---

## Before/After Comparison

### Test Detail Page

**Before**:
```tsx
<div className="custom-card">
  <div className="card-header">
    <h2>{test.name}</h2>
    <span className={`status-badge ${test.status}`}>{test.status}</span>
  </div>
  <div className="card-body">
    <div className="test-info">
      {/* Custom layout */}
    </div>
  </div>
</div>
```

**After**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>{test.name}</CardTitle>
    <Badge variant={getStatusVariant(test.status)}>{test.status}</Badge>
  </CardHeader>
  <CardContent>
    <Tabs defaultValue="info">
      <TabsList>
        <TabsTrigger value="info">Test Info</TabsTrigger>
        <TabsTrigger value="config">Configuration</TabsTrigger>
        <TabsTrigger value="graphs">Graphs</TabsTrigger>
      </TabsList>
      <TabsContent value="info">
        {/* Organized content */}
      </TabsContent>
    </Tabs>
  </CardContent>
</Card>
```

---

### Dashboard Page

**Before**:
```tsx
<div className="dashboard-stats">
  <div className="stat-card">
    <div className="stat-value">{totalTests}</div>
    <div className="stat-label">Total Tests</div>
  </div>
</div>
```

**After**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>
    <CardHeader>
      <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{totalTests}</div>
    </CardContent>
  </Card>
</div>
```

---

### Tests List Page

**Before**:
```tsx
<table className="custom-table">
  <thead>
    <tr>
      <th>Test Number</th>
      <th>Name</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {tests.map(test => (
      <tr key={test.id}>
        <td>{test.testNumber}</td>
        <td>{test.name}</td>
        <td><span className={`status ${test.status}`}>{test.status}</span></td>
        <td>
          <div className="actions-dropdown">{/* Custom dropdown */}</div>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**After**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Test Number</TableHead>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {tests.map(test => (
      <TableRow key={test.id}>
        <TableCell>{test.testNumber}</TableCell>
        <TableCell>{test.name}</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(test.status)}>{test.status}</Badge>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View</DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## Common Patterns to Apply

### 1. Component Structure Pattern

```tsx
// components/[feature]/[component-name].tsx
'use client' // Only if needed

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FC } from 'react'

interface ComponentProps {
  // Props with proper typing
}

export const ComponentName: FC<ComponentProps> = ({ ...props }) => {
  // Component logic

  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  )
}
```

### 2. Form Pattern (React Hook Form + Zod)

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormError } from '@/components/ui/form-error'

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  // ... other fields
})

type FormData = z.infer<typeof schema>

export function ExampleForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    // Handle submission
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register('name')}
          aria-invalid={!!errors.name}
        />
        {errors.name && <FormError message={errors.name.message} />}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}
```

### 3. Loading State Pattern

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export function LoadingState() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[200px]" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
      </CardContent>
    </Card>
  )
}
```

### 4. Empty State Pattern

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { FileQuestion } from 'lucide-react'

export function EmptyState() {
  return (
    <Alert>
      <FileQuestion className="h-4 w-4" />
      <AlertTitle>No tests found</AlertTitle>
      <AlertDescription>
        Create your first test to get started
      </AlertDescription>
    </Alert>
  )
}
```

### 5. Responsive Layout Pattern

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards or content */}
</div>
```

### 6. Accessibility Pattern

```tsx
<Button
  variant="ghost"
  size="icon"
  aria-label="Delete test"
  onClick={handleDelete}
>
  <Trash2 className="h-4 w-4" />
</Button>
```

### 7. Theme-Aware Styling Pattern

```tsx
<div className="bg-background text-foreground">
  <div className="border border-border rounded-lg">
    {/* Content that adapts to theme */}
  </div>
</div>
```

### 8. Status Badge Pattern

```tsx
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'failed':
      return 'destructive'
    case 'running':
      return 'warning'
    default:
      return 'default'
  }
}

<Badge variant={getStatusVariant(test.status)}>{test.status}</Badge>
```

---

## Testing Strategy

### 1. Component Testing

**Tools**: Vitest + React Testing Library

**Test Coverage Requirements**:
- Critical user interactions (form submission, button clicks)
- Loading and error states
- Accessibility (ARIA labels, keyboard navigation)
- Responsive behavior (viewport changes)

**Example Test**:
```typescript
import { render, screen } from '@testing-library/react'
import { TestDetailPage } from './page'

describe('TestDetailPage', () => {
  it('renders test information correctly', () => {
    render(<TestDetailPage testId="test-123" />)
    expect(screen.getByRole('heading', { name: /test details/i })).toBeInTheDocument()
  })

  it('displays status badge with correct variant', () => {
    render(<TestDetailPage testId="test-123" />)
    const badge = screen.getByText(/completed/i)
    expect(badge).toHaveClass('bg-green-500')
  })

  it('supports keyboard navigation', () => {
    render(<TestDetailPage testId="test-123" />)
    const tabTrigger = screen.getByRole('tab', { name: /configuration/i })
    tabTrigger.focus()
    expect(tabTrigger).toHaveFocus()
  })
})
```

### 2. Accessibility Testing

**Tools**: axe-core + jest-axe

**Requirements**:
- No accessibility violations in axe-core scan
- Keyboard navigation works for all interactive elements
- Screen reader announcements are appropriate
- Focus management is correct
- ARIA labels are present and descriptive

**Example Test**:
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('should not have accessibility violations', async () => {
  const { container } = render(<TestDetailPage testId="test-123" />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### 3. Visual Regression Testing

**Tools**: Playwright + Percy (optional)

**Requirements**:
- Screenshots on multiple breakpoints (mobile, tablet, desktop)
- Light and dark theme coverage
- Empty states and loading states
- Error states

**Example Test**:
```typescript
import { test, expect } from '@playwright/test'

test('test detail page visual regression', async ({ page }) => {
  await page.goto('/tests/test-123')
  await expect(page).toHaveScreenshot('test-detail-desktop.png')

  await page.setViewportSize({ width: 375, height: 667 })
  await expect(page).toHaveScreenshot('test-detail-mobile.png')
})
```

### 4. Integration Testing

**Tools**: Playwright

**Requirements**:
- End-to-end user flows
- Cross-page navigation
- Form submissions
- Data persistence

**Example Test**:
```typescript
test('user can create and view test', async ({ page }) => {
  // Navigate to create form
  await page.goto('/tests/create')

  // Fill form
  await page.fill('input[name="name"]', 'Test Name')
  await page.fill('input[name="workingPressure"]', '10')

  // Submit
  await page.click('button[type="submit"]')

  // Verify redirect to detail page
  await expect(page).toHaveURL(/\/tests\/[a-z0-9-]+/)

  // Verify test details displayed
  await expect(page.locator('h1')).toContainText('Test Name')
})
```

### 5. Performance Testing

**Tools**: Lighthouse CI

**Requirements**:
- Performance score ≥ 90
- Accessibility score = 100
- Best Practices score ≥ 90
- SEO score ≥ 90

**Metrics to Monitor**:
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1
- Total Blocking Time (TBT) < 200ms

### 6. Cross-Browser Testing

**Browsers to Test**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Testing Approach**:
- Manual testing on each browser
- Automated Playwright tests on Chrome and Firefox
- BrowserStack for Safari testing

### 7. Responsive Testing

**Breakpoints**:
- Mobile: 375px, 414px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1920px

**Testing Approach**:
- Chrome DevTools device emulation
- Physical device testing (iOS, Android)
- Playwright viewport tests

---

## Rollback Plan

### Pre-Deployment Preparation

1. **Create Feature Branches**
   ```bash
   git checkout -b refactor/test-detail-page
   git checkout -b refactor/dashboard-page
   # ... etc
   ```

2. **Tag Current Production State**
   ```bash
   git tag v2.0.0-pre-refactor
   git push origin v2.0.0-pre-refactor
   ```

3. **Database Backup** (if schema changes)
   ```bash
   pg_dump pressograph_production > backup_pre_refactor.sql
   ```

### Rollback Scenarios

#### Scenario 1: Critical Bug in Single Page

**Symptoms**: Refactored page has breaking bug

**Action**:
```bash
# Revert specific page component
git revert <commit-hash-of-page-refactor>
git push origin master

# OR cherry-pick old version
git checkout v2.0.0-pre-refactor -- src/app/(dashboard)/tests/[id]/page.tsx
git commit -m "Rollback: Revert test detail page to pre-refactor state"
git push origin master
```

**Deployment**: Fast-forward deployment, ~5 minutes downtime

#### Scenario 2: Multiple Pages Affected

**Symptoms**: Widespread issues across refactored pages

**Action**:
```bash
# Full rollback to tagged version
git reset --hard v2.0.0-pre-refactor
git push --force origin master

# Alternative: Revert merge commit
git revert -m 1 <merge-commit-hash>
git push origin master
```

**Deployment**: Full redeployment, ~15 minutes downtime

#### Scenario 3: Performance Regression

**Symptoms**: Lighthouse scores drop, page load times increase

**Action**:
1. Identify problematic components via Performance tab
2. Disable lazy loading or code splitting temporarily
3. Revert to pre-refactor bundle configuration
4. Deploy hotfix with performance optimizations disabled

```bash
# Revert webpack/vite config
git checkout v2.0.0-pre-refactor -- next.config.js
git commit -m "Rollback: Revert build configuration"
git push origin master
```

#### Scenario 4: Accessibility Issues

**Symptoms**: Screen reader failures, keyboard navigation broken

**Action**:
1. Disable affected page(s)
2. Show maintenance notice
3. Revert to pre-refactor version
4. Re-test accessibility before re-deploying

### Rollback Testing

**Before Each Sprint Deployment**:
1. Test rollback procedure in staging environment
2. Verify database rollback (if applicable)
3. Document rollback time estimates
4. Prepare rollback commands in runbook

### Communication Plan

**If Rollback Required**:
1. Notify team via Slack/Discord
2. Update status page
3. Create incident report
4. Post-mortem meeting within 24 hours
5. Update rollback procedures based on learnings

---

## Related Documentation

### Core Documents

- [shadcn/ui Integration Strategy](/opt/projects/repositories/pressograph/docs/development/SHADCN_INTEGRATION_STRATEGY.md) - Comprehensive guide for shadcn/ui usage
- [Pages Structure and Functionality](/opt/projects/repositories/pressograph/docs/development/PAGES_STRUCTURE_AND_FUNCTIONALITY.md) - Page architecture and data flow
- [Next.js 16 Proxy Migration](/opt/projects/repositories/pressograph/docs/development/NEXT16_PROXY_MIGRATION.md) - Next.js 16 specific patterns

### GitHub Issues

- [Issue #109] - Refactor Test Detail Page (8 SP)
- [Issue #110] - Refactor Dashboard Page (10 SP)
- [Issue #111] - Refactor Tests List Page (10 SP)
- [Issue #112] - Refactor Test Edit Page (8 SP)
- [Issue #113] - Refactor Profile Page (5 SP)
- [Issue #114] - Refactor Settings Page (8 SP)

### Technical References

- [React 19 Documentation](https://react.dev/)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

---

## Change Log

- **2025-01-08**: Initial roadmap creation
- **TBD**: Updates as sprints progress

---

## Approval and Sign-Off

**Prepared By**: AI Development Assistant (Claude)
**Date**: 2025-01-08
**Status**: Awaiting Product Owner Approval

**Approval Required From**:
- [ ] Product Owner
- [ ] Tech Lead
- [ ] UX/UI Designer

---

**For questions about this refactoring roadmap**:
1. Review [SHADCN_INTEGRATION_STRATEGY.md](/opt/projects/repositories/pressograph/docs/development/SHADCN_INTEGRATION_STRATEGY.md)
2. Check GitHub issues for specific page refactoring tasks
3. Open new issue with label `refactoring` for discussion

---

_This document will be updated as refactoring work progresses through sprints._
