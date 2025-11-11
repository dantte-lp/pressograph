"use server";

import { db } from "@/lib/db";
import { testComments } from "@/lib/db/schema/test-comments";
import { users } from "@/lib/db/schema/users";
import { pressureTests } from "@/lib/db/schema/pressure-tests";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/server-auth";
import { revalidatePath } from "next/cache";

/**
 * Comment with author info
 */
export interface CommentWithAuthor {
  id: string;
  pressureTestId: string;
  content: string;
  isEdited: boolean;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
}

/**
 * Get all comments for a pressure test
 */
export async function getTestComments(
  testId: string
): Promise<CommentWithAuthor[]> {
  const session = await requireAuth();
  const organizationId = session.user.organizationId as string;

  // Verify user has access to the test
  const [test] = await db
    .select()
    .from(pressureTests)
    .where(
      and(
        eq(pressureTests.id, testId),
        eq(pressureTests.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!test) {
    throw new Error("Test not found or access denied");
  }

  const comments = await db
    .select({
      id: testComments.id,
      pressureTestId: testComments.pressureTestId,
      content: testComments.content,
      isEdited: testComments.isEdited,
      editedAt: testComments.editedAt,
      createdAt: testComments.createdAt,
      updatedAt: testComments.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
        image: users.image,
      },
    })
    .from(testComments)
    .innerJoin(users, eq(testComments.authorId, users.id))
    .where(eq(testComments.pressureTestId, testId))
    .orderBy(desc(testComments.createdAt));

  return comments;
}

/**
 * Create a new comment on a pressure test
 */
export async function createComment(testId: string, content: string) {
  const session = await requireAuth();
  const userId = session.user.id as string;
  const organizationId = session.user.organizationId as string;

  // Verify user has access to the test
  const [test] = await db
    .select()
    .from(pressureTests)
    .where(
      and(
        eq(pressureTests.id, testId),
        eq(pressureTests.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!test) {
    throw new Error("Test not found or access denied");
  }

  // Validate content
  if (!content.trim()) {
    throw new Error("Comment content cannot be empty");
  }

  if (content.length > 10000) {
    throw new Error("Comment content is too long (max 10000 characters)");
  }

  const [comment] = await db
    .insert(testComments)
    .values({
      pressureTestId: testId,
      authorId: userId,
      content: content.trim(),
      isEdited: false,
    })
    .returning();

  revalidatePath(`/tests/${testId}`);
  revalidatePath("/tests");

  return comment;
}

/**
 * Update an existing comment (author only)
 */
export async function updateComment(commentId: string, content: string) {
  const session = await requireAuth();
  const userId = session.user.id as string;

  // Validate content
  if (!content.trim()) {
    throw new Error("Comment content cannot be empty");
  }

  if (content.length > 10000) {
    throw new Error("Comment content is too long (max 10000 characters)");
  }

  // Only allow updating own comments
  const [comment] = await db
    .update(testComments)
    .set({
      content: content.trim(),
      isEdited: true,
      editedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(testComments.id, commentId), eq(testComments.authorId, userId)))
    .returning();

  if (!comment) {
    throw new Error("Comment not found or you don't have permission to edit it");
  }

  revalidatePath(`/tests/${comment.pressureTestId}`);
  revalidatePath("/tests");

  return comment;
}

/**
 * Delete a comment (author only)
 */
export async function deleteComment(commentId: string) {
  const session = await requireAuth();
  const userId = session.user.id as string;

  // Only allow deleting own comments
  const [deleted] = await db
    .delete(testComments)
    .where(and(eq(testComments.id, commentId), eq(testComments.authorId, userId)))
    .returning();

  if (!deleted) {
    throw new Error("Comment not found or you don't have permission to delete it");
  }

  revalidatePath(`/tests/${deleted.pressureTestId}`);
  revalidatePath("/tests");

  return { success: true };
}

/**
 * Get comment count for a pressure test
 */
export async function getCommentCount(testId: string): Promise<number> {
  const session = await requireAuth();
  const organizationId = session.user.organizationId as string;

  // Verify user has access to the test
  const [test] = await db
    .select()
    .from(pressureTests)
    .where(
      and(
        eq(pressureTests.id, testId),
        eq(pressureTests.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!test) {
    return 0;
  }

  const result = await db
    .select()
    .from(testComments)
    .where(eq(testComments.pressureTestId, testId));

  return result.length;
}
