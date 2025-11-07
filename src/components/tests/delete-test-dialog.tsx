'use client';

/**
 * Delete Test Dialog Component
 *
 * Provides a confirmation dialog for deleting pressure tests.
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
import { deleteTest } from '@/lib/actions/tests';

interface DeleteTestDialogProps {
  testId: string;
  testNumber: string;
  testName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTestDialog({
  testId,
  testNumber,
  testName,
  open,
  onOpenChange
}: DeleteTestDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteTest(testId);

      if (result.success) {
        // Close dialog first
        onOpenChange(false);

        // Show success toast
        toast.success(`Test ${testNumber} deleted successfully`);

        // Reset state
        setConfirmDelete(false);
        setIsDeleting(false);

        // Refresh the page to update the table
        router.refresh();
      } else {
        // Show error toast
        toast.error(result.error || 'Failed to delete test');
        setIsDeleting(false);
      }
    } catch (error: any) {
      toast.error('Failed to delete test');
      console.error('[DeleteTestDialog] Error:', error);
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
            <AlertDialogTitle>Delete Test</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <div>
                Are you sure you want to delete test{' '}
                <strong>
                  {testNumber}
                  {testName ? ` (${testName})` : ''}
                </strong>
                ?
              </div>
              <div className="text-destructive font-medium">
                This action cannot be undone. The test configuration, all test runs,
                and graph data will be permanently deleted.
              </div>

              {/* Confirmation Checkbox */}
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="confirm-delete"
                  checked={confirmDelete}
                  onCheckedChange={(checked) => setConfirmDelete(checked === true)}
                  disabled={isDeleting}
                />
                <Label
                  htmlFor="confirm-delete"
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
            {isDeleting ? 'Deleting...' : 'Delete Test'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
