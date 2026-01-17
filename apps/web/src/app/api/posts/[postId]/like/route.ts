/**
 * Post Like API
 * Toggle like on a post
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withSecureAuth } from '@/lib/api-auth-secure';
import { logger } from '@/lib/logger';
import { getDefaultCampusId } from '@/lib/campus-context';

export const POST = withSecureAuth(
  async (
    request: Request,
    token: { uid: string },
    context: { params: Promise<{ postId: string }> }
  ) => {
    try {
      const { postId } = await context.params;
      const userId = token.uid;
      const campusId = getDefaultCampusId();

      // Get the post to verify it exists
      const postRef = dbAdmin.collection('posts').doc(postId);
      const postDoc = await postRef.get();

      if (!postDoc.exists) {
        return NextResponse.json(
          { success: false, error: 'Post not found' },
          { status: 404 }
        );
      }

      const postData = postDoc.data();

      // Verify post is from same campus
      if (postData?.campusId && postData.campusId !== campusId) {
        return NextResponse.json(
          { success: false, error: 'Post not found' },
          { status: 404 }
        );
      }

      // Check if user already liked
      const likeRef = dbAdmin
        .collection('posts')
        .doc(postId)
        .collection('likes')
        .doc(userId);

      const likeDoc = await likeRef.get();
      const isLiked = likeDoc.exists;

      if (isLiked) {
        // Unlike: remove the like document and decrement counter
        await likeRef.delete();
        await postRef.update({
          likes: FieldValue.increment(-1),
          'engagement.likes': FieldValue.increment(-1),
        });

        logger.info('Post unliked', { postId, userId });

        return NextResponse.json({
          success: true,
          isLiked: false,
          action: 'unliked',
        });
      } else {
        // Like: create like document and increment counter
        await likeRef.set({
          userId,
          postId,
          createdAt: new Date().toISOString(),
        });

        await postRef.update({
          likes: FieldValue.increment(1),
          'engagement.likes': FieldValue.increment(1),
        });

        // Create notification for post author (if not liking own post)
        if (postData?.authorId && postData.authorId !== userId) {
          try {
            await dbAdmin.collection('notifications').add({
              userId: postData.authorId,
              type: 'post_like',
              title: 'New like',
              message: 'Someone liked your post',
              data: {
                postId,
                likerId: userId,
              },
              read: false,
              campusId,
              createdAt: new Date().toISOString(),
            });
          } catch (notifError) {
            // Don't fail the like if notification fails
            logger.warn('Failed to create like notification', { error: notifError });
          }
        }

        logger.info('Post liked', { postId, userId });

        return NextResponse.json({
          success: true,
          isLiked: true,
          action: 'liked',
        });
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error('Like error', { error: errMsg });
      return NextResponse.json(
        { success: false, error: 'Failed to process like' },
        { status: 500 }
      );
    }
  },
  {
    allowAnonymous: false,
    rateLimit: { type: 'api' },
  }
);

// GET - Check if user has liked a post
export const GET = withSecureAuth(
  async (
    request: Request,
    token: { uid: string },
    context: { params: Promise<{ postId: string }> }
  ) => {
    try {
      const { postId } = await context.params;
      const userId = token.uid;

      const likeDoc = await dbAdmin
        .collection('posts')
        .doc(postId)
        .collection('likes')
        .doc(userId)
        .get();

      return NextResponse.json({
        success: true,
        isLiked: likeDoc.exists,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error('Check like error', { error: errMsg });
      return NextResponse.json(
        { success: false, error: 'Failed to check like status' },
        { status: 500 }
      );
    }
  },
  {
    allowAnonymous: false,
    rateLimit: { type: 'api' },
  }
);
