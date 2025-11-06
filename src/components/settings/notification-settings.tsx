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
import { cn } from '@/lib/utils';

interface NotificationPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

export function NotificationSettings() {
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
      toast.error('Failed to load preferences');
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
      toast.success('Notification preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
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
      <h2 className="text-xl font-semibold mb-6">Notifications</h2>

      <div className="space-y-6">
        {/* Email Notifications */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="emailNotifications" className="text-base">
              Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Receive notifications about test results, project updates, and
              important alerts via email
            </p>
          </div>

          <button
            id="emailNotifications"
            type="button"
            role="switch"
            aria-checked={preferences.emailNotifications}
            onClick={() =>
              updatePreference({
                emailNotifications: !preferences.emailNotifications,
              })
            }
            disabled={saving}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              preferences.emailNotifications
                ? 'bg-primary'
                : 'bg-input'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-background transition-transform',
                preferences.emailNotifications
                  ? 'translate-x-6'
                  : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* In-App Notifications */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="inAppNotifications" className="text-base">
              In-App Notifications
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Show notifications within the application for real-time updates
              and alerts
            </p>
          </div>

          <button
            id="inAppNotifications"
            type="button"
            role="switch"
            aria-checked={preferences.inAppNotifications}
            onClick={() =>
              updatePreference({
                inAppNotifications: !preferences.inAppNotifications,
              })
            }
            disabled={saving}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              preferences.inAppNotifications
                ? 'bg-primary'
                : 'bg-input'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-background transition-transform',
                preferences.inAppNotifications
                  ? 'translate-x-6'
                  : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Save Indicator */}
        {saving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
            <Spinner className="h-4 w-4" />
            <span>Saving preferences...</span>
          </div>
        )}
      </div>
    </Card>
  );
}
