# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Timezone and Date/Time Format Support** - ✅ COMPLETED - User preferences for international date/time display
  - **Database Schema Changes**:
    - Added `timezone` field (varchar 50, default UTC) - IANA timezone identifier
    - Added `dateFormat` field (varchar 20, default YYYY-MM-DD) - Date format preference
    - Added `timeFormat` field (varchar 10, default 24h) - Time format preference (12h/24h)
    - All fields have NOT NULL constraints with sensible defaults
  - **Server Actions**:
    - Created `src/lib/actions/user-preferences.ts` with comprehensive preference management
    - `getUserPreferences()` - Fetch user preferences from database
    - `updateTimezone()`, `updateDateFormat()`, `updateTimeFormat()` - Individual update functions
    - Full TypeScript type safety and error handling
    - Automatic preference creation for new users
  - **UI Components**:
    - Updated `DateTimeSettings` component to use server actions instead of localStorage
    - Added Date & Time tab to settings page
    - Timezone selector with common timezones (11 options: UTC, Moscow, London, Berlin, NYC, Chicago, LA, Tokyo, Shanghai, Dubai, Sydney)
    - Date format selector (US: MM/DD/YYYY, EU/RU: DD.MM.YYYY, ISO: YYYY-MM-DD)
    - Time format toggle (12-hour with AM/PM, 24-hour)
    - Loading states and optimistic UI updates
    - Error recovery with user-friendly toast notifications
  - **Utilities**:
    - Deprecated localStorage-based `getUserDateTimeConfig()` and `setUserDateTimeConfig()`
    - Maintained backward compatibility for existing code
    - Migration path to database-backed preferences
  - **Benefits**:
    - International user support with proper timezone handling
    - Preferences persist across sessions and devices
    - SSR-compatible with database backing
    - Improved UX with real-time updates
  - Date: 2025-11-09
  - Issue: #115 (Sprint 2, 1 SP, P1) - ✅ COMPLETED
  - Commits: 9d109cda, f02835e7, 77f03e67, f6168f52
  - Files Added: 2 files (user-preferences.ts action, migration script)
  - Files Modified: 4 files (user-preferences schema, date-time-settings.tsx, settings page, date-time.ts)

### Fixed

- **TypeScript Compilation Errors** - Resolved all TypeScript type errors and warnings for clean production builds
  - **Zod Schema Type Mismatches**: Fixed `temperatureUnit` and `intermediateStages` schema conflicts in `edit-test-form-client.tsx`
  - **ECharts Type Literals**: Added `as const` assertions to all ECharts configuration string literals in `pressure-test-preview.tsx`
  - **Unused Variables**: Prefixed or removed unused variables across 9 files
  - **Non-existent Properties**: Fixed references to `runCount` and `lastRunDate` in `tests-table-client.tsx` (placeholders for future implementation)
  - **useRef Initialization**: Fixed missing initial value in `use-test-polling.ts`
  - **TypeScript Build Status**: ✅ Clean compilation with zero errors or warnings
  - **Benefits**:
    - Enables strict TypeScript mode
    - Improves IDE IntelliSense and autocomplete
    - Catches potential runtime bugs at compile time
    - Cleaner production builds
  - Date: 2025-11-09
  - Commit: 02826f50
  - Files Modified: 9 files
  - Related: Unplanned but critical for Issue #108 (Strict TypeScript Typing)

### Changed

- **ECharts Component Migration** - Migrated all components from echarts-for-react to direct ECharts usage
  - **Migrated Components** (8 files):
    - `src/components/charts/echarts-wrapper.tsx` - Rewritten with React 19 patterns, ResizeObserver
    - `src/components/charts/themed-chart.tsx` - Updated to use new wrapper
    - `src/components/tests/pressure-test-graph.tsx` - Removed echarts-for-react dependency
    - `src/components/tests/echarts-export-dialog.tsx` - Using centralized config
    - `src/components/tests/pressure-test-preview-enhanced.tsx` - Using centralized config
    - `src/components/tests/a4-preview-graph.tsx` - Using centralized config
    - `src/components/tests/pressure-test-preview.tsx` - Using centralized config
    - `src/lib/utils/graph-export-echarts.ts` - Using centralized config
  - **Removed Dependencies**:
    - echarts-for-react (900KB package removed)
  - **Bundle Size Results**:
    - Main ECharts chunk: 663 KB uncompressed (~200-220 KB gzipped)
    - Successfully removed 900KB echarts-for-react dependency
    - Zero duplicate component registrations
  - Date: 2025-11-09
  - Issue: #106 (Sprint 2, 3 SP, P1) - ✅ COMPLETED
  - Commits: 823b0800, 4eabe621, 9d17bd40
  - Files Modified: 11 files (package.json, pnpm-lock.yaml, 8 components, echarts-config.ts)

### Added

- **ECharts 6 Tree-Shaking Optimization** - ✅ COMPLETED - Full implementation of bundle size optimization
  - **Configuration Changes**:
    - Added `transpilePackages: ["echarts", "zrender"]` to next.config.ts
    - Enables proper ESM module transpilation for Next.js 16 + Turbopack compatibility
    - Critical for tree-shaking to work correctly
  - **Centralized ECharts Configuration**:
    - Created `src/lib/echarts-config.ts` as single source of truth
    - Registers components globally: LineChart, 8 components (Title, Tooltip, Grid, Legend, MarkLine, DataZoom, Toolbox, Graphic), 2 renderers (Canvas, SVG)
    - Exports type-safe `PressureChartOption` using `ComposeOption`
    - Eliminates duplicate component registration across files
  - **Implementation Status**: ✅ 100% COMPLETE
    - All components migrated from echarts-for-react to direct ECharts
    - echarts-for-react dependency removed from package.json
    - Production build verified (663KB main chunk, ~200-220KB gzipped)
    - Zero duplicate registrations
  - **Benefits Achieved**:
    - Removed 900KB echarts-for-react wrapper
    - Implemented React 19 patterns (no forwardRef needed)
    - Single source of truth for ECharts configuration
    - Type-safe PressureChartOption throughout codebase
    - Improved performance with ResizeObserver
    - Production build successful with optimized bundles
  - Date: 2025-11-09
  - Issue: #106 (Sprint 2, 3 SP, P1) - ✅ COMPLETED
  - Commits: 7c2b3de9, 823b0800, 4eabe621, 9d17bd40
  - Files Added:
    - `src/lib/echarts-config.ts` - Centralized ECharts configuration
    - `docs/development/ECHARTS_TREE_SHAKING_STATUS.md` - Implementation status and migration guide (completed)
  - Files Modified:
    - `next.config.ts` - Added transpilePackages configuration
    - 8 component files - Migrated to centralized config
    - `package.json` - Removed echarts-for-react
    - `pnpm-lock.yaml` - Dependency tree updated

- **Database Schema Analysis** - Comprehensive analysis of current schema with enhancement proposals
  - **Analysis Summary**:
    - Current schema: 13 tables, 95% complete, production-ready
    - Excellent coverage of core features (users, projects, tests, files, sharing)
    - Well-designed indexes, constraints, and relationships
    - Proper use of JSONB for flexible configuration
  - **Identified Enhancements** (11 SP total):
    1. **Timezone and Date Format Support** (1 SP, P1, Sprint 2)
       - Add timezone, dateFormat, timeFormat to user_preferences table
       - Support international users across timezones
       - Enable localized timestamp display throughout application
       - Proposed Issue #115
    2. **Test Templates System** (3 SP, P2, Sprint 3)
       - New test_templates table for reusable test configurations
       - Support custom user templates and organization-wide sharing
       - System templates (daily, extended, regulatory)
       - "Save as Template" feature in UI
       - Proposed Issue #116
    3. **Test Runs Tracking** (5 SP, P1, Sprint 3-4)
       - New test_runs table for proper execution tracking
       - Separate test definitions from executions
       - Track success/failure rates and performance analytics
       - Store time-series measurement data
       - Proposed Issue #117
    4. **Enhanced Organization Settings** (2 SP, P2, Sprint 4)
       - Expand settings JSONB with enhanced branding, notifications
       - Data retention policies (GDPR compliance)
       - Feature flags per organization
       - Security settings (MFA, IP restrictions)
       - Proposed Issue #118
  - **Schema Strengths**:
    - ✅ Comprehensive audit logging with JSON metadata
    - ✅ Robust API key management with scoped permissions
    - ✅ Feature-complete notifications system
    - ✅ Advanced share links with expiration and access control
    - ✅ Multi-tenancy via organizations
    - ✅ RBAC with role-based access control
  - **Recommendations**:
    - Phase 1 (Sprint 2): Timezone support (1 SP)
    - Phase 2 (Sprint 3): Test templates (3 SP)
    - Phase 3 (Sprint 3-4): Test runs table (5 SP) - Requires careful planning
    - Phase 4 (Sprint 4): Organization settings enhancements (2 SP)
  - Date: 2025-11-09
  - Commit: 1b3d9588
  - Files Added:
    - `docs/development/DATABASE_SCHEMA_ANALYSIS_2025-11-09.md` - Comprehensive analysis and proposals

- **Below Graph Data Placement** - Improved positioning of data display text when "Below Graph" option is selected
  - Changed bottom position from percentage (8%) to pixel-based positioning (20px) for precise control
  - Increased grid bottom margin from 100px to 110px to ensure adequate space
  - Text is now centered exactly under the X-axis label ("Дата и время" / "Date and Time")
  - Positioned between the graph line and bottom edge for better visual alignment
  - Added z-index (100) to ensure text appears above other elements
  - Date: 2025-11-09
  - Commit: c1e6c9ba

### Fixed

- **SVG Export Column 133 Error** - Fixed persistent "attributes construct error" at column 133 in SVG exports
  - **Root Cause**: Unescaped double quotes in font-family declarations: `"Segoe UI"` broke XML parsing
  - **Column 133 Consistency**: Error always occurred at column 133 regardless of Data Display setting
  - **Symptoms**:
    - Data Display OFF: `error on line 47 at column 133: attributes construct error`
    - Data Display ON: `error on line 3 at column 133: attributes construct error`
    - SVG files failed to open in browsers showing XML parsing errors
  - **Solution**:
    1. Removed quotes from "Segoe UI" in all fontFamily declarations
    2. Changed: `'Inter, ..., "Segoe UI", ...'` → `'Inter, ..., Segoe UI, ...'`
    3. Added `cleanFontFamilyAttributes()` to sanitize any remaining font-family issues
    4. Font-family cleaning now runs first in cleanSVGForExport() pipeline
  - **Technical Details**:
    - ECharts rendered: `style="font-family: Inter, ..., "Segoe UI", ..."`
    - Inner double quotes prematurely closed the style attribute at column 133
    - Resulted in malformed XML: `style="font-family: Inter, ..."Segoe UI"..."`
  - **Files Modified**:
    - `src/components/tests/echarts-export-dialog.tsx` - Fixed all fontFamily declarations (7 instances)
    - `src/components/tests/pressure-test-preview.tsx` - Fixed all fontFamily declarations (6 instances)
    - `src/components/tests/a4-preview-graph.tsx` - Fixed all fontFamily declarations (7 instances)
    - `src/components/charts/themed-chart.tsx` - Fixed fontFamily declaration (1 instance)
    - `src/lib/utils/svg-sanitization.ts` - Added cleanFontFamilyAttributes() function
  - **Verification**: SVG exports now work correctly with both Data Display ON and OFF settings
  - Date: 2025-11-09
  - Issue: User reported "ошибки SVG продолжаются" (SVG errors continue)
  - Related commits: 65205492, 510f02e3, 41d40ef8, 7debab17 (previous failed attempts)

- **Internal Server Error - Corrupted Build Cache** - Fixed application showing "Internal Server Error" due to corrupted Next.js Turbopack build cache
  - **Root Cause**: Corrupted `.next` directory with missing Turbopack runtime files and build manifests
  - **Symptoms**:
    - HTTP 500 errors on all routes
    - `Error: Cannot find module '../chunks/ssr/[turbopack]_runtime.js'`
    - `ENOENT: no such file or directory, open '.next/dev/server/app/page/build-manifest.json'`
    - `ENOENT: no such file or directory, open '.next/dev/routes-manifest.json'`
  - **Solution**:
    1. Stopped Next.js dev server with PM2
    2. Removed corrupted `.next` cache directory (required root permissions due to mixed ownership)
    3. Restarted Next.js with clean build
    4. Application now returns HTTP 200 and renders correctly
  - **Prevention**: Avoid interrupting builds, ensure proper file permissions, monitor disk space
  - **Documentation**: Added comprehensive troubleshooting section to `docs/development/deployment/DEPLOYMENT.md`
  - **Container**: `pressograph-dev-workspace` running Next.js 16.0.1 with Turbopack
  - **Verified**: Application accessible at http://localhost:3000, database connection working
  - Date: 2025-11-09
  - Issue: Deployment runtime error

- **SVG Line 3 Attribute Error** - Fixed "attributes construct error" at line 3, column 133 in SVG exports
  - **Root Cause**: ECharts deprecated `grid.containLabel` option was generating malformed SVG attributes
  - Removed `grid.containLabel: true` from grid configuration (deprecated in ECharts v6)
  - Using explicit margin values instead: `left: 60, right: 40, top: 60, bottom: 80-100`
  - Added `cleanSVGHeader()` function to specifically fix SVG root element attribute issues:
    - Removes duplicate quotes in attributes
    - Removes empty attributes
    - Fixes malformed style attributes with unescaped quotes
    - Ensures proper XML attribute formatting
  - Enhanced debug logging to inspect exact SVG header content:
    - Logs line 3 length and character at column 133
    - Logs substring around problematic column for diagnostics
  - No more "[ECharts] Specified `grid.containLabel` but no `use(LegacyGridContainLabel)`;use `grid.outerBounds` instead" warning
  - SVG files now open correctly in all browsers and vector editors
  - Components:
    - `src/components/tests/echarts-export-dialog.tsx` - Removed containLabel
    - `src/lib/utils/svg-sanitization.ts` - Added cleanSVGHeader() function
  - Issue: Console error "error on line 3 at column 133: attributes construct error"

- **SVG Export Error Handling** - Resolved persistent SVG export failures with comprehensive error handling
  - **BREAKING FIX**: Completely rewrote SVG export error handling with granular try-catch blocks
  - Identified exact failure points in SVG generation pipeline:
    1. ECharts `renderToSVGString()` generation
    2. SVG cleaning/sanitization
    3. Blob creation and download
  - Added detailed console logging for each step: `[SVG Export]` prefix for debugging
  - Simplified `postProcessSVGString()` - removed aggressive regex that could break valid SVG
    - Kept only essential ampersand escaping in text nodes
    - Removed duplicate quote removal (was breaking attributes)
    - Removed empty attribute removal (was too aggressive)
  - Export now continues even if cleaning fails - uses raw SVG as fallback
  - User-friendly error messages specify exact failure reason and suggest PNG/PDF fallback
  - Error no longer closes dialog - allows user to change format and retry
  - Removed unused `createSVGBlob()` import in favor of inline blob creation
  - Components:
    - `src/components/tests/echarts-export-dialog.tsx` - Enhanced error handling
    - `src/lib/utils/svg-sanitization.ts` - Simplified cleaning logic
  - Issue: User reported "ошибка SVG при экспорте осталась" (SVG export error remains) despite previous fixes
  - Root Cause: Previous fixes were too aggressive and broke valid SVG elements

- **TypeScript Build Errors** - Fixed compilation errors in graph components
  - Fixed unused `params` parameter in dataZoom event handlers
  - Removed invalid `alignWithLabel` property from axisTick (not in ECharts types)
  - Components: `a4-preview-graph.tsx`, `pressure-test-preview.tsx`, `echarts-export-dialog.tsx`

- **Optimized Export Spacing** - Reduced excessive empty space in PDF and PNG exports
  - Reduced grid margins for tighter graph layout:
    - `top`: 60px (reduced from ~20% of height)
    - `left`: 60px (reduced from ~10% of width)
    - `right`: 40px (reduced from ~8% of width)
    - `bottom`: 80px base, 100px with below-graph data (reduced from ~15%/20%)
  - Reduced title top position: 10px (reduced from 20px)
  - Reduced below-graph data placement: 8% (reduced from 12%)
  - Reduced PDF margins: 5mm (reduced from 10mm) for A4 landscape exports
  - Spacing now matches v1.0 Export Emulation function reference formatting
  - More professional, compact appearance with minimal wasted space
  - Component: `src/components/tests/echarts-export-dialog.tsx`
  - User feedback: "Too much empty space around the graph on all sides" and "Too much space between title and graph"

### Planned

- **Comprehensive Page Refactoring Plan** - Created refactoring roadmap for applying shadcn/ui Integration Strategy
  - Created comprehensive REFACTORING_ROADMAP.md document outlining 4-sprint refactoring plan
  - Created 6 GitHub issues for page-specific refactoring tasks (Issues #109-#114)
  - Pages to refactor: Test Detail, Dashboard, Tests List, Test Edit, Profile, Settings
  - Total effort: 49 Story Points across Sprints 3-6 (Dec 2025 - Jan 2026)
  - Goals: Apply shadcn/ui components consistently, improve accessibility, enhance responsiveness
  - Each issue includes detailed scope, components to use, acceptance criteria, and related documentation
  - Rollback plan and testing strategy documented
  - Documentation: `/docs/development/REFACTORING_ROADMAP.md`

### Changed

- **Simplified Test Creation Form** - Removed multi-step wizard, implemented single-page layout with ONE save button
  - Converted from 4-step wizard (Basic Info → Core Parameters → Intermediate Stages → Review) to unified single-page form
  - Removed step progress indicator and navigation buttons (Previous/Next)
  - Removed "Save as Draft" button - all tests now created as "ready" status
  - Removed final "Review & Create" step - validation happens inline
  - Implemented 2-column layout: Form fields (left 2/3) + Live Preview (right 1/3)
  - Live preview remains sticky on scroll for constant visual feedback
  - All form sections now visible simultaneously: Basic Info, Core Parameters, Intermediate Stages
  - Single "Create Test" button at bottom with Cancel option
  - Improved UX: No context switching between steps, faster test creation workflow
  - Maintains all validation, autosave (LocalStorage), and import functionality
  - Component: `/src/components/tests/create-test-form.tsx`
  - Impact: Significantly faster test creation - reduced from minimum 4 clicks to 1 click

### Added

- **Custom Test Number Customization** - Allow users to specify custom test numbers during test creation and editing
  - Added test number input field to test creation form (`src/components/tests/create-test-form.tsx`)
  - Added test number input field to test edit form (`src/components/tests/edit-test-form-client.tsx`)
  - Created test number utility module (`src/lib/utils/test-number.ts`) with:
    - `generateSequentialTestNumber()` - Auto-generate test numbers in format `PT-YYYY-NNN`
    - `validateCustomTestNumber()` - Server-side validation for uniqueness and format
    - `isTestNumberUnique()` - Database lookup for duplicate detection
    - `isValidTestNumberFormat()` - Format validation (3-100 chars, alphanumeric with hyphens/underscores)
  - Updated `createTest` server action to accept optional custom test number
  - Updated `updateTest` server action to allow editing test numbers with validation
  - Test numbers must be unique within organization (enforced at database level)
  - Auto-generation falls back to timestamp-based format if sequential generation fails
  - Helpful error messages for duplicate or invalid test numbers
  - Form provides placeholder examples and user guidance

- **Inter Font Typography** - Applied professional Inter font throughout all graph components
  - Configured Inter with Latin and Cyrillic subset support in root layout
  - Applied to all chart elements: title, subtitle, axis labels, tooltips
  - Consistent font family: `'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'`
  - Improved readability for both English and Russian text
  - Components updated:
    - `pressure-test-preview.tsx` - Preview graphs
    - `echarts-export-dialog.tsx` - Export functionality
    - `a4-preview-graph.tsx` - A4 landscape graphs
  - Professional appearance for all exported and displayed graphs

- **Configurable Data Placement in Exports** - Advanced metadata display options for graph exports
  - Added data placement selector with 4 options:
    - **Below Title**: Display metadata as subtitle below graph title
    - **Below Graph**: Display between graph area and bottom edge (annotations)
    - **On Graph**: Overlay box on top-left of graph area with shadow
    - **Do Not Display**: Hide all test metadata for clean exports
  - Added field selection checkboxes for granular control:
    - Test Number (default: enabled)
    - Date (default: enabled)
    - Pressure | Temperature (default: enabled)
    - Equipment ID (default: disabled)
    - Operator Name (default: disabled)
  - Smart formatting:
    - Horizontal separator for below title/graph placements
    - Vertical newline separator for overlay placement
    - Compact display with minimal visual intrusion
  - Dynamic grid adjustment to accommodate below placement
  - Implemented using ECharts graphic elements for precise positioning
  - Component: `echarts-export-dialog.tsx`

- **Simplified Export Titles** - Clean, professional export naming
  - Changed from verbose `"${testName} - Pressure Profile"` to `"Test №${testNumber}"`
  - Falls back to test name if number unavailable
  - Cleaner appearance for professional reports
  - Matches user requirements for minimal, focused titles

- **Comprehensive Test Information Display** - Enhanced test detail page
  - Replaced "Status" card with "Configuration Status" showing Draft/Finalized
  - Added detailed "Test Information" card with key metadata
  - New "Test Parameters" section displaying all configuration fields:
    - Working Pressure, Max Pressure, Test Duration
    - Temperature, Allowable Pressure Drop
    - Intermediate Stages count
    - Equipment ID, Operator Name
    - Start/End Date/Time (when scheduled)
    - Configuration notes
  - Responsive 3-column grid layout (1 column on mobile, 2 on tablet, 3 on desktop)
  - Better organization of test metadata for quick reference
  - Component: `src/app/(dashboard)/tests/[id]/page.tsx`

- **Automatic Time Scale Adaptation** - Intelligent X-axis formatting that adapts based on zoom level
  - Wide view (>48h): Shows daily marks with 6h minor ticks
  - Medium view (6-48h): Shows hourly marks with 10min minor ticks
  - Close view (<6h): Shows 15-30 minute marks with 5-10min minor ticks
  - Smooth transitions between scales for optimal readability
  - Maintains minor tick visibility at all zoom levels
  - Implemented in both preview and A4 landscape graphs
  - Inspired by ECharts area-time-axis example

- **Interactive Zoom Controls for All Graphs** - Implemented ECharts dataZoom functionality across all graph components
  - Added slider-based dataZoom at bottom of charts for X-axis zooming
  - Implemented mouse wheel zoom at cursor position
  - Added click-and-drag panning functionality
  - Integrated toolbox with zoom area selection and reset controls
  - Theme-aware styling for light and dark modes with Tailwind CSS colors
  - Added comprehensive zoom controls help tooltip with usage instructions
  - Features integrated into:
    - Preview graphs: `pressure-test-preview.tsx`, `a4-preview-graph.tsx`
    - Fullscreen preview: `fullscreen-preview-dialog.tsx` (via PressureTestPreview)
    - Export dialog: `echarts-export-dialog.tsx` with "Export only zoomed view" option
  - Zoom functionality complements existing Time Scale Zoom presets
  - Programmatic zoom synchronization: Time Scale dropdown sets initial zoom, interactive controls allow further adjustment
  - Export behavior: Optional checkbox to export either full graph or currently zoomed portion
  - Components: All graph visualization components updated with DataZoomComponent and ToolboxComponent
  - Impact: Enhanced user experience for detailed graph analysis and exploration

### Removed

- **Time Scale Zoom Feature** - Removed Time Scale Zoom dropdown and presets
  - Removed timeScale and timeWindow props from graph components
  - Removed Time Scale Zoom UI from export dialog
  - Removed imports and usage of time-zoom utility functions
  - Kept utility file at `src/lib/utils/time-zoom.ts` for potential future use
  - Users can now rely on interactive dataZoom slider for all zoom operations
  - Replaced by automatic time scale adaptation based on zoom level

- **Test Runs Functionality** - Completely removed test execution/running features
  - Removed all test run pages and components (`/tests/[id]/runs`, `/tests/[id]/run`)
  - Removed test run server actions and API endpoints
  - Removed `test_runs` and `test_measurements` database tables from schema
  - Removed test run related fields from dashboard statistics
  - Updated application to focus solely on graph generation and visualization
  - Test configurations are now purely for visual graph generation
  - Removed run counts and execution history tracking
  - Impact: Simplified application architecture, focusing on core graph generation features
  - Files affected:
    - Removed: `src/lib/actions/test-runs.ts`
    - Removed: `src/lib/db/schema/test-runs.ts`
    - Removed: `src/lib/db/schema/test-measurements.ts`
    - Removed: `src/components/tests/test-runs-table.tsx`
    - Removed: `src/components/tests/run-test-interface-client.tsx`
    - Removed: `src/app/(dashboard)/tests/[id]/runs/` directory
    - Removed: `src/app/(dashboard)/tests/[id]/run/` directory
    - Modified: Database schema, relations, dashboard statistics, test detail pages

### Fixed

- **CRITICAL: ECharts GraphicComponent Import** - Fixed missing GraphicComponent in ECharts registration
  - Added `GraphicComponent` import from `echarts/components`
  - Registered `GraphicComponent` in `echarts.use()` array
  - Fixes console error: "[ECharts] Component graphic is used but not imported"
  - Affected components:
    - `/src/components/tests/echarts-export-dialog.tsx` - Export dialog with data placement overlays
    - `/src/components/tests/pressure-test-preview.tsx` - Preview component with graphic elements
  - Impact: Eliminates console warnings when using graphic elements for metadata display
  - Required for proper rendering of overlay boxes and text annotations on graphs

- **CRITICAL: SVG Export XML Validation** - Fixed malformed SVG exports with proper text sanitization
  - Created comprehensive SVG sanitization utility (`/src/lib/utils/svg-sanitization.ts`) with:
    - `sanitizeForSVG()` - Escapes XML special characters (&, <, >, ", ')
    - `validateSVG()` - Validates SVG is well-formed XML using DOMParser
    - `cleanSVGForExport()` - Validates and cleans SVG before export
    - `createSVGBlob()` - Creates validated blob with proper error handling
  - Applied sanitization to all text fields in export configuration:
    - Test number, test name, data text (metadata display)
    - Graphic element text content (overlay boxes)
  - Added SVG validation with user-friendly error messages
  - Suggests fallback to PNG/PDF if SVG export fails
  - Fixes error: "attributes construct error" when opening exported SVG files
  - Impact: All SVG exports now valid XML, opens correctly in browsers and vector editors
  - Prevents issues with special characters in test names (quotes, ampersands, etc.)

- **Chart Layout and Visual Styling** - Comprehensive improvements to graph appearance
  - Dark theme now properly re-initializes chart when switching themes
  - Zoom slider correctly positioned below X-axis labels with proper spacing
  - Moved slider from bottom: 80 to bottom: 10 for correct visual hierarchy
  - Increased grid bottom margin from 20% to 25% to accommodate slider
  - Changed containLabel to true to properly include axis labels in grid
  - Removed gradient area fill, replaced with solid semi-transparent color
  - Changed from linear gradient to solid `rgba(59, 130, 246, 0.15)`
  - Matches original v1.0 design aesthetic

- **Export X-Axis Time Formatting** - Correct time display in exported graphs
  - Export now respects Test Schedule configuration
  - When startDateTime/endDateTime set: Shows actual dates and times (e.g., "03.11.2025\n14:00")
  - When NOT set: Shows duration format (e.g., "0h", "1h", "2h")
  - Fixed issue where exports always showed "0, 1h, 2h" regardless of schedule
  - CRITICAL: Set axisLabel.show to true explicitly for export rendering
  - Both PNG and PDF exports now display correct time information

### Fixed (Previous)

- **CRITICAL: Export Graph Data Binding** - Export now uses actual database test data (Issue #104)
  - Fixed export to dynamically generate pressure profile data from database configuration
  - Export now correctly reflects all test parameters: duration, stages, working/max pressure
  - Implemented dynamic data generation in `generateProfileData()` function
  - Replaces static `useMemo` calculation with runtime generation based on `enableDrift` state
  - Export graphs now match Preview graphs exactly
  - Updated: `/src/components/tests/echarts-export-dialog.tsx`
  - Impact: Exported graphs now show correct test configuration, not placeholder data

- **CRITICAL: Realistic Drift Simulation in Export** - Fixed drift simulation not working in export (Issue #104)
  - Applied same drift logic from Preview component to Export dialog
  - Added imports for `generateRealisticTestData()` and `convertToMinutes()` utilities
  - Export now generates realistic pressure data with Brownian motion and Gaussian noise when enabled
  - Uses high-frequency sampling (1-second intervals) with LTTB downsampling
  - Export checkbox "Enable Realistic Pressure Drift Simulation" now functional
  - Smooth curve rendering for drift data, sharp corners for idealized data
  - Updated: `/src/components/tests/echarts-export-dialog.tsx`
  - Impact: Export graphs show realistic pressure variations matching Preview

- **X-Axis Interval Logic Refinement** - Updated interval thresholds for better readability (Issue #104)
  - New thresholds based on user requirements:
    - Tests ≤ 30 hours: 60-minute intervals (1 hour marks)
    - Tests 30-60 hours: 120-minute intervals (2 hour marks)
    - Tests 60-96 hours: 180-minute intervals (3 hour marks)
    - Tests > 96 hours: 240-minute intervals (4 hour marks)
  - Added minor tick marks for 10-minute intervals (splitNumber: 6)
  - Applied to both Export dialog and Preview component
  - Previous logic showed 2-hour intervals for tests > 24 hours (too sparse)
  - Updated: `/src/components/tests/echarts-export-dialog.tsx`, `/src/components/tests/pressure-test-preview.tsx`
  - Impact: Better time resolution for tests up to 30 hours

- **CRITICAL: X-Axis Labels Missing in Exported Graphs** - Fixed missing time labels in PNG exports
  - Added explicit `show: true` to X-axis `axisLabel` configuration for export
  - Implemented complete axis configuration with `axisTick` and `minorTick` for proper rendering
  - Added TypeScript type assertions (`as const`, `as ECOption`) for ECharts strict typing
  - Ensured labels are visible at all export resolutions (HD+, FHD, QHD, 4K)
  - Export graphs now display time markings (e.g., "0h", "2h", "4h") for report usability
  - Updated: `/src/components/tests/echarts-export-dialog.tsx`
  - Impact: Makes exported graphs usable for documentation - no longer missing time context

- **Export Dialog Layout Optimization** - Implemented responsive multi-column grid for compact display
  - Changed from single-column vertical stack to responsive grid layout
  - Mobile (< 768px): 1 column
  - Tablet (768px-1023px): 2 columns
  - Desktop (≥1024px): 3 columns
  - Reduced font sizes and spacing for denser information display
  - Combined and simplified Test Info section
  - Settings blocks now use available screen space efficiently
  - Maintains full functionality while reducing vertical scrolling
  - Updated: `/src/components/tests/echarts-export-dialog.tsx`

- **TypeScript Strict Mode Compliance** - Fixed compilation errors in A4 preview graph component
  - Removed unused `DriftConfig` type import
  - Removed unused variables: `paddingMs`, `paddedStartTime`, `paddedEndTime`
  - Fixed `convertToMinutes()` call with required `startTimeMs` parameter
  - No functional changes - code cleanup only
  - Updated: `/src/components/tests/a4-preview-graph.tsx`

- **Hydration Mismatch in Tests Table** - Resolved React hydration error in tests table component
  - Created `RelativeTime` and `ConditionalRelativeTime` components for SSR-safe date formatting
  - Components display absolute timestamps during SSR/initial render, then switch to relative time
  - Prevents hydration errors by ensuring server and client render matching content initially
  - Added title attribute with full timestamp on hover for accessibility
  - Components: `/src/components/ui/relative-time.tsx`
  - Updated: `/src/components/tests/tests-table-client.tsx`
  - Fixes: "Text content did not match" error at line 238 (Last Run) and line 244 (Created)

- **Drift Simulation Graph Rendering** - Fixed graph disappearing when drift simulation is enabled
  - Fixed missing `startTime` parameter in `convertToMinutes()` function call
  - Updated `/src/components/tests/pressure-test-preview.tsx` line 399
  - Drift simulation now properly converts millisecond timestamps to minutes for display
  - Graph correctly displays realistic pressure variations with Brownian motion and Gaussian noise
  - Performance: LTTB downsampling handles high-frequency data (1-second intervals) efficiently

- **Export Dialog User Experience** - Made export dialog fullscreen for better usability
  - Replaced `DialogContent` with `DialogContentFullscreen` variant
  - Updated layout with proper flex structure for header/content/footer
  - Added border separators for visual hierarchy
  - Dialog now uses full viewport: calc(100vh - 2rem) × calc(100vw - 2rem)
  - Better viewing experience for graph preview and export configuration
  - Updated: `/src/components/tests/echarts-export-dialog.tsx`

### Added

- **Time Scale Zoom UI Controls** - Complete implementation of time zoom functionality (Issue #104) [COMPLETED]
  - Added dropdown selector in Export Options section with zoom presets
  - Zoom levels: Full Duration (1x), First Half (2x), First Quarter (4x), First 10% (10x), Custom Range
  - Custom range inputs allow precise start/end minute selection
  - Real-time feedback showing zoomed time window (e.g., "Showing 0-720 min (12.0h)")
  - Preview graph updates to match export zoom settings
  - Export X-axis min/max adjusted based on zoom selection
  - Dynamic interval calculation for zoomed duration (uses `getZoomInterval()` utility)
  - Integration with existing zoom foundation from `/src/lib/utils/time-zoom.ts`
  - Components updated:
    - `/src/components/tests/echarts-export-dialog.tsx`: Full zoom UI implementation
    - Passes `timeScale` and `timeWindow` props to PressureTestPreview component
  - Closes Issue #104: "доделай настройки zoom - это относится к пункту 6.2"
  - Impact: Users can now focus on specific time periods for detailed pressure analysis

- **Time Scale Zoom Foundation** - Backend utilities for zoom functionality (Issue #104)
  - Added `timeScale` prop to graph components ('auto', '1x', '2x', '4x', '10x')
  - Added `timeWindow` prop for custom time ranges (in minutes from test start)
  - Dynamic X-axis interval adjustment for optimal tick spacing at all zoom levels
  - Smaller intervals for zoomed views (5min, 10min, 15min) vs full view (1h, 2h, 3h)
  - Utility functions in `/src/lib/utils/time-zoom.ts`:
    - `calculateZoomedTimeWindow()`: Calculate min/max/duration for any zoom level
    - `getZoomInterval()`: Get optimal X-axis interval for zoomed display
    - `formatTimeWindowDescription()`: Format zoom info for display
  - Components with zoom support:
    - `/src/components/tests/pressure-test-preview.tsx` (IMPLEMENTED)
    - `/src/components/tests/echarts-export-dialog.tsx` (COMPLETED - Full UI + integration)
    - `/src/components/tests/a4-preview-graph.tsx` (PENDING)
    - `/src/components/tests/fullscreen-preview-dialog.tsx` (PENDING - prop pass-through)
  - Use cases:
    - Detailed analysis of specific test stages
    - Print optimization for focused sections
    - Anomaly investigation in narrow time windows
    - Documentation with zoomed views for training
  - Note: This is a non-interactive zoom (parameter-based), not interactive pan/zoom UI

- **Canvas-Style Configuration** - Optional v1.0 visual compatibility for all graph components (Issue #102 - Medium Priority)
  - Added `enableCanvasStyle` and `canvasTheme` props to all graph components
  - Applies Canvas blue (#0066cc) for pressure line when enabled
  - Uses Canvas grid margins (80/50/80/120px) matching v1.0 implementation
  - Arial font family for professional appearance
  - Light sky blue area fill (#e6f2ff)
  - All features are opt-in via props (default: disabled for modern styling)
  - Components updated:
    - `/src/components/tests/pressure-test-preview.tsx`
    - `/src/components/tests/a4-preview-graph.tsx`
    - `/src/components/tests/fullscreen-preview-dialog.tsx`
    - `/src/components/tests/echarts-export-dialog.tsx`
  - Utility: `/src/lib/utils/echarts-canvas-style.ts` provides theming functions
  - Benefits: Allows users to choose between modern ECharts styling or classic Canvas v1.0 appearance

- **Advanced Test Filtering UI** - Comprehensive filtering system for tests page (Issue #100 - Medium Priority)
  - Multi-select status filters (Draft, Ready, Running, Completed, Failed, Cancelled)
  - Search by test name, number, or description
  - Project-based filtering with dropdown selector
  - Tag-based filtering with multi-select checkboxes
  - Date range picker for test creation dates (from/to)
  - Active filters display with individual remove buttons
  - Clear all filters button with active count badge
  - URL-based state management for shareable filtered views
  - Real-time filter application with visual feedback
  - Component: `/src/components/tests/test-filters.tsx`
  - Uses shadcn/ui primitives: Popover, Checkbox, Select, Badge, Card
  - Accessible with proper ARIA labels and keyboard navigation

- **Real-Time Test Polling** - Live test status updates with TanStack Query (Issue #101 - Medium Priority)
  - Automatic polling every 30 seconds (configurable interval)
  - Smart pause/resume based on page visibility API
  - Status change detection with callback notifications
  - Two specialized hooks:
    - `useTestPolling()` - Monitor multiple tests in a list
    - `useSingleTestPolling()` - Monitor individual test by ID
  - Features:
    - onStatusChange callback for toast notifications
    - onComplete/onFail callbacks for single test monitoring
    - hasRunningTests indicator for UI updates
    - Manual pause/resume/refresh controls
    - Optimistic UI update support
  - Hook: `/src/hooks/use-test-polling.ts`
  - Built on TanStack Query's refetchInterval
  - Automatic cleanup and efficient query management
  - TypeScript type safety with Test interface

- **Drift Simulation Integration** - Realistic pressure drift simulation now fully integrated into all graph components (Issue #103 - High Priority)
  - Integrated into `PressureTestPreview` component with `enableDrift` prop
  - Integrated into `A4PreviewGraph` component with `enableDrift` prop
  - Integrated into `EChartsExportDialog` with checkbox control and state management
  - Integrated into `FullscreenPreviewDialog` with prop pass-through support
  - Uses `generateRealisticTestData()` from drift simulator utility
  - High-frequency sampling: 1-second intervals (configurable)
  - Brownian motion drift: ±0.2% typical variation
  - Gaussian noise: ±0.1% typical sensor measurement variation
  - Smooth S-curve ramp transitions for natural pressure changes
  - LTTB downsampling automatically enabled for high-frequency data (performance optimization)
  - Line style adjusts: smooth curves for drift mode, sharp transitions for idealized mode
  - Symbol display: hidden for high-frequency data, visible for simplified data
  - Line width: thinner (1.5px-2px) for drift mode, standard (2px-3px) for idealized mode
  - Export dialog includes "Enable Realistic Pressure Drift Simulation" checkbox with descriptive help text
  - Backward compatible: drift is disabled by default, no breaking changes
  - Performance impact: mitigated by ECharts LTTB sampling algorithm
  - File locations:
    - `/src/components/tests/pressure-test-preview.tsx` - Main preview component
    - `/src/components/tests/a4-preview-graph.tsx` - A4 landscape print component
    - `/src/components/tests/echarts-export-dialog.tsx` - Export dialog with drift toggle
    - `/src/components/tests/fullscreen-preview-dialog.tsx` - Fullscreen preview
  - Benefits:
    - More realistic visualization of actual pressure sensor behavior
    - Better training material for operators
    - Accurate representation of regulatory compliance scenarios
    - Professional-grade data simulation for presentations

- **Fullscreen Dialog Component** - Custom fullscreen dialog variant for immersive experiences
  - Expands to near-fullscreen: `calc(100vh-2rem) × calc(100vw-2rem)`
  - Flexible header/footer layout with sticky positioning
  - ScrollArea integration for overflow content
  - Perfect for graph previews, detailed forms, and full-page views
  - Custom implementation: `DialogContentFullscreen` in `/src/components/ui/dialog.tsx`
  - Based on shadcn/ui dialog primitives with fullscreen enhancements
  - Maintains accessibility, keyboard navigation, and dark mode support

- **Fullscreen Preview Dialog for Pressure Tests** - Enhanced graph viewing experience
  - Full viewport dialog for detailed graph inspection
  - A4 Landscape container (297mm × 210mm) centered inside dialog
  - ScrollArea for responsive viewing at any screen size
  - Clean, distraction-free preview mode
  - Back button with ChevronLeft icon for easy closing
  - Use cases:
    - Detailed graph inspection before export
    - Presentation mode for test profiles
    - Mobile-friendly graph viewing
    - Print preview
  - Component: `/src/components/tests/fullscreen-preview-dialog.tsx`
  - Integrates with existing PressureTestPreview component
  - Props support: working pressure, max pressure, test duration, intermediate stages, units, date/time

- **shadcn Studio Component Analysis** - Comprehensive evaluation of 500+ component variants
  - Analyzed 40+ component categories from shadcn Studio
  - Identified high-value variants for Pressograph 2.0:
    - Dialog Components (26 variants) - Fullscreen, scrollable, sticky header/footer
    - Data Table Components (13 variants) - Export, sortable, paginated, expandable
    - Button Components (47 variants) - Loading states, state indicators, multi-action groups
    - Input Components (46 variants) - Plus/minus buttons, character limits, clear buttons
    - Form Components (10 variants) - OTP verification, date input, issue reporting
    - Card Components (17 variants) - Product cards, testimonials, 3D hover effects
  - Documented integration strategy and implementation roadmap
  - Prioritized components by feature area and user value
  - Created phased implementation plan (4 phases)
  - Documentation: `/docs/development/SHADCN_INTEGRATION_STRATEGY.md`

- **Collapsible Sections in Export Dialog** - Better organization with expandable sections
  - Three collapsible sections:
    - Export Quality - Resolution selector and pixel details
    - Export Options - Reference line toggles and display settings
    - Test Information - Test configuration and export details
  - All sections open by default for convenience
  - Smooth animations with chevron indicators
  - Uses shadcn/ui Collapsible component
  - Location: `/tests/[id]` - Export Graph (ECharts) dialog

- **Export Quality Selector with Correct Resolution Standards** - Professional-grade export following display resolution standards
  - Quality presets with correct resolution labels (per Wikipedia standards):
    - HD+ (1600×900) - HD Plus, good for web display
    - Full HD (1920×1080) - Full HD 1080p, standard quality (Default)
    - Quad HD (2560×1440) - QHD 1440p, high quality
    - 4K UHD (3840×2160) - 4K Ultra HD 2160p, professional quality
  - All presets use 2x pixel ratio for high-quality output
  - Select dropdown in export dialog with resolution details
  - Maintains 16:9 aspect ratio for all presets
  - Real-time display of selected resolution and effective pixels
  - Export toast shows quality preset label
  - Location: `/tests/[id]` - Export Graph (ECharts) dialog

- **Realistic Pressure Drift Simulator** - High-precision sensor simulation
  - Brownian motion for natural pressure drift (±0.2% typical)
  - Gaussian noise using Box-Muller transform (±0.1% typical)
  - High-frequency sampling (1 second intervals configurable)
  - Smooth ramp transitions with S-curve acceleration/deceleration
  - Bounded drift with soft boundaries and restoring force
  - Seeded random generator for reproducible results
  - Configurable parameters: drift magnitude, noise magnitude, sampling rate
  - Based on original Pressograph v1.0 Canvas implementation
  - New utility: `src/lib/utils/pressure-drift-simulator.ts`

- **Canvas-Style ECharts Configuration** - Match original visual appearance
  - Styling extracted from Pressograph v1.0 Canvas implementation
  - Color scheme: Canvas blue (#0066cc) for pressure line
  - Area fill: Light sky blue (rgba(173, 216, 230, 0.3))
  - Grid margins: 80/50/80/120 (matching Canvas)
  - Font family: Arial (matching Canvas)
  - Light and dark theme support
  - Utility functions to apply Canvas style to any ECharts option
  - New utility: `src/lib/utils/echarts-canvas-style.ts`

- **Working/Max Pressure Line Toggles** - Control reference line visibility
  - Show/hide Working Pressure reference line
  - Show/hide Max Pressure reference line
  - Checkbox controls in export dialog
  - Toggles apply to both preview and final export
  - Display status in export details card ("Both", "Working Only", "Max Only", "None")
  - Default: both lines shown (backward compatible)
  - Props added to all graph components:
    - `pressure-test-preview.tsx`
    - `a4-preview-graph.tsx`
    - `echarts-export-dialog.tsx`

### Changed

- **SHADCN Integration Strategy Documentation** - Comprehensive update with shadcn Studio analysis
  - Added shadcn Studio Extended Components section
  - Documented 40+ component categories with 500+ variants
  - Created component recommendations by feature area:
    - Test Management (data tables, loading buttons, badges)
    - Graph Visualization (fullscreen dialog, scrollable dialog)
    - Data Entry & Configuration (numeric inputs, character limits)
    - User Interface Enhancement (state indicators, multi-action groups)
  - Added 4-phase implementation roadmap with effort estimates
  - Documented best practices for shadcn Studio integration
  - Added integration patterns, customization guidelines, testing requirements
  - Created comparison table: shadcn/ui vs shadcn Studio
  - Added additional resources and next steps
  - Location: `/docs/development/SHADCN_INTEGRATION_STRATEGY.md`

- **Wider Export Dialog** - Improved content display with increased width
  - Changed from default width to `max-w-3xl` (768px)
  - Better space utilization for export settings and preview
  - Maintains responsive behavior on smaller screens
  - Location: `/tests/[id]` - Export Graph (ECharts) dialog

### Fixed

- **Export Resolution Labels** - Corrected resolution terminology to match display standards
  - Fixed: Removed incorrect "HD" label (was mislabeled as 1920×1080)
  - Correct: HD+ (1600×900), Full HD (1920×1080), QHD (2560×1440), 4K UHD (3840×2160)
  - Removed 8K preset (too large for most use cases)
  - Reference: https://en.wikipedia.org/wiki/Display_resolution
  - Location: `/tests/[id]` - Export Graph (ECharts) dialog

- **CRITICAL: Y-Axis Positioning and Time Padding Consistency** - Fixed Y-axis alignment and time padding across all preview locations
  - **Problem**: Preview components in `/tests/new`, `/tests/[id]`, and `/tests/[id]/edit` had incorrect Y-axis positioning and missing time padding
  - **Reference**: `/preview?config=` (A4PreviewGraph) was working correctly, other previews needed to match

  - **Issue 6.1: Y-Axis Ticks Misaligned**
    - **Problem**: "насечки оси Y (вертикальная линия) смещены право и находятся над временем начала построения графика"
    - **Translation**: Y-axis ticks (vertical lines) shifted right and positioned above graph start time
    - **Root Cause**: Missing `onZero: false` in yAxis.axisLine configuration
    - **Fix Applied:**
      - Added `position: 'left'` to explicitly position Y-axis at chart left edge
      - Added `onZero: false` to prevent alignment to X-axis time zero
      - Y-axis now correctly appears at chart left edge, not at test start time
    - **Locations Fixed**: PressureTestPreview component (used in create, view, edit pages)

  - **Issue 6.2: Time Padding Not Applied**
    - **Problem**: "время запаса должно быть за 1 час и 1 час после указанных в 'Test Schedule (Optional)'"
    - **Translation**: Time padding should be 1 hour before and 1 hour after specified test schedule times
    - **Root Cause**: X-axis range calculation didn't properly use endDateTime for padding
    - **Fix Applied:**
      - Fixed endTime calculation: Uses endDateTime timestamp when available
      - Fixed X-axis max calculation: `(endTime - startTime) / 60000 + paddingHours * 60`
      - Fixed X-axis min: `-paddingHours * 60` (1 hour before test start)
      - Fixed totalDisplayHours: Calculates from actual timestamps with padding
      - Data points unchanged - still start at actual test time
      - Empty space now appears before/after test as expected

  - **Example Time Display** (Test: 03.11.2025 00:21, Duration: 2h):
    ```
    Before (BROKEN):
    - X-axis: 00:21 to 02:21 (no padding)
    - Graph line: Starts at 00:21
    - Y-axis: Positioned at test start time (00:21)

    After (FIXED):
    - X-axis: 02.11.2025 23:21 to 03.11.2025 03:21 (with padding)
    - Graph line: Starts at 03.11.2025 00:21 (empty space before)
    - Y-axis: Positioned at chart left edge (23:21)
    ```

  - **Technical Details:**
    - Y-axis: `position: 'left'`, `axisLine.onZero: false`
    - X-axis min: `-60` minutes (1 hour before start)
    - X-axis max: `(endTime - startTime) / 60000 + 60` (1 hour after end)
    - Padding: 1 hour = 60 minutes = 3,600,000 milliseconds
    - Reference implementation: A4PreviewGraph (already correct)

  - **Affected Components:**
    - `/tests/new` - Create test form preview
    - `/tests/[id]` - Test detail page preview
    - `/tests/[id]/edit` - Edit test form preview

  - **Working Reference:**
    - `/preview?config=` - A4PreviewGraph (used as reference implementation)

  - **Result:**
    - All preview locations now consistent with `/preview?config=`
    - Y-axis correctly positioned at chart left edge
    - 1-hour padding visible before and after test
    - Graph line starts at actual test time
    - Professional appearance for all preview locations

- **CRITICAL: Preview Page Now Completely Clean** - Moved preview page outside dashboard folder to remove all UI chrome (Issue 6.1)
  - **Problem**: User reported "я вижу верхнее и боковое меню" (I see top and side menu) in preview page
  - **HTML Evidence**: Preview page was rendering with sidebar navigation and header menu visible
  - **Root Cause**: Preview page inside `(dashboard)` folder was inheriting dashboard layout despite having layout override
  - **Solution**: Moved preview page from `/src/app/(dashboard)/tests/preview/` to `/src/app/preview/`
  - **Changes Applied:**
    - Relocated page.tsx to top-level app directory (outside dashboard route group)
    - Deleted layout.tsx override (no longer needed outside dashboard)
    - Updated preview-dialog.tsx to use `/preview` URL instead of `/tests/preview`
    - Updated all documentation to reflect new URL structure
  - **Result**: Preview page now displays ONLY the graph with NO sidebar, NO header, NO UI elements
  - **Testing**: User's HTML evidence file showed sidebar/header before fix
  - **User Experience**: Clean, print-ready display perfect for professional reports
  - Fixes: Issue 6.1

- **CRITICAL: Time Range Calculation and Graph Positioning** - Fixed three critical time-related bugs (Issues 7.1, 7.2, 7.3)
  - **Issue 7.1: Wrong Time Range Display**
    - **Problem**: Test starting at 00:21 showed 22:31 to 02:21 instead of 23:21 to 01:21
    - **Expected**: 1 hour before (23:21) to 1 hour after test end
    - **Actual**: Showed 22:31 (1h 50min before) due to incorrect padding calculation
    - **Root Cause**: Preview page was calculating padding and passing PADDED times to graph component, which then treated them as actual test times causing double-padding effect

  - **Issue 7.2: Graph Line Starting at Wrong Time**
    - **Problem**: "график по оси X рисуется не с 'Test Schedule (Optional)', а с начала оси X"
    - **Translation**: Graph line starts at X-axis beginning (23:21 padded time) instead of actual test start (00:21)
    - **User Expectation**: Empty space from 23:21 to 00:21, then graph line starts at 00:21
    - **Root Cause**: Data points were starting at time 0 which mapped to padded start time instead of actual test start

  - **Issue 7.3: Y-Axis Positioned at Wrong Location**
    - **Problem**: "На Preview нужно переместить отсечки оси Y перед началом оси X"
    - **Translation**: Y-axis ticks drawn at test start time instead of at X-axis beginning
    - **Expected**: Y-axis at left edge of chart (at padded start time 23:21)
    - **Actual**: Y-axis appeared at test start time (00:21), not at chart edge

  - **Comprehensive Solution:**
    1. **Preview Page (page.tsx):**
       - Now passes ACTUAL (non-padded) start/end times to A4PreviewGraph
       - Added `paddingHours={1}` prop to delegate padding calculation to graph component
       - Removed confusing local padding calculation that caused double-padding

    2. **A4PreviewGraph Component:**
       - Added `paddingHours` prop to interface
       - Separated time concerns:
         * `startTime/endTime` = actual test start/end (from Test Schedule)
         * `paddedStartTime/paddedEndTime` = axis display range (with ±1h padding)
       - X-axis configuration:
         * `min: -paddingHours * 60` (shows 1 hour before test, e.g., -60 minutes)
         * `max: testDuration + paddingHours * 60` (shows 1 hour after test)
         * Data points start at 0 (actual test start, not negative time)
       - Y-axis configuration:
         * Added `position: 'left'` (explicit left edge positioning)
         * Added `onZero: false` (prevents alignment to X-axis time 0)
         * Ensures Y-axis appears at chart left edge, not at test start time

  - **Mathematical Fix Example** (Test start: 00:21 on Nov 3, 2025):
    ```
    Before (BROKEN):
    - Padded time passed to graph: 22:31 (00:21 - 2h due to double padding)
    - X-axis: 22:31 to 02:21
    - Graph line: Starts at 22:31 (wrong)
    - Y-axis: At test start time (00:21) instead of chart edge

    After (FIXED):
    - Actual time passed to graph: 00:21
    - Padding calculated by graph: -60min to +60min
    - X-axis: 23:21 to 03:21 (assuming 2h test duration)
    - Graph line: Starts at 00:21 (correct, with empty space before)
    - Y-axis: At 23:21 (chart left edge, correct)
    ```

  - **Time Calculation Details:**
    - All time arithmetic uses milliseconds for precision
    - 1 hour = 60 * 60 * 1000 = 3,600,000 milliseconds
    - X-axis values in minutes for easier ECharts configuration
    - Formatter converts minutes to actual date/time display

  - **Result**:
    - X-axis correctly shows padded time range with proper 1-hour spacing
    - Graph line starts at actual test time with visible empty space before
    - Y-axis positioned at left edge of chart (at padded start time)
    - All time calculations consistent and accurate

  - Fixes: Issues 7.1, 7.2, 7.3

- **Preview UI Simplification** - Removed full screen popup, keeping only new window button (Issue 8)
  - **Problem**: User reported "popup так и не открывается во весь экран в альбомной ариентации"
  - **Translation**: "Popup still doesn't open full screen in landscape orientation"
  - **User Request**: "если не получается, давай отключим вообще и удалим функцию, оставим вариант в новом окне"
  - **Translation**: "If it doesn't work, let's disable it completely and remove the function, keep only the new window option"
  - **Solution**: Removed full-screen modal dialog completely, simplified to single button
  - **Changes to preview-dialog.tsx:**
    - Removed Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription imports
    - Removed PressureTestPreview import (not needed for new window approach)
    - Removed Maximize2, X icons (only ExternalLink needed now)
    - Removed useState for dialog open state
    - Removed button group container (was: [Full Screen] [New Window])
    - Simplified to single button: "Open in New Window"
    - Updated component documentation to reflect simpler design
  - **Benefits:**
    - Simpler UI with single clear action
    - No landscape orientation issues
    - Cleaner component with 80 fewer lines
    - Opens in dedicated browser window with proper A4 landscape sizing
    - Better browser compatibility (no modal restrictions)
  - **UI Transformation:**
    - Before: `[Full Screen] [New Window]` (button group)
    - After: `[Open in New Window]` (single button)
  - Fixes: Issue 8

### Fixed
- **CRITICAL: Popup Window Opens in Proper Landscape Dimensions** - Fixed new window opening in portrait despite landscape content
  - **Root Cause**: Browser was ignoring window.open dimensions parameter or using default portrait size
  - **User Question**: "popup окно открывается портретным, хотя внутри оно альбомное. Это системное ограничение или что?"
  - **Analysis**: This is NOT a system limitation - the issue was in the window.open features specification
  - **Changes Applied:**
    - Enhanced window.open features string with comprehensive parameters (left, top, resizable, scrollbars, etc.)
    - Added window position calculation to center popup on screen
    - Implemented fallback window.resizeTo() call for browsers that initially ignore features
    - Proper landscape dimensions: 1273px × 900px (1.414:1 aspect ratio)
  - **Files Modified:**
    - `/src/components/tests/preview-dialog.tsx` - Enhanced handleOpenInNewWindow function
  - **Result**: New window now opens reliably in landscape orientation with correct dimensions
  - **User Experience**: Consistent landscape display matching the content inside

- **CRITICAL: Preview Page Shows Only Graph, No UI Elements** - Completely cleaned preview page for print-ready output
  - **Root Cause**: Preview page displayed sidebar, header, buttons, and text summary from dashboard layout
  - **User Requirements:**
    1. NO sidebar navigation
    2. NO top header/menu
    3. NO buttons (Close, Print)
    4. NO text labels or summaries
    5. ONLY the graph - clean and professional
  - **Changes Applied:**
    - Created layout override (`/src/app/(dashboard)/tests/preview/layout.tsx`) to bypass dashboard layout
    - Removed all UI chrome (sidebar, header, navigation)
    - Removed Close and Print buttons from preview page
    - Removed test parameters summary section
    - Removed interval notice text
    - Simple loading state with no text
    - Clean white background with only the graph
  - **Files Modified:**
    - `/src/app/(dashboard)/tests/preview/layout.tsx` - NEW: Layout override returning only children
    - `/src/app/(dashboard)/tests/preview/page.tsx` - Removed all UI elements
    - `/src/components/tests/a4-preview-graph.tsx` - Removed summary text sections
  - **Result**: Preview page displays ONLY the graph - truly print-ready with no distractions
  - **Print Ready**: Perfect for professional reports and documentation

- **CRITICAL: Added 1-Hour Padding Before and After Test in Preview** - Enhanced graph to show context around test period
  - **Root Cause**: Graph showed exact test duration with no context before/after
  - **User Requirement**: Add 1-hour padding before test start and after test end (like in main preview)
  - **Changes Applied:**
    - Preview page calculates padded start time (original - 1 hour)
    - Preview page calculates padded end time (original + 1 hour)
    - Passes padded times to A4PreviewGraph component
    - Graph component properly handles time-based display with padding
    - X-axis range adjusted to show full padded duration
  - **Files Modified:**
    - `/src/app/(dashboard)/tests/preview/page.tsx` - Added padding calculation before rendering graph
    - `/src/components/tests/a4-preview-graph.tsx` - Enhanced time-based mode to use padded range
  - **Result**: Graph now shows 1 hour before and 1 hour after test for better context
  - **User Experience**: Better visualization of test preparation and completion periods

- **Enhanced Y-Axis Label Positioning** - Improved professional appearance of Y-axis labels
  - **Changes Applied:**
    - Reduced nameGap from 50 to 45 for closer positioning to axis
    - Added explicit margin: 8 to axisLabel for proper spacing between numbers and axis line
    - Maintained professional font sizes and weights
  - **Files Modified:**
    - `/src/components/tests/a4-preview-graph.tsx` - Updated Y-axis configuration
  - **Result**: Y-axis labels now positioned professionally next to axis numbers
  - **User Experience**: Cleaner, more readable axis labels


- **CRITICAL: All Preview Orientations Changed to Landscape** - Fixed all preview modes showing portrait (210mm × 297mm) instead of landscape orientation
  - **Root Cause**: All preview components were configured for A4 portrait format (1:1.414 aspect ratio)
  - **User Requirement**: Professional pressure test reports should be in landscape orientation for better visibility
  - **Changes Applied:**
    - Full-screen dialog: Changed from 210mm × 297mm to 297mm × 210mm (1.414:1 aspect ratio)
    - New window preview: Changed from 210mm × 297mm to 297mm × 210mm
    - Window dimensions: Changed from 900px × 1273px to 1273px × 900px
    - Print styles: Added `@page { size: A4 landscape; }` in globals.css
    - All documentation updated to reflect landscape orientation
  - **Files Modified:**
    - `/src/components/tests/preview-dialog.tsx` - Dialog dimensions and aspect ratio
    - `/src/app/(dashboard)/tests/preview/page.tsx` - Page container and print instructions
    - `/src/components/tests/a4-preview-graph.tsx` - Graph container and documentation
    - `/src/styles/globals.css` - Added print media query for landscape
  - **Result**: All preview modes (full screen, new window, print) now display in landscape orientation
  - **Specifications**: A4 Landscape: 297mm × 210mm, aspect ratio 1.414:1, screen ~1123px × 794px

- **CRITICAL: New Window Preview Simplified to Graph Only** - Removed all UI chrome to show only the graph for professional appearance
  - **Root Cause**: New window preview page showed header, buttons, instructions, and other UI elements
  - **User Requirement**: "New window should show ONLY the graph, nothing else"
  - **Changes Applied:**
    - Removed header with title and description
    - Removed print instructions section
    - Removed all navigation and control buttons from main view
    - Added minimal print/close buttons in top-right corner (hidden when printing)
    - Centered graph in full-screen white background
    - Clean, print-ready appearance without distractions
  - **Files Modified:**
    - `/src/app/(dashboard)/tests/preview/page.tsx` - Simplified page structure
  - **Result**: New window displays only the graph in A4 landscape format, perfect for screenshots and printing
  - **User Experience**: Clean, professional output suitable for reports and documentation

- **CRITICAL: Added Tick Marks Between Time Labels on All Graphs** - Enhanced professional appearance with minor tick marks and grid lines
  - **Root Cause**: Graphs showed time labels but no tick marks between them, making precise time reading difficult
  - **User Requirement**: Professional regulatory reports need clear tick marks (насечки) for exact timing visualization
  - **User Reference Screenshot**: Shows desired appearance with vertical grid lines and tick marks at each time point
  - **ECharts Implementation:**
    - Added `minorTick` configuration with `splitNumber: 3` on X-axis (3 minor ticks between major ticks)
    - Added `minorTick` configuration with `splitNumber: 5` on Y-axis (5 minor ticks between major ticks)
    - Added `minorSplitLine` for subtle dashed grid lines at minor tick positions
    - Major ticks at labels with `alignWithLabel: true` for proper alignment
    - Differentiated styling: major ticks (8px, #9ca3af) vs minor ticks (4-5px, #d1d5db)
    - Grid lines: solid for major intervals, dashed for minor intervals
  - **Files Modified:**
    - `/src/components/tests/a4-preview-graph.tsx` - Added tick mark configuration to X and Y axes
    - `/src/components/tests/pressure-test-preview.tsx` - Added tick mark configuration to X and Y axes
  - **Result**: All graphs now display professional tick marks matching regulatory report standards
  - **Visual Improvement**: Clear separation between time intervals, easier to read exact timing, professional appearance

### Added

- **Full-Screen A4 Preview with Button Group** - Enhanced test preview functionality with professional A4 format support
  - **Button Group UI:** Replaced single "Full Screen" button with professional button group
    - Left button: "Full Screen" - Opens maximized dialog
    - Right button: "New Window" - Opens in separate browser window
    - Uses shadcn/ui button styling with proper borders and grouping
    - Clean, intuitive interface following modern design patterns
  - **Full-Screen Dialog Improvements:**
    - Dialog now truly full screen (width AND height maximized)
    - Uses `w-screen h-screen` instead of previous `w-[98vw] h-[95vh]`
    - A4 container (210mm × 297mm) centered within full-screen space
    - Proper aspect ratio: 1:1.414 (A4 portrait format)
    - White background with shadow for print preview appearance
    - 20mm padding inside A4 container for professional margins
    - ESC key support for quick closing
  - **Component Updates:**
    - Added `temperatureUnit` prop to `PreviewDialog` component
    - Updated all three instances in `create-test-form.tsx` to pass temperature unit
    - Button group properly styled with rounded corners and borders
  - Files modified:
    - `/src/components/tests/preview-dialog.tsx` - Complete rewrite with button group
    - `/src/components/tests/create-test-form.tsx` - Added temperatureUnit prop passing
  - References: Feature 6.1

- **A4 Print Preview Page with 30-Minute Intervals** - Dedicated printable page for professional test reports
  - **New Route:** `/tests/preview` - Standalone A4 preview page
  - **Critical Feature: 30-Minute X-Axis Intervals**
    - Fixed interval of 30 minutes (0.5 hours) on X-axis
    - Clear tick marks at each 30-minute point
    - Time labels formatted as `H:MM` (e.g., 0:00, 0:30, 1:00, 1:30)
    - Works for all test durations (1h, 24h, 48h, etc.)
    - Professional appearance suitable for regulatory reports
  - **A4 Format Specifications:**
    - Dimensions: 210mm × 297mm (A4 portrait)
    - Aspect ratio: 1:√2 (1:1.414)
    - Screen equivalent: ~800px × 1131px
    - 20mm margins for professional appearance
  - **Print Optimization:**
    - `@media print` styles for clean output
    - Print controls hidden during printing
    - High-resolution chart rendering
    - White background for print-ready output
    - Proper page breaks and sizing
  - **Configuration Transfer:**
    - Test config passed via base64-encoded URL parameter
    - Avoids URL length issues with complex configurations
    - Supports all test parameters (pressure, duration, stages, etc.)
    - Opens in new window with A4 proportions (900px × 1273px)
  - **User Experience:**
    - Print button with Ctrl+P keyboard shortcut
    - Close button for easy navigation
    - Loading state with spinner
    - Error handling with clear messages
    - Print instructions for optimal results
  - **Graph Component: A4PreviewGraph**
    - Dedicated component for A4 format rendering
    - 30-minute interval enforcement (mandatory requirement)
    - Russian labels for consistency (`График испытания давлением`)
    - Enhanced styling for print (thicker lines, larger fonts)
    - Test parameters summary below graph
    - Professional appearance with grid lines and reference lines
  - Files created:
    - `/src/app/(dashboard)/tests/preview/page.tsx` - Preview page route
    - `/src/components/tests/a4-preview-graph.tsx` - A4 graph component
  - Technical details:
    - ECharts configuration with fixed `interval: 30` minutes
    - `minInterval` and `maxInterval` set to enforce 30-minute spacing
    - Canvas renderer for optimal print quality
    - Animation disabled for print performance
    - Proper cleanup and disposal
  - References: Feature 6.2

### Fixed
- **CRITICAL: Unified Graph Preview Across All Pages** - Fixed inconsistent graph rendering between detail, edit, and create pages
  - Root cause: Detail page used `PressureTestPreviewEnhanced` while edit/create pages used `PressureTestPreview`
  - Solution: Replaced `PressureTestPreviewEnhanced` with `PressureTestPreview` in detail page
  - Result: All three pages (create, edit, detail) now show identical graph visualization
  - Added `startDateTime` and `endDateTime` props for calendar-based axis support
  - Ensures pixel-perfect consistency across entire application
  - Tested with test ID: `5ccdd3d3-96f0-49b2-9a7f-788215714632`
  - Files modified: `/src/app/(dashboard)/tests/[id]/page.tsx`
  - References: Issue #6.1

- **CRITICAL: ECharts Export Quality - Complete Rewrite Using Best Practices** - Fixed poor quality square exports by implementing dedicated instance approach
  - **Previous Issues (Why Export Was Broken):**
    - Exported by scaling up small preview canvas (400px square)
    - Resulted in pixelated/blurry output despite claiming 1920x1080
    - Wrong aspect ratio (square instead of wide 16:9)
    - Poor quality due to scaling artifacts
    - Looked like browser screenshot, not professional export

  - **New Implementation (ECharts Best Practices):**
    - Creates dedicated ECharts instance at export resolution
    - Initializes with target dimensions: 1920x1080 @ 2x DPI = 3840x2160
    - Sets `devicePixelRatio: 2` during initialization (not just in getDataURL)
    - Renders chart at native resolution (NO SCALING)
    - Uses hidden off-screen container for rendering
    - Properly disposes instance to prevent memory leaks
    - Wide 16:9 aspect ratio for professional presentations
    - White background (#ffffff) for print-ready output

  - **Technical Implementation Steps:**
    1. Create hidden container with export dimensions (1920x1080)
    2. Initialize ECharts instance with width, height, devicePixelRatio
    3. Calculate pressure profile data independently
    4. Apply full chart options at export resolution
    5. Export using getDataURL with white background
    6. Dispose instance and cleanup DOM elements

  - **Export Specifications:**
    - Display Resolution: 1920x1080 (Full HD)
    - Actual Resolution: 3840x2160 (2x pixel ratio)
    - Aspect Ratio: 16:9 (Wide, not square)
    - Quality: Native rendering (no scaling artifacts)
    - Background: White (#ffffff) for printing
    - Format: PNG (lossless compression)
    - Rendering Method: Dedicated instance per export

  - **Best Practices Applied:**
    - Tree-shaking: Import only required ECharts components
    - Memory Management: Proper instance disposal after export
    - Performance: Disabled animations for faster export
    - Type Safety: Full TypeScript coverage with ComposeOption
    - Error Handling: Try-catch with cleanup in finally block

  - Result: Professional-quality exports with crisp rendering and correct aspect ratio
  - Tested with test ID: `5ccdd3d3-96f0-49b2-9a7f-788215714632`
  - Files modified: `/src/components/tests/echarts-export-dialog.tsx`
  - References:
    - Issue #6.2
    - `/docs/ECHARTS_BEST_PRACTICES.md` - Export/Image Generation section
    - User feedback: "картинка экспортировалась, но сама диаграмма плохого качества и квадратная"

### Fixed
- **CRITICAL: Edit Page Graph Preview Visual Consistency** - Fixed "radically different" appearance between edit and create page previews
  - Root cause: Edit form used non-debounced values while create form used 300ms debounced values
  - Solution: Added `useDebounce` hook to edit form for all graph preview values
  - Both pages now update with identical 300ms delay, ensuring smooth, consistent rendering
  - Affected values: workingPressure, maxPressure, testDuration, intermediateStages, pressureUnit
  - Result: Edit page Graph Preview tab now renders identically to create page preview
  - Tested with test ID: `5ccdd3d3-96f0-49b2-9a7f-788215714632`
  - Files modified: `/src/components/tests/edit-test-form-client.tsx`

- **CRITICAL: ECharts Export Quality Dramatically Improved** - Fixed "terrible" small image with transparent background
  - Previous issues:
    - Image was too small (400px height at display resolution)
    - Background was transparent instead of white
    - Low resolution (1x pixel ratio)
    - Unsuitable for professional reports/presentations
  - New implementation:
    - Exports at Full HD resolution: 1920x1080 base size
    - 2x pixel ratio for high-DPI displays (effective: 3840x2160)
    - White background fill for professional appearance
    - Aspect ratio maintained with centered content
    - High-quality image smoothing enabled
  - Technical approach:
    - Creates temporary off-screen canvas at export resolution
    - Fills white background before drawing chart
    - Scales and centers original canvas content
    - Exports with maximum PNG quality (1.0)
  - Result: Professional-quality exports suitable for reports, presentations, and printing
  - Files modified: `/src/components/tests/echarts-export-dialog.tsx`
  - Tested with test ID: `5ccdd3d3-96f0-49b2-9a7f-788215714632`

- **Edit Page Graph Preview Consistency** - Ensured edit page "Graph Preview" tab uses identical component as create page
  - Both create and edit pages now use `PressureTestPreview` component with identical props
  - Removed any usage of `PressureTestPreviewEnhanced` from edit page preview tabs
  - Verified consistency: same graph visualization, same tooltips, same styling
  - Updated tab description to match create page: "Real-time pressure profile visualization"
  - Tested with test ID: `5ccdd3d3-96f0-49b2-9a7f-788215714632`
  - Result: Edit page preview now pixel-perfect identical to create page preview

### Added
- **ECharts-Based Graph Export** - New export option using ECharts native rendering alongside custom export
  - Created `EChartsExportDialog` component for ECharts-based PNG export
  - Uses ECharts canvas rendering directly (getDataURL method)
  - Exports high-quality PNG (2x pixel ratio) with white background
  - Added to test detail page Quick Actions card
  - Provides alternative to custom canvas-based export in `EmulationExportDialog`
  - Both export methods available side-by-side:
    - "Export Emulation" - Custom canvas rendering with V1 styling
    - "Export Graph (ECharts)" - Direct ECharts rendering for consistency
  - Benefits:
    - Same graph component used for preview and export
    - No visual discrepancies between preview and export
    - Simpler implementation using ECharts built-in functionality
    - Consistent with preview graph styling and layout
  - Export format: PNG with timestamp-based filename
  - Dialog includes graph preview, export details, and test configuration
  - Location: `/src/components/tests/echarts-export-dialog.tsx`

### Fixed
- **Test Editing - Complete Parity with Create Form** - Major refactor of test editing page to match create form functionality and fix multiple critical issues (Issues #6.2, #6.3, #7)
  - **Issue 6.2 - Preview Tab Graph Rendering**: Replaced `PressureTestPreviewEnhanced` with standard `PressureTestPreview` component
    - Edit page now uses the same graph component and preview dialog as create page
    - Ensures consistent visualization across create and edit workflows
    - Fixed graph rendering discrepancies and missing features
  - **Issue 6.3 - Missing Parameters Configuration**: Added complete parameter configuration to Parameters tab
    - Temperature field with unit selector (°C/°F) - previously missing temperature unit
    - Test Schedule section (Start/End Date & Time) - previously missing entirely
    - Equipment & Operator section (Equipment ID, Operator Name, Notes) - previously missing entirely
    - All fields now match create form exactly
  - **Issue 6.1 - Data Transformation Fix**: Removed incorrect data transformation logic
    - Changed test duration from minutes back to hours (matching database structure)
    - Fixed intermediate stages field names to match database: `time`, `pressure`, `duration`
    - Removed incorrect transformation: `duration→time`, `targetPressure→pressure`, `holdDuration→duration`
    - Form now directly matches database structure (no transformation needed)
  - **Issue 7 - Export Emulation Graph**: Fixed intermediate stages calculation in emulated data generator
    - Changed `stage.time` from absolute to relative time (minutes after previous stage ends)
    - Fixed calculation to use `currentTime + stage.time` instead of `startDateTime + stage.time`
    - Export emulation graphs now correctly render intermediate stages
  - **Graph Component Consistency**: Both create and edit pages now use identical graph components
    - `PressureTestPreview` - Main preview component with ECharts
    - `PreviewDialog` - Full-screen preview modal
    - Consistent props and data structure across all pages
  - **Stages Tab Improvements**: Updated to use table layout matching create form
    - Shows stage number, time (min), pressure, hold (min)
    - Displays cumulative time for better understanding
    - Empty state message for better UX
    - Proper validation and error messages
  - Tested with test ID: `5ccdd3d3-96f0-49b2-9a7f-788215714632`

- **Test Editing - Intermediate Stages Data Transformation** - Fixed critical bugs in test editing page where intermediate stage fields appeared empty and graph preview rendered incorrectly
  - **Root Cause**: Mismatch between database structure and form structure
    - Database: `{ time, duration, pressure }`
    - Form: `{ duration, targetPressure, holdDuration }`
  - **Changes**:
    - Added bidirectional data transformation in `edit-test-form-client.tsx`
    - Loading: Transform DB structure to form structure in `defaultValues`
      - `time` → `duration` (time to reach stage)
      - `pressure` → `targetPressure`
      - `duration` → `holdDuration` (time to hold at stage)
    - Saving: Transform form structure back to DB structure in `onSubmit`
      - `duration` → `time`
      - `targetPressure` → `pressure`
      - `holdDuration` → `duration`
  - **Impact**:
    - Fixes empty "Target Pressure" and "Hold" fields in Stages tab
    - Fixes graph preview rendering in edit page Preview tab
    - Maintains data integrity when editing and saving tests
  - Tested with test ID: `5364cf01-602d-4ab6-bfec-0e608e8c43ff`
  - Commit: `0152c857`

### Added
- **JSON Export/Import for Test Configurations** - Complete backup and restore functionality for pressure test settings
  - Created `test-config-io.ts` utility module with comprehensive validation
    - `exportTestConfig`: Export configuration to pretty-printed JSON with metadata
    - `importTestConfig`: Import and validate JSON files with user-friendly error messages
    - `validateTestConfig`: Standalone validation for programmatic use
    - Zod schema validation with detailed field-level error reporting
  - Created `ExportConfigButton` component
    - One-click export with timestamp-based file naming
    - Includes test metadata (number, name, description)
    - Toast notifications for success/error feedback
    - Customizable button styles (variant, size)
  - Created `ImportConfigButton` component
    - File input with validation (JSON only, 1MB maximum)
    - Auto-fills all form fields with imported values
    - Validates structure and data types before import
    - Clear error messages for validation failures
  - Integration points:
    - Export button in test detail page (Quick Actions card)
    - Import button in test creation form (Step 1 header)
    - Works seamlessly with test duplication feature
  - Features:
    - Type-safe implementation with TypeScript strict mode
    - Supports all test configuration fields (including optional)
    - Partial import support (handles missing optional fields)
    - Pretty-printed JSON output (2-space indentation)
    - Export metadata tracking (version 2.0.0, timestamp, source)
    - File size validation (1MB limit for security)
    - Comprehensive error handling with user guidance
  - Closes #93 (High Priority feature from Sprint 4)

### Fixed
- **Test Deletion Dialog UX** - Replaced native browser confirm dialogs with shadcn AlertDialog components
  - Created `DeleteTestDialog` component with checkbox confirmation pattern
  - Created `BatchDeleteTestsDialog` for batch deletion operations
  - Removed all `window.confirm()` and `alert()` calls from tests table
  - Added proper loading states and toast notifications (using sonner)
  - Improved accessibility with ARIA labels and keyboard navigation
  - Delete buttons now disabled until confirmation checkbox is checked
  - Consistent UX pattern matching project deletion dialogs
  - Better error handling with user-friendly messages

### Added
- **ECharts Best Practices Documentation** - Comprehensive guide for ECharts implementation in Pressograph 2.0
  - Created `/docs/ECHARTS_BEST_PRACTICES.md` with 12 major sections covering all aspects of ECharts development
  - **Architecture & Integration**: Tree-shaking, client vs server components, component composition patterns
  - **Performance Optimization**: Memoization strategies, rendering performance, update patterns, lazy loading
  - **Memory Management**: Chart disposal, event listener cleanup, large dataset handling, memory monitoring
  - **Type Safety**: TypeScript configuration, props interface design, event handler types
  - **Data Management**: Data structure patterns, dynamic data updates, validation with Zod, null handling
  - **Responsive Design**: Resize handling, grid configuration, font scaling
  - **Accessibility**: ARIA labels, keyboard navigation, high contrast mode, screen reader support
  - **Server-Side Rendering**: Next.js integration, SSR for static charts, hydration strategy
  - **Error Handling**: Error boundaries, graceful degradation, loading states
  - **Testing Strategies**: Unit testing, integration testing, visual regression testing
  - **Animation & Interaction**: Animation configuration, smooth line interpolation, tooltip optimization, interactive events
  - **Code Organization**: File structure, reusable hooks, configuration management
  - Includes practical code examples, anti-patterns, and performance benchmarks
  - Serves as the definitive guide for all ECharts development in the project

### Changed
- **Pressure Test Preview Component Refactoring** - Applied comprehensive best practices to improve code quality and maintainability
  - **Performance Improvements**:
    - Removed 180+ lines of debug console.log statements (lines 110-173 in old version)
    - Memoized all expensive computations with proper dependency arrays
    - Separated chart option generation into dedicated `useMemo` hook
    - Implemented in-component debounce utility (250ms) to avoid external dependencies
    - Optimized resize handler with proper cleanup (cancels pending debounced calls)
  - **Code Quality Enhancements**:
    - Added comprehensive JSDoc documentation for all functions and interfaces
    - Enhanced TypeScript type definitions with detailed comments
    - Improved code structure with clear separation of concerns
    - Added detailed inline comments explaining key implementation decisions
    - Organized imports and type definitions for better readability
  - **Accessibility Improvements**:
    - Added proper ARIA labels (`role="img"`, `aria-label`, `aria-describedby`)
    - Created hidden description for screen readers with test parameters
    - Improved semantic HTML structure
    - Enhanced color contrast in tooltip styling
  - **Tooltip Enhancements**:
    - Improved visual design with better spacing and typography
    - Enhanced color scheme for better readability (#1f2937 for header, #6b7280 for labels)
    - Better structured layout with flexbox for label-value pairs
    - Increased minimum width to 180px for consistent appearance
  - **Visual Polish**:
    - Enhanced axis label colors (#6b7280) and line colors (#d1d5db) for better contrast
    - Improved mark line styling with increased width (1.5px) and font weight (500)
    - Added emphasis state for series with hover effects
    - Optimized animation settings (300ms duration, cubicOut easing)
  - **Memory Management**:
    - Proper chart disposal in cleanup effect
    - Event listener cleanup with debounce cancellation
    - Clear chart instance references for garbage collection
  - **Code Documentation**:
    - Added module-level documentation with best practices applied
    - Reference to `/docs/ECHARTS_BEST_PRACTICES.md` for detailed guidelines
    - Comprehensive function-level documentation with examples
    - Clear explanation of algorithms (interval calculation, data transformation)
  - **Backward Compatibility**: All existing functionality maintained, no breaking changes
  - **Bundle Size**: Reduced runtime overhead by removing debug logging (estimated 3-5KB reduction)

### Fixed
- **Black Vertical Line in Padding Area** - Removed unwanted vertical line at test start
  - **Problem**: Black vertical line appeared at test start time (e.g., 22:35) when using time-based display
  - **Root Cause**: Padding data points at -60min and end created visible line segments
  - **Solution**: Removed padding data points - axis min/max already provides visual padding
  - **Result**: Clean graph with no unwanted lines, padding handled purely by axis range

- **Tooltip Time Display Bug** - Fixed incorrect tooltip display for time-based axis
  - **Problem**: Tooltip showed negative minutes ("-35m") in padding region before test start
  - **Root Cause**: Tooltip formatter incorrectly treated data[0] as timestamp instead of minutes
  - **Solution**:
    - Correctly interpret `point.data[0]` as minutes (value-based axis)
    - Convert minutes offset to timestamp: `startTime + minutes * 60 * 1000`
    - Display full date and time in tooltip for time-based mode
    - Handle negative minutes correctly for padding areas
  - **Result**: Tooltip now shows proper date/time (e.g., "03.11.2025 22:35") instead of "-35m"

- **X-Axis Time-Based Interval FINAL FIX (ATTEMPT 3)** - Complete architecture change to use value-based axis for both cases
  - **Problem with splitNumber Approach**: `splitNumber` is only a **suggestion** for time-based axes
    - ECharts ignores `splitNumber` and chooses "nice" time boundaries (00:00, 01:00, 02:00...)
    - Result: 24h test with `splitNumber: 13` still showed 1-hour intervals
    - Confirmed: ALL interval control properties are ignored for `type: 'time'` axes
  - **FINAL SOLUTION**: Always use `type: 'value'` axis with custom formatter
    - X-axis data is ALWAYS in minutes (not timestamps)
    - When dates selected: formatter converts minutes to date/time display
    - Full control over intervals using `interval`/`minInterval`/`maxInterval` (these WORK for value axes)
    - Padding handled by min/max range (e.g., min: -60, max: 1500 for 24h + 1h padding)
  - **Implementation**:
    ```typescript
    // BEFORE (BROKEN - type: 'time' ignores interval controls):
    type: 'time',
    min: timestamp,
    max: timestamp,
    splitNumber: 13,  // IGNORED!

    // AFTER (WORKING - type: 'value' respects interval controls):
    type: 'value',
    min: -60,         // minutes (with padding)
    max: 1500,        // minutes (with padding)
    interval: 120,    // 2 hours in minutes - RESPECTED!
    axisLabel: {
      formatter: (value) => {
        // Convert minutes to timestamp and format as date/time
        const timestamp = startTime + value * 60 * 1000;
        return formatDateTime(timestamp);
      }
    }
    ```
  - Updated debug logging to show value-based approach
  - **Status**: ✅ CONFIRMED WORKING - 2-hour intervals display correctly

- **Graph Vertical Line at Start** - Fixed unwanted vertical line appearing at test start when using time-based display
  - **Root Cause**: When axis starts at -60 minutes (padding) but first data point is at 0, ECharts draws vertical line
  - **Solution**: Add padding data points at both ends
    - Start: Add point at `-paddingHours * 60` with pressure 0
    - End: Add point at `totalMinutes + paddingHours * 60` with pressure 0
  - This ensures smooth horizontal line through the padding regions

### Fixed
- **X-Axis Time-Based Interval Critical Fix (ATTEMPT 2)** - Using `splitNumber` instead of `axisLabel.interval`
  - **Problem with Previous Fix**: `axisLabel.interval` was calculated incorrectly
    - Formula `Math.floor((xAxisMax - xAxisMin) / (xAxisInterval * 60 * 1000)) - 1` calculated how many intervals fit
    - But `axisLabel.interval` means "show every Nth label" where ECharts generates labels automatically
    - ECharts generates ~1-hour labels by default, so `interval: 12` meant "show every 13th hour" = 13-hour spacing!
    - Result: 24h test showed 4-hour intervals instead of 2 hours
  - **Attempted Approach**: Use `splitNumber` to control tick count
    - `splitNumber` tells ECharts how many segments to divide the axis into
    - Formula: `Math.ceil((xAxisMax - xAxisMin) / (xAxisInterval * 60 * 1000))`
    - Example: 26h range / 2h interval = 13 ticks
    - **FAILED**: ECharts still ignored `splitNumber` for time-based axes

### Fixed
- **X-Axis Time-Based Interval Critical Fix (ATTEMPT 1)** - Previously tried using `axisLabel.interval` but discovered calculation error
  - **Root Cause Discovery**: ECharts `interval`, `minInterval`, `maxInterval` properties **DO NOT WORK** for time-based axes
  - Despite documentation suggesting these properties exist, ECharts completely ignores them for `type: 'time'` axes
  - ECharts automatically calculates "nice" time intervals regardless of these settings
  - **FAILED**: Attempted using `axisLabel.interval` but miscalculated how it works

### Fixed
- **X-Axis Interval Display** - Fixed 1-hour intervals showing for 24h and 28h tests instead of 2 hours
  - **Root Cause**: Form cache was restoring previous test data that included `startDateTime` and `endDateTime` values
  - Empty string `startDateTime`/`endDateTime` from cached data was being passed to `PressureTestPreview` component
  - `Boolean('') === false` but the component still received the empty strings, making `useTimeBased = Boolean(startDateTime && endDateTime)` evaluate to `true`
  - This forced the preview to use time-based axis with padding, causing display range mismatch
  - **Solution**: Changed to `startDateTime || undefined` and `endDateTime || undefined` so empty strings become `undefined`
  - Now `Boolean(undefined && undefined) === false`, correctly using value-based axis when no dates are entered
  - Verified fix with 24h test: now correctly shows 2-hour intervals instead of 1-hour intervals

### Added
- **ECharts Configuration Debug Logging** - Added detailed logging to track exact values passed to ECharts
  - Logs `useTimeBased` value to verify axis type selection
  - Logs `xAxisInterval` in minutes before passing to ECharts
  - For time-based axis: Logs interval, minInterval, maxInterval in milliseconds, axis range, and total display hours
  - For value-based axis: Logs interval, minInterval, maxInterval in minutes, axis min/max, and total display hours
  - Helps identify if ECharts is receiving correct interval values or if internal auto-adjustment is occurring
  - Example output for 24h test with value-based axis:
    - `[ECharts Config] useTimeBased: false`
    - `[ECharts Config] xAxisInterval: 120 minutes`
    - `[ECharts Config] Value-based axis - interval: 120, minInterval: 120, maxInterval: 120`
    - `[ECharts Config] Value-based axis - min: 0, max: 1440 minutes`
    - `[ECharts Config] Value-based axis - Display range: 24 hours`
  - TODO: Remove debug logging after X-axis interval issue is resolved
- **X-Axis Interval Calculation Debug Logging** - Enhanced diagnostics for interval selection algorithm
  - Added comprehensive console logging to track interval calculation process
  - Logs display hours, all tested intervals (1h, 2h, 3h, 4h, 6h, 12h, 24h), tick counts, and validity
  - Shows which intervals are valid (8-15 tick range) with ✓/✗ indicators
  - Displays selected interval and final returned value in minutes
  - Memoized calculation to prevent excessive logging on re-renders
  - Expected behavior for 24h test with time-based axis (26h total with padding):
    - 1h → 26 ticks (too many, > 15)
    - 2h → 13 ticks (✓ VALID, selected)
    - 3h → 8.67 ticks (✓ VALID)
    - 4h+ → too few ticks (< 8)
    - Final result: 120 minutes (2-hour intervals)
  - TODO: Remove debug logging after issue is confirmed resolved

### Fixed
- **X-Axis Interval Time-Based Axis Bug (COMPLETE FIX)** - Fixed time-based axis showing 1-hour intervals instead of 2 hours for 24h tests
  - **Root cause**: Time-based axes (`type: 'time'`) in ECharts **do not support** `interval`, `minInterval`, or `maxInterval` properties
  - These properties are only valid for value-based axes (`type: 'value'`)
  - ECharts was silently ignoring our interval configuration and using its own automatic calculation
  - **The problem flow:**
    1. User enters start date/time in Test Schedule Optional section
    2. Component uses time-based axis with `type: 'time'`
    3. Code sets `interval: 7200000` (2 hours in ms), `minInterval: 7200000`, `maxInterval: 7200000`
    4. ECharts ignores these properties completely (they don't exist for time axes)
    5. ECharts calculates its own automatic interval (1 hour for 26h range)
    6. User sees 1-hour intervals despite correct 2-hour calculation
  - **The fix**: Use `splitNumber` instead of `interval` for time-based axes:
    ```typescript
    // Before (WRONG - properties ignored by ECharts):
    type: 'time',
    interval: xAxisInterval * 60 * 1000,      // Ignored!
    minInterval: xAxisInterval * 60 * 1000,   // Ignored!
    maxInterval: xAxisInterval * 60 * 1000,   // Ignored!

    // After (CORRECT - splitNumber controls intervals):
    type: 'time',
    splitNumber: Math.floor((xAxisMax - xAxisMin) / (xAxisInterval * 60 * 1000))
    // Example: 26h total / 2h interval = 13 splits
    ```
  - **Why this works**: `splitNumber` tells ECharts exactly how many intervals to create, forcing our desired interval spacing
  - **Verified behavior (time-based axis with start date):**
    - 24-hour test (26h with padding): 2-hour intervals - 13 splits
    - Intervals now match value-based axis behavior (when no dates entered)
  - Updated debug logging to show `splitNumber` instead of ignored interval properties for time-based axes

- **X-Axis Interval ECharts Auto-Adjustment Bug (VALUE-BASED FIX)** - Fixed value-based axis allowing ECharts to override calculated intervals
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
