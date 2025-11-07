'use client';

/**
 * Delete Project Dialog Component
 */

import { useState } from 'react';
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
import { toast } from 'sonner';
import { deleteProject } from '@/lib/actions/projects';
import type { Project } from '@/lib/db/schema/projects';

interface DeleteProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProjectDialog({ project, open, onOpenChange }: DeleteProjectDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteProject(project.id);
      // If we reach here, deleteProject redirected successfully
      // The redirect throws a NEXT_REDIRECT error which is caught below
    } catch (error: any) {
      // Check if this is a Next.js redirect (which is expected and means success)
      if (error?.digest?.startsWith('NEXT_REDIRECT')) {
        // Redirect was successful, show success toast
        toast.success('Project deleted successfully');
        onOpenChange(false);
        return;
      }

      // Otherwise, it's an actual error
      toast.error('Failed to delete project');
      console.error('[DeleteProjectDialog] Error:', error);
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-2 pt-2">
              <div>
                Are you sure you want to delete <strong>{project.name}</strong>?
              </div>
              <div className="text-destructive font-medium">
                This action cannot be undone. All pressure tests and related data
                within this project will be permanently deleted.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
