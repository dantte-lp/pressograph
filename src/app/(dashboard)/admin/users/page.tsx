/**
 * Admin Users Management Page
 *
 * Manage all users in the system with full CRUD operations
 *
 * @route /admin/users
 */

import { requireAdmin } from '@/lib/auth/server-auth';
import { getUsers, getOrganizations } from '@/lib/actions/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UsersIcon, PlusIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UserManagementDialog } from '@/components/admin/user-management-dialog';
import { DeleteUserDialog } from '@/components/admin/delete-user-dialog';

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: 'admin' | 'user';
  }>;
}

export const metadata = {
  title: 'User Management | Admin | Pressograph',
  description: 'Manage system users',
};

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const search = params.search;
  const role = params.role;

  const { users, pagination } = await getUsers({
    page,
    search,
    role,
  });

  // Get organizations for user assignment
  const organizations = await getOrganizations();

  return (
    <div className="container mx-auto space-y-6 p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-3 rounded-lg">
            <UsersIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage system users and permissions
            </p>
          </div>
        </div>

        {/* Create User Button */}
        <UserManagementDialog
          mode="create"
          organizations={organizations.map((org) => ({
            id: org.id,
            name: org.name,
          }))}
          trigger={
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create User
            </Button>
          }
        />
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {pagination.total} total users · Page {pagination.page} of {pagination.totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Username: {user.username} · {user._count.projects} projects ·{' '}
                      {user._count.pressureTests} tests
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right space-y-2">
                      <div>
                        <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                          {user.role}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Joined {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                      </div>
                      {user.lastLoginAt && (
                        <div className="text-xs text-muted-foreground">
                          Last login {formatDistanceToNow(user.lastLoginAt, { addSuffix: true })}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <UserManagementDialog
                        mode="edit"
                        user={{
                          id: user.id,
                          name: user.name ?? '',
                          email: user.email,
                          username: user.username,
                          role: user.role as 'admin' | 'user',
                          organizationId: user.organizationId,
                        }}
                        organizations={organizations.map((org) => ({
                          id: org.id,
                          name: org.name,
                        }))}
                        trigger={
                          <Button variant="outline" size="sm">
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        }
                      />

                      <DeleteUserDialog
                        user={{
                          id: user.id,
                          name: user.name ?? 'Unknown',
                          email: user.email,
                        }}
                        trigger={
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
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
