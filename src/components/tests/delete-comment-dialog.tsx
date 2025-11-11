"use client";

/**
 * Delete Comment Dialog Component
 *
 * Confirmation dialog for deleting comments.
 * Simple confirmation without checkbox since comments are less critical than tests.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteComment } from "@/lib/actions/comments";

interface DeleteCommentDialogProps {
  commentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentDeleted?: () => void;
}

export function DeleteCommentDialog({
  commentId,
  open,
  onOpenChange,
  onCommentDeleted,
}: DeleteCommentDialogProps) {
  const t = useTranslations("comments");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteComment(commentId);
      toast.success(t("commentDeleted"));
      onOpenChange(false);
      onCommentDeleted?.();
    } catch (error: any) {
      toast.error(error.message || t("failedToDelete"));
      console.error("[DeleteCommentDialog] Error:", error);
    } finally {
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
            <AlertDialogTitle>{t("deleteComment")}</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-2 pt-2">
              <p>{t("confirmDelete")}</p>
              <p className="text-destructive font-medium">{t("confirmDeleteDescription")}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? `${t("saving")}...` : t("deleteComment")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
