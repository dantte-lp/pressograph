# Sprint 2 Quick Start Guide

**Last Updated:** 2025-10-31
**Target:** Development Team
**Sprint:** Sprint 2 - Foundation (Week 1)

---

## What Changed?

We've set up the **testing infrastructure, CI/CD pipeline, and code quality tools** as part of Phase 1 (Foundation) refactoring.

### New Tools

1. **Vitest** - Fast test runner (replaces Jest, works with Vite)
2. **React Testing Library** - Component testing
3. **Prettier** - Automatic code formatting
4. **Husky** - Git hooks (pre-commit checks)
5. **GitHub Actions** - CI/CD pipeline

---

## Setup (First Time)

### 1. Install Dependencies

```bash
cd /opt/projects/repositories/pressograph
npm install
```

This installs:

- Testing libraries (Vitest, React Testing Library)
- Code quality tools (Prettier, Husky, lint-staged)

### 2. Verify Setup

```bash
# Run tests (should show 13 passing)
npm test

# Run linting (should show warnings, not errors)
npm run lint

# Check Prettier (dry-run, no changes)
npx prettier --check "src/**/*.{ts,tsx}"
```

### 3. Enable Git Hooks

```bash
# Should happen automatically during npm install
# If not, run manually:
npx husky install
```

---

## Daily Workflow

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI (visual test runner)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Writing Tests

**Example test file:** `src/utils/helpers.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFile';

describe('MyFunction', () => {
  it('should do something', () => {
    const result = myFunction(5);
    expect(result).toBe(10);
  });
});
```

**Naming convention:** `<filename>.test.ts` or `<filename>.spec.ts`

**Location:** Next to the file being tested (e.g., `helpers.ts` → `helpers.test.ts`)

### Pre-commit Hooks

**What happens when you run `git commit`:**

1. **lint-staged** runs automatically
2. ESLint fixes your TypeScript files (`*.ts`, `*.tsx`)
3. Prettier formats all staged files
4. If linting fails, commit is blocked

**Example:**

```bash
git add src/utils/helpers.ts
git commit -m "Add new helper function"

# Output:
# ✔ Preparing lint-staged...
# ✔ Running tasks for staged files...
# ✔ Applying modifications...
# ✔ Cleaning up...
# [master 1a2b3c4] Add new helper function
```

**Bypass hook (emergency only):**

```bash
git commit --no-verify -m "Emergency fix"
```

### Formatting Code

**Automatic (recommended):**

Pre-commit hooks format automatically. Just commit!

**Manual (if needed):**

```bash
# Format all files
npx prettier --write "src/**/*.{ts,tsx,json,css,md}"

# Check formatting without changing files
npx prettier --check "src/**/*.{ts,tsx}"
```

### Linting

```bash
# Run ESLint
npm run lint

# Auto-fix issues
npx eslint . --fix
```

---

## CI/CD Pipeline

### What Runs Automatically

**On every push to `master`, `main`, or `develop`:**

1. **Lint** - ESLint checks code quality
2. **Test** - All tests run, coverage uploaded to Codecov
3. **Build** - Frontend and backend builds verified

**On every pull request:**

1. All above jobs
2. **Lighthouse CI** - Performance testing (must score >90)

**On merge to `develop`:**

1. Deploy to staging (TODO: setup server)

**On merge to `master`:**

1. Deploy to production (TODO: setup server)

### GitHub Actions Status

**View build status:**

- Go to GitHub repository → Actions tab
- See all workflow runs
- Click on a run to see detailed logs

**Pull Request Checks:**

- Required checks must pass before merge
- Status badges show on PR page (✅ or ❌)

---

## Writing Your First Test

### Step 1: Choose a File to Test

**Priority targets:**

- `src/utils/graphGenerator.ts` (complex logic)
- `src/utils/canvasRenderer.ts` (critical rendering)
- `src/services/api.service.ts` (API calls)

**Start simple:**

- Pure functions (no React, no state)
- Utility helpers
- Data transformations

### Step 2: Create Test File

**Example: Testing `graphGenerator.ts`**

```bash
# Create test file
touch src/utils/graphGenerator.test.ts
```

```typescript
import { describe, it, expect } from 'vitest';
import { generateGraphData } from './graphGenerator';

describe('Graph Generator', () => {
  it('should generate valid graph data', () => {
    const settings = {
      workingPressure: 50,
      maxPressure: 60,
      testDuration: 24,
      // ... other settings
    };

    const result = generateGraphData(settings);

    expect(result).toBeDefined();
    expect(result.points).toBeInstanceOf(Array);
    expect(result.points.length).toBeGreaterThan(0);
  });
});
```

### Step 3: Run Tests

```bash
# Run in watch mode (re-runs on save)
npm run test:watch

# Run once
npm test
```

### Step 4: Check Coverage

```bash
npm run test:coverage
```

**Output:**

```
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|--------
All files           |   12.34 |    10.50 |   15.20 |   12.10
 graphGenerator.ts  |   85.00 |    75.00 |   90.00 |   85.00
 helpers.ts         |  100.00 |   100.00 |  100.00 |  100.00
```

**Target:** 60% overall by end of Sprint 2

---

## Component Testing

### Example: Testing a React Component

**File:** `src/components/common/Version.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Version } from './Version';

describe('Version Component', () => {
  it('renders version number', () => {
    render(<Version />);

    // Check if version text is present
    expect(screen.getByText(/v\d+\.\d+\.\d+/)).toBeInTheDocument();
  });
});
```

**Common patterns:**

```typescript
// Render component
render(<MyComponent prop="value" />);

// Find elements
screen.getByText('Hello');          // Throws if not found
screen.queryByText('Hello');        // Returns null if not found
screen.findByText('Hello');         // Async, waits for element

// User interactions
import { userEvent } from '@testing-library/user-event';
await userEvent.click(screen.getByRole('button'));
await userEvent.type(screen.getByLabelText('Name'), 'John');

// Assertions
expect(element).toBeInTheDocument();
expect(element).toHaveTextContent('Hello');
expect(element).toHaveClass('active');
```

---

## Testing Cheat Sheet

### Vitest API

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Test Suite', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('test description', () => {
    expect(value).toBe(expected);
  });
});
```

### Common Matchers

```typescript
// Equality
expect(a).toBe(b); // Strict equality (===)
expect(a).toEqual(b); // Deep equality (objects/arrays)

// Truthiness
expect(a).toBeTruthy();
expect(a).toBeFalsy();
expect(a).toBeDefined();
expect(a).toBeNull();

// Numbers
expect(a).toBeGreaterThan(b);
expect(a).toBeLessThanOrEqual(b);
expect(a).toBeCloseTo(0.3, 1); // Floating point

// Strings
expect(str).toMatch(/pattern/);
expect(str).toContain('substring');

// Arrays
expect(arr).toContain(item);
expect(arr).toHaveLength(3);

// Objects
expect(obj).toHaveProperty('key', value);
```

### Mocking

```typescript
// Mock function
const mockFn = vi.fn();
mockFn.mockReturnValue(42);
expect(mockFn()).toBe(42);
expect(mockFn).toHaveBeenCalled();

// Mock module
vi.mock('./api.service', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'test' }),
}));

// Mock localStorage (already done in setup.ts)
localStorage.setItem('key', 'value');
expect(localStorage.setItem).toHaveBeenCalled();
```

---

## Troubleshooting

### Tests Failing Locally

```bash
# Clear Vitest cache
rm -rf node_modules/.vitest

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Run tests in verbose mode
npm test -- --reporter=verbose
```

### Pre-commit Hook Too Slow

```bash
# Check what's taking time
npm run lint         # Should be <5s
npx prettier --check src/**/*.ts  # Should be <2s

# If too slow, adjust lint-staged config in package.json
```

### Prettier vs. ESLint Conflicts

```bash
# Check for conflicts
npx eslint-config-prettier src/utils/helpers.ts

# Should not show any style conflicts
# If conflicts exist, Prettier config may need adjustment
```

### Git Hooks Not Running

```bash
# Reinstall hooks
npx husky install

# Check hook exists
ls -la .husky/pre-commit

# Make executable
chmod +x .husky/pre-commit
```

---

## Sprint 2 Goals

### Week 1 (Current)

- ✅ Testing infrastructure setup
- ✅ CI/CD pipeline created
- ✅ Code quality tools configured
- ⏳ Team onboarding (this guide)
- ⏳ First tests written (target: 20% coverage)

### Week 2

- ⏳ Reach 40% code coverage
- ⏳ Enable TypeScript strict mode
- ⏳ Fix all linting errors
- ⏳ Activate CI/CD on GitHub

### Week 3

- ⏳ Reach 60% code coverage
- ⏳ All tests passing in CI
- ⏳ Documentation updated
- ⏳ Team comfortable with new tools

---

## Resources

### Documentation

- **Current Stack:** `/docs/CURRENT_STACK.md`
- **Refactoring Plan:** `/docs/REFACTORING_PLAN.md`
- **Session Summary:** `/docs/REFACTORING_SESSION_2025-10-31.md`

### Official Docs

- **Vitest:** https://vitest.dev/
- **React Testing Library:** https://testing-library.com/react
- **Prettier:** https://prettier.io/docs/
- **Husky:** https://typicode.github.io/husky/

### Examples

- **Existing Test:** `src/utils/helpers.test.ts`
- **Test Setup:** `src/test/setup.ts`
- **Vitest Config:** `vitest.config.ts`

---

## Getting Help

### Questions?

1. **Check documentation** (this guide, official docs)
2. **Review existing tests** (`helpers.test.ts`)
3. **Ask in team chat** (mention testing infrastructure)
4. **Create GitHub issue** (tag with `testing` label)

### Common Questions

**Q: Do I need to write tests for every file?**
A: No. Focus on business logic, utilities, critical paths. UI components can have lower coverage initially.

**Q: How do I test async functions?**
A: Use `async/await` in your test:

```typescript
it('fetches data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

**Q: Can I skip the pre-commit hook?**
A: Yes, but only for emergencies: `git commit --no-verify`. Generally, fix the linting issues instead.

**Q: What if CI fails on my PR?**
A: Check the GitHub Actions logs, fix the issue locally, push again. CI must pass before merge.

---

## Next Steps

1. **Read this guide** (you're here!)
2. **Run `npm install` and `npm test`** (verify setup)
3. **Write your first test** (pick a utility function)
4. **Make a commit** (test pre-commit hooks)
5. **Review refactoring plan** (`REFACTORING_PLAN.md`)

**Target:** Everyone writing tests by end of Week 1

**Sprint 2 Success:** 60% coverage, CI/CD active, team confident with tools

---

**Good luck, and happy testing!** 🚀
