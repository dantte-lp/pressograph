'use client';

/**
 * Appearance Settings Component
 *
 * Allows users to configure:
 * - Theme preference (light/dark/system)
 * - Language preference (en/ru)
 * - UI display preferences
 *
 * Features:
 * - Visual theme selector
 * - Language dropdown
 * - Auto-save on change
 * - Real-time language switching without page reload
 * - Toast notifications
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SunIcon, MoonIcon, MonitorIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import i18next from '@/i18n/client';

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'ru';

interface Preferences {
  themePreference: Theme;
  languagePreference: Language;
}

export function AppearanceSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    themePreference: 'system',
    languagePreference: 'en',
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
        themePreference: data.themePreference,
        languagePreference: data.languagePreference,
      });
    } catch (error) {
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (updates: Partial<Preferences>) => {
    setSaving(true);

    try {
      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to update preferences');

      setPreferences((prev) => ({ ...prev, ...updates }));
      toast.success('Preferences updated successfully');

      // Apply theme change immediately
      if (updates.themePreference) {
        applyTheme(updates.themePreference);
      }

      // Apply language change immediately
      if (updates.languagePreference) {
        await applyLanguage(updates.languagePreference);
      }
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }

    // Update cookie for SSR
    document.cookie = `theme=${theme}; path=/; max-age=31536000`;
  };

  const applyLanguage = async (language: Language) => {
    try {
      // Update i18next language immediately for client-side re-render
      await i18next.changeLanguage(language);

      // Update locale cookie for SSR
      document.cookie = `locale=${language}; path=/; max-age=31536000`;

      // Refresh the router to update server-rendered content
      router.refresh();
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
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

  const themeOptions = [
    {
      value: 'light' as Theme,
      label: 'Light',
      icon: SunIcon,
      description: 'Light theme',
    },
    {
      value: 'dark' as Theme,
      label: 'Dark',
      icon: MoonIcon,
      description: 'Dark theme',
    },
    {
      value: 'system' as Theme,
      label: 'System',
      icon: MonitorIcon,
      description: 'Follow system preference',
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Appearance</h2>

      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <Label className="text-base mb-3 block">Theme</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Select your preferred theme for the interface
          </p>

          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = preferences.themePreference === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    updatePreference({ themePreference: option.value })
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

        {/* Language Selection */}
        <div>
          <Label htmlFor="language" className="text-base mb-3 block">
            Language
          </Label>
          <p className="text-sm text-muted-foreground mb-4">
            Select your preferred language for the interface
          </p>

          <div className="max-w-xs">
            <Select
              value={preferences.languagePreference}
              onValueChange={(value) =>
                updatePreference({
                  languagePreference: value as Language,
                })
              }
              disabled={saving}
            >
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ru">Русский (Russian)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Save Indicator */}
        {saving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" />
            <span>Saving preferences...</span>
          </div>
        )}
      </div>
    </Card>
  );
}
