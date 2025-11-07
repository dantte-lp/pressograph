# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
