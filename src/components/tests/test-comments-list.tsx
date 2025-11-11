"use client";

/**
 * Test Comments List Component
 *
 * Displays all comments for a pressure test with:
 * - Markdown rendering support
 * - Author information and timestamps
 * - Edit/delete actions for comment authors
 * - Empty state for no comments
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare, Pencil, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/ui/relative-time";
import { EditCommentDialog } from "./edit-comment-dialog";
import { DeleteCommentDialog } from "./delete-comment-dialog";
import type { CommentWithAuthor } from "@/lib/actions/comments";

interface TestCommentsListProps {
  comments: CommentWithAuthor[];
  currentUserId: string;
  onCommentUpdated?: () => void;
  onCommentDeleted?: () => void;
}

export function TestCommentsList({
  comments,
  currentUserId,
  onCommentUpdated,
  onCommentDeleted,
}: TestCommentsListProps) {
  const t = useTranslations("comments");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{t("noComments")}</h3>
        <p className="text-sm text-muted-foreground">{t("noCommentsDescription")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const isAuthor = comment.author.id === currentUserId;
        const authorInitials = comment.author.name
          ? comment.author.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : comment.author.username.slice(0, 2).toUpperCase();

        return (
          <Card key={comment.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author.image || undefined} />
                    <AvatarFallback>{authorInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {comment.author.name || comment.author.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        <RelativeTime date={comment.createdAt} />
                      </span>
                      {comment.isEdited && (
                        <span className="text-xs text-muted-foreground italic">
                          ({t("edited")})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isAuthor && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCommentId(comment.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">{t("editComment")}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingCommentId(comment.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t("deleteComment")}</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {comment.content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Edit Comment Dialog */}
      {editingCommentId && (
        <EditCommentDialog
          commentId={editingCommentId}
          initialContent={
            comments.find((c) => c.id === editingCommentId)?.content || ""
          }
          open={!!editingCommentId}
          onOpenChange={(open) => {
            if (!open) setEditingCommentId(null);
          }}
          onCommentUpdated={() => {
            setEditingCommentId(null);
            onCommentUpdated?.();
          }}
        />
      )}

      {/* Delete Comment Dialog */}
      {deletingCommentId && (
        <DeleteCommentDialog
          commentId={deletingCommentId}
          open={!!deletingCommentId}
          onOpenChange={(open) => {
            if (!open) setDeletingCommentId(null);
          }}
          onCommentDeleted={() => {
            setDeletingCommentId(null);
            onCommentDeleted?.();
          }}
        />
      )}
    </div>
  );
}
