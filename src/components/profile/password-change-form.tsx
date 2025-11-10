'use client';

/**
 * Password Change Form Component
 *
 * Allows users to change their password with:
 * - Current password verification
 * - New password validation
 * - Password strength requirements
 * - Confirmation matching
 *
 * Features:
 * - Password visibility toggle
 * - Client-side validation
 * - Loading states
 * - Toast notifications
 * - Security requirements display
 * - Comprehensive i18n support
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { EyeIcon, EyeOffIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PasswordChangeForm() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password strength validation
  const passwordRequirements = [
    {
      label: t('profile.passwordRequirement.minLength'),
      test: (pwd: string) => pwd.length >= 8,
    },
    {
      label: t('profile.passwordRequirement.uppercase'),
      test: (pwd: string) => /[A-Z]/.test(pwd),
    },
    {
      label: t('profile.passwordRequirement.lowercase'),
      test: (pwd: string) => /[a-z]/.test(pwd),
    },
    {
      label: t('profile.passwordRequirement.number'),
      test: (pwd: string) => /\d/.test(pwd),
    },
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = t('profile.currentPasswordRequired');
    }

    if (!formData.newPassword) {
      newErrors.newPassword = t('profile.newPasswordRequired');
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = t('profile.passwordTooShort');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = t('profile.passwordRequirements');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('profile.confirmPasswordRequired');
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('profile.passwordsDoNotMatch');
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
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('profile.failedToChangePassword'));
      }

      toast.success(t('profile.passwordChangedSuccess'));

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('profile.failedToChangePassword');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">{t('profile.changePassword')}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <Label htmlFor="currentPassword">
            {t('profile.currentPassword')} <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => {
                setFormData({ ...formData, currentPassword: e.target.value });
                if (errors.currentPassword) {
                  setErrors({ ...errors, currentPassword: '' });
                }
              }}
              placeholder={t('profile.enterCurrentPassword')}
              disabled={loading}
              aria-invalid={!!errors.currentPassword}
              aria-describedby={
                errors.currentPassword ? 'currentPassword-error' : undefined
              }
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('current')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPasswords.current ? t('profile.hidePassword') : t('profile.showPassword')}
            >
              {showPasswords.current ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.currentPassword && (
            <p
              id="currentPassword-error"
              className="text-sm text-destructive mt-1"
            >
              {errors.currentPassword}
            </p>
          )}
        </div>

        {/* New Password */}
        <div>
          <Label htmlFor="newPassword">
            {t('profile.newPassword')} <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => {
                setFormData({ ...formData, newPassword: e.target.value });
                if (errors.newPassword) {
                  setErrors({ ...errors, newPassword: '' });
                }
              }}
              placeholder={t('profile.enterNewPassword')}
              disabled={loading}
              aria-invalid={!!errors.newPassword}
              aria-describedby={
                errors.newPassword ? 'newPassword-error' : undefined
              }
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('new')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPasswords.new ? t('profile.hidePassword') : t('profile.showPassword')}
            >
              {showPasswords.new ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p id="newPassword-error" className="text-sm text-destructive mt-1">
              {errors.newPassword}
            </p>
          )}

          {/* Password Requirements */}
          {formData.newPassword && (
            <div className="mt-2 space-y-1">
              {passwordRequirements.map((req, index) => {
                const isValid = req.test(formData.newPassword);
                return (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-2 text-sm',
                      isValid ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'
                    )}
                  >
                    {isValid ? (
                      <CheckCircle2Icon className="h-4 w-4" />
                    ) : (
                      <XCircleIcon className="h-4 w-4" />
                    )}
                    <span>{req.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <Label htmlFor="confirmPassword">
            {t('profile.confirmPassword')} <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                if (errors.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: '' });
                }
              }}
              placeholder={t('profile.confirmNewPassword')}
              disabled={loading}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? 'confirmPassword-error' : undefined
              }
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('confirm')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPasswords.confirm ? t('profile.hidePassword') : t('profile.showPassword')}
            >
              {showPasswords.confirm ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p
              id="confirmPassword-error"
              className="text-sm text-destructive mt-1"
            >
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {t('profile.changingPassword')}
              </>
            ) : (
              t('profile.changePassword')
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
