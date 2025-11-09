/**
 * Documentation Page
 *
 * User guide and help documentation
 *
 * @route /docs
 */

import { requireAuth } from '@/lib/auth/server-auth';
import { DocsContent } from '@/components/docs/docs-content';

export const metadata = {
  title: 'Documentation | Pressograph',
  description: 'User guide and help documentation',
};

export default async function DocsPage() {
  await requireAuth();

  return <DocsContent />;
}
