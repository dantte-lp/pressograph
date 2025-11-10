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
 * - Comprehensive i18n support
 *
 * @route /profile
 */

import { requireAuth } from '@/lib/auth/server-auth';
import { ProfilePageClient } from '@/components/profile/profile-page-client';

export const metadata = {
  title: 'Profile | Pressograph',
  description: 'Manage your user profile and account settings',
};

export default async function ProfilePage() {
  const session = await requireAuth();

  return (
    <ProfilePageClient
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
  );
}
