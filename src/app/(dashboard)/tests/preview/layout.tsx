/**
 * Preview Page Layout Override
 *
 * This layout overrides the dashboard layout for the preview page.
 * It removes all UI elements (sidebar, header, etc.) to provide
 * a clean, print-ready graph display.
 *
 * Key Features:
 * - No sidebar navigation
 * - No header/top menu
 * - No layout wrapper
 * - Clean white background for printing
 * - Only the graph content
 *
 * This ensures the preview page is truly print-ready with no distractions.
 */

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  // Return only children - no layout wrapper, no sidebar, no header
  return children;
}
