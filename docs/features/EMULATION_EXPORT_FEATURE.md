# Emulation Export Feature

**Status:** ✅ Implemented
**Version:** 2.0.0
**Commits:** 577a84a2, d7c44c3f, 0f1fd659
**Related Issues:** #91 (PNG Export), #92 (PDF Export)
**Sprint:** 4
**Priority:** P0 - Critical

## Overview

The Emulation Export feature allows users to generate and export pressure test graphs **without running actual tests**. This "Successful Emulation" mode creates realistic simulated data based on the test configuration, enabling:

- Preview graph exports before running tests
- Generate documentation and examples
- Test export functionality without hardware
- Create training materials with sample data

This feature is based on the v1 implementation from `/opt/backup/pressograph-20251103-051742/src/utils/graphGenerator.ts` with significant improvements for v2.

## Features Implemented

### 1. Emulated Data Generation (`pressure-data-generator.ts`)

**Location:** `/src/lib/utils/pressure-data-generator.ts`

**Core Functionality:**
- Generates realistic pressure test data based on `PressureTestConfig`
- Simulates complete test lifecycle:
  1. Initial pressure rise (30 seconds to working pressure)
  2. Hold at working pressure with small fluctuations
  3. Intermediate stages (if configured)
  4. Pressure drop phases between stages
  5. Final return to zero pressure
- Adds realistic noise to pressure values (`addNoise()` function)
- Supports complex multi-stage test configurations
- Includes temperature data if configured

**Key Functions:**
```typescript
generateEmulatedTestData(
  config: PressureTestConfig,
  startDate?: Date
): EmulatedTestData

emulatedDataToCSV(data: EmulatedTestData): string
emulatedDataToJSON(data: EmulatedTestData): string
```

**Data Point Structure:**
```typescript
interface PressureDataPoint {
  time: Date;
  pressure: number; // MPa
  temperature?: number; // °C
  isSimulated: true; // Always true for emulated data
}
```

### 2. Export Utilities (`graph-export.ts`)

**Location:** `/src/lib/utils/graph-export.ts`

**Export Formats:**
- **PNG**: High-resolution image with watermark
- **PDF**: Two-page document with graph and test configuration
- **CSV**: Data points with metadata headers
- **JSON**: Structured data with complete metadata

**Key Functions:**
```typescript
exportGraphAsPNG(canvas, testNumber, testName, isEmulation): Promise<void>
exportGraphAsPDF(canvas, testNumber, testName, isEmulation, config): Promise<void>
exportEmulatedCSV(config, testNumber, testName): Promise<{content, filename, mimeType}>
exportEmulatedJSON(config, testNumber, testName): Promise<{content, filename, mimeType}>
```

**Filename Format:**
- `EMULATED_[testNumber]_[YYYY-MM-DD].[ext]`
- Clear prefix distinguishes from real test data

**PDF Export Details:**
- Page 1: High-resolution graph with "EMULATED DATA" watermark (45° rotation)
- Page 2: Complete test configuration including:
  - Test identification (number, name)
  - Pressure parameters (working, max, allowable drop)
  - Test duration and temperature
  - Intermediate stages (if any)
  - Notes and equipment information
  - ⚠️ WARNING: "EMULATED/SIMULATED - NOT FROM ACTUAL TEST RUN"

### 3. User Interface (`emulation-export-dialog.tsx`)

**Location:** `/src/components/tests/emulation-export-dialog.tsx`

**Component:** `EmulationExportDialog`

**Features:**
- Modal dialog with format selection
- Live graph preview on HTML canvas
- Clear warning about simulated data
- Format selection via radio buttons:
  - PNG Image (high-quality raster)
  - PDF Document (includes metadata)
  - CSV Data (raw data points)
  - JSON Data (structured with metadata)
- Test configuration summary display
- Loading states during export
- Success/error toast notifications

**Props:**
```typescript
interface EmulationExportDialogProps {
  testNumber: string;
  testName: string;
  config: PressureTestConfig;
}
```

**Integration Points:**
1. Test detail page → Quick Actions card
2. Test detail page → Graph Preview tab header

## Technical Implementation

### Dependencies

**Installed:**
- `jspdf` 3.0.3 - PDF generation (already in package.json)
- `@radix-ui/react-radio-group` - Radio button UI component
- `sonner` - Toast notifications

**Used:**
- React 19.2.0 - Client component with hooks
- TypeScript 5.9.3 - Strict mode enabled
- shadcn/ui - UI component library

### Data Flow

1. User clicks "Export Emulation" button
2. Dialog opens with format selection
3. `generateEmulatedTestData()` creates realistic data
4. Canvas renders graph with watermark
5. User selects format (PNG/PDF/CSV/JSON)
6. Export handler processes data:
   - PNG/PDF: Canvas → Blob → Download
   - CSV/JSON: String → Blob → Download
7. File downloads with `EMULATED_` prefix
8. Success toast notification shown

### Watermarking Strategy

**Canvas Watermark:**
```typescript
ctx.font = 'bold 48px Arial';
ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
ctx.rotate(-Math.PI / 6); // 30° rotation
ctx.fillText('EMULATED DATA', centerX, centerY);
```

**PDF Watermark:**
```typescript
pdf.setFontSize(60);
pdf.setTextColor(200, 200, 200);
pdf.text('EMULATED DATA', pageWidth/2, pageHeight/2, {
  align: 'center',
  angle: 45
});
```

**File Metadata:**
- CSV: Header comments with "WARNING: This is SIMULATED data"
- JSON: `metadata.isEmulation: true`
- Filename: `EMULATED_` prefix

## Testing

### Manual Testing Checklist

- [x] Dialog opens from Quick Actions
- [x] Dialog opens from Graph Preview tab
- [x] Canvas renders emulated graph
- [x] Warning message displays correctly
- [x] Format selection works (PNG, PDF, CSV, JSON)
- [x] PNG export downloads with watermark
- [x] PDF export contains graph and metadata
- [x] CSV export includes headers and warnings
- [x] JSON export has complete metadata
- [x] Filenames have EMULATED prefix
- [x] Toast notifications show success/error
- [x] Loading states work during export
- [x] TypeScript compilation succeeds
- [x] No console errors or warnings

### Test Scenarios

**Scenario 1: Simple Test (No Intermediate Stages)**
- Working Pressure: 50 MPa
- Max Pressure: 60 MPa
- Duration: 4 hours
- Temperature: 20°C
- Expected: Smooth rise → hold → drop curve

**Scenario 2: Complex Multi-Stage Test**
- Working Pressure: 50 MPa
- Intermediate Stages: 3 stages (25 MPa, 75 MPa, 40 MPa)
- Duration: 8 hours
- Expected: Multiple pressure levels with transitions

**Scenario 3: Edge Cases**
- Very short duration (0.5 hours)
- Very long duration (24 hours)
- Many intermediate stages (5+)
- Zero temperature

## Known Limitations

1. **Canvas Rendering Quality**
   - Current implementation uses basic HTML canvas rendering
   - Not as sophisticated as ECharts used for live preview
   - Future enhancement: Integrate ECharts for export rendering

2. **Emulation Only**
   - This implementation only handles emulated data
   - Does not export actual test run results
   - Future enhancement: Export real test data with same interface

3. **Theme Support**
   - Currently uses light theme for clarity
   - Future enhancement: Theme selection in export dialog

4. **Single Graph Per Export**
   - Cannot compare multiple tests in one export
   - Future enhancement: Multi-test comparison PDFs

## Future Enhancements

### Short Term (Sprint 5)
- [ ] Add theme selection to export dialog (light/dark)
- [ ] Improve canvas rendering quality to match ECharts
- [ ] Add export button to test results page for actual data
- [ ] Support exporting multiple test runs as comparison

### Medium Term (Sprint 6-7)
- [ ] Add export templates (industry standards)
- [ ] Support custom watermark text
- [ ] Add digital signatures to PDFs
- [ ] Batch export multiple tests
- [ ] Export to Excel format (XLSX)

### Long Term (Future Sprints)
- [ ] Integration with cloud storage (S3, Google Drive)
- [ ] Automated email delivery of reports
- [ ] Scheduled exports (daily, weekly reports)
- [ ] Export API endpoint for programmatic access

## Migration from V1

### Improvements Over V1

1. **TypeScript Type Safety**
   - V1: Weak typing with `any` types
   - V2: Strict TypeScript with proper interfaces

2. **Modern React Patterns**
   - V1: Class components and HOCs
   - V2: Functional components with hooks

3. **Better Separation of Concerns**
   - V1: Mixed UI and logic in single file
   - V2: Separate files for data, export, and UI

4. **Enhanced Metadata**
   - V1: Basic filename timestamp
   - V2: Complete metadata including version, generation time, warnings

5. **Improved Watermarking**
   - V1: Simple text overlay
   - V2: Rotated watermark, PDF metadata, CSV headers

6. **User Experience**
   - V1: Direct export on button click
   - V2: Dialog with format selection and preview

### Breaking Changes

None - This is a new feature in v2.0

## Deployment

### Files Added
```
src/lib/utils/pressure-data-generator.ts       (334 lines)
src/lib/utils/graph-export.ts                  (285 lines)
src/components/tests/emulation-export-dialog.tsx (452 lines)
src/components/ui/radio-group.tsx              (shadcn/ui component)
```

### Files Modified
```
src/app/(dashboard)/tests/[id]/page.tsx        (+2 imports, +2 components)
CHANGELOG.md                                   (+12 lines)
package.json                                   (+1 dependency)
pnpm-lock.yaml                                 (auto-updated)
```

### Database Changes

None - No database migrations required

### Environment Variables

None - No configuration needed

## Rollout Plan

### Phase 1: Internal Testing (Completed)
- ✅ TypeScript compilation
- ✅ Unit testing of data generator
- ✅ Integration testing of export utilities
- ✅ UI testing in development environment

### Phase 2: Staging Deployment (Current)
- Deploy to dev-pressograph.infra4.dev
- Test with various browser configurations
- Verify file downloads work correctly
- Performance testing with large datasets

### Phase 3: Production Deployment
- Deploy to production
- Monitor error rates
- Collect user feedback
- Iterate based on usage patterns

## Support and Documentation

### User Documentation

**How to Use:**
1. Navigate to any test detail page
2. Click "Export Emulation" button in Quick Actions or Graph Preview tab
3. Select desired export format (PNG, PDF, CSV, JSON)
4. Click "Export [FORMAT]" button
5. File downloads automatically with EMULATED prefix

**Important Notes:**
- Exported data is SIMULATED - not from actual test runs
- Files are clearly marked as "EMULATED DATA"
- Use for documentation, training, and testing purposes only
- Do NOT use emulated data for compliance or certification

### Developer Documentation

**Adding New Export Formats:**
```typescript
// 1. Add to ExportFormat type
type ExportFormat = 'png' | 'pdf' | 'csv' | 'json' | 'xlsx';

// 2. Implement export function
export async function exportEmulatedXLSX(
  config: PressureTestConfig,
  testNumber: string,
  testName: string
): Promise<{content: Buffer; filename: string; mimeType: string}> {
  // Implementation
}

// 3. Add to UI dialog
<RadioGroupItem value="xlsx" id="format-xlsx" />
```

## Metrics and Analytics

### Success Metrics
- Export success rate > 95%
- Average export time < 2 seconds
- User satisfaction > 4.0/5.0
- Zero data corruption incidents

### Monitoring
- Error rate by format type
- File size distribution
- Browser compatibility issues
- User feedback and feature requests

## Related Documentation

- [Graph Comparison V1 vs V2](/docs/development/GRAPH_COMPARISON_V1_V2.md)
- [Pages Structure and Functionality](/docs/development/PAGES_STRUCTURE_AND_FUNCTIONALITY.md)
- [Sprint 4 Planning](/docs/sprints/sprint-4-plan.md)

## Changelog

### 2025-01-07 (v2.0.0)
- Initial implementation of emulation export feature
- PNG, PDF, CSV, and JSON export support
- Integration into test detail page
- Comprehensive documentation

## Contributors

- Claude Code (Implementation)
- Based on v1 design by previous developers

---

**Last Updated:** 2025-01-07
**Status:** Production Ready
**Maintainer:** Development Team
