import { redirect } from 'next/navigation';

/**
 * History Route Redirect
 *
 * The old v1.0 `/history` route has been replaced by `/tests` in v2.0.
 * This page redirects to the new route for backward compatibility.
 *
 * See: docs/development/PAGES_STRUCTURE_AND_FUNCTIONALITY.md
 */
export default function HistoryRedirect() {
  redirect('/tests');
}
