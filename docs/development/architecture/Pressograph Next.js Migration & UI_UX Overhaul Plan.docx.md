# Pressograph Next.js Migration & UI/UX Overhaul Plan

## Migration Objectives

- **Next.js Framework:** Replace the Vite build system with Next.js 13+ (App Router) for the frontend.

- **File-Based Routing:** Adopt Next.js file-based routing and dynamic pages structure (using the /app directory).

- **Server-Side Rendering:** Introduce SSR (Server-Side Rendering) and ISR (Incremental Static Regeneration) where appropriate (e.g. login page, shareable report pages) to improve performance and SEO.

- **API Integration:** Continue using the existing Node/Express backend API via fetch requests from Next.js (no backend refactor in this scope).

- **Routing & Auth:** Replace React Router with Next.js routing. Leverage Next.js middleware for authentication checks, redirecting unauthenticated users to login.

- **State Management:** Preserve the Zustand state management and ensure it remains client-side only in the new Next.js architecture.

- **Tooling Parity:** Maintain full TypeScript support and development environment parity (linting, formatting, etc.) after migration.

- **Containerization:** Provide a Docker setup for a Node-based Next.js server (replacing the previous nginx/Vite setup) for consistent deployment.

## UI/UX Redesign Objectives

- **Guided Workflow:** Implement a step-by-step, guided test creation flow with four clear stages: 1\) Select Template → 2\) Set Parameters → 3\) Add Intermediate Stages → 4\) Export/View Results. This provides structured guidance to users through the testing configuration process.

- **Progressive Disclosure:** Use progressive disclosure (e.g. collapsible sections or “Advanced Mode” toggles) to hide complex settings until needed, simplifying the interface for basic use cases.

- **Improved Layout & Labels:** Redesign component layouts with consistent icons and helper tooltips. All controls should have clear labels and icons following modern industrial UI principles, making the app more intuitive.

- **Graph Visualization:** Update the graph canvas rendering for better readability. Use theme-aware, high-contrast lines and backgrounds so that the pressure graphs are legible under various lighting (including a high-contrast dark mode).

- **Enhanced Theming:** Improve dark/light theme support. Use an updated color palette that meets WCAG AA contrast standards. Ensure typography and spacing are optimized for readability in industrial environments (e.g. in bright sunlight or on low-end displays).

- **Touch-Friendly Design:** Ensure the UI controls are touch-friendly. Buttons, inputs, and interactive elements should be large enough with adequate spacing, suitable for tablet use or users wearing gloves.

- **Contextual Help:** Add contextual help links and tooltips throughout the app. Key features should link to a Help page or show tooltips that explain their purpose, aiding users with minimal training.

- **Bilingual Support:** Maintain full bilingual support (English/Russian) for all new UI text. Any new labels or messages must be added to the localization files so the interface remains fully translated in both languages.

## Constraints and Considerations

- **Preserve Core Features:** All existing functionality (e.g. graph generation, test export, user authentication) must remain intact after the refactor. The refactor should not change the core logic of pressure test calculations or data handling—focus is on frontend restructuring and design.

- **URL Structure:** The application’s routes/URLs should remain consistent with the current version where possible. This ensures existing links or user bookmarks remain valid (unless a change is intentionally part of the redesign).

- **Selective SSR:** Apply server-side rendering only where it provides clear benefits (such as initial load performance for public pages or SEO for shareable reports). Pages heavily relying on client-side state (e.g. the interactive graph page) can remain client-rendered to avoid complexity with hydration.

- **Reuse Proven Components:** Leverage existing UI components and styling where it aligns with the new design (especially since Tailwind and HeroUI are still in use). This will speed up development and maintain visual consistency, updating only where improvements are needed.

- **Quality & Testing:** After the migration, thorough testing (including cross-browser, cross-device, and regression tests) is required. The system should pass all existing tests and new tests for added features before considering the refactor complete.

## Initial Sprint Backlog – User Stories and Acceptance Criteria

### US1: Next.js App Router Migration

**User Story:** _As a fullstack developer, I want to convert the project layout to Next.js App Router so I can use file-based routing and server rendering._  
**Acceptance Criteria:**  
\- The app is restructured to use Next.js 13+ App Router conventions (an /app directory with layout.tsx and page.tsx files for each page/route).  
\- Each major route (e.g. **/login**, **/history**, **/admin**, **/graph**) is implemented as a Next.js page (using the appropriate file or folder structure under /app).  
\- All legacy routing code (React Router and any usage of react-router-dom) is completely removed. The application navigates using Next.js Link components and built-in routing.  
\- The development server runs via next dev and the production build via next build && next start, with no reliance on Vite. All existing functionalities load and navigate correctly in this new structure.

### US2: Authentication Middleware for Protected Routes

**User Story:** _As a developer, I want to implement middleware-based route protection so that only authenticated users can access protected pages._  
**Acceptance Criteria:**  
\- A Next.js middleware.ts is created at the appropriate level to check authentication (e.g. verify a JWT token stored in cookies or session).  
\- If a user is not authenticated, the middleware redirects them to the **/login** page. If authenticated, they proceed to the requested page.  
\- Protected pages (such as **/history**, **/admin**, **/graph**, etc.) are correctly identified in the middleware (for example, by URL pattern) so that only those require auth. Public pages (like **/login** or static info pages) bypass the auth check.  
\- The middleware solution works consistently for both direct link accesses (typing the URL) and client-side navigation. Testing should show that an unauthenticated user cannot access protected routes and gets redirected to login.

### US3: Preserve Zustand State Management

**User Story:** _As a developer, I want to preserve the Zustand store and ensure it works in the new Next.js architecture (client-side only) so that application state is maintained correctly._  
**Acceptance Criteria:**  
\- The Zustand state management setup from the Vite/React app is integrated into Next.js without changes to its external API. The store should still be initialized and used on the client side as before.  
\- No React hydration errors or warnings occur related to state when using Next.js SSR. (If certain pages are server-side rendered, ensure that Zustand store access is limited to client components or use dynamic imports as needed to avoid SSR mismatches.)  
\- Application state (user selections, theme settings, etc.) held in Zustand remains consistent as users navigate between pages. For example, if a user selects a template in step 1 and navigates to step 2, the selection persists.  
\- There is clear documentation or comments for the team on how to use Zustand in Next.js (e.g. using the use client directive in Next.js where necessary, since Zustand should not be used in server components).

### US4: SSR for Login and Shareable Report Pages

**User Story:** _As a developer, I want to implement server-side rendering for key pages (like the login and shareable test report pages) to improve first-load performance and allow unfettered previews._  
**Acceptance Criteria:**  
\- The **Login** page is rendered on the server (e.g. using Next.js server components or getServerSideProps), so that the initial load of the login screen is fast and the page is indexable if needed. This page should not flash or wait for client-side JavaScript to display the form.  
\- A dynamic **Shareable Report** page (e.g. at route **/share/\[token\]** or similar) is implemented to show a read-only test report/graph for a given token or ID. This page fetches the necessary test data from the backend on the server and renders the graph or report content as static HTML (with minimal client-side hydration, if any).  
\- Both the above pages (login and share) are verified via direct HTTP requests (e.g. using curl or Postman) to confirm the content is returned from the server side. For example, fetching the share page URL with a valid token returns an HTML page with the graph already rendered in the HTML (not just a blank page requiring React to load).  
\- Ensure that implementing SSR does not break client-side behavior. After logging in (which is SSR initially), the app still behaves as a single-page application once the user is inside. The shareable report page should be mostly static but can load minimal interactive scripts for things like theme toggling if needed.

### US5: Guided Test Configuration Flow (UI Redesign)

**User Story:** _As a UX designer, I want to redesign the Home page into a 4-step guided flow so that users can easily follow the process of configuring a new pressure test._  
**Acceptance Criteria:**  
\- The home (or main dashboard) page is restructured into four clearly labeled steps: **Step 1: Select Template**, **Step 2: Set Parameters**, **Step 3: Add Stages**, **Step 4: Export/View**. Each step’s section is visually distinct (e.g. as a card or panel) and numbered/titled for clarity.  
\- Only Step 1 is fully open by default. Subsequent steps might be collapsed or disabled until the previous step is completed (progressive disclosure). For example, the user cannot jump to “Add Stages” before selecting a template and setting initial parameters.  
\- Each step section contains the relevant controls and information. For instance, Step 1 shows a list of test templates (with descriptions), Step 2 displays input fields or sliders for test parameters, Step 3 allows adding intermediate pressure stages, and Step 4 provides export options (e.g. download graph, save report).  
\- Presets or recommended values are displayed where appropriate. For example, if a template has predefined parameter suggestions or quick interval settings, these are shown in context with explanatory text.  
\- The new layout has been tested with users (or representative personas) to ensure the guided flow is intuitive. Users with minimal training should be able to go through all four steps in order without confusion.

### US6: Updated Industrial UI Theme

**User Story:** _As a UI engineer, I want to apply updated color tokens and Tailwind configurations for a modern industrial look, so that the app’s appearance is clean and compliant with accessibility standards._  
**Acceptance Criteria:**  
\- Define a new color scheme (Tailwind theme extension or custom CSS variables) for primary, secondary, success, and error states that aligns with an industrial design aesthetic (muted blues/greys, high-contrast safety colors, etc.). These new tokens replace or override the old theme colors.  
\- The dark theme is updated to use near-neutral dark backgrounds (for example, a shade around \#1E1E2E or similar) with light text, and the light theme uses neutral light backgrounds with dark text. Both themes should meet WCAG AA contrast requirements for text vs background on all components.  
\- All UI components (buttons, inputs, tables, graph backgrounds, etc.) are checked to ensure they use the new color tokens. There should be no visual inconsistencies—e.g., no old color codes lingering. The design should feel cohesive and modern across the app.  
\- The Tailwind configuration file is updated with the new design tokens, and any custom CSS or HeroUI theme settings are adjusted accordingly. This includes spacing, font sizing, and border radius if the design calls for changes in those for a more professional look.  
\- A review of the interface in both light and dark mode confirms that critical elements (like text, icons, graph lines) have sufficient contrast. For example, graph lines should be clearly visible against the background in both themes, and interactive controls should be easily identifiable.

### US7: Accessibility and Validation Improvements

**User Story:** _As a QA engineer, I want to ensure all input forms are keyboard-navigable and provide clear validation feedback, so that the app is accessible and user errors are minimized._  
**Acceptance Criteria:**  
\- All form controls (text fields, dropdowns, buttons, sliders, etc.) can be accessed via keyboard alone. Tabbing through the application should follow a logical order (left-to-right, top-to-bottom through interactive elements) and visible focus indicators should be present on focused elements.  
\- Form validation is improved to give immediate and clear feedback. If a user input is invalid or missing, an inline message is displayed near the field explaining the issue in simple language (both in English and Russian, via localization).  
\- Validation messages and states are styled for visibility: for example, error messages in red (with appropriate contrast against backgrounds), and the form field highlighted (red outline or background) when there is an error. Success or neutral states can also be indicated where relevant (e.g., a checkmark or green outline for valid inputs, if it makes sense).  
\- Each form field includes either placeholder text, helper text, or a tooltip/icon that provides guidance on what to input. For instance, if a parameter expects a pressure value in Bar, the label or helper text indicates the units and acceptable range.  
\- The improvements are tested with both mouse and keyboard usage, and in both languages, to ensure that no accessibility regressions are introduced. This includes testing screen reader navigation on form fields to verify that labels and error messages are announced properly (ensuring proper ARIA attributes or inherent accessibility of form components).

### US8: Next.js Docker Deployment Setup

**User Story:** _As a DevOps engineer, I want to set up a new Dockerfile for the Next.js application, so that we can containerize the app for deployment similarly to the current system._  
**Acceptance Criteria:**  
\- A new **Dockerfile** is created in the repository for building the Next.js app. It should use a Node.js base image (matching the appropriate Node version) and include steps to install dependencies, build the Next.js app (using NEXT_TELEMETRY_DISABLED=1 next build for example), and then run the app with next start.  
\- The Dockerfile and/or docker-compose configuration should account for environment variables (like API endpoint URLs, secrets, etc.). Use a .env file or Docker secrets to manage sensitive or environment-specific config, rather than hardcoding values.  
\- The container runs the Next.js server in standalone mode. Ensure that after next build, the generated .next/standalone directory (or similar output) is used to keep the image size minimal, if using Next.js optimization for standalone output.  
\- A healthcheck is included in the Docker configuration to monitor the running container (for example, hitting an /api/health endpoint or simply the homepage) to ensure the Next.js server is responding.  
\- The new Docker setup is tested by building the image locally and running it. The application should be accessible on the expected port and function identically to the development environment. Documentation (README or comments) is updated to describe how to build and run the container for the Next.js app.

### US9: Update Localization for New UI Strings

**User Story:** _As a technical writer, I want to update the i18n localization files for any new UI text, so that both English and Russian languages are fully supported throughout the updated app._  
**Acceptance Criteria:**  
\- All new text introduced in the UI redesign (labels, tooltips, messages, etc.) are added to the localization JSON files (for both English and Russian). There should be no user-facing strings left hardcoded in the JSX/TSX components.  
\- The existing i18next configuration remains in place and continues to work in Next.js (likely using next-i18next or a similar integration for Next). Verify that language switching still works and that the translations load correctly on both client and server.  
\- The language toggle (if one exists in the UI) continues to function and now persists across page navigations. For example, if a user selects Russian on the login page and then navigates through the app, the language setting remains Russian (this might involve ensuring the language selection is stored in a cookie or global state that Next.js pages respect).  
\- Proofread and update the Russian translations for clarity if needed, especially for any new guidance text in the redesigned UI. If certain new terms don’t have existing translations, collaborate with a bilingual team member or use a translation service to add accurate translations.  
\- Test the application in both English and Russian after updates. All pages (including any new or SSR pages) should display the correct language content and there should be no fallback to English for any string when Russian is selected (and vice versa).

### US10: Cross-Device & Regression Testing

**User Story:** _As the fullstack team, we want to test the application across different devices and environments to ensure the refactored app is as stable and usable as the current version for industrial users._  
**Acceptance Criteria:**  
\- The application is tested on various devices common in the target industrial environment, including desktop browsers, a ruggedized tablet (touch screen), and a typical mobile phone. The layout should be responsive: key screens (like the 4-step flow and graph page) should adapt or at least be usable at different resolutions commonly used in the field.  
\- In dark mode and light mode, all screens are reviewed for visual clarity. For example, on a tablet in bright sunlight (light mode) the text and graphs remain visible; in a dark control room (dark mode) the UI does not cause eye strain and is still readable.  
\- The graph export functionality is tested to ensure it produces the same output as before the migration. This includes verifying that PDFs or images generated have the correct dark/light theme applied and that all data is accurately represented.  
\- Perform a full regression test of core user flows: logging in, creating a test (all steps), saving/exporting results, viewing past tests, and logging out. Any bug found is documented and addressed. The aim is to ensure feature parity with the previous version — the refactor should not introduce new bugs in existing features.  
\- A test report is compiled that summarizes the testing across devices and any issues fixed. This ensures stakeholders know that the new system has been validated in an industrial context and is ready to deploy as a replacement for the current system.

---
