'use client';

/**
 * Save as Template Button Component
 *
 * Allows users to save current test configuration as a reusable template
 *
 * Features:
 * - Extract current form values
 * - Save as template with metadata
 * - Category selection
 * - Public/private toggle
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { SaveIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { createTestTemplate } from '@/lib/actions/test-templates';
import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';

interface SaveAsTemplateButtonProps {
  config: Partial<PressureTestConfig>;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function SaveAsTemplateButton({
  config,
  variant = 'outline',
  size = 'sm',
}: SaveAsTemplateButtonProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    isPublic: false,
  });

  const handleSaveTemplate = async () => {
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    // Validate that config has some values
    if (Object.keys(config).length === 0) {
      toast.error('No configuration to save');
      return;
    }

    setSaving(true);
    try {
      await createTestTemplate({
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        config,
        isPublic: formData.isPublic,
      });

      toast.success('Template saved successfully');
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'custom',
      isPublic: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={variant} size={size}>
          <SaveIcon className="h-4 w-4 mr-2" />
          Save as Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save this test configuration as a reusable template
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">
              Template Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="template-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Standard Daily Test"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger id="template-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Tests</SelectItem>
                <SelectItem value="extended">Extended Tests</SelectItem>
                <SelectItem value="regulatory">Regulatory Tests</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="template-is-public"
              checked={formData.isPublic}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isPublic: checked })
              }
            />
            <Label htmlFor="template-is-public" className="cursor-pointer">
              Make template public (visible to your organization)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSaveTemplate} disabled={saving}>
            {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
