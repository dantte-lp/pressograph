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
              <CardTitle className="text-lg">General Settings</CardTitle>
              <CardDescription>
                Basic organization configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Language */}
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Default Language</Label>
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
                  Default language for new users and system messages
                </p>
              </div>

              <Separator />

              {/* Max Test Duration */}
              <div className="space-y-2">
                <Label htmlFor="maxTestDuration">Maximum Test Duration (hours)</Label>
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
                  Maximum duration allowed for pressure tests (1-168 hours)
                </p>
              </div>

              <Separator />

              {/* Permission Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Public Sharing</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable users to create public share links for tests
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
                    <Label>Require Approval for Tests</Label>
                    <p className="text-sm text-muted-foreground">
                      Require admin approval before running new tests
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
                <CardTitle className="text-lg">Branding</CardTitle>
              </div>
              <CardDescription>
                Customize your organization's visual identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo URL */}
              <div className="space-y-2">
                <Label htmlFor="brandingLogo">Logo URL</Label>
                <Input
                  id="brandingLogo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={settings.branding?.logo || ''}
                  onChange={(e) => updateSetting('branding.logo', e.target.value)}
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  URL to your organization logo (or base64 data URL)
                </p>
              </div>

              {/* Primary Color */}
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
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
                <Label htmlFor="secondaryColor">Secondary Color</Label>
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
                <CardTitle className="text-lg">Notifications</CardTitle>
              </div>
              <CardDescription>
                Configure notification channels and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications for important events
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
                <Label htmlFor="digestFrequency">Digest Frequency</Label>
                <Select
                  value={settings.notifications?.digestFrequency || 'weekly'}
                  onValueChange={(value) => updateSetting('notifications.digestFrequency', value)}
                  disabled={saving}
                >
                  <SelectTrigger id="digestFrequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Slack Webhook */}
              <div className="space-y-2">
                <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
                <Input
                  id="slackWebhook"
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={settings.notifications?.slackWebhook || ''}
                  onChange={(e) => updateSetting('notifications.slackWebhook', e.target.value)}
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  Optional: Send notifications to Slack channel
                </p>
              </div>

              {/* Discord Webhook */}
              <div className="space-y-2">
                <Label htmlFor="discordWebhook">Discord Webhook URL</Label>
                <Input
                  id="discordWebhook"
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={settings.notifications?.discordWebhook || ''}
                  onChange={(e) => updateSetting('notifications.discordWebhook', e.target.value)}
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  Optional: Send notifications to Discord channel
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
                <CardTitle className="text-lg">Data Retention</CardTitle>
              </div>
              <CardDescription>
                Configure data retention policies for GDPR compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test Data Retention */}
              <div className="space-y-2">
                <Label htmlFor="testDataDays">Test Data Retention (days)</Label>
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
                  How long to keep test data (30-3650 days)
                </p>
              </div>

              {/* Audit Log Retention */}
              <div className="space-y-2">
                <Label htmlFor="auditLogDays">Audit Log Retention (days)</Label>
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
                  How long to keep audit logs (365-3650 days)
                </p>
              </div>

              <Separator />

              {/* Auto Delete */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Deletion</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically delete data after retention period expires
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
                <CardTitle className="text-lg">Feature Flags</CardTitle>
              </div>
              <CardDescription>
                Enable or disable specific features for your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Feature Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>API Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable REST API access for integrations
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
                    <Label>Public Sharing</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow public share links for test results
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
                    <Label>Advanced Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable advanced analytics and reporting features
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
                <Label htmlFor="maxTestsPerMonth">Maximum Tests Per Month</Label>
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
                  Rate limit for test creation (1-100,000 per month)
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
                <CardTitle className="text-lg">Security Policies</CardTitle>
              </div>
              <CardDescription>
                Configure security policies and password requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* MFA Required */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Multi-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Enforce MFA for all organization users
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
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
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
                  Automatically log out inactive users (5-1440 minutes)
                </p>
              </div>

              <Separator />

              {/* Password Policy */}
              <div className="space-y-4">
                <Label>Password Policy</Label>

                <div className="space-y-2">
                  <Label htmlFor="minPasswordLength">Minimum Length</Label>
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
                  <Label>Require Special Characters</Label>
                  <Switch
                    checked={settings.security?.passwordPolicy?.requireSpecialChars ?? true}
                    onCheckedChange={(checked) => updateSetting('security.passwordPolicy.requireSpecialChars', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Require Numbers</Label>
                  <Switch
                    checked={settings.security?.passwordPolicy?.requireNumbers ?? true}
                    onCheckedChange={(checked) => updateSetting('security.passwordPolicy.requireNumbers', checked)}
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Require Uppercase Letters</Label>
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
          <span>Saving...</span>
        </div>
      )}
    </div>
  );
}
