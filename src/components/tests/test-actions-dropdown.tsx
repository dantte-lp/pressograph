'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';
import { MoreVerticalIcon, DownloadIcon, Share2Icon, CopyIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { deleteTest } from '@/lib/actions/tests';
import type { TestDetail } from '@/lib/actions/tests';

interface TestActionsDropdownProps {
  test: TestDetail;
}

export function TestActionsDropdown({ test }: TestActionsDropdownProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = async () => {
    toast.info(t('tests.downloadFeatureComingSoon'));
  };

  const handleShare = async () => {
    toast.info(t('tests.shareFeatureComingSoon'));
  };

  const handleDuplicate = () => {
    router.push(`/tests/new?duplicate=${test.id}` as any);
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteTest(test.id);

      if (result.success) {
        toast.success(t('tests.testDeletedSuccess'));
        setShowDeleteDialog(false);
        router.push('/tests');
        router.refresh();
      } else {
        toast.error(result.error || t('tests.failedToDeleteTest'));
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error(t('errors.unknownError'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVerticalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleDownload}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            {t('tests.downloadGraph')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare}>
            <Share2Icon className="mr-2 h-4 w-4" />
            {t('tests.share')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <CopyIcon className="mr-2 h-4 w-4" />
            {t('tests.duplicate')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive">
            <Trash2Icon className="mr-2 h-4 w-4" />
            {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tests.deleteTestConfirm')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  {t('tests.deleteTestQuestion', { testNumber: test.testNumber })}
                </p>
                <p>{t('tests.thisActionCannotBeUndone')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('tests.deleting') : t('tests.deleteTest')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
