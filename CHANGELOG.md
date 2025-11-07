# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **X-Axis Interval ECharts Auto-Adjustment Bug (FINAL FIX)** - Fixed value-based axis allowing ECharts to override calculated intervals
  - **Root cause**: Value-based axis had `minInterval: 30` (hardcoded) while time-based axis had `minInterval` and `maxInterval` set to the calculated interval value. This inconsistency allowed ECharts to auto-adjust the value-based axis intervals despite correct calculations.
  - **The problem flow:**
    1. Algorithm correctly calculates 120-minute (2-hour) interval for 24-hour test
    2. Sets `interval: 120` on value-based axis configuration
    3. BUT also sets `minInterval: 30` (different value!)
    4. ECharts sees this as permission to optimize and auto-adjusts to 60-minute (1-hour) intervals
    5. User sees 1-hour intervals instead of the calculated 2-hour intervals
  - **The fix**: Apply the same strict enforcement pattern used for time-based axis:
    ```typescript
    // Before (WRONG - allows auto-adjustment):
    interval: calculateXAxisInterval(totalDisplayHours),
    minInterval: 30,  // Different value - ECharts can optimize!

    // After (CORRECT - forces exact interval):
    interval: calculateXAxisInterval(totalDisplayHours),
    minInterval: calculateXAxisInterval(totalDisplayHours),  // Same value
    maxInterval: calculateXAxisInterval(totalDisplayHours),  // Same value
    ```
  - **Why this works**: When `interval`, `minInterval`, and `maxInterval` are all the same value, ECharts has no room to auto-adjust and must use our calculated interval exactly
  - **Verified behavior (value-based axis):**
    - 24-hour test: 2-hour intervals (120 minutes) - 12 ticks ✓
    - 28-hour test: 2-hour intervals (120 minutes) - 14 ticks ✓
    - 30-hour test: 2-hour intervals (120 minutes) - 15 ticks ✓
    - 40-hour test: 3-hour intervals (180 minutes) - 13.33 ticks ✓
    - 48-hour test: 4-hour intervals (240 minutes) - 12 ticks ✓
  - **Why previous fixes didn't work:**
    - Commit e36206ae: Fixed algorithm to calculate based on total display hours - Algorithm was correct!
    - Commit e1505b8b: Fixed to use actual duration (not padded) for value-based axis - Also correct!
    - BUT both commits left `minInterval: 30` unchanged, allowing ECharts to ignore our calculated intervals
  - **This fix completes the interval calculation system** - No more auto-adjustments, both axis types now respect calculated intervals
  - Time-based axis: Already had this fix (lines 327-329)
  - Value-based axis: Now has the same fix (lines 379-380)
  - User feedback: "24 hours shows 1-hour intervals (WRONG - should be 2 hours)" - RESOLVED ✓
  - User feedback: "28 hours shows 1-hour intervals (WRONG - should be 2-3 hours)" - RESOLVED ✓

- **X-Axis Interval Regression for Value-Based Axis** - Fixed interval calculation mismatch between time-based and value-based axes
  - **Root cause**: Previous fix (e36206ae) calculated intervals based on `totalDisplayHours` (duration + 2h padding) for BOTH axis types, but padding is ONLY applied to time-based axes. This caused:
    - Value-based axis: Interval calculated for 40h (38h + 2h padding) but displayed range was only 38h
    - ECharts auto-adjusted intervals back to 1-hour to fit the unpadded range
    - User feedback: "в моменте было как надо, а потом опять промежуток 1 час стал" (intervals were correct, then reverted to 1 hour)
  - **Fix**: Calculate intervals based on actual display range for each axis type:
    - Time-based axis (`type: 'time'`): Uses `totalDisplayHours` (duration + 2h padding) - includes ±1 hour padding
    - Value-based axis (`type: 'value'`): Uses `sanitizedDuration` (no padding) - displays exact test duration
  - **New behavior (value-based axis without padding):**
    - 24-hour test: 2-hour intervals (12 ticks) ✓
    - 25-hour test: 2-hour intervals (12.5 ticks) ✓
    - 38-hour test: 3-hour intervals (12.67 ticks) ✓ - User requirement: ">38h should use 3 or 4 hour intervals"
    - 40-hour test: 3-hour intervals (13.33 ticks) ✓
    - 48-hour test: 4-hour intervals (12 ticks) ✓
    - 72-hour test: 6-hour intervals (12 ticks) ✓
  - Algorithm remains: 8-15 tick target, common intervals (1h, 2h, 3h, 4h, 6h, 12h, 24h), prefer smaller when valid
  - User feedback: "Если Test Duration больше 38, то нужно уже 3 или 4 часа промежуток ставить" - resolved

### Fixed
- **Working Pressure 0 MPa Not Displaying Correctly** - Fixed graph line stuck at 10 MPa when working pressure is set to 0
  - Root cause: Logical OR (`||`) treats 0 as falsy, so `0 || 10` returns 10
  - Applied to debounced values in create form (lines 184-186)
  - Applied to preview props in edit form (lines 326, 433-434)
  - **Fix**: Changed from `workingPressure || 10` to `workingPressure ?? 10` (nullish coalescing)
  - Nullish coalescing (`??`) only returns fallback for `null`/`undefined`, NOT for `0`
  - Now correctly displays 0 MPa working pressure in graph
  - Same fix applied to `maxPressure` and `testDuration` for consistency
  - User feedback: "Линия графика почему-то зафиксировалась на 10МПа, хотя Working Pressure - 0" - resolved
- **Preview Graph Interval Display Bug (Create and Edit Forms)** - Fixed 1-hour intervals showing for 24-hour tests
  - Root cause: Missing fallback values in debounced form values caused undefined/0 to be passed to preview
  - When `testDuration` is undefined/0, preview would sanitize to 24h but interval calculation already completed
  - Create form: Added fallbacks to debounced values (workingPressure || 10, maxPressure || 15, testDuration || 24)
  - Edit form: Updated fallbacks in preview props from || 0 to proper defaults (1440 minutes = 24 hours)
  - This ensures preview always receives valid values and calculates correct intervals:
    - ≤6h tests: 1-hour intervals
    - ≤24h tests: 2-hour intervals (now working correctly)
    - ≤72h tests: 4-hour intervals
    - >72h tests: 6-hour intervals
  - User feedback: "Preview до сих пор отображается с промежутком в 1 час" - resolved
- **Edit Form Test Duration Unit Mismatch** - Fixed 1-hour intervals showing instead of 2-hour for 24-hour tests in edit form
  - Root cause: Edit form uses MINUTES internally but was loading hours from database without conversion
  - Database stores testDuration in hours (set by create form)
  - Edit form schema expects minutes (`min(1, 'Duration must be at least 1 minute')`)
  - When loading: 24 hours was loaded as "24 minutes" internally
  - When passing to preview: `(24 minutes) / 60 = 0.4 hours` → triggered ≤6h condition → 1-hour intervals
  - **Fix applied:**
    - Load: Convert hours to minutes: `testDuration: test.config.testDuration * 60`
    - Save: Convert minutes to hours: `testDuration: data.testDuration / 60`
  - Now correctly displays 2-hour intervals for 24-hour tests in edit form
  - Added input validation fallback in PressureTestPreview to default to 24 hours if invalid
- **X-Axis Interval Auto-Adjustment Issue** - Fixed 24-hour tests showing 4-hour intervals instead of 2-hour intervals
  - Added `minInterval` and `maxInterval` constraints to strictly enforce calculated interval
  - ECharts was auto-adjusting intervals when padding (±1 hour) made the display range 26 hours
  - The `calculateXAxisInterval()` correctly returned 120 minutes (2 hours) for 24-hour test
  - But ECharts auto-adjusted to 4-hour intervals to reduce tick count for visual comfort
  - Solution: Set `minInterval` and `maxInterval` to same value to disable auto-adjustment
  - Now correctly shows: 1h intervals (≤6h tests), 2h intervals (≤24h tests), 4h intervals (≤72h tests), 6h intervals (>72h tests)
  - Interval calculation based on actual test duration (24h), NOT padded range (26h)
- **Cumulative Time Calculation for Intermediate Stages** - Redesigned time semantics for better usability
  - "Time (min)" field now represents RELATIVE time (minutes AFTER previous stage's hold ends)
  - Added "Cumulative" column showing absolute time from test start in H:M format (e.g., "2:30")
  - Graph generation updated to calculate cumulative time dynamically
  - Example: Stage 1 at Time=120min, Hold=60min ends at 180min; Stage 2 at Time=120min starts at 300min (180+120)
  - More intuitive workflow: users specify wait time between stages, system calculates absolute timing
  - Schema comment updated: `time` field is now "MINUTES AFTER previous stage's hold ends (relative time)"
  - Tooltip updated: "Minutes AFTER previous stage's hold duration ends"
  - Removed sorting logic (no longer needed with relative time)
- **Time Unit Correction for Intermediate Stages** - Changed time input from hours to minutes
  - Column header changed from "Time (h)" to "Time (min)"
  - Input step changed from 0.1 hours to 1 minute
  - Schema comment updated: time field now represents MINUTES from test start
  - Tooltip updated: "Time from test start in minutes (e.g., 120 for 2 hours)"
  - Graph rendering updated: stage.time now interpreted as minutes (not hours)
  - Removed `* 60` conversion in graph calculation (stage.time is already in minutes)
  - More intuitive for users - direct minute input instead of decimal hours
  - Prevents confusion with 0.1 hour increments (6 minutes)

### Added
- **X-Axis Time Padding** - Added 1 hour buffer before and after test duration for time-based graphs
  - When using startDateTime/endDateTime, graph displays ±1 hour padding
  - Example: Test from 20:00 to 20:00 (next day) shows graph from 19:00 to 21:00
  - Improves visualization by showing context before/after test boundaries
  - Only applies to time-based axis (when start/end dates are provided)
  - Duration-based axis (minutes) remains unchanged
  - **X-axis interval calculation correctly based on test duration** (not padded range)
  - For 24-hour test: 2-hour intervals even with ±1 hour padding (displays -1h to +25h)

### Fixed
- **Intermediate Stage Pressure Validation** - Pressure in stages cannot go below working pressure
  - Added Zod schema refinement to validate all stages against working pressure
  - Real-time visual feedback: red border on invalid pressure inputs
  - Tooltip shows minimum required pressure on hover
  - Form-level error message displayed below stages table
  - Prevents creation of invalid test configurations
  - Ensures stage pressures are always >= working pressure

### Fixed
- **Graph Ramp Duration Calculation** - Fixed graph starting at 2h 24m instead of 0
  - Changed ramp up duration from 10% of total time to fixed 30 seconds (matching v1)
  - Changed depressurize duration from 5% to fixed 30 seconds
  - Graph now shows correct pressure profile from test start to end
  - Eliminates confusing time offset in graph display
  - Matches v1 behavior with rapid pressure changes (30 seconds)
- **Intermediate Stages Time Interpretation** - Fixed stages to use absolute time from test start
  - Changed "Offset (min)" back to "Time (h)" to match v1 behavior
  - Stage time field now represents HOURS from test start (not minutes from previous stage)
  - Removed "Cumulative" column as time field is already absolute
  - Updated graph generation logic to interpret stage.time as hours from start
  - Stage.time * 60 converts hours to minutes for graph calculation
  - Matches v1 logic where intermediate stages use absolute timing
  - Simplified form table with clearer column headers
- **Form Cache Project Selection** - Project dropdown now preserves selection on page refresh
  - useFormCache hook properly restores all form values including projectId
  - Auto-save every 30 seconds includes Project selection
  - Draft restoration shows toast with timestamp
  - 7-day cache expiration prevents stale data
- **Preview Dialog Full-Screen Orientation** - Enhanced full-screen preview to maximum viewport dimensions (98vw × 95vh)
  - Increased from 95vw to 98vw width for truly full-width display
  - Increased from 85vh to 95vh height for maximum vertical space
  - Added DialogDescription to fix accessibility warning
  - Optimized for viewing pressure test graphs in landscape mode
  - Improves visualization of long-duration tests
- **Graph Time Range Default Values** - Removed fallback values causing fixed 2h 24m to 22h 48m range
  - Removed `|| 24` fallback from testDuration watch
  - Removed `|| 10` and `|| 15` fallbacks from pressure values
  - Graph now uses actual form values without defaults
  - Prevents confusing time ranges in empty/new forms
  - X-axis now correctly displays 0 to actual test duration
- **Select Component Controlled Warnings** - Fixed React controlled component warnings
  - Added `|| ''` fallback to projectId Select value
  - Added `|| 'MPa'` fallback to pressureUnit Select value
  - Added `|| 'C'` fallback to temperatureUnit Select value
  - Added `|| 'daily'` fallback to templateType Select value
  - Ensures all Select components always have defined values
- **Form Default Values** - Added complete default values to prevent undefined warnings
  - Added empty string defaults for name, projectId, description
  - Added empty string defaults for equipmentId, operatorName, notes
  - Added empty string defaults for startDateTime, endDateTime
  - Ensures all form fields have defined initial values
  - Prevents controlled/uncontrolled component switching warnings
- **ECharts Deprecated API** - Removed deprecated grid.containLabel configuration
  - Replaced `containLabel: true` with explicit margin values
  - Updated grid to use left: 12%, right: 8%, bottom: 18%, top: 22%
  - Fixed deprecation warning in both preview components
  - Maintains identical visual appearance
  - Follows ECharts 6.0 modern API guidelines
- **Preview Dialog Landscape Orientation** - Full-screen preview now uses wide layout (95vw × 85vh)
  - Changed from portrait max-w-screen-2xl to landscape 95vw width
  - Reduced height from 90vh to 85vh for better screen fit
  - Optimized for viewing pressure test graphs in full width
  - Improves visualization of long-duration tests
- **Time Axis Formatter Display** - Fixed X-axis showing correct h:m format instead of long numbers
  - Enhanced tooltip formatter to handle both time-based and value-based axes
  - Improved axis label formatting with consistent spacing (e.g., "2h 30m")
  - Fixed minutes-only display for durations under 1 hour
  - Better readability for all test duration ranges
- **Working Pressure Minimum Value** - Form now allows 0 MPa working pressure
  - Changed min constraint from implicit 1 to explicit 0
  - Added min="0" attribute to both workingPressure and maxPressure inputs
  - Enables zero-pressure tests for specific testing scenarios
  - Form validation updated to accept 0 as valid value
- **ECharts Legend Errors** - Resolved series name mismatch warnings in console
  - Disabled legend display in both PressureTestPreview and PressureTestPreviewEnhanced
  - Eliminates "series not exists" warnings for Working Pressure and Max Pressure
  - Legend data was referencing series names that didn't exist (markLine items are not series)
  - Cleaner graph display without redundant legend

### Added
- **Dynamic X-Axis Intervals** - Smart time axis scaling based on test duration
  - 0-6 hours: 1-hour intervals (60 minutes)
  - 6-24 hours: 2-hour intervals (120 minutes)
  - 24-72 hours: 4-hour intervals (240 minutes)
  - 72+ hours: 6-hour intervals (360 minutes)
  - Minimum interval: 30 minutes to prevent overcrowding
  - Applies to both standard and enhanced preview components
  - Improves readability for tests of any duration
- **Three-Tier Form Caching** - Automatic draft saving for test creation form
  - Tier 1: React state via react-hook-form (in-memory)
  - Tier 2: LocalStorage with 30-second auto-save (browser)
  - Tier 3: Database on form submission (persistent)
  - Restores drafts automatically on page reload
  - 7-day cache expiration
  - Toast notification on draft restore
  - Silent autosave to prevent notification spam
  - Implements ADR-003 caching strategy
  - Prevents data loss from browser crashes or accidental navigation
- **Enhanced Date-Time Picker** - Professional date/time selection component
  - Built with shadcn/ui primitives (Popover, Button, Input, Label)
  - Calendar-based date selection
  - Separate time input with HH:mm format
  - "Now" button for quick current time
  - "Clear" button to reset selection
  - Formatted display: "Apr 29, 2023, 9:30 AM"
  - Full keyboard navigation support
  - ARIA labels for accessibility
  - Compatible with react-hook-form
  - Can replace native datetime-local inputs
- **Full-Screen Preview Dialog** - Maximized graph viewing modal
  - 90vh modal height for maximum visibility
  - Full-screen button on all preview cards (Steps 2, 3, 4)
  - Close button and ESC key support
  - Scrollable content for long graphs
  - Responsive layout for mobile devices
  - Better for presentations and detailed inspections
  - Built with shadcn/ui Dialog component
- **Form Cache Hook** - Reusable caching utility for any form
  - `useFormCache` hook with auto-save capability
  - Configurable autosave interval (default 30s)
  - Manual save with toast notification
  - Before-unload save to catch browser close
  - Cache versioning with timestamps
  - Automatic expiration (7 days)
  - Can be disabled per form (e.g., for duplicating tests)
  - Location: `/src/lib/hooks/use-form-cache.ts`
- **Preview Dialog Component** - Reusable full-screen graph viewer
  - Accepts all PressureTestPreview props
  - Maximize2 icon trigger button
  - Clean header with title
  - Scrollable content area
  - Close button in footer
  - Location: `/src/components/tests/preview-dialog.tsx`

### Changed
- **Test Creation Form shadcn Components** - Refactored form to use shadcn/ui Form pattern
  - Replaced manual Label + Input + Error pattern with FormField + FormItem + FormLabel + FormControl + FormMessage
  - Wrapped form with Form provider component for better context management
  - Updated key fields: name, projectId, workingPressure, maxPressure
  - Improved accessibility with automatic ARIA attributes
  - Better error handling and validation messaging
  - Follows shadcn/ui best practices and React Hook Form integration patterns
- **SHADCN Integration Documentation** - Comprehensive component audit
  - Documented all 30 installed shadcn/ui components
  - Categorized by function (Core UI, Layout, Feedback, Navigation, Forms, Display, Utilities)
  - Added custom components section (DateTimePicker, PreviewDialog, Form Cache Hook)
  - Updated component count from 14 to 30
  - Added feature descriptions and usage examples
  - Status: EXCELLENT - fully React 19 compatible

### Fixed (Previous)
- **Graph Real-Time Updates** - Fixed graph not updating when changing intermediate stage parameters
  - Changed from react-hook-form register to controlled inputs with explicit setValue
  - Implemented immutable update pattern for intermediate stages array
  - Graph now updates in real-time when modifying Time, Pressure, or Hold fields
  - Previously only updated when adding/removing stages
  - Fixes the critical bug where parameter changes were ignored by React's change detection
- **Graph X-Axis Time Display** - Fixed X-axis not respecting test duration parameter
  - Added explicit min/max bounds to X-axis (0 to testDuration * 60 minutes)
  - Graph now correctly displays 0-60min for 1-hour tests, 0-180min for 3-hour tests, etc.
  - Previously X-axis would auto-scale causing inconsistent time ranges
  - Added grid lines to both X and Y axes for better readability
  - Confirmed hot reload functionality works correctly for intermediate stages (300ms debounce)

### Added
- **Test Date/Time Scheduling** - Support for setting start and end date/time for pressure tests
  - New optional fields in test configuration: startDateTime and endDateTime (ISO 8601 format)
  - Automatic end date/time calculation based on start + duration
  - Manual override supported for end date/time
  - Native HTML5 datetime-local inputs for better UX
  - Date/time displayed in test configuration forms
  - Backward compatible (fields are optional)
- **Enhanced X-Axis with Date/Time Labels** - Time-based graph visualization with proper intervals
  - Switches to time-based X-axis when start/end dates are provided
  - Major ticks every 2 hours (2 * 60 * 60 * 1000 ms)
  - Minor ticks every 30 minutes (splitNumber: 4)
  - Displays date and time in Russian locale format (DD.MM\nHH:MM)
  - Falls back to duration-based axis (minutes) when no dates provided
  - ECharts 'time' type with millisecond timestamp precision
- **Y-Axis 5 MPa Intervals** - Standardized pressure axis for better readability
  - Rounds max to nearest 5 MPa: Math.ceil(maxPressure * 1.1 / 5) * 5
  - Interval set to 5 MPa for consistent grid lines
  - Applies to both PressureTestPreview and PressureTestPreviewEnhanced
  - Industry-standard pressure scale for professional reports
- **Compact Edit Page Layout** - Improved Parameters tab with live preview
  - Split into 4 tabs: Basic Info | Parameters | Stages | Graph Preview
  - Parameters tab now shows live graph preview side-by-side
  - Intermediate Stages moved to dedicated tab for better organization
  - Reduced vertical spacing (pb-3 instead of default)
  - Two-column grid layout (lg:grid-cols-2) for efficient space usage
  - Live preview updates in real-time as parameters change
  - Graph Preview tab maintained for full-screen visualization
- **ECharts-Based Graph Export System** - Complete rewrite of graph export using ECharts native capabilities
  - New graph-export-echarts.ts module using ECharts getDataURL() method
  - High-resolution PNG export (pixelRatio: 4) for print-quality output
  - 100% visual parity between preview and export (no more differences)
  - Russian labels matching v1 Pressograph export style
  - Temporary ECharts instance for export rendering (no preview canvas dependency)
  - Clean professional output without watermarks
  - PDF export with only the graph (no metadata page)
- **Real-time Graph Updates with Debouncing** - Optimized test configuration preview
  - useDebounce hook for 300ms delayed updates
  - Graph updates automatically as user types in /tests/new
  - Prevents expensive re-renders during rapid input changes
  - Smooth user experience with debounced working pressure, max pressure, test duration, and intermediate stages
- **Compact Intermediate Stages UI** - Improved form layout for test configuration
  - Replaced card-based layout with compact table view
  - Automatic cumulative time calculation for each stage
  - Total stages and total time summary display
  - Inline editing with smaller input fields (h-8)
  - Better space efficiency (50% height reduction)
  - Real-time validation and visual feedback
- **Russian Labels in Graph Preview** - Consistent localization across all views
  - Preview graphs now use Russian labels matching export
  - "Время" (Time) for X-axis
  - "Давление, МПа" (Pressure, MPa) for Y-axis
  - "Предварительный просмотр испытания" (Test Preview) for title

### Fixed
- **TypeError: measurement.pressure.toFixed is not a function** - Critical runtime error on test run detail page
  - Added type checking before calling .toFixed() on pressure and temperature values
  - Handles string/number type coercion from database JSONB fields
  - Graceful fallback to parseFloat() for non-number values
  - Prevents application crashes when viewing test run results
- **Graph Preview/Export Inconsistency** - Resolved visual differences between preview and export
  - Preview now uses same ECharts configuration as export
  - Identical colors, margins, grid lines, and axis formatting
  - User sees EXACTLY what will be exported
  - Eliminated confusion from mismatched graph appearances

### Changed
- **PressureTestConfig Schema** - Added startDateTime and endDateTime optional fields
- **PressureTestPreview Component** - Now supports time-based X-axis and 5 MPa Y-axis intervals
- **PressureTestPreviewEnhanced Component** - Updated Y-axis interval calculation
- **CreateTestForm** - Implemented controlled inputs for test duration and intermediate stages
- **EditTestFormClient** - Reorganized tabs and added Parameters tab live preview
- PressureTestPreview component updated to use Russian labels
- PressureTestPreviewEnhanced component updated to use Russian labels
- CreateTestForm now uses debounced values for all graph preview instances
- Intermediate stages input moved from individual cards to compact table format

### Known Issues
- **Performance.measure runtime error** - Non-blocking Turbopack warning in Next.js 16.0.1
  - Error: "Performance.measure: Given attribute end cannot be negative"
  - This is a known issue with Turbopack performance monitoring
  - Does not affect application functionality
  - Will be resolved in future Next.js updates

### Previously Added
- **Successful Emulation Export Mode (#91, #92 - 577a84a2)** - Generate and export simulated pressure test graphs without running actual tests
  - Emulated test data generator with realistic pressure curves and noise
  - Support for multiple export formats: PNG, PDF, CSV, and JSON
  - Proper watermarking and metadata to distinguish emulated from real data
  - EmulationExportDialog component with format selection UI
  - Integration into test detail page (Quick Actions and Graph Preview tab)
  - Based on v1 graphGenerator.ts with modern TypeScript improvements
  - Simulates complete test lifecycle: rise, hold, intermediate stages, and drop phases
  - CSV export includes metadata headers and timestamp data
  - PDF export includes graph image and full test configuration details
  - JSON export provides structured data with complete metadata
  - All exported files prefixed with "EMULATED" to prevent confusion
- **Batch Operations on Tests (#98 - bac2044b)** - Multi-select and batch actions for test management
  - Checkbox selection for individual tests and select-all functionality
  - Batch delete with ownership verification and confirmation
  - CSV export for selected tests with all metadata
  - Batch action toolbar with loading states
  - Server action batchDeleteTests() with proper authorization
- **Share Links Database Schema (#99 - 332aaf87)** - Foundation for public test sharing
  - Created share_links table with token-based authentication
  - Expiration dates and download permission controls
  - View count analytics and last viewed tracking
  - Foreign key relationships with cascade delete
  - Drizzle ORM schema and relations configuration
- **Edit Test Form (#95 - 1c762240)** - Full test configuration editing with 3-tab interface (Basic Info, Parameters, Preview)
  - updateTest server action with ownership and status validation
  - Live graph preview during editing
  - Support for all test parameters including intermediate stages
  - Restricted editing to draft/ready status tests
- **Run Test Interface (#96 - d8922f01)** - Comprehensive test execution and real-time monitoring
  - test_measurements table for time-series data storage
  - Manual measurement input with pressure and temperature
  - Real-time ECharts graph with working/max pressure lines
  - Elapsed time counter and status monitoring
  - Pass/fail calculation based on pressure drop
  - CSV data export functionality
  - Pause/Resume and Complete test controls
  - Auto-redirect to results page on completion
  - Server actions: startTestRun(), recordMeasurement(), completeTestRun()

### Changed
- **Graph Styling Updated to Match V1 (#91, #92)** - Consistent visual appearance across all graph components
  - Updated emulation export dialog canvas rendering to use v1 styling (white background, #0066cc line color, light gray grid)
  - Updated pressure-test-graph.tsx ECharts config to match v1 colors and grid lines
  - Applied v1 margin system (top: 80, right: 50, bottom: 120, left: 80)
  - Standardized pressure scaling: `Math.ceil(maxPressure * 1.1 / 5) * 5`
  - Added 5% time buffer on graph edges for better visualization
  - Grid lines: light gray (#f0f0f0) for Y-axis, darker gray (#d0d0d0) for X-axis
  - Pressure line: #0066cc with 2px width (matching v1)
  - Area fill: rgba(173, 216, 230, 0.3) light blue (matching v1)
  - Proper tick marks on time axis (1 hour major, 10 minute minor)
  - High DPI rendering (2x scale) for crisp canvas output

### Fixed
- **PNG Export Rendering (#91)** - Fixed broken PNG export functionality
  - Resolved issue where exported PNG showed transparent background with no graph content
  - Implemented v1-style fresh canvas rendering for each export operation
  - Export now creates high-resolution (1123x794 @ 4x scale) canvas matching v1 quality
  - Removed preview canvas dependency - export renders independently
  - Added Russian language support for axis labels (matching v1)
  - Graph shows ONLY the visual chart without watermarks in export
- **PDF Export Rendering (#92)** - Fixed broken PDF export functionality
  - Resolved issue where PDF showed no graph on first page, only text on second page
  - User requirement: "при экспорте должен быть только график, без каких-либо текстовых данных"
  - PDF now contains ONLY the graph image (no metadata page, no watermarks)
  - Implemented v1-style canvas-to-PDF pipeline with full-page A4 landscape output
  - All text (title, labels, footer) rendered on canvas as part of the image
  - Matches v1 export behavior exactly
- Permission denied error on /tests/[id]/edit and /tests/[id]/run directories blocking Turbopack compilation
- DateTimeSettings component useTranslations error by removing next-intl dependency and using hardcoded English text
- LocaleSwitcher emoji flags not rendering in Chrome by replacing with text-based country codes (EN | English, RU | Русский)
- LocaleSwitcher intl context error by passing locale as prop from Server Component instead of using useLocale() hook
- DashboardHeader refactored to Client Component with locale passed from parent layout
- UserMenu extracted to separate client component for better separation of concerns

### Previously Added
- LocaleSwitcher component to dashboard header for language switching
- DateTimeSettings integration in profile page for timezone and format preferences
- Custom title and description props to PressureTestPreviewEnhanced component
- Temperature display option in graph description section
- Graph Preview tab to test detail page for in-page visualization
- Comprehensive RUN test functionality specification document (docs/development/RUN_TEST_FUNCTIONALITY.md)
- Responsive tab layout for test detail page (2 columns on mobile, 5 on desktop)
- Test Results Display page for viewing completed test run data (#97) - 99835d5e
- Server action getTestRunById() for fetching test run details with measurements and files
- New GitHub issues for Sprint 3 features: Edit Test Form (#95), Run Test Interface (#96), Batch Operations (#98), Share Links Management (#99), Advanced Filtering (#100), Real-time Updates (#101)
- Comprehensive graph functionality comparison V1 vs V2 analysis document (docs/development/GRAPH_COMPARISON_V1_V2.md)
- GitHub issues for missing graph features: PNG export (#91), PDF export (#92), JSON import/export (#93), pressure drift simulation (#94)
- Comprehensive i18n and date-fns research documentation (docs/development/I18N_DATEFNS_RESEARCH.md)
- TypeScript type augmentation for type-safe translation keys
- date-fns locale integration with next-intl for consistent localization
- Custom hooks for localized date formatting (useFormattedDate, useRelativeTime, useShortDate)
- LocaleSwitcher component for language switching UI
- Enhanced date/time utilities with full locale support
- Multi-step test creation form with real-time graph preview (182c7a92)
- Internationalization support for English and Russian languages (683f8680)
- Timezone and date/time format configuration (172b112f)
- Dashboard with statistics and recent activity (37d33af1)
- Projects CRUD operations with archiving support (1448b44d)
- Tests management with full table view and actions (e7839966)
- Test detail page with run history (bf5b4984)
- Project detail page with scoped tests (950361c8)
- User profile page with preferences (56c1f34a)
- Application settings page (48f2bf24)
- Enhanced graph preview with manual recalculation and axis scaling (2454f6ab)
- Landing page for unauthenticated users (3a7436c1)
- Notification system with toast messages (992b447a)
- Loading states and error handling UI (992b447a)
- Date formatting utilities for SSR/CSR consistency (fad1b911)

### Changed
- Test table now shows clickable Test Number and plain text Name (improved UX)
- Enhanced graph preview component with return to working pressure after intermediate stages
- Migrated from middleware.ts to proxy.ts for Next.js 16 compatibility (182c7a92)
- Migrated from Recharts to ECharts 6.0.0 for graph visualization (b2b65084)
- Updated authentication to use Credentials Provider with username (798e8e58)
- Improved navigation with nested menus and breadcrumbs (477de586)
- Reorganized dashboard action sections for better UX (643f58f7)
- Reduced stage card height in test form for improved UX (e60bde44)

### Fixed
- /tests/history route conflict with dynamic [id] route - added redirect to /tests
- Graph intermediate stages not returning to working pressure between stages
- LocaleSwitcher server-side import error causing build failure (duplicated locale types in client component)
- Messages directory permission denied error blocking Turbopack build (chmod 755, chown developer:developer)

### Closed Issues
- Sprint 3 completed: Edit Test Form (#95), Run Test Interface (#96), Batch Operations (#98), Share Links Schema (#99)
- Infrastructure issues closed as not planned: Uptrace (#58), VictoriaMetrics (#57), Stack Verification (#55)
- Completed infrastructure: Drizzle ORM Configuration (#56)
- Performance optimization issues consolidated: GraphCanvas (#7), ExportButtons (#8)
- Sprint 2 issues completed: Dashboard (#84), Navigation Sidebar (#85), Additional shadcn/ui Components (#86), Dashboard Statistics Backend (#87), Recent Activity Feed (#88), Dashboard Charts (#89)
- Critical build failure resolved (#90)
- Sprint 1 issues completed: Real API authentication (#60), i18n setup (#33)
- Test creation route conflict between /tests/new and /tests/[id] (75d2cfd2)
- Dynamic import issues with i18n in Edge Runtime (182c7a92)
- All date formatting to prevent hydration errors (fad1b911, d0e665b2, 5451f445, dc5aa467, 925f0628)
- Bad Gateway error from route conflicts and CORS resolution (ed1b78e0)
- Internal Server Error from authentication configuration (e2059cd9)
- Session provider error on landing page (e95c478d)
- Dashboard Drizzle date query error (a6898bdf)
- Sidebar navigation to parent routes /projects and /tests (a67ccddf)
- Missing organizationId handling in session (6d531f5b)
- SearchParams and params awaiting for Next.js 16 (418de0a2)
- Nested paragraph hydration errors in delete dialog (79f79a5f)
- Delete project toast visibility issue (4bf418da)
- Archived projects filter implementation (4a09fed8)
- Active tests filter mapping (eacd8fee)
- FormatBytes export error in dashboard (5a1af798)
- Duplicate /tests route causing build error (01199cf2)
- Build errors and missing table component (31d6ff37)
- Header menu visibility and styling for unauthenticated users (f63d282c)
- Authentication redirect and routing issues (676e897d, e956ec21, 4f4c5f89, d44f3ab0, 22ed0f01)
- Middleware conflict resolution (2c3b99a1)
- CreateTest error handling and organizationId (b88aa8a3)

### Security
- Implemented proper authentication checks in all server actions (multiple commits)

## [2.0.0-alpha.1] - 2025-11-03

### Added
- Complete architectural redesign with Next.js 15, React 19, TypeScript 5.7 (03051ed3)
- TanStack Query v5 with SSR hydration (ba6fce06)
- Zustand v5 store with immer, persist, and devtools middleware (ba6fce06)
- Server-side theme management with 3-tier caching (a2b3f504)
- PressureGraph component with Recharts visualization (ba6fce06)
- OpenTelemetry observability stack (2491e223)
- Prisma ORM with PostgreSQL database (03051ed3)
- Valkey cache integration for user preferences (6320627f)
- NextAuth v4 with database adapter (d7efb3bf)
- shadcn/ui component library base (438b53d0)
- Database seed script for development (fb8756b0)
- Drizzle Studio hosted UI support (62c19d3f, a9a13c86, 5823a351)

### Changed
- Migrated from Vite+React to Next.js 15 App Router (8d48f03a, 4f1cb085)
- Downgraded Next.js from 16.0.1 to stable 15.5.6 (4ff37988)
- Applied React 19 and Next.js 15 modern patterns (cbe4fdb3)
- Removed Traefik BasicAuth in favor of application-level auth (e55c326d)

### Fixed
- SSR build issues with QueryProvider (01c79012)
- Test theme page TypeScript JSX errors (23ff4219)

### Removed
- Archived original Vite+React stack to /archive/v1-vite-react/ (8d48f03a)

## [1.2.0-legacy] - 2025-10-31

### Added
- PDF/JSON export functionality (584cdcd3)
- Comment field in test parameters (f269cdbe)
- Date column in history table (584cdcd3)
- Comprehensive test coverage for utilities and components (b3f83998)
- Makefile for deployment automation (0698cce2)
- Infrastructure documentation (c485883b)

### Changed
- Enhanced history page with improved layout (0698cce2)
- Migrated to Docker Compose-based deployment (0698cce2)
- Updated Node.js to LTS version (0aca9c08)
- Phase 1 and Phase 2 dependency updates (53147c60, 33e6a236)

### Fixed
- PNG Cyrillic encoding issues (a7fc1b21)
- PDF orientation and theme selection (aa163509)
- History table layout improvements (aa163509)
- API routing for Traefik proxy integration (c2e79ce8, 17c9f4eb)
- Comment saving and i18n translations (38590cb0)
- Authentication 401 errors and API integration (64ac1c41)
- Admin password restoration (fab78771)

### Removed
- Unused i18next dependencies (fab78771)
- lucide-react icons replaced with inline SVG (9e0d7ce4, 26238cfd)

## [1.1.0] - 2025-10-29

### Added
- Backend graph generator endpoints (07cdf20d)
- Validation service (f64a30cf)
- Server-side PNG export with node-canvas (858e4ae0, 885043c9)
- File storage service (7479c848)
- PDF export endpoint (e9cdf8c6)
- Help page structure (62319273)
- History page with interactive features (51a11ae8)
- Backend History API endpoints (5344d528)
- Error boundaries (fdc2e59d)
- Enhanced loading states (f66df308)
- Form validation improvements (73e00955)
- Accessibility improvements (b5e8d178)
- Infrastructure modernization with observability stack (38ebe4b4)
- Scrum framework and performance optimizations (abb73df9, 87cf0141)

### Changed
- Migrated to ESLint v9 flat config (ba0acb66)
- Frontend integration with backend PNG export API (cfa663fb)

### Fixed
- Vite HMR and i18n configuration (bc5f993b)
- Healthcheck IPv6 issues in containers (e3b6a613)
- Theme switching performance with useShallow (468626b8)

## [1.0.0] - 2025-10-28

### Added
- Initial pressure test visualizer implementation (68bf290c)
- Traefik reverse proxy and production deployment (354d1c98)
- Comprehensive middleware chain (765523be)
- Database size and schema version display (d97298aa)
- Podman pod support and API routing (3e8ced17)
- Development environment with Podman Kubernetes YAML (e77529ea)
- Project documentation files (ed984355)
- Agile task breakdown in TODO.md (64a3c7f3)

### Changed
- Updated to latest library versions (6d2ff1d9)
- Disabled Zustand persist middleware (c3ca3aa4)
- Used Node 22 LTS and disabled StrictMode (5bf72f99)

### Fixed
- React error 185 infinite update loop (0d672188, d3855b9e, 1a8d36c2)
- Nginx caching of index.html (38d268ed)
- GraphCanvas state comparison with zustand useShallow (1a8d36c2)
- Initialization endpoint and request format (b35a86f6)
- Documentation inaccuracies and broken links (cfdd6f61)
- Admin user status display (503f75e3)

[Unreleased]: https://github.com/dantte-lp/pressograph/compare/v2.0.0-alpha.1...HEAD
[2.0.0-alpha.1]: https://github.com/dantte-lp/pressograph/compare/v1.2.0-legacy...v2.0.0-alpha.1
[1.2.0-legacy]: https://github.com/dantte-lp/pressograph/compare/v1.1.0...v1.2.0-legacy
[1.1.0]: https://github.com/dantte-lp/pressograph/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/dantte-lp/pressograph/releases/tag/v1.0.0
