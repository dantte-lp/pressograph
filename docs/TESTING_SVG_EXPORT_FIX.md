# Testing Guide: SVG Export Line 3 Fix

**Purpose:** Verify that the SVG line 3 attribute error (commit 7debab17) is completely resolved.

## Quick Test (5 minutes)

### 1. Start Development Server

**From outside the container (local server):**
```bash
cd /opt/projects/repositories/pressograph
podman exec -u developer -w /workspace pressograph-dev-workspace pnpm dev
```

The dev server should start on port 3000 or 3001 (if 3000 is busy).

### 2. Open Application

Navigate to: `http://localhost:3000` (or 3001)

### 3. Open Browser Console

**Chrome/Firefox:**
- Press F12 or Ctrl+Shift+I
- Go to "Console" tab
- Clear any existing logs

### 4. Create a Test

1. Click "Create New Test" or edit existing test
2. Configure test parameters:
   - Test Name: `SVG Fix Verification Test`
   - Test Number: `001`
   - Duration: 24 hours
   - Working Pressure: 10 MPa
   - Max Pressure: 15 MPa

### 5. Export as SVG

1. Click "Export Graph (ECharts)" button
2. In the export dialog:
   - Select **"SVG Vector"** format
   - Leave quality settings at default
3. Click **"Export SVG"**

### 6. Verify Success

**Check Console Output:**

✅ **EXPECTED (After Fix):**
```
[SVG Export] Starting SVG generation...
[SVG Export] SVG string generated successfully, length: ~245000
[SVG Debug] Total lines: ~2800
[SVG Debug] First 5 lines: ['<?xml version="1.0"...', '<svg xmlns=...', ...]
[SVG Debug] Line 3 length: ~189
[SVG Debug] Line 3 char at column 133: e
[SVG Debug] Line 3 substring around column 133: version="1.1" viewBox="0 0 1920 1080"
[SVG Export] SVG cleaned successfully
[SVG Export] SVG downloaded successfully
```

❌ **NOT EXPECTED (Before Fix):**
```
[ECharts] Specified `grid.containLabel` but no `use(LegacyGridContainLabel)`...
error on line 3 at column 133: attributes construct error
```

**Check Downloaded File:**

1. Locate the downloaded SVG file (usually in Downloads folder)
2. File name format: `001_SVG_Fix_Verification_Test_export_YYYY-MM-DDTHH-mm-ss.svg`
3. File size should be ~240-250 KB

**Open SVG in Browser:**

1. Drag and drop the SVG file into a new browser tab
2. **Expected:** Graph displays correctly without errors
3. **NOT Expected:** Error message "error on line 3 at column 133"

### 7. Test Result

✅ **PASS:** No console errors, SVG downloads and opens correctly
❌ **FAIL:** Any errors in console or SVG won't open

## Comprehensive Test Suite (15 minutes)

### Test Case 1: Basic SVG Export

**Configuration:**
- Test Name: Basic Test
- Duration: 24h
- Working Pressure: 10 MPa
- Max Pressure: 15 MPa
- No intermediate stages
- No special characters

**Steps:**
1. Create test with above configuration
2. Export as SVG
3. Check console for errors
4. Open SVG in browser
5. Verify graph renders correctly

**Expected:**
- ✅ No console errors
- ✅ SVG downloads successfully
- ✅ SVG opens in browser
- ✅ Graph displays correctly

### Test Case 2: Special Characters in Name

**Configuration:**
- Test Name: `Test "A&B" <Special> Chars`
- Add quotes, ampersands, angle brackets
- Test Number: `#123-ABC`

**Steps:**
1. Create test with special characters
2. Export as SVG
3. Check SVG content for proper escaping

**Expected:**
- ✅ Special characters properly escaped
- ✅ No XML parsing errors
- ✅ Characters display correctly in SVG

### Test Case 3: Complex Test with Stages

**Configuration:**
- Test Name: Complex Multi-Stage Test
- Duration: 48h
- Working Pressure: 10 MPa
- Max Pressure: 20 MPa
- Add 3 intermediate stages:
  - Stage 1: 15 MPa at 8h for 2h
  - Stage 2: 18 MPa at 16h for 4h
  - Stage 3: 12 MPa at 32h for 1h

**Steps:**
1. Create test with multiple stages
2. Export as SVG
3. Verify all stages render correctly

**Expected:**
- ✅ All stages visible in SVG
- ✅ Stage transitions smooth
- ✅ Labels readable

### Test Case 4: With Realistic Drift

**Configuration:**
- Any test configuration
- Enable "Realistic Drift" option

**Steps:**
1. Create test
2. Enable "Realistic Drift" in export dialog
3. Export as SVG
4. Check for smooth curves

**Expected:**
- ✅ Smooth drift curves
- ✅ High-frequency data rendered
- ✅ No performance issues

### Test Case 5: With Metadata Display

**Configuration:**
- Test with all metadata fields filled:
  - Equipment ID
  - Operator Name
  - Temperature
  - Pressure Unit
  - Date/Time

**Steps:**
1. Create test with metadata
2. In export dialog, select different data placement options:
   - Below Title
   - Below Graph
   - On Graph (overlay)
   - Do Not Display
3. Export SVG for each option
4. Verify metadata displays correctly

**Expected:**
- ✅ Metadata renders in correct location
- ✅ Text is readable
- ✅ No overlap with graph

### Test Case 6: All Export Formats

**Steps:**
1. Export same test as:
   - PNG (Full HD 1920×1080)
   - SVG (Vector)
   - PDF (A4 Landscape)
2. Verify all formats work

**Expected:**
- ✅ PNG downloads and opens
- ✅ SVG downloads and opens (main test)
- ✅ PDF downloads and opens
- ✅ All formats show same graph

### Test Case 7: Verify No ECharts Warnings

**Steps:**
1. Open browser console
2. Clear all logs
3. Export any test as SVG
4. Check console carefully

**Expected:**
- ✅ No `[ECharts] Specified grid.containLabel...` warning
- ✅ Only `[SVG Export]` and `[SVG Debug]` logs
- ✅ No errors or warnings

## Browser Compatibility Testing

Test SVG export in multiple browsers:

### Chrome/Edge
- Version: Latest stable
- Expected: Full compatibility

### Firefox
- Version: Latest stable
- Expected: Full compatibility

### Safari (macOS)
- Version: Latest stable
- Expected: Full compatibility

## SVG Editor Testing

Open exported SVG files in:

### 1. Inkscape (Free)
```bash
# Install Inkscape if not already installed
sudo dnf install inkscape

# Open SVG
inkscape exported_file.svg
```

**Expected:**
- ✅ SVG opens without errors
- ✅ All elements editable
- ✅ Text selectable
- ✅ Paths modifiable

### 2. Adobe Illustrator (Commercial)
**Expected:**
- ✅ SVG imports successfully
- ✅ No warnings about malformed XML
- ✅ All layers intact

### 3. Browser Built-in Viewer
**Expected:**
- ✅ SVG displays immediately
- ✅ No error messages
- ✅ Zoom works correctly

## Debug Information Analysis

### Understanding Console Output

**1. SVG Export Starting:**
```
[SVG Export] Starting SVG generation...
```
- ECharts is initializing the export

**2. SVG Generation Success:**
```
[SVG Export] SVG string generated successfully, length: 245847
```
- ECharts successfully rendered to SVG
- Length ~240-250 KB is normal for complex graphs

**3. Debug Information:**
```
[SVG Debug] Total lines: 2891
[SVG Debug] First 5 lines: [...]
[SVG Debug] Line 3 length: 189
[SVG Debug] Line 3 char at column 133: e
[SVG Debug] Line 3 substring around column 133: version="1.1" viewBox="0 0 1920 1080"
```
- **Line 3 length:** Should be ~180-200 characters
- **Char at column 133:** Should be a normal character (e.g., 'e', 'w', '=')
- **Substring:** Should show normal XML attributes

**4. Cleaning Success:**
```
[SVG Export] SVG cleaned successfully
```
- SVG sanitization completed
- No errors found

**5. Download Success:**
```
[SVG Export] SVG downloaded successfully
```
- File saved to Downloads folder

### What to Look For

✅ **GOOD SIGNS:**
- All steps complete without errors
- Debug output shows normal XML attributes
- Character at column 133 is alphanumeric or `=`
- No warnings about `grid.containLabel`

❌ **BAD SIGNS (Should Not Appear After Fix):**
- Error message containing "attributes construct error"
- Warning about `grid.containLabel`
- Character at column 133 is unusual (`"`, `>`, etc. where not expected)
- SVG validation fails

## Troubleshooting

### Issue: Console shows "attributes construct error"

**Cause:** Fix not applied or git changes not reflected

**Solution:**
```bash
# Verify commit is present
git log --oneline | grep "7debab17"

# If missing, pull latest changes
git pull origin master

# Restart dev server
podman exec -u developer -w /workspace pressograph-dev-workspace pkill node
podman exec -u developer -w /workspace pressograph-dev-workspace pnpm dev
```

### Issue: SVG won't open in browser

**Cause:** XML parsing error

**Solution:**
1. Check console output carefully
2. Note the exact error message
3. Check if debug logs show unusual character at column 133
4. Report issue with full console output

### Issue: No console output at all

**Cause:** Console not open or filtered

**Solution:**
1. Open browser console (F12)
2. Click "Console" tab
3. Ensure filter is set to "All levels" (not just errors)
4. Try export again

### Issue: Downloaded SVG file size is 0 KB

**Cause:** Export failed silently

**Solution:**
1. Check browser console for JavaScript errors
2. Try different export format (PNG) to verify component works
3. Clear browser cache and try again

## Performance Metrics

**Expected Timing:**
- SVG generation: < 1 second
- Cleaning/validation: < 0.1 seconds
- Total export time: < 2 seconds

**Expected File Size:**
- Simple test (no stages): ~150-200 KB
- Complex test (3+ stages): ~240-300 KB
- With drift enabled: ~400-600 KB (high frequency data)

## Automated Testing (Future)

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { cleanSVGForExport } from '@/lib/utils/svg-sanitization';

describe('SVG Export Line 3 Fix', () => {
  it('should not contain grid.containLabel in export options', () => {
    // Test that containLabel is not present in grid configuration
    const exportOption = generateExportOption();
    expect(exportOption.grid.containLabel).toBeUndefined();
  });

  it('should generate valid XML without attribute errors', () => {
    const mockSVG = generateMockSVG();
    const cleaned = cleanSVGForExport(mockSVG);

    // Parse as XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleaned, 'image/svg+xml');

    // Should not have parser errors
    const errors = doc.querySelector('parsererror');
    expect(errors).toBeNull();
  });

  it('should clean SVG header correctly', () => {
    const mockSVG = '<?xml version="1.0"?>\n<svg>\n<g attr="">\n</svg>';
    const cleaned = cleanSVGForExport(mockSVG);

    // Empty attributes should be removed
    expect(cleaned).not.toContain('attr=""');
  });
});
```

### Integration Test Template

```typescript
import { test, expect } from '@playwright/test';

test('SVG export completes without errors', async ({ page }) => {
  // Navigate to test page
  await page.goto('http://localhost:3000/tests/new');

  // Fill test configuration
  await page.fill('[name="testName"]', 'Integration Test');
  await page.fill('[name="workingPressure"]', '10');
  await page.fill('[name="maxPressure"]', '15');

  // Start export
  await page.click('button:has-text("Export Graph")');
  await page.click('button:has-text("Export SVG")');

  // Check console for errors
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));

  // Wait for download
  const download = await page.waitForEvent('download');

  // Verify no error messages
  const errors = logs.filter(log =>
    log.includes('error on line 3') ||
    log.includes('attributes construct error')
  );
  expect(errors).toHaveLength(0);

  // Verify file downloaded
  expect(download.suggestedFilename()).toContain('.svg');
});
```

## Reporting Results

When reporting test results, include:

1. **Browser:** Chrome 120 / Firefox 121 / Safari 17
2. **Console Output:** Copy full `[SVG Export]` and `[SVG Debug]` logs
3. **Screenshot:** Show exported SVG in browser
4. **File Size:** Report actual SVG file size
5. **Success:** ✅ Pass or ❌ Fail with error details

**Example Report:**
```
Test: SVG Export Line 3 Fix
Date: 2025-11-09
Browser: Chrome 120.0.6099.129
Status: ✅ PASS

Console Output:
[SVG Export] Starting SVG generation...
[SVG Export] SVG string generated successfully, length: 245847
[SVG Debug] Line 3 char at column 133: e
[SVG Export] SVG cleaned successfully
[SVG Export] SVG downloaded successfully

File: 001_SVG_Fix_Verification_Test_export_2025-11-09T13-45-12.svg
Size: 240 KB
Opens: ✅ Chrome, ✅ Firefox, ✅ Inkscape

Notes: No errors, graph displays perfectly.
```

## Conclusion

This fix should completely resolve the "attributes construct error" at line 3, column 133.

The test is successful if:
1. ✅ No console errors about "attributes construct error"
2. ✅ No ECharts warnings about `grid.containLabel`
3. ✅ SVG downloads successfully
4. ✅ SVG opens correctly in browser
5. ✅ Debug logs show normal XML attributes at column 133

If any test fails, capture the full console output and file a bug report with:
- Browser version
- Console logs
- Downloaded SVG file (if available)
- Steps to reproduce
