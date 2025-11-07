/**
 * User Profile Page
 *
 * Displays and allows editing of:
 * - User profile information (name, email)
 * - Password change functionality
 * - Account details (username, role, creation date, last login)
 *
 * Features:
 * - Server-side authentication check
 * - Profile form with validation
 * - Password change with security requirements
 * - Toast notifications for feedback
 * - Loading states
 *
 * @route /profile
 */

import { requireAuth } from '@/lib/auth/server-auth';
import { ProfileForm } from '@/components/profile/profile-form';
import { PasswordChangeForm } from '@/components/profile/password-change-form';
import { DateTimeSettings } from '@/components/settings/date-time-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserIcon, ClockIcon } from 'lucide-react';

export const metadata = {
  title: 'Profile | Pressograph',
  description: 'Manage your user profile and account settings',
};

export default async function ProfilePage() {
  const session = await requireAuth();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <UserIcon className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your account information and security settings
        </p>
      </div>

      {/* Profile Forms */}
      <div className="space-y-6">
        <ProfileForm
          user={{
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            username: session.user.username,
            role: session.user.role,
            createdAt: new Date(session.user.createdAt || Date.now()),
            lastLoginAt: session.user.lastLoginAt
              ? new Date(session.user.lastLoginAt)
              : null,
          }}
        />

        <PasswordChangeForm />

        {/* Date & Time Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <ClockIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Date & Time Preferences</CardTitle>
                <CardDescription>
                  Configure how dates and times are displayed throughout the application
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DateTimeSettings />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
