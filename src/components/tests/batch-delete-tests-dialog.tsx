'use client';

/**
 * Batch Delete Tests Dialog Component
 *
 * Provides a confirmation dialog for deleting multiple tests at once.
 * Uses AlertDialog with checkbox confirmation pattern for safety.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { batchDeleteTests } from '@/lib/actions/tests';

interface BatchDeleteTestsDialogProps {
  testIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BatchDeleteTestsDialog({
  testIds,
  open,
  onOpenChange,
  onSuccess
}: BatchDeleteTestsDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const count = testIds.length;

  const handleDelete = async () => {
    if (!confirmDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await batchDeleteTests(testIds);

      if (result.success) {
        // Close dialog first
        onOpenChange(false);

        // Show success toast
        toast.success(`${count} test${count > 1 ? 's' : ''} deleted successfully`);

        // Reset state
        setConfirmDelete(false);
        setIsDeleting(false);

        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }

        // Refresh the page to update the table
        router.refresh();
      } else {
        // Show error toast
        toast.error(result.error || 'Failed to delete tests');
        setIsDeleting(false);
      }
    } catch (error: any) {
      toast.error('Failed to delete tests');
      console.error('[BatchDeleteTestsDialog] Error:', error);
      setIsDeleting(false);
    }
  };

  // Reset checkbox when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmDelete(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Delete {count} Test{count > 1 ? 's' : ''}</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <div>
                Are you sure you want to delete{' '}
                <strong>
                  {count} test{count > 1 ? 's' : ''}
                </strong>
                ?
              </div>
              <div className="text-destructive font-medium">
                This action cannot be undone. All selected tests, including their
                configurations, test runs, and graph data will be permanently deleted.
              </div>

              {/* Confirmation Checkbox */}
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="confirm-batch-delete"
                  checked={confirmDelete}
                  onCheckedChange={(checked) => setConfirmDelete(checked === true)}
                  disabled={isDeleting}
                />
                <Label
                  htmlFor="confirm-batch-delete"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I understand this action cannot be undone
                </Label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || !confirmDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : `Delete ${count} Test${count > 1 ? 's' : ''}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
