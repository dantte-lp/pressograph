import { redirect } from 'next/navigation';

/**
 * Active Projects Route
 *
 * This route redirects to the main projects page which shows active (non-archived) projects by default.
 * The main /projects page handles filtering via searchParams.
 *
 * @route /projects/active
 * @redirects /projects
 */
export default function ActiveProjectsPage() {
  redirect('/projects');
}
