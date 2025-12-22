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
import { getCurrentUser } from '@/lib/server-auth';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import { NextRequest, NextResponse } from 'next/server';

const FieldValue = admin.firestore.FieldValue;

/**
 * POST /api/comments/[commentId]/like
 * Toggle like on a comment
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await context.params;
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

      const likeRef = commentRef.collection('likes').doc(user.uid);
      const likeDoc = await likeRef.get();

      if (likeDoc.exists) {
        // Unlike
        await likeRef.delete();
        await commentRef.update({
          likeCount: FieldValue.increment(-1),
        });
        return NextResponse.json({ liked: false });
      } else {
        // Like
        await likeRef.set({
          userId: user.uid,
          createdAt: new Date(),
        });
        await commentRef.update({
          likeCount: FieldValue.increment(1),
        });
        return NextResponse.json({ liked: true });
      }
    }

    // Fallback: Search for the comment in recent posts (less efficient)
    const postsSnapshot = await dbAdmin
      .collection('posts')
      .where('campusId', '==', CURRENT_CAMPUS_ID)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    for (const postDoc of postsSnapshot.docs) {
      const commentRef = postDoc.ref.collection('comments').doc(commentId);
      const commentDoc = await commentRef.get();

      if (commentDoc.exists) {
        const likeRef = commentRef.collection('likes').doc(user.uid);
        const likeDoc = await likeRef.get();

        if (likeDoc.exists) {
          // Unlike
          await likeRef.delete();
          await commentRef.update({
            likeCount: FieldValue.increment(-1),
          });
          return NextResponse.json({ liked: false });
        } else {
          // Like
          await likeRef.set({
            userId: user.uid,
            createdAt: new Date(),
          });
          await commentRef.update({
            likeCount: FieldValue.increment(1),
          });
          return NextResponse.json({ liked: true });
        }
      }
    }

    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  } catch (error) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
