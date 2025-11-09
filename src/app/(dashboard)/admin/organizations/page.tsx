/**
 * Admin Organizations Management Page
 *
 * Manage all organizations in the system
 *
 * @route /admin/organizations
 */

import { requireAdmin } from '@/lib/auth/server-auth';
import { getOrganizations } from '@/lib/actions/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2Icon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const metadata = {
  title: 'Organizations | Admin | Pressograph',
  description: 'Manage system organizations',
};

export default async function AdminOrganizationsPage() {
  await requireAdmin();

  const organizations = await getOrganizations();

  return (
    <div className="container mx-auto space-y-6 p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary text-primary-foreground p-3 rounded-lg">
          <Building2Icon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground mt-1">
            Manage organizations and their settings
          </p>
        </div>
      </div>

      {/* Organizations List */}
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>{organizations.length} total organizations</CardDescription>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No organizations yet
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between border rounded-lg p-4"
                >
                  <div className="flex-1">
                    <div className="font-medium text-lg">{org.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Slug: {org.slug}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {org._count.users} users · {org._count.projects} projects
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Created {formatDistanceToNow(org.createdAt, { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
