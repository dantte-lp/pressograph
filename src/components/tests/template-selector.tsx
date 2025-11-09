'use client';

/**
 * Template Selector Component
 *
 * Allows users to:
 * - Select from available templates
 * - Apply template configuration to form
 * - Preview template details
 *
 * Features:
 * - Category filtering
 * - Template search
 * - Usage statistics display
 * - System/Public/Private badges
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  FileTextIcon,
  CheckIcon,
  GlobeIcon,
  LockIcon,
  StarIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getTestTemplates,
  getTestTemplateById,
  incrementTemplateUsage,
  type TestTemplateListItem,
} from '@/lib/actions/test-templates';
import type { PressureTestConfig } from '@/lib/db/schema/pressure-tests';

interface TemplateSelectorProps {
  onSelect: (config: Partial<PressureTestConfig>) => void;
  variant?: 'button' | 'dropdown';
}

export function TemplateSelector({ onSelect, variant = 'button' }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<TestTemplateListItem[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TestTemplateListItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  useEffect(() => {
    filterTemplates();
  }, [templates, categoryFilter, searchQuery]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getTestTemplates();
      setTemplates(data);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleSelectTemplate = async (templateId: string) => {
    try {
      const template = await getTestTemplateById(templateId);
      if (!template) {
        toast.error('Template not found');
        return;
      }

      // Apply template configuration
      onSelect(template.config);

      // Increment usage count
      await incrementTemplateUsage(templateId);

      toast.success(`Applied template: ${template.name}`);
      setOpen(false);
      setSelectedTemplate(null);
    } catch (error) {
      toast.error('Failed to apply template');
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'daily':
        return 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20';
      case 'extended':
        return 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20';
      case 'regulatory':
        return 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === 'button' ? (
          <Button type="button" variant="outline" size="sm">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="sm">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Load from Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Select Template</DialogTitle>
          <DialogDescription>
            Choose a template to pre-fill test configuration
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="daily">Daily Tests</SelectItem>
                    <SelectItem value="extended">Extended Tests</SelectItem>
                    <SelectItem value="regulatory">Regulatory Tests</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Template List */}
            <ScrollArea className="h-[400px] rounded-md border p-4">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No templates found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors hover:border-primary ${
                        selectedTemplate === template.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{template.name}</h4>
                            {template.isSystemTemplate && (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 border-amber-500/20"
                              >
                                <StarIcon className="h-3 w-3 mr-1" />
                                System
                              </Badge>
                            )}
                            {template.isPublic ? (
                              <Badge
                                variant="outline"
                                className="bg-green-500/10 text-green-600 border-green-500/20"
                              >
                                <GlobeIcon className="h-3 w-3 mr-1" />
                                Public
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-gray-500/10 text-gray-600 border-gray-500/20"
                              >
                                <LockIcon className="h-3 w-3 mr-1" />
                                Private
                              </Badge>
                            )}
                            <Badge className={getCategoryBadgeColor(template.category)}>
                              {template.category}
                            </Badge>
                          </div>

                          {template.description && (
                            <p className="text-sm text-muted-foreground">
                              {template.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>By {template.creatorName}</span>
                            <span>•</span>
                            <span>Used {template.usageCount} times</span>
                          </div>
                        </div>

                        {selectedTemplate === template.id && (
                          <CheckIcon className="h-5 w-5 text-primary ml-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setSelectedTemplate(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (selectedTemplate) {
                    handleSelectTemplate(selectedTemplate);
                  }
                }}
                disabled={!selectedTemplate}
              >
                Apply Template
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
