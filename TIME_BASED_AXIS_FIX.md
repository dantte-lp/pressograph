# Time-Based Axis Interval Fix

## Problem Summary

When users entered a start date/time in the "Test Schedule Optional" section, the X-axis intervals were displaying incorrectly:

- **Expected**: 2-hour intervals for 24h test (13 ticks for 26h total with padding)
- **Actual**: 1-hour intervals (26 ticks)

## Root Cause

ECharts time-based axes (`type: 'time'`) **do not support** the following properties:
- `interval`
- `minInterval`
- `maxInterval`

These properties are only valid for value-based axes (`type: 'value'`).

Our code was setting these properties for time-based axes:
```typescript
type: 'time',
interval: xAxisInterval * 60 * 1000,      // IGNORED by ECharts!
minInterval: xAxisInterval * 60 * 1000,   // IGNORED by ECharts!
maxInterval: xAxisInterval * 60 * 1000,   // IGNORED by ECharts!
```

ECharts silently ignored these properties and used its own automatic interval calculation, resulting in 1-hour intervals instead of our calculated 2-hour intervals.

## Solution

For time-based axes, use `splitNumber` instead of `interval`:

```typescript
type: 'time',
splitNumber: Math.floor((xAxisMax - xAxisMin) / (xAxisInterval * 60 * 1000))
// Example: 26h total / 2h interval = 13 splits
```

`splitNumber` tells ECharts exactly how many intervals to create, which effectively forces our desired interval spacing.

## Changes Made

### File: `/opt/projects/repositories/pressograph/src/components/tests/pressure-test-preview.tsx`

**Before:**
```typescript
xAxis: useTimeBased ? {
  type: 'time',
  min: xAxisMin,
  max: xAxisMax,
  interval: xAxisInterval * 60 * 1000,      // Ignored!
  minInterval: xAxisInterval * 60 * 1000,   // Ignored!
  maxInterval: xAxisInterval * 60 * 1000,   // Ignored!
  // ... other config
} : {
  // value-based axis config
}
```

**After:**
```typescript
xAxis: useTimeBased ? {
  type: 'time',
  min: xAxisMin,
  max: xAxisMax,
  // Use splitNumber for time-based axes (interval/minInterval/maxInterval don't work)
  splitNumber: Math.floor((xAxisMax - xAxisMin) / (xAxisInterval * 60 * 1000)),
  // ... other config
} : {
  // value-based axis config (unchanged - uses interval/minInterval/maxInterval)
}
```

### Debug Logging Update

Updated console logging to show `splitNumber` for time-based axes instead of the ignored interval properties:

```typescript
if (useTimeBased) {
  const intervalMs = xAxisInterval * 60 * 1000;
  const splitNumber = Math.floor((xAxisMax - xAxisMin) / intervalMs);
  console.log(`[ECharts Config] Time-based axis - splitNumber: ${splitNumber} (${xAxisInterval / 60}h intervals)`);
  // ...
}
```

## Testing Instructions

### Test Case 1: Value-Based Axis (No Start Date)
1. Navigate to `/tests/new` (Create New Test page)
2. Keep "Test Schedule Optional" section EMPTY (no start/end dates)
3. Enter Test Duration: 24 hours
4. Open browser console
5. Verify:
   - Console shows: `useTimeBased: false`
   - Console shows: `xAxisInterval: 120 minutes`
   - Console shows: `Value-based axis - interval: 120`
   - Graph displays 2-hour intervals (12 ticks for 24h)

### Test Case 2: Time-Based Axis (With Start Date) - THE FIX
1. Navigate to `/tests/new`
2. Fill in "Test Schedule Optional" section:
   - Start Date/Time: any date
3. Enter Test Duration: 24 hours
4. Open browser console
5. Verify:
   - Console shows: `useTimeBased: true`
   - Console shows: `xAxisInterval: 120 minutes`
   - Console shows: `Time-based axis - splitNumber: 13 (2h intervals)`
   - Graph displays 2-hour intervals (13 ticks for 26h total with ±1h padding)

### Expected Console Output (24h Test with Start Date):

```
[X-Axis Interval] Display hours: 26.00
Testing 1h interval: 26.00 ticks (valid range: 8-15) ✗ invalid
Testing 2h interval: 13.00 ticks (valid range: 8-15) ✓ VALID
Testing 3h interval: 8.67 ticks (valid range: 8-15) ✓ VALID
Testing 4h interval: 6.50 ticks (valid range: 8-15) ✗ invalid
Testing 6h interval: 4.33 ticks (valid range: 8-15) ✗ invalid
Testing 12h interval: 2.17 ticks (valid range: 8-15) ✗ invalid
Testing 24h interval: 1.08 ticks (valid range: 8-15) ✗ invalid
Found 2 valid intervals: [
  { interval: 2, tickCount: 13, diff: 3 },
  { interval: 3, tickCount: 8.67, diff: 1.33 }
]
Selected interval: 2h (13.00 ticks)
Returning: 120 minutes

[ECharts Config] useTimeBased: true
[ECharts Config] xAxisInterval: 120 minutes
[ECharts Config] Time-based axis - splitNumber: 13 (2h intervals)
[ECharts Config] Time-based axis - xAxisMin: 1762276440000, xAxisMax: 1762370040000
[ECharts Config] Time-based axis - Display range: 26 hours
```

## Verification Checklist

- [ ] Build succeeds without TypeScript errors
- [ ] Value-based axis (no dates) shows 2-hour intervals for 24h test
- [ ] Time-based axis (with dates) shows 2-hour intervals for 24h test
- [ ] Console logging correctly shows `splitNumber` for time-based axis
- [ ] Both axis types produce identical interval spacing (2 hours for 24h test)

## Files Modified

1. `/opt/projects/repositories/pressograph/src/components/tests/pressure-test-preview.tsx`
   - Changed time-based axis config from `interval/minInterval/maxInterval` to `splitNumber`
   - Updated debug logging to show `splitNumber` for time-based axes

2. `/opt/projects/repositories/pressograph/CHANGELOG.md`
   - Added detailed explanation of time-based axis fix
   - Documented root cause, problem flow, solution, and verification

## Next Steps

After user confirms the fix works:
1. Remove all debug console.log statements
2. Commit changes with message: `fix(tests): use splitNumber for time-based axis intervals`
3. Push to GitHub
