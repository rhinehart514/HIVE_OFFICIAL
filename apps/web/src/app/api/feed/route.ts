/**
 * Feed API Route - Firebase Direct Implementation with Caching
 * Provides feed data from Firestore with Next.js caching optimization
 */

import { type NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { dbAdmin } from '@/lib/firebase-admin';
import { withSecureAuth } from '@/lib/api-auth-secure';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';

// Feed query schema
const FeedQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
  type: z.enum(['all', 'spaces', 'events', 'posts']).default('all'),
  spaceId: z.string().optional()
});

// Cached feed fetcher - 60 second cache with tags for revalidation
const getCachedFeed = unstable_cache(
  async (
    campusId: string,
    limit: number,
    type: string,
    spaceId?: string,
    cursor?: string
  ) => {
    const postsRef = dbAdmin.collection('posts');
    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = postsRef
      .where('campusId', '==', campusId)
      .where('isActive', '==', true)
      .where('isDeleted', '!=', true);

    if (type !== 'all') {
      q = q.where('type', '==', type);
    }
    if (spaceId) {
      q = q.where('spaceId', '==', spaceId);
    }

    q = q.orderBy('createdAt', 'desc');

    if (cursor) {
      const cursorSnap = await postsRef.doc(cursor).get();
      if (cursorSnap.exists) {
        q = q.startAfter(cursorSnap);
      }
    }

    q = q.limit(limit);

    const snapshot = await q.get();

    const posts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date()
      };
    });

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = lastDoc?.id;

    return {
      posts,
      pagination: {
        limit,
        cursor,
        nextCursor,
        hasMore: posts.length === limit
      }
    };
  },
  ['feed-cache'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['feed', 'posts']
  }
);

export const GET = withSecureAuth(
  async (request: NextRequest, token) => {
    try {
      const { searchParams } = new URL(request.url);
      const params = FeedQuerySchema.parse({
        limit: searchParams.get('limit'),
        cursor: searchParams.get('cursor'),
        type: searchParams.get('type'),
        spaceId: searchParams.get('spaceId')
      });

      const campusId = CURRENT_CAMPUS_ID;

      // Use cached feed fetcher
      const result = await getCachedFeed(
        campusId,
        params.limit,
        params.type,
        params.spaceId,
        params.cursor
      );

      logger.info('Feed fetched', {
        userId: token.uid,
        count: result.posts.length,
        type: params.type,
        cached: true
      });

      return NextResponse.json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Feed fetch error', { error: error instanceof Error ? error : new Error(String(error)) });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch feed' },
        { status: 500 }
      );
    }
  },
  {
    allowAnonymous: false,
    rateLimit: { type: 'api' }
  }
);
