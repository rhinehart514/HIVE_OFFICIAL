/**
 * Post Bookmark API
 * Toggle bookmark on a post
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
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

      // Check if user already bookmarked
      const bookmarkRef = dbAdmin
        .collection('users')
        .doc(userId)
        .collection('bookmarks')
        .doc(postId);

      const bookmarkDoc = await bookmarkRef.get();
      const isBookmarked = bookmarkDoc.exists;

      if (isBookmarked) {
        // Remove bookmark
        await bookmarkRef.delete();

        logger.info('Post unbookmarked', { postId, userId });

        return NextResponse.json({
          success: true,
          isBookmarked: false,
          action: 'unbookmarked',
        });
      } else {
        // Add bookmark
        await bookmarkRef.set({
          postId,
          postAuthorId: postData?.authorId,
          postTitle: postData?.title,
          postContent: postData?.content?.substring(0, 200),
          spaceId: postData?.spaceId,
          spaceName: postData?.spaceName,
          contentType: postData?.contentType,
          campusId,
          createdAt: new Date().toISOString(),
        });

        logger.info('Post bookmarked', { postId, userId });

        return NextResponse.json({
          success: true,
          isBookmarked: true,
          action: 'bookmarked',
        });
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error('Bookmark error', { error: errMsg });
      return NextResponse.json(
        { success: false, error: 'Failed to process bookmark' },
        { status: 500 }
      );
    }
  },
  {
    allowAnonymous: false,
    rateLimit: { type: 'api' },
  }
);

// GET - Check if user has bookmarked a post
export const GET = withSecureAuth(
  async (
    request: Request,
    token: { uid: string },
    context: { params: Promise<{ postId: string }> }
  ) => {
    try {
      const { postId } = await context.params;
      const userId = token.uid;

      const bookmarkDoc = await dbAdmin
        .collection('users')
        .doc(userId)
        .collection('bookmarks')
        .doc(postId)
        .get();

      return NextResponse.json({
        success: true,
        isBookmarked: bookmarkDoc.exists,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error('Check bookmark error', { error: errMsg });
      return NextResponse.json(
        { success: false, error: 'Failed to check bookmark status' },
        { status: 500 }
      );
    }
  },
  {
    allowAnonymous: false,
    rateLimit: { type: 'api' },
  }
);

// GET all bookmarks for user
export const dynamic = 'force-dynamic';
