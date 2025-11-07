'use client';

/**
 * Delete Project Dialog Component
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
import { deleteProject } from '@/lib/actions/projects';
import type { Project } from '@/lib/db/schema/projects';

interface DeleteProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProjectDialog({ project, open, onOpenChange }: DeleteProjectDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteProject(project.id);

      if (result.success) {
        // Close dialog first
        onOpenChange(false);

        // Show success toast
        toast.success('Project deleted successfully');

        // Reset state
        setConfirmDelete(false);
        setIsDeleting(false);

        // Redirect to projects page
        router.push('/projects');
        router.refresh();
      } else {
        // Show error toast
        toast.error(result.error || 'Failed to delete project');
        setIsDeleting(false);
      }
    } catch (error: any) {
      toast.error('Failed to delete project');
      console.error('[DeleteProjectDialog] Error:', error);
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
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <div>
                Are you sure you want to delete <strong>{project.name}</strong>?
              </div>
              <div className="text-destructive font-medium">
                This action cannot be undone. All pressure tests and related data
                within this project will be permanently deleted.
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
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
