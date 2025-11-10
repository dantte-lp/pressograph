/**
 * Edit Test Page
 *
 * Allows users to modify an existing pressure test configuration.
 * Uses the same form component as create test but pre-populates with existing data.
 *
 * @route /tests/[id]/edit
 */

import { notFound, redirect } from 'next/navigation';
import { getTestById } from '@/lib/actions/tests';
import { EditTestPageClient } from '@/components/tests/edit-test-page-client';

export const metadata = {
  title: 'Edit Test | Pressograph',
  description: 'Edit pressure test configuration',
};

interface EditTestPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTestPage({ params }: EditTestPageProps) {
  const { id } = await params;

  // Fetch test details
  const test = await getTestById(id);

  if (!test) {
    notFound();
  }

  // Only allow editing tests in 'draft' or 'ready' status
  if (!['draft', 'ready'].includes(test.status)) {
    redirect(`/tests/${id}`);
  }

  return <EditTestPageClient test={test} />;
}
