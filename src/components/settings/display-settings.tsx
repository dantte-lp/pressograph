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
import { FileImageIcon, FileCodeIcon, FileTextIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type GraphFormat = 'PNG' | 'SVG' | 'PDF';

interface DisplayPreferences {
  graphDefaultFormat: GraphFormat;
  graphDefaultResolution: number;
  sidebarCollapsed: boolean;
}

export function DisplaySettings() {
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
      toast.error('Failed to load preferences');
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
      toast.success('Display preferences updated');
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

  const formatOptions = [
    {
      value: 'PNG' as GraphFormat,
      label: 'PNG',
      icon: FileImageIcon,
      description: 'Raster image format',
    },
    {
      value: 'SVG' as GraphFormat,
      label: 'SVG',
      icon: FileCodeIcon,
      description: 'Vector graphics format',
    },
    {
      value: 'PDF' as GraphFormat,
      label: 'PDF',
      icon: FileTextIcon,
      description: 'Portable document format',
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Display Preferences</h2>

      <div className="space-y-6">
        {/* Graph Default Format */}
        <div>
          <Label className="text-base mb-3 block">
            Default Graph Export Format
          </Label>
          <p className="text-sm text-muted-foreground mb-4">
            Choose the default file format when exporting pressure test graphs
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
            Default Graph Resolution
          </Label>
          <p className="text-sm text-muted-foreground mb-4">
            Higher resolution produces larger files but better quality (1x - 4x)
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
              <span className="text-muted-foreground">1x (Standard)</span>
              <span className="font-medium text-primary">
                {preferences.graphDefaultResolution}x
              </span>
              <span className="text-muted-foreground">4x (Ultra HD)</span>
            </div>
          </div>
        </div>

        {/* Sidebar Collapsed */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="sidebarCollapsed" className="text-base">
              Collapse Sidebar by Default
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Start with the sidebar collapsed to maximize content area
            </p>
          </div>

          <button
            id="sidebarCollapsed"
            type="button"
            role="switch"
            aria-checked={preferences.sidebarCollapsed}
            onClick={() =>
              updatePreference({
                sidebarCollapsed: !preferences.sidebarCollapsed,
              })
            }
            disabled={saving}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              preferences.sidebarCollapsed ? 'bg-primary' : 'bg-input'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-background transition-transform',
                preferences.sidebarCollapsed
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
