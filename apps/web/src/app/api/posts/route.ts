/**
 * Posts API
 * Create and list posts in the feed
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { withSecureAuth } from '@/lib/api-auth-secure';
import { logger } from '@/lib/logger';
import { getDefaultCampusId } from '@/lib/campus-context';
import { z } from 'zod';

// Post creation schema
const CreatePostSchema = z.object({
  content: z.string().min(1).max(5000),
  contentType: z.enum(['user_post', 'builder_announcement']).default('user_post'),
  spaceId: z.string().optional(),
  visibility: z.enum(['public', 'private', 'members_only']).default('public'),
});

// POST - Create a new post
export const POST = withSecureAuth(
  async (request: Request, token: { uid: string }) => {
    try {
      const userId = token.uid;
      const campusId = getDefaultCampusId();

      // Parse and validate body
      const body = await request.json();
      const validation = CreatePostSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid input',
            details: validation.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const { content, contentType, spaceId, visibility } = validation.data;

      // If posting to a space, verify membership
      if (spaceId) {
        const memberSnap = await dbAdmin
          .collection('spaceMembers')
          .where('spaceId', '==', spaceId)
          .where('userId', '==', userId)
          .where('campusId', '==', campusId)
          .limit(1)
          .get();

        if (memberSnap.empty) {
          return NextResponse.json(
            { success: false, error: 'You must be a member to post in this space' },
            { status: 403 }
          );
        }
      }

      // Get user info for author data
      const userDoc = await dbAdmin.collection('users').doc(userId).get();
      const userData = userDoc.data();

      // Create post
      const now = new Date().toISOString();
      const post = {
        content,
        contentType,
        spaceId: spaceId || null,
        visibility,
        authorId: userId,
        authorName: userData?.displayName || 'HIVE User',
        authorHandle: userData?.handle || 'user',
        authorAvatar: userData?.photoURL || null,
        authorRole: userData?.role || 'member',
        campusId,
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
        },
        likes: 0,
        isHidden: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await dbAdmin.collection('posts').add(post);

      // If in a space, increment the space's post count
      if (spaceId) {
        const { FieldValue } = await import('firebase-admin/firestore');
        await dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .update({
            postCount: FieldValue.increment(1),
            updatedAt: now,
          })
          .catch(() => {
            // Don't fail if space update fails
          });
      }

      logger.info('Post created', { postId: docRef.id, userId, spaceId });

      return NextResponse.json({
        success: true,
        post: {
          id: docRef.id,
          ...post,
        },
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error('Create post error', { error: errMsg });
      return NextResponse.json(
        { success: false, error: 'Failed to create post' },
        { status: 500 }
      );
    }
  },
  {
    allowAnonymous: false,
    rateLimit: { type: 'api' },
  }
);

// GET - List posts (simple endpoint, main feed at /api/feed)
export const GET = withSecureAuth(
  async (request: Request, token: { uid: string }) => {
    try {
      const { searchParams } = new URL(request.url);
      const campusId = getDefaultCampusId();
      const userId = token.uid;
      const spaceId = searchParams.get('spaceId');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

      let query = dbAdmin
        .collection('posts')
        .where('campusId', '==', campusId)
        .where('isDeleted', '==', false)
        .where('isHidden', '==', false);

      if (spaceId) {
        query = query.where('spaceId', '==', spaceId);
      }

      query = query.orderBy('createdAt', 'desc').limit(limit);

      const snapshot = await query.get();

      const posts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return NextResponse.json({
        success: true,
        posts,
        pagination: {
          limit,
          count: posts.length,
        },
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error('Fetch posts error', { error: errMsg });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch posts' },
        { status: 500 }
      );
    }
  },
  {
    allowAnonymous: false,
    rateLimit: { type: 'api' },
  }
);
