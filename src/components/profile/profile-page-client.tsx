'use client';

/**
 * Profile Page Client Component
 *
 * Client-side wrapper for the profile page with i18n support
 *
 * Features:
 * - i18n support using useTranslation hook
 * - Profile form for updating user information
 * - Password change form
 */

import { useTranslation } from '@/hooks/use-translation';
import { ProfileForm } from '@/components/profile/profile-form';
import { PasswordChangeForm } from '@/components/profile/password-change-form';
import { UserIcon } from 'lucide-react';

interface ProfilePageClientProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
    username: string;
    role: string;
    createdAt: Date;
    lastLoginAt?: Date | null;
  };
}

export function ProfilePageClient({ user }: ProfilePageClientProps) {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <UserIcon className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
        </div>
        <p className="text-muted-foreground">
          {t('profile.manageAccountInfo')}
        </p>
      </div>

      {/* Profile Forms */}
      <div className="space-y-6">
        <ProfileForm user={user} />
        <PasswordChangeForm />
      </div>
    </div>
  );
}
