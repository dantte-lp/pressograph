---
id: run-test-functionality
title: RUN Test Functionality Specification
sidebar_label: RUN Test Functionality
---

# RUN Test Functionality Specification

**Version:** 1.0.0
**Date:** 2025-11-07
**Status:** Design Document - Sprint 3 Implementation
**Author:** Development Team

## Executive Summary

The **RUN Test** functionality allows users to execute a configured pressure test, collect real-time measurements, monitor progress, and generate results including pass/fail determination and graph generation. This document defines the complete workflow, technical implementation, and user interface requirements.

---

## Что делает функционал RUN test? (What does the RUN test functionality do?)

**Краткий ответ (Short answer):**

Функционал RUN test запускает выполнение настроенного испытания на давление, собирает измерения в реальном времени, отслеживает прогресс теста и генерирует отчет с графиком и результатами (прошел/не прошел).

**English translation:**

The RUN test functionality starts the execution of a configured pressure test, collects real-time measurements, monitors test progress, and generates a report with graph and results (pass/fail).

---

## Detailed Functionality Description

### 1. Overview

The RUN test functionality transforms a test **configuration** (defined in `pressure_tests` table) into an actual test **execution** (recorded in `test_runs` table). It encompasses:

- **Pre-execution validation** - Verify test is ready to run
- **Real-time data collection** - Capture pressure, temperature, and time measurements
- **Live monitoring** - Display current status and graph
- **Completion processing** - Calculate metrics and determine pass/fail
- **Report generation** - Create graphs (PNG, PDF) and save results

---

## 2. User Workflow

### 2.1 Starting a Test Run

**Entry Points:**
1. Test Detail Page (`/tests/[id]`) - "Run Test" button (when status = 'ready')
2. Tests List Page (`/tests`) - Actions dropdown → "Run Test"
3. Dashboard Quick Actions - "Run Test" link

**Pre-Run Checks:**
- Test status must be 'ready' (not 'draft', 'running', 'completed', etc.)
- User must have permission to run the test
- Test configuration must be valid (all required parameters set)

**Navigation:**
- User clicks "Run Test" button
- System navigates to `/tests/[id]/run` (dedicated run page)

---

### 2.2 Test Run Interface (`/tests/[id]/run`)

**Page Layout:**

```
┌──────────────────────────────────────────────────────────────┐
│  Test Run: PT-2025-001 - Daily Pressure Test                │
│  [Back to Test Details]                          [Stop Test] │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Status: Running                    Elapsed: 00:45:23        │
│  Current Pressure: 12.5 MPa         Target: 15.0 MPa        │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │         [Real-time Graph Display]                      │ │
│  │                                                         │ │
│  │                                                         │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Measurements Input (Manual Mode)                        ││
│  │ Pressure (MPa): [____]  Temperature (°C): [____]        ││
│  │ Timestamp: 2025-11-07 14:32:15   [Record Measurement]  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  Recent Measurements:                                         │
│  14:32:15  →  12.5 MPa  →  20.2°C                           │
│  14:17:08  →  12.4 MPa  →  20.0°C                           │
│  14:02:01  →  12.3 MPa  →  19.8°C                           │
│                                                               │
│  [Stop Test]  [Pause Test]  [Download Current Data]         │
└──────────────────────────────────────────────────────────────┘
```

**Key Components:**

1. **Header Section**
   - Test identification (number, name)
   - Back navigation
   - Stop test button (emergency stop)

2. **Status Panel**
   - Current status badge (Running/Paused/Completed)
   - Elapsed time (HH:MM:SS format, auto-updating)
   - Current pressure vs target pressure
   - Current stage (if using intermediate stages)

3. **Real-time Graph**
   - ECharts line graph showing pressure over time
   - Auto-updates when new measurements recorded
   - Shows target pressure line
   - Shows allowable pressure drop threshold
   - Color-coded: green = within tolerance, red = failed

4. **Measurement Input Section**
   - Manual pressure input field (MPa/Bar/PSI)
   - Temperature input field (°C/°F)
   - Auto-populated timestamp (editable)
   - "Record Measurement" button

5. **Measurements Table**
   - Recent measurements (last 10-20 entries)
   - Timestamp, pressure, temperature
   - Auto-scroll to latest

6. **Action Buttons**
   - **Stop Test** - Complete test immediately, calculate results
   - **Pause Test** - Temporarily pause data collection (optional)
   - **Download Current Data** - Export measurements as CSV

---

### 2.3 Data Collection Modes

**Option 1: Manual Entry (MVP)**
- User manually enters pressure readings at intervals
- System records timestamp automatically
- Suitable for tests with physical gauges

**Option 2: Automatic Collection (Future)**
- Integration with pressure sensors via API/serial
- Auto-polling at configured intervals (e.g., every 30 seconds)
- Requires hardware integration

**Option 3: Import from CSV (Future)**
- User uploads CSV file with timestamp, pressure, temperature
- System validates and imports data
- Useful for offline tests

**Recommended for Sprint 3:** Implement **Manual Entry** only. Automatic and CSV import can be added in Sprint 5.

---

### 2.4 Test Completion

**Automatic Completion:**
- Test duration elapsed (based on `testDuration` in config)
- System automatically stops test
- Shows "Completing..." status
- Calculates final metrics

**Manual Completion:**
- User clicks "Stop Test" button
- System prompts confirmation: "Are you sure? Test will be marked as completed."
- User confirms
- System calculates metrics

**Calculations Performed:**

1. **Final Pressure** - Last recorded pressure value
2. **Pressure Drop** - `workingPressure - finalPressure`
3. **Hold Duration** - Time spent at working pressure
4. **Pass/Fail Determination:**
   ```typescript
   const passed = pressureDrop <= allowablePressureDrop;
   ```
5. **Intermediate Stage Compliance** - Check if each stage met requirements

**Results Storage:**
```typescript
// Stored in test_runs.results (JSONB)
{
  measurements: Array<{
    timestamp: Date;
    pressure: number;
    temperature?: number;
  }>;
  finalPressure: number;
  pressureDrop: number;
  holdDuration: number; // minutes
  passed: boolean;
  failureReason?: string; // if failed
  intermediateStageResults?: Array<{
    stageIndex: number;
    targetPressure: number;
    actualPressure: number;
    passed: boolean;
  }>;
  notes?: string; // operator notes
}
```

---

### 2.5 Report Generation

After test completion, system automatically:

1. **Generates Graphs:**
   - PNG graph (high-resolution, 1920x1080)
   - PDF report (A4 landscape with test info + graph)
   - Saves to `file_uploads` table

2. **Updates Test Status:**
   - `pressure_tests.status` → 'completed'
   - `pressure_tests.completedAt` → current timestamp

3. **Redirects to Results Page:**
   - Navigate to `/tests/[id]/runs/[runId]`
   - Shows complete test results
   - Download links for graphs

---

## 3. Technical Implementation

### 3.1 Database Tables Involved

**Primary Tables:**

1. **`pressure_tests`** - Test configuration
   - Contains: `workingPressure`, `maxPressure`, `testDuration`, etc.
   - Status updated: 'ready' → 'running' → 'completed'/'failed'

2. **`test_runs`** - Test execution records
   ```sql
   CREATE TABLE test_runs (
     id UUID PRIMARY KEY,
     pressure_test_id UUID NOT NULL REFERENCES pressure_tests(id),
     executed_by UUID NOT NULL REFERENCES users(id),
     status VARCHAR(50) NOT NULL, -- 'running', 'paused', 'completed', 'failed', 'cancelled'
     results JSONB, -- measurement data and metrics
     started_at TIMESTAMP NOT NULL,
     completed_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **`test_measurements`** - Individual data points (optional table for normalization)
   ```sql
   CREATE TABLE test_measurements (
     id UUID PRIMARY KEY,
     test_run_id UUID NOT NULL REFERENCES test_runs(id),
     timestamp TIMESTAMP NOT NULL,
     pressure NUMERIC(10, 3) NOT NULL,
     temperature NUMERIC(6, 2),
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

4. **`file_uploads`** - Generated graphs
   - Links to both `pressure_test_id` and `test_run_id`

---

### 3.2 Server Actions

**File:** `/src/lib/actions/test-runs.ts`

```typescript
'use server';

import { db } from '@/lib/db';
import { testRuns, testMeasurements, pressureTests } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth/server-auth';
import { eq, and } from 'drizzle-orm';

/**
 * Start a new test run
 */
export async function startTestRun(testId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  // 1. Verify test exists and is ready
  const test = await db
    .select()
    .from(pressureTests)
    .where(
      and(
        eq(pressureTests.id, testId),
        eq(pressureTests.createdBy, userId),
        eq(pressureTests.status, 'ready')
      )
    )
    .limit(1);

  if (test.length === 0) {
    throw new Error('Test not found or not ready to run');
  }

  // 2. Create test_run record
  const [run] = await db
    .insert(testRuns)
    .values({
      pressureTestId: testId,
      executedBy: userId,
      status: 'running',
      startedAt: new Date(),
      results: { measurements: [] },
    })
    .returning();

  // 3. Update pressure_test status
  await db
    .update(pressureTests)
    .set({
      status: 'running',
      startedAt: new Date(),
    })
    .where(eq(pressureTests.id, testId));

  return { runId: run.id };
}

/**
 * Record a measurement during test run
 */
export async function recordMeasurement(
  runId: string,
  data: {
    pressure: number;
    temperature?: number;
    timestamp?: Date;
  }
) {
  const session = await requireAuth();
  const userId = session.user.id;

  // Verify run exists and user has access
  const run = await db
    .select()
    .from(testRuns)
    .where(
      and(
        eq(testRuns.id, runId),
        eq(testRuns.executedBy, userId),
        eq(testRuns.status, 'running')
      )
    )
    .limit(1);

  if (run.length === 0) {
    throw new Error('Test run not found or not running');
  }

  // Insert measurement
  await db.insert(testMeasurements).values({
    testRunId: runId,
    timestamp: data.timestamp || new Date(),
    pressure: data.pressure,
    temperature: data.temperature,
  });

  return { success: true };
}

/**
 * Complete test run and calculate metrics
 */
export async function completeTestRun(runId: string, notes?: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  // 1. Get run and test configuration
  const run = await db
    .select({
      run: testRuns,
      test: pressureTests,
    })
    .from(testRuns)
    .innerJoin(pressureTests, eq(testRuns.pressureTestId, pressureTests.id))
    .where(
      and(
        eq(testRuns.id, runId),
        eq(testRuns.executedBy, userId)
      )
    )
    .limit(1);

  if (run.length === 0) {
    throw new Error('Test run not found');
  }

  const { run: testRun, test } = run[0];
  const config = test.config as any;

  // 2. Get all measurements
  const measurements = await db
    .select()
    .from(testMeasurements)
    .where(eq(testMeasurements.testRunId, runId))
    .orderBy(testMeasurements.timestamp);

  // 3. Calculate metrics
  const finalPressure = measurements[measurements.length - 1]?.pressure || 0;
  const pressureDrop = config.workingPressure - finalPressure;
  const passed = pressureDrop <= config.allowablePressureDrop;

  const startTime = new Date(testRun.startedAt);
  const endTime = new Date();
  const holdDuration = (endTime.getTime() - startTime.getTime()) / 1000 / 60; // minutes

  const results = {
    measurements: measurements.map(m => ({
      timestamp: m.timestamp,
      pressure: m.pressure,
      temperature: m.temperature,
    })),
    finalPressure,
    pressureDrop,
    holdDuration,
    passed,
    failureReason: passed ? undefined : 'Pressure drop exceeded allowable limit',
    notes,
  };

  // 4. Update test_run
  await db
    .update(testRuns)
    .set({
      status: 'completed',
      completedAt: endTime,
      results,
    })
    .where(eq(testRuns.id, runId));

  // 5. Update pressure_test
  await db
    .update(pressureTests)
    .set({
      status: 'completed',
      completedAt: endTime,
    })
    .where(eq(pressureTests.id, test.id));

  // 6. Generate graphs (async, don't wait)
  generateTestGraphs(runId, test.id).catch(console.error);

  return { success: true, passed, results };
}

/**
 * Generate graphs for test run (PNG, PDF)
 */
async function generateTestGraphs(runId: string, testId: string) {
  // Implementation: Call graph generation service
  // Save to file_uploads table
  // This will be implemented in Sprint 4 (PNG/PDF export issues)
}
```

---

### 3.3 Real-time Updates

**Approach for Sprint 3: Polling**

Use client-side polling to update UI every 5 seconds:

```typescript
// /app/(dashboard)/tests/[id]/run/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getTestRunById } from '@/lib/actions/test-runs';

export default function TestRunPage({ params }: { params: { id: string } }) {
  const [run, setRun] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Poll for updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const updatedRun = await getTestRunById(params.id);
      setRun(updatedRun);
    }, 5000);

    return () => clearInterval(interval);
  }, [params.id]);

  // Update elapsed time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ... render UI
}
```

**Future Enhancement (Sprint 5): Server-Sent Events (SSE)**

Use SSE for real-time push updates:

```typescript
// /app/api/test-runs/[id]/stream/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send updates when measurements are recorded
      const interval = setInterval(async () => {
        const run = await getTestRunById(params.id);
        const data = `data: ${JSON.stringify(run)}\n\n`;
        controller.enqueue(encoder.encode(data));
      }, 1000);

      // Clean up
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## 4. User Interface Specifications

### 4.1 Run Test Page Components

**File Structure:**
```
/src/app/(dashboard)/tests/[id]/run/
  ├── page.tsx                    # Main run page
  └── components/
      ├── test-run-header.tsx     # Header with status
      ├── test-run-graph.tsx      # Real-time graph
      ├── measurement-input.tsx   # Manual input form
      ├── measurements-table.tsx  # Recent measurements
      └── test-run-controls.tsx   # Stop/Pause buttons
```

**Component Hierarchy:**

```typescript
// page.tsx
<TestRunPage>
  <TestRunHeader />
  <TestRunStatusPanel />
  <TestRunGraph />
  <MeasurementInput />
  <MeasurementsTable />
  <TestRunControls />
</TestRunPage>
```

---

### 4.2 Form Validation

**Measurement Input Validation:**

```typescript
import { z } from 'zod';

const measurementSchema = z.object({
  pressure: z
    .number()
    .min(0, 'Pressure must be positive')
    .max(100, 'Pressure exceeds maximum'),
  temperature: z
    .number()
    .min(-50, 'Temperature too low')
    .max(100, 'Temperature too high')
    .optional(),
  timestamp: z.date(),
});
```

---

### 4.3 Error Handling

**Common Errors:**

1. **Test Not Ready**
   - Message: "Test must be in 'ready' status to run"
   - Action: Redirect to test edit page

2. **Invalid Measurement**
   - Message: "Pressure value is invalid (must be between 0-100 MPa)"
   - Action: Show inline error, prevent submission

3. **Network Error During Run**
   - Message: "Connection lost. Measurements saved locally will be synced when connection restored."
   - Action: Use local storage for offline support

4. **Concurrent Run Attempt**
   - Message: "This test is already running in another session"
   - Action: Redirect to existing run page

---

## 5. User Stories and Acceptance Criteria

### User Story 1: Start Test Run

**As a** test operator
**I want to** start a pressure test from the test detail page
**So that** I can begin collecting measurements

**Acceptance Criteria:**
- [x] "Run Test" button visible when test status = 'ready'
- [x] Button disabled when test status ≠ 'ready'
- [x] Clicking button navigates to `/tests/[id]/run`
- [x] Test status updated to 'running' in database
- [x] New `test_run` record created
- [x] Start timestamp recorded

---

### User Story 2: Record Measurements

**As a** test operator
**I want to** manually enter pressure readings during test
**So that** the system tracks the test progress

**Acceptance Criteria:**
- [x] Input form displays current timestamp (editable)
- [x] Pressure input accepts decimal values (MPa/Bar/PSI)
- [x] Temperature input optional
- [x] "Record Measurement" button saves to database
- [x] Graph updates immediately after recording
- [x] Measurement appears in recent measurements table
- [x] Form clears after submission

---

### User Story 3: Monitor Test Progress

**As a** test operator
**I want to** see real-time graph and elapsed time
**So that** I can monitor test status without manual calculations

**Acceptance Criteria:**
- [x] Elapsed time updates every second (HH:MM:SS)
- [x] Current pressure displays latest measurement
- [x] Graph shows all recorded measurements
- [x] Target pressure line visible on graph
- [x] Allowable drop threshold line visible
- [x] Graph auto-scales as measurements added
- [x] Status badge shows "Running" with animated indicator

---

### User Story 4: Complete Test

**As a** test operator
**I want to** stop the test and generate results
**So that** I can see if the test passed or failed

**Acceptance Criteria:**
- [x] "Stop Test" button triggers confirmation dialog
- [x] System calculates final pressure, pressure drop, hold duration
- [x] Pass/fail determination based on allowable drop
- [x] Results saved to `test_runs.results`
- [x] Test status updated to 'completed'
- [x] Graphs generated (PNG, PDF)
- [x] Redirect to results page `/tests/[id]/runs/[runId]`

---

## 6. Implementation Roadmap

### Sprint 3 (2025-12-02 to 2025-12-15)

**Issue: #96 - Run Test Interface Implementation (8 SP)**

**Tasks:**

1. **Database Schema Updates** (1 SP)
   - Add `test_measurements` table
   - Add `test_runs.results` JSONB column
   - Create indexes for performance

2. **Server Actions** (2 SP)
   - `startTestRun()` - Create run, update status
   - `recordMeasurement()` - Save measurement
   - `completeTestRun()` - Calculate metrics, update status
   - `getTestRunById()` - Fetch run with measurements

3. **Run Test Page UI** (3 SP)
   - Create `/tests/[id]/run/page.tsx`
   - Header component
   - Status panel with elapsed time
   - Real-time graph component (ECharts)
   - Measurement input form
   - Recent measurements table

4. **Real-time Updates** (1 SP)
   - Implement polling (5-second interval)
   - Update graph and measurements table
   - Elapsed time counter

5. **Testing** (1 SP)
   - Unit tests for calculations (pressure drop, pass/fail)
   - Integration tests for server actions
   - E2E test for complete run workflow

---

### Sprint 4 (2025-12-16 to 2025-12-29)

**Graph Generation Integration:**

- Integrate with PNG export (#91)
- Integrate with PDF export (#92)
- Auto-generate graphs on test completion

---

### Sprint 5 (2025-12-30 to 2026-01-12)

**Advanced Features:**

- Server-Sent Events for real-time updates (#101)
- Automatic data collection from sensors (hardware integration)
- CSV import for offline measurements
- Pause/resume test functionality

---

## 7. Testing Strategy

### 7.1 Unit Tests

**Test calculations:**

```typescript
// /src/lib/utils/test-calculations.test.ts
import { calculatePressureDrop, determinePassFail } from './test-calculations';

describe('Test Calculations', () => {
  it('calculates pressure drop correctly', () => {
    const result = calculatePressureDrop(15.0, 14.5);
    expect(result).toBe(0.5);
  });

  it('determines pass when drop within allowable', () => {
    const passed = determinePassFail(0.3, 0.5); // drop=0.3, allowable=0.5
    expect(passed).toBe(true);
  });

  it('determines fail when drop exceeds allowable', () => {
    const passed = determinePassFail(0.8, 0.5); // drop=0.8, allowable=0.5
    expect(passed).toBe(false);
  });
});
```

---

### 7.2 Integration Tests

**Test server actions:**

```typescript
// /src/lib/actions/test-runs.test.ts
import { startTestRun, recordMeasurement, completeTestRun } from './test-runs';

describe('Test Run Actions', () => {
  it('starts test run successfully', async () => {
    const { runId } = await startTestRun('test-id-123');
    expect(runId).toBeTruthy();
  });

  it('records measurement successfully', async () => {
    const result = await recordMeasurement('run-id-456', {
      pressure: 12.5,
      temperature: 20.0,
    });
    expect(result.success).toBe(true);
  });

  it('completes test run and calculates metrics', async () => {
    const result = await completeTestRun('run-id-789');
    expect(result.passed).toBeDefined();
    expect(result.results).toHaveProperty('finalPressure');
  });
});
```

---

### 7.3 E2E Tests

**Test complete workflow:**

```typescript
// /e2e/run-test.spec.ts
import { test, expect } from '@playwright/test';

test('complete test run workflow', async ({ page }) => {
  // 1. Navigate to test detail page
  await page.goto('/tests/test-id-123');

  // 2. Click "Run Test" button
  await page.click('button:has-text("Run Test")');

  // 3. Verify redirected to run page
  await expect(page).toHaveURL(/\/tests\/.*\/run/);

  // 4. Record a measurement
  await page.fill('input[name="pressure"]', '12.5');
  await page.click('button:has-text("Record Measurement")');

  // 5. Verify measurement appears in table
  await expect(page.locator('text=12.5 MPa')).toBeVisible();

  // 6. Stop test
  await page.click('button:has-text("Stop Test")');
  await page.click('button:has-text("Confirm")');

  // 7. Verify redirected to results page
  await expect(page).toHaveURL(/\/tests\/.*\/runs\/.*/);

  // 8. Verify pass/fail status displayed
  await expect(page.locator('text=Passed')).toBeVisible();
});
```

---

## 8. Security Considerations

### 8.1 Authorization

- Only test creator can run the test
- Only run executor can record measurements
- Only run executor can stop the test

### 8.2 Input Validation

- All measurements validated server-side (Zod schema)
- Pressure/temperature must be within realistic ranges
- Timestamps must be sequential (prevent backdating)

### 8.3 Rate Limiting

- Limit measurements to 1 per second per run
- Prevent spam submissions

---

## 9. Performance Considerations

### 9.1 Database Optimization

- Index on `test_runs.pressure_test_id` for fast lookup
- Index on `test_measurements.test_run_id` for fast aggregation
- Use JSONB efficiently (avoid nested queries)

### 9.2 Real-time Updates

- Polling interval: 5 seconds (configurable)
- Only fetch changed data (use `updated_at` timestamp)
- Debounce graph re-renders

### 9.3 Graph Rendering

- Use ECharts incremental rendering
- Limit displayed measurements (show latest 1000 points)
- Lazy load historical data

---

## 10. Future Enhancements

### 10.1 Hardware Integration

- Connect to pressure sensors via serial/USB
- Auto-record measurements at intervals
- Support multiple sensor types

### 10.2 Advanced Analytics

- Trend analysis (pressure decline rate)
- Predictive failure detection
- Anomaly detection (sudden pressure spikes)

### 10.3 Collaboration

- Multiple operators viewing same test run
- Real-time synchronization via WebSockets
- Comments and annotations during test

### 10.4 Offline Support

- Service Worker for offline measurements
- Local storage caching
- Sync when connection restored

---

## 11. Documentation

### 11.1 User Documentation

**Location:** `/docs/user-guide/running-tests.md`

**Topics:**
- How to start a test run
- Recording measurements manually
- Understanding the real-time graph
- Stopping a test
- Interpreting results (pass/fail)
- Troubleshooting common issues

### 11.2 API Documentation

**Location:** `/docs/api/test-runs.md`

**Endpoints:**
- `POST /api/test-runs` - Start test run
- `POST /api/test-runs/:id/measurements` - Record measurement
- `PUT /api/test-runs/:id/complete` - Complete test run
- `GET /api/test-runs/:id` - Get test run details
- `GET /api/test-runs/:id/stream` - SSE stream (future)

---

## 12. Open Questions

### Q1: Should tests support pause/resume?

**Options:**
- A. Yes - Add 'paused' status and resume functionality
- B. No - Keep it simple, only running/completed

**Recommendation:** Option B for MVP, Option A for Sprint 5

---

### Q2: How to handle long-running tests (24+ hours)?

**Options:**
- A. Keep run page open for entire duration
- B. Allow closing browser, resume later via "Continue Test" button
- C. Background job processes test, user checks periodically

**Recommendation:** Option B - Store run state in DB, allow resume

---

### Q3: Should measurements be editable after submission?

**Options:**
- A. Yes - Allow editing for corrections
- B. No - Immutable for audit trail

**Recommendation:** Option B - Immutable, but allow "Add Correction Note"

---

## 13. Related Documents

- [PAGES_STRUCTURE_AND_FUNCTIONALITY.md](./PAGES_STRUCTURE_AND_FUNCTIONALITY.md) - Page architecture
- [GRAPH_COMPARISON_V1_V2.md](./GRAPH_COMPARISON_V1_V2.md) - Graph export features
- GitHub Issue #96 - Run Test Interface Implementation

---

## Document Metadata

**Version:** 1.0.0
**Author:** Development Team
**Date:** 2025-11-07
**Last Updated:** 2025-11-07
**Status:** Final Design - Ready for Sprint 3 Implementation
**Approval:** Pending Product Owner Review

**Change Log:**
- 2025-11-07: Initial document creation based on V1 reference and domain knowledge

**Next Review:** 2025-12-15 (End of Sprint 3 - after implementation)

---

**For questions or clarifications about RUN test functionality, please:**
1. Open an issue in [GitHub Issues](https://github.com/dantte-lp/pressograph/issues)
2. Tag with label: `documentation` and `type:feature`
3. Reference: Issue #96 and this document

---

_This document provides comprehensive specifications for implementing the RUN test functionality in Pressograph 2.0. All development should align with these requirements._
