import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  withAuthValidationAndErrors,
  respond,
  getUserId,
  type ResponseFormatter,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import { logger } from '@/lib/logger';
import { enforceRateLimit } from '@/lib/secure-rate-limiter';

/**
 * Waitlist API
 *
 * POST /api/spaces/waitlist - Join waitlist for locked major space
 * GET /api/spaces/waitlist/status?spaceId=xxx - Check if user is on waitlist
 */

// POST schema - join waitlist
const joinWaitlistSchema = z.object({
  spaceId: z.string().min(1, 'Space ID is required'),
  majorName: z.string().optional(),
});

type JoinWaitlistBody = z.infer<typeof joinWaitlistSchema>;

/**
 * POST - Join waitlist for a locked major space
 */
export const POST = withAuthValidationAndErrors(
  joinWaitlistSchema,
  async (
    request,
    _ctx: Record<string, string | string[]>,
    body: JoinWaitlistBody,
    _respondFmt: typeof ResponseFormatter
  ) => {
    // Rate limit
    const rateLimitResult = await enforceRateLimit('standard', request as NextRequest);
    if (!rateLimitResult.allowed) {
      return respond.error(
        rateLimitResult.error || 'Too many requests',
        'RATE_LIMITED',
        { status: rateLimitResult.status }
      );
    }

    const userId = getUserId(request as unknown as AuthenticatedRequest);
    const session = await getSession(request as unknown as NextRequest);

    if (!session) {
      return respond.error('Session not found', 'UNAUTHORIZED', { status: 401 });
    }

    const campusId = session.campusId || 'ub-buffalo';

    if (!isFirebaseConfigured) {
      return respond.error(
        'Service unavailable',
        'SERVICE_UNAVAILABLE',
        { status: 503 }
      );
    }

    try {
      // Verify space exists and is a locked major space
      const spaceRef = dbAdmin.collection('spaces').doc(body.spaceId);
      const spaceDoc = await spaceRef.get();

      if (!spaceDoc.exists) {
        return respond.error('Space not found', 'NOT_FOUND', { status: 404 });
      }

      const spaceData = spaceDoc.data();
      if (!spaceData) {
        return respond.error('Space data not found', 'NOT_FOUND', { status: 404 });
      }

      if (spaceData.identityType !== 'major') {
        return respond.error('Not a major space', 'BAD_REQUEST', { status: 400 });
      }

      if (spaceData.isUnlocked) {
        return respond.error(
          'Space is already unlocked',
          'BAD_REQUEST',
          { status: 400 }
        );
      }

      // Check if already on waitlist
      const waitlistId = `${body.spaceId}_${userId}`;
      const waitlistRef = dbAdmin.collection('spaceWaitlists').doc(waitlistId);
      const waitlistDoc = await waitlistRef.get();

      if (waitlistDoc.exists) {
        return respond.success({
          message: 'Already on waitlist',
          alreadyOnWaitlist: true,
        });
      }

      // Add to waitlist
      await waitlistRef.set({
        id: waitlistId,
        spaceId: body.spaceId,
        userId: userId,
        majorName: body.majorName || spaceData.majorName || null,
        joinedAt: new Date().toISOString(),
        notified: false,
        campusId: campusId,
      });

      logger.info('User joined major space waitlist', {
        component: 'waitlist-api',
        userId,
        spaceId: body.spaceId,
        majorName: body.majorName || spaceData.majorName,
      });

      return respond.success({
        message: 'Added to waitlist',
        waitlistId,
      });
    } catch (error) {
      logger.error('Failed to join waitlist', {
        error: { error: error instanceof Error ? error.message : String(error) },
        component: 'waitlist-api',
        userId,
        spaceId: body.spaceId,
      });
      return respond.error(
        'Failed to join waitlist',
        'INTERNAL_ERROR',
        { status: 500 }
      );
    }
  }
);

/**
 * GET - Check waitlist status for a space
 * Query params: spaceId (required)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get('spaceId');

  if (!spaceId) {
    return NextResponse.json(
      { success: false, error: 'spaceId query parameter is required' },
      { status: 400 }
    );
  }

  // Rate limit
  const rateLimitResult = await enforceRateLimit('standard', request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: rateLimitResult.error || 'Too many requests',
      },
      { status: rateLimitResult.status }
    );
  }

  const session = await getSession(request);
  if (!session?.userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userId = session.userId;

  if (!isFirebaseConfigured) {
    return NextResponse.json(
      { success: false, error: 'Service unavailable' },
      { status: 503 }
    );
  }

  try {
    const waitlistId = `${spaceId}_${userId}`;
    const waitlistRef = dbAdmin.collection('spaceWaitlists').doc(waitlistId);
    const waitlistDoc = await waitlistRef.get();

    if (!waitlistDoc.exists) {
      return NextResponse.json({
        success: true,
        isOnWaitlist: false,
      });
    }

    const waitlistData = waitlistDoc.data();
    return NextResponse.json({
      success: true,
      isOnWaitlist: true,
      notified: waitlistData?.notified || false,
      joinedAt: waitlistData?.joinedAt || null,
    });
  } catch (error) {
    logger.error('Failed to check waitlist status', {
      error: { error: error instanceof Error ? error.message : String(error) },
      component: 'waitlist-api',
      userId,
      spaceId,
    });
    return NextResponse.json(
      { success: false, error: 'Failed to check waitlist status' },
      { status: 500 }
    );
  }
}
