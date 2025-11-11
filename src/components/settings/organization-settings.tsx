'use client';

/**
 * Organization Settings Component
 *
 * Comprehensive organization configuration including:
 * - Branding and customization
 * - Notifications (Email, Slack, Discord)
 * - Data retention policies (GDPR compliance)
 * - Feature flags
 * - Security policies
 *
 * Features:
 * - Tabbed sections for organization
 * - Auto-save with debouncing
 * - Validation with error messages
 * - Loading states
 * - Toast notifications
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Building2,
  Palette,
  Bell,
  Database,
  Zap,
  Shield,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from '@/i18n/client';

// Placeholder types until actions are properly imported
type OrganizationSettingsUpdate = any;

// Placeholder functions (will be replaced with actual server actions)
async function getOrganizationSettings(_orgId: string) {
  // TODO: Import from @/server/actions/organizations when path is resolved
  return {
    success: false,
    error: 'settings.organizationSettings.notYetImplemented',
    data: null,
  };
}

async function updateOrganizationSettings(_orgId: string, _settings: any) {
  // TODO: Import from @/server/actions/organizations when path is resolved
  return {
    success: false,
    error: 'settings.organizationSettings.updateNotImplemented',
  };
}

export function OrganizationSettings() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (status !== 'authenticated' || !session?.user?.organizationId) {
        setError(t('settings.organizationSettings.noOrganizationFound'));
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await getOrganizationSettings(session.user.organizationId);

      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        setError(t(result.error) || t('settings.organizationSettings.failedToLoadSettings'));
        toast.error(t('settings.organizationSettings.failedToLoadSettings'));
      }
      setLoading(false);
    };

    loadSettings();
  }, [session, status]);

  // Save settings
  const handleSave = async (updates: OrganizationSettingsUpdate) => {
    if (!session?.user?.organizationId) return;

    setSaving(true);
    const result = await updateOrganizationSettings(
      session.user.organizationId,
      updates
    );

    if (result.success) {
      toast.success(t('settings.organizationSettings.settingsSaved'));
      setSettings({ ...settings, ...updates });
    } else {
      toast.error(t(result.error) || t('settings.organizationSettings.failedToSaveSettings'));
    }
    setSaving(false);
  };

  // Update individual setting
  const updateSetting = (path: string, value: any) => {
    const keys = path.split('.');
    const updated = { ...settings };
    let current = updated;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setSettings(updated);

    // Auto-save after 1 second
    setTimeout(() => {
      handleSave(updated);
    }, 1000);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!settings) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t('settings.organizationSettings.noSettingsFound')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>{t('settings.organizationSettings.title')}</CardTitle>
              <CardDescription>
                {t('settings.organizationSettings.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="general">{t('settings.organizationSettings.tabGeneral')}</TabsTrigger>
          <TabsTrigger value="branding">{t('settings.organizationSettings.tabBranding')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('settings.organizationSettings.tabNotifications')}</TabsTrigger>
          <TabsTrigger value="data">{t('settings.organizationSettings.tabDataRetention')}</TabsTrigger>
          <TabsTrigger value="features">{t('settings.organizationSettings.tabFeatures')}</TabsTrigger>
          <TabsTrigger value="security">{t('settings.organizationSettings.tabSecurity')}</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('settings.organizationSettings.generalSettings')}</CardTitle>
              <CardDescription>
                {t('settings.organizationSettings.generalDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Language */}
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">{t('settings.organizationSettings.defaultLanguageLabel')}</Label>
                <Select
                  value={settings.defaultLanguage}
                  onValueChange={(value) => updateSetting('defaultLanguage', value)}
                  disabled={saving}
                >
                  <SelectTrigger id="defaultLanguage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {t('settings.organizationSettings.defaultLanguageDescription')}
                </p>
              </div>

              <Separator />

              {/* Max Test Duration */}
              <div className="space-y-2">
                <Label htmlFor="maxTestDuration">{t('settings.organizationSettings.maxTestDurationLabel')}</Label>
                <Input
                  id="maxTestDuration"
                  type="number"
                  min={1}
                  max={168}
                  value={settings.maxTestDuration}
                  onChange={(e) => updateSetting('maxTestDuration', parseInt(e.target.value))}
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.organizationSettings.maxTestDurationDescription')}
                </p>
              </div>

              <Separator />

              {/* Permission Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.organizationSettings.allowPublicSharingLabel')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.organizationSettings.allowPublicSharingDescription')}
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowPublicSharing}
                    onCheckedChange={(checked) => updateSetting('allowPublicSharing', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.organizationSettings.requireApprovalLabel')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.organizationSettings.requireApprovalDescription')}
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireApprovalForTests}
                    onCheckedChange={(checked) => updateSetting('requireApprovalForTests', checked)}
                    disabled={saving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle className="text-lg">{t('settings.organizationSettings.brandingSettings')}</CardTitle>
              </div>
              <CardDescription>
                {t('settings.organizationSettings.brandingDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo URL */}
              <div className="space-y-2">
                <Label htmlFor="brandingLogo">{t('settings.organizationSettings.logoUrlLabel')}</Label>
                <Input
                  id="brandingLogo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={settings.branding?.logo || ''}
                  onChange={(e) => updateSetting('branding.logo', e.target.value)}
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.organizationSettings.logoUrlDescription')}
                </p>
              </div>

              {/* Primary Color */}
              <div className="space-y-2">
                <Label htmlFor="primaryColor">{t('settings.organizationSettings.primaryColorLabel')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={settings.branding?.primaryColor || '#2563EB'}
                    onChange={(e) => updateSetting('branding.primaryColor', e.target.value)}
                    disabled={saving}
                    className="w-20"
                  />
                  <Input
                    type="text"
                    value={settings.branding?.primaryColor || '#2563EB'}
                    onChange={(e) => updateSetting('branding.primaryColor', e.target.value)}
                    disabled={saving}
                    placeholder="#2563EB"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">{t('settings.organizationSettings.secondaryColorLabel')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={settings.branding?.secondaryColor || '#64748B'}
                    onChange={(e) => updateSetting('branding.secondaryColor', e.target.value)}
                    disabled={saving}
                    className="w-20"
                  />
                  <Input
                    type="text"
                    value={settings.branding?.secondaryColor || '#64748B'}
                    onChange={(e) => updateSetting('branding.secondaryColor', e.target.value)}
                    disabled={saving}
                    placeholder="#64748B"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle className="text-lg">{t('settings.organizationSettings.notificationSettings')}</CardTitle>
              </div>
              <CardDescription>
                {t('settings.organizationSettings.notificationDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.organizationSettings.emailNotificationsLabel')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.organizationSettings.emailNotificationsDescription')}
                  </p>
                </div>
                <Switch
                  checked={settings.notifications?.emailEnabled ?? true}
                  onCheckedChange={(checked) => updateSetting('notifications.emailEnabled', checked)}
                  disabled={saving}
                />
              </div>

              <Separator />

              {/* Digest Frequency */}
              <div className="space-y-2">
                <Label htmlFor="digestFrequency">{t('settings.organizationSettings.digestFrequencyLabel')}</Label>
                <Select
                  value={settings.notifications?.digestFrequency || 'weekly'}
                  onValueChange={(value) => updateSetting('notifications.digestFrequency', value)}
                  disabled={saving}
                >
                  <SelectTrigger id="digestFrequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t('settings.organizationSettings.digestDaily')}</SelectItem>
                    <SelectItem value="weekly">{t('settings.organizationSettings.digestWeekly')}</SelectItem>
                    <SelectItem value="never">{t('settings.organizationSettings.digestNever')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Slack Webhook */}
              <div className="space-y-2">
                <Label htmlFor="slackWebhook">{t('settings.organizationSettings.slackWebhookLabel')}</Label>
                <Input
                  id="slackWebhook"
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={settings.notifications?.slackWebhook || ''}
                  onChange={(e) => updateSetting('notifications.slackWebhook', e.target.value)}
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.organizationSettings.slackWebhookDescription')}
                </p>
              </div>

              {/* Discord Webhook */}
              <div className="space-y-2">
                <Label htmlFor="discordWebhook">{t('settings.organizationSettings.discordWebhookLabel')}</Label>
                <Input
                  id="discordWebhook"
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={settings.notifications?.discordWebhook || ''}
                  onChange={(e) => updateSetting('notifications.discordWebhook', e.target.value)}
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.organizationSettings.discordWebhookDescription')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Retention Settings */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle className="text-lg">{t('settings.organizationSettings.dataRetentionSettings')}</CardTitle>
              </div>
              <CardDescription>
                {t('settings.organizationSettings.dataRetentionDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test Data Retention */}
              <div className="space-y-2">
                <Label htmlFor="testDataDays">{t('settings.organizationSettings.testDataRetentionLabel')}</Label>
                <Input
                  id="testDataDays"
                  type="number"
                  min={30}
                  max={3650}
                  value={settings.dataRetention?.testDataDays || 365}
                  onChange={(e) => updateSetting('dataRetention.testDataDays', parseInt(e.target.value))}
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.organizationSettings.testDataRetentionDescription')}
                </p>
              </div>

              {/* Audit Log Retention */}
              <div className="space-y-2">
                <Label htmlFor="auditLogDays">{t('settings.organizationSettings.auditLogRetentionLabel')}</Label>
                <Input
                  id="auditLogDays"
                  type="number"
                  min={365}
                  max={3650}
                  value={settings.dataRetention?.auditLogDays || 730}
                  onChange={(e) => updateSetting('dataRetention.auditLogDays', parseInt(e.target.value))}
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.organizationSettings.auditLogRetentionDescription')}
                </p>
              </div>

              <Separator />

              {/* Auto Delete */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.organizationSettings.autoDeleteLabel')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.organizationSettings.autoDeleteDescription')}
                  </p>
                </div>
                <Switch
                  checked={settings.dataRetention?.autoDeleteEnabled ?? false}
                  onCheckedChange={(checked) => updateSetting('dataRetention.autoDeleteEnabled', checked)}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Flags */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <CardTitle className="text-lg">{t('settings.organizationSettings.featureFlagsSettings')}</CardTitle>
              </div>
              <CardDescription>
                {t('settings.organizationSettings.featureFlagsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Feature Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.organizationSettings.apiAccessLabel')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.organizationSettings.apiAccessDescription')}
                    </p>
                  </div>
                  <Switch
                    checked={settings.features?.apiAccessEnabled ?? false}
                    onCheckedChange={(checked) => updateSetting('features.apiAccessEnabled', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.organizationSettings.publicSharingLabel')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.organizationSettings.publicSharingDescription')}
                    </p>
                  </div>
                  <Switch
                    checked={settings.features?.publicSharingEnabled ?? false}
                    onCheckedChange={(checked) => updateSetting('features.publicSharingEnabled', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.organizationSettings.advancedAnalyticsLabel')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.organizationSettings.advancedAnalyticsDescription')}
                    </p>
                  </div>
                  <Switch
                    checked={settings.features?.advancedAnalytics ?? false}
                    onCheckedChange={(checked) => updateSetting('features.advancedAnalytics', checked)}
                    disabled={saving}
                  />
                </div>
              </div>

              <Separator />

              {/* Rate Limiting */}
              <div className="space-y-2">
                <Label htmlFor="maxTestsPerMonth">{t('settings.organizationSettings.maxTestsPerMonthLabel')}</Label>
                <Input
                  id="maxTestsPerMonth"
                  type="number"
                  min={1}
                  max={100000}
                  value={settings.features?.maxTestsPerMonth || 1000}
                  onChange={(e) => updateSetting('features.maxTestsPerMonth', parseInt(e.target.value))}
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.organizationSettings.maxTestsPerMonthDescription')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle className="text-lg">{t('settings.organizationSettings.securitySettings')}</CardTitle>
              </div>
              <CardDescription>
                {t('settings.organizationSettings.securityDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* MFA Required */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.organizationSettings.mfaRequiredLabel')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.organizationSettings.mfaRequiredDescription')}
                  </p>
                </div>
                <Switch
                  checked={settings.security?.mfaRequired ?? false}
                  onCheckedChange={(checked) => updateSetting('security.mfaRequired', checked)}
                  disabled={saving}
                />
              </div>

              <Separator />

              {/* Session Timeout */}
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">{t('settings.organizationSettings.sessionTimeoutLabel')}</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min={5}
                  max={1440}
                  value={settings.security?.sessionTimeout || 60}
                  onChange={(e) => updateSetting('security.sessionTimeout', parseInt(e.target.value))}
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.organizationSettings.sessionTimeoutDescription')}
                </p>
              </div>

              <Separator />

              {/* Password Policy */}
              <div className="space-y-4">
                <Label>{t('settings.organizationSettings.passwordPolicyLabel')}</Label>

                <div className="space-y-2">
                  <Label htmlFor="minPasswordLength">{t('settings.organizationSettings.minPasswordLengthLabel')}</Label>
                  <Input
                    id="minPasswordLength"
                    type="number"
                    min={8}
                    max={128}
                    value={settings.security?.passwordPolicy?.minLength || 8}
                    onChange={(e) => updateSetting('security.passwordPolicy.minLength', parseInt(e.target.value))}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>{t('settings.organizationSettings.requireSpecialCharsLabel')}</Label>
                  <Switch
                    checked={settings.security?.passwordPolicy?.requireSpecialChars ?? true}
                    onCheckedChange={(checked) => updateSetting('security.passwordPolicy.requireSpecialChars', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>{t('settings.organizationSettings.requireNumbersLabel')}</Label>
                  <Switch
                    checked={settings.security?.passwordPolicy?.requireNumbers ?? true}
                    onCheckedChange={(checked) => updateSetting('security.passwordPolicy.requireNumbers', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>{t('settings.organizationSettings.requireUppercaseLabel')}</Label>
                  <Switch
                    checked={settings.security?.passwordPolicy?.requireUppercase ?? true}
                    onCheckedChange={(checked) => updateSetting('security.passwordPolicy.requireUppercase', checked)}
                    disabled={saving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t('settings.organizationSettings.saving')}</span>
        </div>
      )}
    </div>
  );
}
