/**
 * Delete Organization Dialog Component
 *
 * Confirmation dialog for deleting an organization with dependency checks.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteOrganization } from '@/lib/actions/admin';
import { Loader2Icon } from 'lucide-react';

interface DeleteOrganizationDialogProps {
  /**
   * Trigger button content
   */
  trigger: React.ReactNode;

  /**
   * Organization to delete
   */
  organization: {
    id: string;
    name: string;
    slug: string;
    userCount: number;
    projectCount: number;
  };
}

export function DeleteOrganizationDialog({
  trigger,
  organization,
}: DeleteOrganizationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const hasDependencies = organization.userCount > 0 || organization.projectCount > 0;

  async function handleDelete() {
    if (hasDependencies) {
      toast({
        variant: 'destructive',
        title: 'Cannot Delete',
        description: 'Please remove all users and projects before deleting this organization.',
      });
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteOrganization(organization.id);

      if (result.success) {
        toast({
          title: 'Success',
          description: `Organization ${organization.name} has been deleted`,
        });
        setOpen(false);
        router.refresh();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to delete organization',
        });
      }
    } catch (error) {
      console.error('Delete organization error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasDependencies ? 'Cannot Delete Organization' : 'Are you absolutely sure?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {hasDependencies ? (
              <>
                <p>
                  This organization cannot be deleted because it has associated data:
                </p>
                <div className="rounded-md bg-muted p-3 mt-2">
                  <p className="font-medium">{organization.name}</p>
                  <p className="text-sm text-muted-foreground">{organization.slug}</p>
                  <div className="mt-2 space-y-1">
                    {organization.userCount > 0 && (
                      <p className="text-sm text-destructive">
                        {organization.userCount} user(s)
                      </p>
                    )}
                    {organization.projectCount > 0 && (
                      <p className="text-sm text-destructive">
                        {organization.projectCount} project(s)
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-3">
                  Please reassign or delete all users and projects before deleting this organization.
                </p>
              </>
            ) : (
              <>
                <p>
                  This action cannot be undone. This will permanently delete the organization:
                </p>
                <div className="rounded-md bg-muted p-3 mt-2">
                  <p className="font-medium">{organization.name}</p>
                  <p className="text-sm text-muted-foreground">{organization.slug}</p>
                </div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {hasDependencies ? 'Close' : 'Cancel'}
          </AlertDialogCancel>
          {!hasDependencies && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Delete Organization
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
