/**
 * Settings Page
 *
 * Comprehensive application settings with tabs:
 * - Appearance: theme and language preferences
 * - Notifications: email and in-app notification settings
 * - Display: graph export preferences and UI settings
 *
 * Features:
 * - Tabbed interface for organization
 * - Auto-save preferences
 * - Toast notifications for feedback
 * - Loading states
 *
 * @route /settings
 */

import { requireAuth } from '@/lib/auth/server-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppearanceSettings } from '@/components/settings/appearance-settings';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { DisplaySettings } from '@/components/settings/display-settings';
import { DateTimeSettings } from '@/components/settings/date-time-settings';
import { TemplateSettings } from '@/components/settings/template-settings';
import { SettingsIcon } from 'lucide-react';

export const metadata = {
  title: 'Settings | Pressograph',
  description: 'Configure your application preferences and settings',
};

export default async function SettingsPage() {
  // Ensure user is authenticated
  await requireAuth();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your application preferences and display settings
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="appearance" className="px-6">
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="px-6">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="display" className="px-6">
            Display
          </TabsTrigger>
          <TabsTrigger value="datetime" className="px-6">
            Date & Time
          </TabsTrigger>
          <TabsTrigger value="templates" className="px-6">
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="display">
          <DisplaySettings />
        </TabsContent>

        <TabsContent value="datetime">
          <DateTimeSettings />
        </TabsContent>

        <TabsContent value="templates">
          <TemplateSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
