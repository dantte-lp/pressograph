"use client";

/**
 * Add Comment Form Component
 *
 * Form for adding new comments to pressure tests.
 * Features:
 * - Markdown support with syntax hint
 * - Character count validation
 * - Optimistic UI updates
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createComment } from "@/lib/actions/comments";

interface AddCommentFormProps {
  testId: string;
  onCommentAdded?: () => void;
}

export function AddCommentForm({ testId, onCommentAdded }: AddCommentFormProps) {
  const t = useTranslations("comments");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    try {
      await createComment(testId, content);
      toast.success(t("commentAdded"));
      setContent("");
      onCommentAdded?.();
    } catch (error: any) {
      toast.error(error.message || t("failedToAdd"));
      console.error("[AddCommentForm] Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > 10000;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquarePlus className="h-5 w-5" />
          {t("addComment")}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comment-content">{t("placeholder")}</Label>
            <Textarea
              id="comment-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("placeholder")}
              rows={4}
              disabled={isSubmitting}
              className="resize-y min-h-[100px]"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("markdownHint")}</span>
              <span className={isOverLimit ? "text-destructive font-medium" : ""}>
                {charCount.toLocaleString()} / 10,000
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setContent("")}
            disabled={isSubmitting || !content}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting || !content.trim() || isOverLimit}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              t("save")
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
