/**
 * Comment Like API
 *
 * POST /api/comments/[commentId]/like - Toggle like on a comment
 *
 * Note: Since comments are in subcollections, we need to search for the comment
 * across posts. In production, consider storing a flat comments collection.
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { withAuthAndErrors, getUserId, getCampusId } from '@/lib/middleware';
import { createNotification } from '@/lib/notification-service';

const FieldValue = admin.firestore.FieldValue;

/**
 * POST /api/comments/[commentId]/like
 * Toggle like on a comment
 */
export const POST = withAuthAndErrors(async (request, context: { params: Promise<{ commentId: string }> }, respond) => {
  const { commentId } = await context.params;
  const userId = getUserId(request);
  const campusId = getCampusId(request);

  // Try to get postId from request body (more efficient)
  let postId: string | null = null;
  try {
    const body = await request.json();
    postId = body.postId;
  } catch {
    // Body might be empty, that's fine
  }

  // If we have postId, use it directly
  if (postId) {
    const commentRef = dbAdmin
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .doc(commentId);

    const likeRef = commentRef.collection('likes').doc(userId);
    const likeDoc = await likeRef.get();

    if (likeDoc.exists) {
      // Unlike
      await likeRef.delete();
      await commentRef.update({
        likeCount: FieldValue.increment(-1),
      });
      return respond.success({ liked: false });
    } else {
      // Like
      await likeRef.set({
        userId,
        createdAt: new Date(),
      });
      await commentRef.update({
        likeCount: FieldValue.increment(1),
      });

      // Notify comment author
      const commentData = (await commentRef.get()).data();
      const authorId = commentData?.authorId || commentData?.userId;
      if (authorId && authorId !== userId) {
        createNotification({
          userId: authorId,
          type: 'like',
          category: 'social',
          title: 'Someone liked your comment',
          actionUrl: `/post/${postId}`,
          metadata: { actorId: userId, postId, commentId },
        }).catch(() => {});
      }

      return respond.success({ liked: true });
    }
  }

  // Fallback: Search for the comment in recent posts (less efficient)
  // campusId filter omitted (index exempted); filter in-memory after fetch
  const postsSnapshot = await dbAdmin
    .collection('posts')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  for (const postDoc of postsSnapshot.docs) {
    const postData = postDoc.data();
    if (postData.campusId && postData.campusId !== campusId) continue;
    const commentRef = postDoc.ref.collection('comments').doc(commentId);
    const commentDoc = await commentRef.get();

    if (commentDoc.exists) {
      const likeRef = commentRef.collection('likes').doc(userId);
      const likeDoc = await likeRef.get();

      if (likeDoc.exists) {
        // Unlike
        await likeRef.delete();
        await commentRef.update({
          likeCount: FieldValue.increment(-1),
        });
        return respond.success({ liked: false });
      } else {
        // Like
        await likeRef.set({
          userId,
          createdAt: new Date(),
        });
        await commentRef.update({
          likeCount: FieldValue.increment(1),
        });

        // Notify comment author
        const fallbackCommentData = commentDoc.data();
        const fallbackAuthorId = fallbackCommentData?.authorId || fallbackCommentData?.userId;
        if (fallbackAuthorId && fallbackAuthorId !== userId) {
          createNotification({
            userId: fallbackAuthorId,
            type: 'like',
            category: 'social',
            title: 'Someone liked your comment',
            actionUrl: `/post/${postDoc.id}`,
            metadata: { actorId: userId, postId: postDoc.id, commentId },
          }).catch(() => {});
        }

        return respond.success({ liked: true });
      }
    }
  }

  return respond.error('Comment not found', 'NOT_FOUND', { status: 404 });
});
