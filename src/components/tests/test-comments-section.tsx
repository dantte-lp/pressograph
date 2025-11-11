"use client";

/**
 * Test Comments Section Component
 *
 * Client component wrapper for handling comments with state management.
 * This component manages the comment list refresh logic.
 */

import { useState, useCallback } from "react";
import { TestCommentsList } from "./test-comments-list";
import { AddCommentForm } from "./add-comment-form";
import type { CommentWithAuthor } from "@/lib/actions/comments";

interface TestCommentsSectionProps {
  testId: string;
  initialComments: CommentWithAuthor[];
  currentUserId: string;
}

export function TestCommentsSection({
  testId,
  initialComments,
  currentUserId,
}: TestCommentsSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh comments from server
  const refreshComments = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Import dynamically to avoid issues with server components
      const { getTestComments } = await import("@/lib/actions/comments");
      const updatedComments = await getTestComments(testId);
      setComments(updatedComments);
    } catch (error) {
      console.error("[TestCommentsSection] Failed to refresh comments:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [testId]);

  return (
    <div className="space-y-6">
      {/* Add Comment Form */}
      <AddCommentForm testId={testId} onCommentAdded={refreshComments} />

      {/* Comments List */}
      <div className={isRefreshing ? "opacity-50 pointer-events-none" : ""}>
        <TestCommentsList
          comments={comments}
          currentUserId={currentUserId}
          onCommentUpdated={refreshComments}
          onCommentDeleted={refreshComments}
        />
      </div>
    </div>
  );
}
