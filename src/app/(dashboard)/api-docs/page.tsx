/**
 * API Documentation Page
 *
 * API reference and code examples
 *
 * @route /api-docs
 */

import { requireAuth } from '@/lib/auth/server-auth';
import { ApiDocsContent } from '@/components/docs/api-docs-content';

export const metadata = {
  title: 'API Documentation | Pressograph',
  description: 'API reference and integration guide',
};

export default async function ApiDocsPage() {
  await requireAuth();

  return <ApiDocsContent />;
}
