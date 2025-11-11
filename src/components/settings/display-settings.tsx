'use client';

/**
 * Display Settings Component
 *
 * Allows users to configure:
 * - Graph default format (PNG, SVG, PDF)
 * - Graph default resolution (1x - 4x)
 * - Sidebar collapsed state
 *
 * Features:
 * - Visual format selector
 * - Resolution slider
 * - Toggle for sidebar
 * - Auto-save on change
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { FileImageIcon, FileCodeIcon, FileTextIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

type GraphFormat = 'PNG' | 'SVG' | 'PDF';

interface DisplayPreferences {
  graphDefaultFormat: GraphFormat;
  graphDefaultResolution: number;
  sidebarCollapsed: boolean;
}

export function DisplaySettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<DisplayPreferences>({
    graphDefaultFormat: 'PNG',
    graphDefaultResolution: 2,
    sidebarCollapsed: false,
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
        graphDefaultFormat: data.graphDefaultFormat,
        graphDefaultResolution: data.graphDefaultResolution,
        sidebarCollapsed: data.sidebarCollapsed,
      });
    } catch (error) {
      toast.error(t('settings.failedToLoadPreferences'));
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (updates: Partial<DisplayPreferences>) => {
    setSaving(true);

    try {
      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to update preferences');

      setPreferences((prev) => ({ ...prev, ...updates }));
      toast.success(t('settings.displaySettings.displayPreferencesUpdated'));
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

  const formatOptions = [
    {
      value: 'PNG' as GraphFormat,
      label: t('settings.displaySettings.formatPNG'),
      icon: FileImageIcon,
      description: t('settings.displaySettings.formatPNGDescription'),
    },
    {
      value: 'SVG' as GraphFormat,
      label: t('settings.displaySettings.formatSVG'),
      icon: FileCodeIcon,
      description: t('settings.displaySettings.formatSVGDescription'),
    },
    {
      value: 'PDF' as GraphFormat,
      label: t('settings.displaySettings.formatPDF'),
      icon: FileTextIcon,
      description: t('settings.displaySettings.formatPDFDescription'),
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">
        {t('settings.displaySettings.title')}
      </h2>

      <div className="space-y-6">
        {/* Graph Default Format */}
        <div>
          <Label className="text-base mb-3 block">
            {t('settings.displaySettings.graphFormatLabel')}
          </Label>
          <p className="text-sm text-muted-foreground mb-4">
            {t('settings.displaySettings.graphFormatDescription')}
          </p>

          <div className="grid grid-cols-3 gap-3">
            {formatOptions.map((option) => {
              const Icon = option.icon;
              const isSelected =
                preferences.graphDefaultFormat === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    updatePreference({ graphDefaultFormat: option.value })
                  }
                  disabled={saving}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                    'hover:bg-accent hover:border-primary/50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected
                      ? 'border-primary bg-accent'
                      : 'border-border bg-background',
                    saving && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-6 w-6',
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Graph Default Resolution */}
        <div>
          <Label htmlFor="resolution" className="text-base mb-3 block">
            {t('settings.displaySettings.graphResolutionLabel')}
          </Label>
          <p className="text-sm text-muted-foreground mb-4">
            {t('settings.displaySettings.graphResolutionDescription')}
          </p>

          <div className="space-y-3">
            <input
              id="resolution"
              type="range"
              min="1"
              max="4"
              step="1"
              value={preferences.graphDefaultResolution}
              onChange={(e) =>
                updatePreference({
                  graphDefaultResolution: parseInt(e.target.value),
                })
              }
              disabled={saving}
              className="w-full h-2 bg-input rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('settings.displaySettings.resolutionStandard')}
              </span>
              <span className="font-medium text-primary">
                {preferences.graphDefaultResolution}x
              </span>
              <span className="text-muted-foreground">
                {t('settings.displaySettings.resolutionUltraHD')}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Collapsed */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="sidebarCollapsed" className="text-base">
              {t('settings.displaySettings.sidebarCollapsedLabel')}
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {t('settings.displaySettings.sidebarCollapsedDescription')}
            </p>
          </div>

          <Switch
            id="sidebarCollapsed"
            checked={preferences.sidebarCollapsed}
            onCheckedChange={(checked) =>
              updatePreference({
                sidebarCollapsed: checked,
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
