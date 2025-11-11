'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TagIcon, XIcon, PlusIcon } from 'lucide-react';
import { batchUpdateTags } from '@/lib/actions/tests';

interface BatchTagAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  availableTags: string[];
  onSuccess?: () => void;
}

/**
 * BatchTagAssignmentDialog Component
 *
 * Dialog for batch tag assignment/removal to multiple tests.
 *
 * Features:
 * - Add tags to multiple tests at once
 * - Remove tags from multiple tests at once
 * - Tag autocomplete from existing tags
 * - Support for creating new tags
 * - Visual feedback with badges
 * - i18n support
 */
export function BatchTagAssignmentDialog({
  open,
  onOpenChange,
  selectedIds,
  availableTags,
  onSuccess,
}: BatchTagAssignmentDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [tagInput, setTagInput] = useState('');
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);

  // Handle tag input change for autocomplete
  const handleTagInputChange = (value: string) => {
    setTagInput(value);

    if (value.trim()) {
      // Filter available tags based on input
      const filtered = availableTags.filter(tag =>
        tag.toLowerCase().includes(value.toLowerCase()) &&
        !tagsToAdd.includes(tag) &&
        !tagsToRemove.includes(tag)
      ).slice(0, 5); // Limit to 5 suggestions
      setFilteredTags(filtered);
    } else {
      setFilteredTags([]);
    }
  };

  // Add tag from input or autocomplete
  const handleAddTag = (tag?: string) => {
    const trimmed = tag ? tag.trim() : tagInput.trim();

    if (!trimmed) return;

    // Check if tag is already in add list
    if (tagsToAdd.includes(trimmed)) {
      toast.error(t('tests.tagAlreadyInList'));
      return;
    }

    // Check if tag is in remove list
    if (tagsToRemove.includes(trimmed)) {
      toast.error(t('tests.tagInRemoveList'));
      return;
    }

    setTagsToAdd([...tagsToAdd, trimmed]);
    setTagInput('');
    setFilteredTags([]);
  };

  // Remove tag from add list
  const handleRemoveFromAdd = (tag: string) => {
    setTagsToAdd(tagsToAdd.filter(t => t !== tag));
  };

  // Add tag to remove list
  const handleAddToRemove = (tag: string) => {
    if (!tagsToRemove.includes(tag) && !tagsToAdd.includes(tag)) {
      setTagsToRemove([...tagsToRemove, tag]);
    }
  };

  // Remove tag from remove list
  const handleRemoveFromRemove = (tag: string) => {
    setTagsToRemove(tagsToRemove.filter(t => t !== tag));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (tagsToAdd.length === 0 && tagsToRemove.length === 0) {
      toast.error(t('tests.noTagsSelected'));
      return;
    }

    startTransition(async () => {
      try {
        const result = await batchUpdateTags(selectedIds, tagsToAdd, tagsToRemove);

        if (result.success) {
          toast.success(t('tests.tagsUpdatedSuccess', { count: result.updated }));
          onOpenChange(false);
          router.refresh(); // Refresh to show updated tags
          if (onSuccess) onSuccess();
        } else {
          toast.error(result.error || t('tests.tagsUpdatedError'));
        }
      } catch (error) {
        console.error('Error updating tags:', error);
        toast.error(t('tests.tagsUpdatedError'));
      }
    });
  };

  // Handle key press in input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            {t('tests.batchTagAssignment')}
          </DialogTitle>
          <DialogDescription>
            {t('tests.batchTagAssignmentDescription', { count: selectedIds.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Add Tags Section */}
          <div className="space-y-3">
            <Label>{t('tests.tagsToAdd')}</Label>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  placeholder={t('tests.typeTagName')}
                  value={tagInput}
                  onChange={(e) => handleTagInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isPending}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1 h-7"
                  onClick={() => handleAddTag()}
                  disabled={!tagInput.trim() || isPending}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Autocomplete suggestions */}
              {filteredTags.length > 0 && (
                <div className="flex flex-wrap gap-1 rounded-md border bg-muted/50 p-2">
                  <span className="text-xs text-muted-foreground">
                    {t('tests.suggestions')}:
                  </span>
                  {filteredTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleAddTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Tags to add list */}
              {tagsToAdd.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tagsToAdd.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromAdd(tag)}
                        className="ml-1 rounded-full hover:bg-muted"
                        disabled={isPending}
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Remove Tags Section */}
          <div className="space-y-3">
            <Label>{t('tests.tagsToRemove')}</Label>
            <div className="space-y-2">
              {/* Available tags from all tests */}
              <div className="flex flex-wrap gap-1 rounded-md border bg-muted/50 p-2 min-h-[60px]">
                {availableTags.length > 0 ? (
                  availableTags
                    .filter(tag => !tagsToAdd.includes(tag))
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant={tagsToRemove.includes(tag) ? "destructive" : "outline"}
                        className="cursor-pointer"
                        onClick={() =>
                          tagsToRemove.includes(tag)
                            ? handleRemoveFromRemove(tag)
                            : handleAddToRemove(tag)
                        }
                      >
                        {tag}
                        {tagsToRemove.includes(tag) && (
                          <XIcon className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t('tests.noTagsAvailable')}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('tests.clickTagToRemove')}
              </p>
            </div>
          </div>

          {/* Summary */}
          {(tagsToAdd.length > 0 || tagsToRemove.length > 0) && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium mb-1">{t('tests.summary')}:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {tagsToAdd.length > 0 && (
                  <li>
                    {t('tests.willAddTags', { count: tagsToAdd.length })}:{' '}
                    {tagsToAdd.join(', ')}
                  </li>
                )}
                {tagsToRemove.length > 0 && (
                  <li>
                    {t('tests.willRemoveTags', { count: tagsToRemove.length })}:{' '}
                    {tagsToRemove.join(', ')}
                  </li>
                )}
                <li>
                  {t('tests.testsAffected', { count: selectedIds.length })}
                </li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || (tagsToAdd.length === 0 && tagsToRemove.length === 0)}
          >
            {isPending ? t('tests.updating') : t('tests.updateTags')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
