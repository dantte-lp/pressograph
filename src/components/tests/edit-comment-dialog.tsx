"use client";

/**
 * Edit Comment Dialog Component
 *
 * Modal dialog for editing existing comments.
 * Features:
 * - Markdown support
 * - Character count validation
 * - Cancel to revert changes
 */

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateComment } from "@/lib/actions/comments";

interface EditCommentDialogProps {
  commentId: string;
  initialContent: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentUpdated?: () => void;
}

export function EditCommentDialog({
  commentId,
  initialContent,
  open,
  onOpenChange,
  onCommentUpdated,
}: EditCommentDialogProps) {
  const t = useTranslations("comments");
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset content when dialog opens/closes or initial content changes
  useEffect(() => {
    if (open) {
      setContent(initialContent);
    }
  }, [open, initialContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Comment content cannot be empty");
      return;
    }

    if (content.length > 10000) {
      toast.error("Comment is too long (max 10000 characters)");
      return;
    }

    // No changes made
    if (content.trim() === initialContent.trim()) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    try {
      await updateComment(commentId, content);
      toast.success(t("commentUpdated"));
      onOpenChange(false);
      onCommentUpdated?.();
    } catch (error: any) {
      toast.error(error.message || t("failedToUpdate"));
      console.error("[EditCommentDialog] Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > 10000;
  const hasChanges = content.trim() !== initialContent.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              {t("editComment")}
            </DialogTitle>
            <DialogDescription>{t("markdownSupport")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-comment-content">{t("placeholder")}</Label>
              <Textarea
                id="edit-comment-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("placeholder")}
                rows={6}
                disabled={isSubmitting}
                className="resize-y min-h-[150px]"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("markdownHint")}</span>
                <span className={isOverLimit ? "text-destructive font-medium" : ""}>
                  {charCount.toLocaleString()} / 10,000
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim() || isOverLimit || !hasChanges}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("save")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
