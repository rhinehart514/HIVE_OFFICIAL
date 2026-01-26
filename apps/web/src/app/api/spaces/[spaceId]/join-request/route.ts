import { z } from 'zod';
import * as admin from 'firebase-admin';
import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { addSecureCampusMetadata } from '@/lib/secure-firebase-queries';
import { HttpStatus } from '@/lib/api-response-types';
import { createBulkNotifications } from '@/lib/notification-service';

/**
 * Space Join Request API
 *
 * POST: Create a join request for a private space
 * GET: Get user's pending join request for this space
 * DELETE: Cancel a pending join request
 */

// ============================================
// SCHEMAS
// ============================================

const createRequestSchema = z.object({
  message: z.string().max(500).optional(),
});

// ============================================
// TYPES
// ============================================

interface JoinRequestData {
  id: string;
  spaceId: string;
  userId: string;
  campusId: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  reviewedAt?: admin.firestore.Timestamp;
  reviewedBy?: string;
  rejectionReason?: string;
}

// ============================================
// POST - Create join request
// ============================================

export const POST = withAuthValidationAndErrors(
  createRequestSchema,
  async (request, context: { params: Promise<{ spaceId: string }> }, body: z.infer<typeof createRequestSchema>, respond) => {
    const params = await context.params;
    const spaceId = params.spaceId as string;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error('Space ID is required', 'VALIDATION_ERROR', {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    // 1. Verify space exists and is private
    const spaceDoc = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .get();

    if (!spaceDoc.exists) {
      return respond.error('Space not found', 'RESOURCE_NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const space = spaceDoc.data();
    if (!space || space.campusId !== campusId) {
      return respond.error('Space not found', 'RESOURCE_NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    // 2. Check if space is private (only private spaces need join requests)
    const isPrivate = space.isPrivate === true || space.visibility === 'private';
    if (!isPrivate) {
      return respond.error(
        'This space is public. You can join directly without a request.',
        'VALIDATION_ERROR',
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // 3. Check if user is already a member
    const compositeId = `${spaceId}_${userId}`;
    const existingMember = await dbAdmin
      .collection('spaceMembers')
      .doc(compositeId)
      .get();

    if (existingMember.exists && existingMember.data()?.isActive) {
      return respond.error('You are already a member of this space', 'VALIDATION_ERROR', {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    // 4. Check for existing pending request
    const existingRequest = await dbAdmin
      .collection('spaceJoinRequests')
      .where('spaceId', '==', spaceId)
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .where('campusId', '==', campusId)
      .limit(1)
      .get();

    if (!existingRequest.empty) {
      return respond.error(
        'You already have a pending join request for this space',
        'VALIDATION_ERROR',
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // 5. Create the join request
    const requestRef = dbAdmin.collection('spaceJoinRequests').doc();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const requestData = addSecureCampusMetadata({
      spaceId,
      userId,
      status: 'pending',
      message: body.message || null,
      createdAt: now,
      updatedAt: now,
    });

    await requestRef.set(requestData);

    logger.info('[join-request] Created join request', {
      requestId: requestRef.id,
      spaceId,
      userId,
      campusId,
    });

    // 6. Notify space leaders about new join request
    const leaderSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('campusId', '==', campusId)
      .where('isActive', '==', true)
      .where('role', 'in', ['owner', 'admin', 'moderator'])
      .get();

    if (!leaderSnapshot.empty) {
      const leaderIds = leaderSnapshot.docs.map(doc => doc.data().userId as string);
      const userDoc = await dbAdmin.collection('users').doc(userId).get();
      const userName = userDoc.data()?.displayName || userDoc.data()?.name || 'Someone';
      const spaceName = space.name || 'your space';

      await createBulkNotifications(leaderIds, {
        type: 'space_join',
        category: 'spaces',
        title: `${userName} wants to join ${spaceName}`,
        body: body.message || 'Review their request in the space settings.',
        actionUrl: `/spaces/${spaceId}/settings?tab=requests`,
        metadata: {
          actorId: userId,
          actorName: userName,
          spaceId,
          spaceName,
          requestId: requestRef.id,
        },
      });
    }

    return respond.success(
      {
        id: requestRef.id,
        spaceId,
        status: 'pending',
        message: body.message || null,
      },
      { status: HttpStatus.CREATED }
    );
  }
);

// ============================================
// GET - Get user's join request for this space
// ============================================

export async function GET(
  request: Request,
  context: { params: Promise<{ spaceId: string }> }
) {
  try {
    // Get auth context
    const authHeader = request.headers.get('cookie');
    const sessionMatch = authHeader?.match(/hive_session=([^;]+)/);
    if (!sessionMatch) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    // Verify session and get user info
    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || '');
    const { payload } = await jwtVerify(sessionMatch[1], secret);
    const userId = payload.userId as string;
    const campusId = (payload.campusId as string) || 'ub-buffalo';

    const params = await context.params;
    const spaceId = params.spaceId;

    if (!spaceId) {
      return NextResponse.json(
        { success: false, error: { message: 'Space ID is required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Find user's request for this space
    const requestQuery = await dbAdmin
      .collection('spaceJoinRequests')
      .where('spaceId', '==', spaceId)
      .where('userId', '==', userId)
      .where('campusId', '==', campusId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (requestQuery.empty) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const doc = requestQuery.docs[0];
    const data = doc.data() as JoinRequestData;

    return NextResponse.json({
      success: true,
      data: {
        id: doc.id,
        spaceId: data.spaceId,
        status: data.status,
        message: data.message,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || null,
        rejectionReason: data.rejectionReason,
      },
    });
  } catch (error) {
    logger.error('[join-request] GET error', { error });
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Cancel pending join request
// ============================================

export async function DELETE(
  request: Request,
  context: { params: Promise<{ spaceId: string }> }
) {
  try {
    // Get auth context
    const authHeader = request.headers.get('cookie');
    const sessionMatch = authHeader?.match(/hive_session=([^;]+)/);
    if (!sessionMatch) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    // Verify session
    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || '');
    const { payload } = await jwtVerify(sessionMatch[1], secret);
    const userId = payload.userId as string;
    const campusId = (payload.campusId as string) || 'ub-buffalo';

    const params = await context.params;
    const spaceId = params.spaceId;

    if (!spaceId) {
      return NextResponse.json(
        { success: false, error: { message: 'Space ID is required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Find and delete pending request
    const requestQuery = await dbAdmin
      .collection('spaceJoinRequests')
      .where('spaceId', '==', spaceId)
      .where('userId', '==', userId)
      .where('status', '==', 'pending')
      .where('campusId', '==', campusId)
      .limit(1)
      .get();

    if (requestQuery.empty) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'No pending join request found', code: 'RESOURCE_NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    // Delete the request
    await requestQuery.docs[0].ref.delete();

    logger.info('[join-request] Cancelled join request', {
      requestId: requestQuery.docs[0].id,
      spaceId,
      userId,
      campusId,
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Join request cancelled' },
    });
  } catch (error) {
    logger.error('[join-request] DELETE error', { error });
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
