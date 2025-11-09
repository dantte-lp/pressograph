/**
 * Admin Organizations Management Page
 *
 * Manage all organizations in the system with full CRUD operations
 *
 * @route /admin/organizations
 */

import { requireAdmin } from '@/lib/auth/server-auth';
import { getOrganizations } from '@/lib/actions/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2Icon, PlusIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { OrganizationManagementDialog } from '@/components/admin/organization-management-dialog';
import { DeleteOrganizationDialog } from '@/components/admin/delete-organization-dialog';

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
      <div className="flex items-center justify-between">
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

        {/* Create Organization Button */}
        <OrganizationManagementDialog
          mode="create"
          trigger={
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          }
        />
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
              <Building2Icon className="mx-auto h-12 w-12 opacity-50 mb-3" />
              <p className="font-medium">No organizations yet</p>
              <p className="text-sm mt-1">Create your first organization to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {org.logoUrl ? (
                        <img
                          src={org.logoUrl}
                          alt={org.name}
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-md flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: org.primaryColor || '#2563EB' }}
                        >
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-lg">{org.name}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          <Badge variant="outline" className="mr-2">
                            {org.slug}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 ml-13">
                      {org._count.users} users · {org._count.projects} projects
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Created {formatDistanceToNow(org.createdAt, { addSuffix: true })}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <OrganizationManagementDialog
                        mode="edit"
                        organization={{
                          id: org.id,
                          name: org.name,
                          slug: org.slug,
                          logoUrl: org.logoUrl,
                          primaryColor: org.primaryColor,
                        }}
                        trigger={
                          <Button variant="outline" size="sm">
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        }
                      />

                      <DeleteOrganizationDialog
                        organization={{
                          id: org.id,
                          name: org.name,
                          slug: org.slug,
                          userCount: org._count.users,
                          projectCount: org._count.projects,
                        }}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        }
                      />
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
