'use client';

/**
 * Notification Settings Component
 *
 * Allows users to configure:
 * - Email notifications
 * - In-app notifications
 *
 * Features:
 * - Toggle switches for notification types
 * - Auto-save on change
 * - Toast feedback
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/use-translation';

interface NotificationPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

export function NotificationSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    inAppNotifications: true,
  });

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const res = await fetch('/api/preferences');
      if (!res.ok) throw new Error('Failed to load preferences');

      const data = await res.json();
      setPreferences({
        emailNotifications: data.emailNotifications,
        inAppNotifications: data.inAppNotifications,
      });
    } catch (error) {
      toast.error(t('settings.failedToLoadPreferences'));
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (
    updates: Partial<NotificationPreferences>
  ) => {
    setSaving(true);

    try {
      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to update preferences');

      setPreferences((prev) => ({ ...prev, ...updates }));
      toast.success(t('settings.notificationSettings.notificationPreferencesUpdated'));
    } catch (error) {
      toast.error(t('settings.failedToUpdatePreferences'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Spinner className="h-8 w-8" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">
        {t('settings.notificationSettings.title')}
      </h2>

      <div className="space-y-6">
        {/* Email Notifications */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="emailNotifications" className="text-base">
              {t('settings.notificationSettings.emailLabel')}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {t('settings.notificationSettings.emailDescription')}
            </p>
          </div>

          <Switch
            id="emailNotifications"
            checked={preferences.emailNotifications}
            onCheckedChange={(checked) =>
              updatePreference({
                emailNotifications: checked,
              })
            }
            disabled={saving}
          />
        </div>

        {/* In-App Notifications */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="inAppNotifications" className="text-base">
              {t('settings.notificationSettings.inAppLabel')}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {t('settings.notificationSettings.inAppDescription')}
            </p>
          </div>

          <Switch
            id="inAppNotifications"
            checked={preferences.inAppNotifications}
            onCheckedChange={(checked) =>
              updatePreference({
                inAppNotifications: checked,
              })
            }
            disabled={saving}
          />
        </div>

        {/* Save Indicator */}
        {saving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
            <Spinner className="h-4 w-4" />
            <span>{t('settings.savingPreferences')}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
