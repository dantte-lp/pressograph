'use client';

/**
 * Profile Form Component
 *
 * Allows users to update their profile information:
 * - Name
 * - Email
 *
 * Features:
 * - Client-side validation
 * - Loading states
 * - Toast notifications
 * - Error handling
 * - Comprehensive i18n support
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { formatDate, formatDateTime } from '@/lib/utils/format';

interface ProfileFormProps {
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

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = t('profile.nameRequired');
    } else if (formData.name.length > 255) {
      newErrors.name = t('profile.nameTooLong');
    }

    if (!formData.email?.trim()) {
      newErrors.email = t('profile.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('profile.invalidEmailFormat');
    } else if (formData.email.length > 255) {
      newErrors.email = t('profile.emailTooLong');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('profile.failedToUpdateProfile'));
      }

      toast.success(t('profile.profileUpdatedSuccess'));
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('profile.failedToUpdateProfile');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isChanged =
    formData.name !== (user.name || '') || formData.email !== user.email;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">{t('profile.profileInformation')}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username (read-only) */}
        <div>
          <Label htmlFor="username">{t('profile.username')}</Label>
          <Input
            id="username"
            value={user.username}
            disabled
            className="bg-muted cursor-not-allowed"
          />
          <p className="text-sm text-muted-foreground mt-1">
            {t('profile.usernameCannotChange')}
          </p>
        </div>

        {/* Name */}
        <div>
          <Label htmlFor="name">
            {t('profile.name')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) {
                setErrors({ ...errors, name: '' });
              }
            }}
            placeholder={t('profile.enterYourName')}
            disabled={loading}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-destructive mt-1">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">
            {t('profile.email')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) {
                setErrors({ ...errors, email: '' });
              }
            }}
            placeholder={t('profile.enterYourEmail')}
            disabled={loading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Role (read-only) */}
        <div>
          <Label htmlFor="role">{t('profile.role')}</Label>
          <Input
            id="role"
            value={user.role}
            disabled
            className="bg-muted cursor-not-allowed capitalize"
          />
        </div>

        {/* Account Information */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('profile.accountCreated')}</span>
            <span className="font-medium">
              {formatDate(user.createdAt)}
            </span>
          </div>
          {user.lastLoginAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('profile.lastLogin')}</span>
              <span className="font-medium" suppressHydrationWarning>
                {formatDateTime(user.lastLoginAt)}
              </span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button type="submit" disabled={loading || !isChanged}>
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {t('profile.saving')}
              </>
            ) : (
              t('profile.saveChanges')
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
