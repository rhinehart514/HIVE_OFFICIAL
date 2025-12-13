import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as _admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { logger } from "@/lib/logger";
import { ApiResponseHelper, HttpStatus, ErrorCodes as _ErrorCodes } from "@/lib/api-response-types";
import { dbAdmin } from '@/lib/firebase-admin';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';

// =============================================================================
// Inlined Feed Functions (previously from @/lib/real-time-feed)
// =============================================================================

interface FeedUpdate {
  hasNewPosts: boolean;
  newPostCount: number;
  lastPostAt: string | null;
  lastCheckedAt: string;
}

/**
 * Get feed updates for a user
 */
async function getFeedUpdates(userId: string): Promise<FeedUpdate | null> {
  try {
    // Get user's spaces
    const membershipsSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .where('campusId', '==', CURRENT_CAMPUS_ID)
      .get();

    if (membershipsSnapshot.empty) {
      return null;
    }

    const spaceIds = membershipsSnapshot.docs.map(doc => doc.data().spaceId);

    // Get user's last viewed timestamp
    const userFeedStateDoc = await dbAdmin
      .collection('userFeedState')
      .doc(userId)
      .get();

    const lastViewedAt = userFeedStateDoc.exists
      ? (userFeedStateDoc.data()?.lastViewedAt || new Date(0).toISOString())
      : new Date(0).toISOString();

    // Count new posts since last viewed
    let newPostCount = 0;
    let lastPostAt: string | null = null;

    // Query posts in batches (Firestore 'in' query limit is 10)
    const batches: string[][] = [];
    for (let i = 0; i < spaceIds.length; i += 10) {
      batches.push(spaceIds.slice(i, i + 10));
    }

    for (const batch of batches) {
      const postsSnapshot = await dbAdmin
        .collection('posts')
        .where('spaceId', 'in', batch)
        .where('createdAt', '>', lastViewedAt)
        .where('status', '==', 'published')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      newPostCount += postsSnapshot.size;

      if (postsSnapshot.docs.length > 0 && !lastPostAt) {
        lastPostAt = postsSnapshot.docs[0].data().createdAt;
      }
    }

    return {
      hasNewPosts: newPostCount > 0,
      newPostCount,
      lastPostAt,
      lastCheckedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error getting feed updates', { userId, error });
    return null;
  }
}

/**
 * Mark feed items as viewed
 */
async function markFeedAsViewed(userId: string, itemIds: string[]): Promise<void> {
  try {
    const batch = dbAdmin.batch();

    // Update user's last viewed timestamp
    const userFeedStateRef = dbAdmin.collection('userFeedState').doc(userId);
    batch.set(
      userFeedStateRef,
      {
        lastViewedAt: new Date().toISOString(),
        lastViewedItemIds: itemIds.slice(0, 20), // Keep last 20
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Mark individual items as viewed
    for (const itemId of itemIds.slice(0, 50)) {
      const viewedRef = dbAdmin
        .collection('userFeedViews')
        .doc(`${userId}_${itemId}`);
      batch.set(viewedRef, {
        userId,
        itemId,
        viewedAt: new Date().toISOString(),
      });
    }

    await batch.commit();
  } catch (error) {
    logger.error('Error marking feed as viewed', { userId, itemIds, error });
    throw error;
  }
}

/**
 * Force refresh feed cache for a user
 */
async function refreshFeedCache(userId: string): Promise<FeedUpdate | null> {
  try {
    // Clear any cached state and re-fetch
    await dbAdmin.collection('userFeedState').doc(userId).delete();
    return await getFeedUpdates(userId);
  } catch (error) {
    logger.error('Error refreshing feed cache', { userId, error });
    return null;
  }
}

// Real-time feed update schema
const FeedUpdateQuerySchema = z.object({
  action: z.enum(['check', 'mark_viewed', 'force_refresh']).default('check'),
  itemIds: z.string().optional(), // Comma-separated for mark_viewed
});

/**
 * Real-time Feed Updates API
 * 
 * GET ?action=check - Check for new feed updates
 * POST ?action=mark_viewed - Mark items as viewed
 * POST ?action=force_refresh - Force refresh feed cache
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { action } = FeedUpdateQuerySchema.parse(queryParams);

    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(ApiResponseHelper.error("Authorization header required", "UNAUTHORIZED"), { status: HttpStatus.UNAUTHORIZED });
    }

    const token = authHeader.substring(7);
    let userId: string;

    // SECURITY: Always verify token with Firebase Admin
    try {
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch {
      return NextResponse.json(ApiResponseHelper.error("Invalid or expired token", "UNAUTHORIZED"), { status: HttpStatus.UNAUTHORIZED });
    }

    logger.info('🔄 Feed update request:for user', { action, userId, endpoint: '/api/feed/updates' });

    switch (action) {
      case 'check': {
        const updates = await getFeedUpdates(userId);
        
        return NextResponse.json({
          success: true,
          hasUpdates: updates !== null,
          update: updates,
          timestamp: new Date().toISOString()
        });
      }

      case 'force_refresh': {
        const refreshResult = await refreshFeedCache(userId);
        
        return NextResponse.json({
          success: true,
          update: refreshResult,
          message: 'Feed cache refreshed',
          timestamp: new Date().toISOString()
        });
      }

      default:
        return NextResponse.json(ApiResponseHelper.error("Invalid action for GET request", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
    }

  } catch (error: unknown) {
    logger.error(
      `Feed updates API error at /api/feed/updates`,
      { error: error instanceof Error ? error.message : String(error) }
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    return NextResponse.json(ApiResponseHelper.error("Internal server error", "INTERNAL_ERROR"), { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { action, itemIds } = FeedUpdateQuerySchema.parse(queryParams);

    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(ApiResponseHelper.error("Authorization header required", "UNAUTHORIZED"), { status: HttpStatus.UNAUTHORIZED });
    }

    const token = authHeader.substring(7);
    let userId: string;

    // SECURITY: Always verify token with Firebase Admin
    try {
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch {
      return NextResponse.json(ApiResponseHelper.error("Invalid or expired token", "UNAUTHORIZED"), { status: HttpStatus.UNAUTHORIZED });
    }

    logger.info('🔄 Feed POST request:for user', { action, userId, endpoint: '/api/feed/updates' });

    switch (action) {
      case 'mark_viewed': {
        if (!itemIds) {
          return NextResponse.json(ApiResponseHelper.error("itemIds parameter required for mark_viewed action", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
        }

        const itemIdArray = itemIds.split(',').map(id => id.trim()).filter(Boolean);
        
        if (itemIdArray.length === 0) {
          return NextResponse.json(ApiResponseHelper.error("At least one valid itemId required", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
        }

        await markFeedAsViewed(userId, itemIdArray);

        return NextResponse.json({
          success: true,
          message: `Marked ${itemIdArray.length} items as viewed`,
          itemIds: itemIdArray,
          timestamp: new Date().toISOString()
        });
      }

      case 'force_refresh': {
        const refreshResult = await refreshFeedCache(userId);
        
        return NextResponse.json({
          success: true,
          update: refreshResult,
          message: 'Feed cache refreshed',
          timestamp: new Date().toISOString()
        });
      }

      default:
        return NextResponse.json(ApiResponseHelper.error("Invalid action for POST request", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
    }

  } catch (error: unknown) {
    logger.error(
      `Feed updates POST API error at /api/feed/updates`,
      { error: error instanceof Error ? error.message : String(error) }
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    return NextResponse.json(ApiResponseHelper.error("Internal server error", "INTERNAL_ERROR"), { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
}