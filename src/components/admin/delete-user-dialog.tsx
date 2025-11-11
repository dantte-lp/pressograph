/**
 * Delete User Dialog Component
 *
 * Confirmation dialog for deleting a user with proper warnings.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';
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
import { deleteUser } from '@/lib/actions/admin';
import { Loader2Icon } from 'lucide-react';

interface DeleteUserDialogProps {
  /**
   * Trigger button content
   */
  trigger: React.ReactNode;

  /**
   * User to delete
   */
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function DeleteUserDialog({ trigger, user }: DeleteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const result = await deleteUser(user.id);

      if (result.success) {
        toast({
          title: t('toast.success'),
          description: t('user.userDeleted', { name: user.name }),
        });
        setOpen(false);
        router.refresh();
      } else {
        toast({
          variant: 'destructive',
          title: t('toast.error'),
          description: result.error || t('user.failedToDeleteUser'),
        });
      }
    } catch (error) {
      console.error('Delete user error:', error);
      toast({
        variant: 'destructive',
        title: t('toast.error'),
        description: t('errors.unknownError'),
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
          <AlertDialogTitle>{t('user.areYouSure')}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              {t('user.cannotBeUndone')}
            </p>
            <div className="rounded-md bg-muted p-3 mt-2">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <p className="text-destructive font-medium mt-3">
              {t('user.allDataDeleted')}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            {t('user.deleteUser')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
