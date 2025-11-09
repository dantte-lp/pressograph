'use client';

/**
 * Template Settings Component
 *
 * Allows users to:
 * - View all available templates (system, organization, personal)
 * - Create new templates
 * - Edit their own templates
 * - Delete their own templates
 * - See template usage statistics
 *
 * Features:
 * - Template list with filtering by category
 * - Create/Edit modal
 * - Delete confirmation
 * - Usage statistics
 * - System template badges
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  PlusIcon,
  TrashIcon,
  EditIcon,
  GlobeIcon,
  LockIcon,
  StarIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
  getTestTemplates,
  createTestTemplate,
  updateTestTemplate,
  deleteTestTemplate,
  type TestTemplateListItem,
} from '@/lib/actions/test-templates';

export function TemplateSettings() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TestTemplateListItem[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TestTemplateListItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TestTemplateListItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    isPublic: false,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, categoryFilter]);

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
    if (categoryFilter === 'all') {
      setFilteredTemplates(templates);
    } else {
      setFilteredTemplates(templates.filter((t) => t.category === categoryFilter));
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    setSaving(true);
    try {
      await createTestTemplate({
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        config: {}, // Empty partial config - user will fill when using template
        isPublic: formData.isPublic,
      });

      toast.success('Template created successfully');
      setShowCreateDialog(false);
      resetForm();
      await loadTemplates();
    } catch (error) {
      toast.error('Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const handleEditTemplate = async () => {
    if (!selectedTemplate || !formData.name.trim()) {
      return;
    }

    setSaving(true);
    try {
      await updateTestTemplate(selectedTemplate.id, {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        isPublic: formData.isPublic,
      });

      toast.success('Template updated successfully');
      setShowEditDialog(false);
      setSelectedTemplate(null);
      resetForm();
      await loadTemplates();
    } catch (error) {
      toast.error('Failed to update template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      await deleteTestTemplate(selectedTemplate.id);
      toast.success('Template deleted successfully');
      setShowDeleteDialog(false);
      setSelectedTemplate(null);
      await loadTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    } finally {
      setSaving(false);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (template: TestTemplateListItem) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      isPublic: template.isPublic,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (template: TestTemplateListItem) => {
    setSelectedTemplate(template);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'custom',
      isPublic: false,
    });
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

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Templates</CardTitle>
          <CardDescription>Loading templates...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner className="h-8 w-8" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test Templates</CardTitle>
              <CardDescription>
                Create and manage reusable test configuration templates
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="mb-6">
            <Label htmlFor="category-filter" className="mb-2 block">
              Filter by Category
            </Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="category-filter" className="w-full md:w-64">
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

          {/* Templates List */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">No templates found</p>
              <p className="text-sm">
                {categoryFilter === 'all'
                  ? 'Create your first template to get started'
                  : 'No templates in this category'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{template.name}</h3>
                          {template.isSystemTemplate && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                              <StarIcon className="h-3 w-3 mr-1" />
                              System
                            </Badge>
                          )}
                          {template.isPublic ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                              <GlobeIcon className="h-3 w-3 mr-1" />
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                              <LockIcon className="h-3 w-3 mr-1" />
                              Private
                            </Badge>
                          )}
                          <Badge className={getCategoryBadgeColor(template.category)}>
                            {template.category}
                          </Badge>
                        </div>

                        {template.description && (
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>By {template.creatorName}</span>
                          <span>•</span>
                          <span>Used {template.usageCount} times</span>
                          <span>•</span>
                          <span>Last used: {formatDate(template.lastUsedAt)}</span>
                        </div>
                      </div>

                      {!template.isSystemTemplate && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(template)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(template)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>
              Create a new test configuration template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard Daily Test"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
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
                id="is-public"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
              />
              <Label htmlFor="is-public" className="cursor-pointer">
                Make template public (visible to organization)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={saving}>
              {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update template details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Template Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard Daily Test"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="edit-category">
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
                id="edit-is-public"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
              />
              <Label htmlFor="edit-is-public" className="cursor-pointer">
                Make template public (visible to organization)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleEditTemplate} disabled={saving}>
              {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? <Spinner className="h-4 w-4 mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
