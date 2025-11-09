import { redirect } from 'next/navigation';

/**
 * Archived Projects Route
 *
 * This route redirects to the main projects page with the archived filter enabled.
 * The main /projects page handles the archived state via the 'archived' search parameter.
 *
 * @route /projects/archived
 * @redirects /projects?archived=true
 */
export default function ArchivedProjectsPage() {
  redirect('/projects?archived=true');
}
