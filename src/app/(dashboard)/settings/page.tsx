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
import { getTranslations } from 'next-intl/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppearanceSettings } from '@/components/settings/appearance-settings';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { DisplaySettings } from '@/components/settings/display-settings';
import { DateTimeSettings } from '@/components/settings/date-time-settings';
import { TemplateSettings } from '@/components/settings/template-settings';
import { OrganizationSettings } from '@/components/settings/organization-settings';
import { SettingsIcon } from 'lucide-react';

export const metadata = {
  title: 'Settings | Pressograph',
  description: 'Configure your application preferences and settings',
};

export default async function SettingsPage() {
  // Ensure user is authenticated
  await requireAuth();

  const t = await getTranslations('settings');

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
        <p className="text-muted-foreground">
          {t('pageDescription')}
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="appearance" className="px-6">
            {t('appearance')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="px-6">
            {t('notifications')}
          </TabsTrigger>
          <TabsTrigger value="display" className="px-6">
            {t('pageTabDisplay')}
          </TabsTrigger>
          <TabsTrigger value="datetime" className="px-6">
            {t('pageTabDateTime')}
          </TabsTrigger>
          <TabsTrigger value="templates" className="px-6">
            {t('pageTabTemplates')}
          </TabsTrigger>
          <TabsTrigger value="organization" className="px-6">
            {t('pageTabOrganization')}
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

        <TabsContent value="organization">
          <OrganizationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
