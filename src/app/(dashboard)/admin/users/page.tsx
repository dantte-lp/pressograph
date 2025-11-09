/**
 * Admin Users Management Page
 *
 * Manage all users in the system
 *
 * @route /admin/users
 */

import { requireAdmin } from '@/lib/auth/server-auth';
import { getUsers } from '@/lib/actions/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UsersIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

  return (
    <div className="container mx-auto space-y-6 p-6 lg:p-8">
      {/* Page Header */}
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

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {pagination.total} total users · Page {pagination.page} of {pagination.totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between border rounded-lg p-4"
              >
                <div className="flex-1">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Username: {user.username} · {user._count.projects} projects ·{' '}
                    {user._count.pressureTests} tests
                  </div>
                </div>
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
