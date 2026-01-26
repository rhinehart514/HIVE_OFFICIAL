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
import { createNotification } from '@/lib/notification-service';

/**
 * Space Join Requests Management API (for space leaders)
 *
 * GET: List all join requests for a space (leaders only)
 * PATCH: Approve or reject a join request
 */

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

interface UserProfile {
  displayName?: string;
  handle?: string;
  avatarUrl?: string;
  email?: string;
}

// ============================================
// HELPERS
// ============================================

async function isSpaceLeader(
  spaceId: string,
  userId: string,
  campusId: string
): Promise<boolean> {
  const compositeId = `${spaceId}_${userId}`;
  const memberDoc = await dbAdmin.collection('spaceMembers').doc(compositeId).get();

  if (!memberDoc.exists) return false;

  const data = memberDoc.data();
  if (!data || data.campusId !== campusId || !data.isActive) return false;

  return ['owner', 'admin', 'moderator'].includes(data.role);
}

async function getUserProfiles(userIds: string[]): Promise<Map<string, UserProfile>> {
  if (userIds.length === 0) return new Map();

  const profiles = new Map<string, UserProfile>();

  // Batch fetch in groups of 30 (Firestore limit for 'in' queries)
  const batches = [];
  for (let i = 0; i < userIds.length; i += 30) {
    batches.push(userIds.slice(i, i + 30));
  }

  for (const batch of batches) {
    const snapshot = await dbAdmin
      .collection('users')
      .where('__name__', 'in', batch)
      .get();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      profiles.set(doc.id, {
        displayName: data.displayName || data.name,
        handle: data.handle,
        avatarUrl: data.avatarUrl || data.photoURL,
        email: data.email,
      });
    });
  }

  return profiles;
}

// ============================================
// GET - List join requests (leaders only)
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

    // Check if user is a space leader
    const isLeader = await isSpaceLeader(spaceId, userId, campusId);
    if (!isLeader) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Only space leaders can view join requests', code: 'FORBIDDEN' },
        },
        { status: 403 }
      );
    }

    // Parse query params
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

    // Fetch join requests
    let query = dbAdmin
      .collection('spaceJoinRequests')
      .where('spaceId', '==', spaceId)
      .where('campusId', '==', campusId);

    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(limit).get();

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        data: { requests: [], total: 0 },
      });
    }

    // Get user profiles for all requesters
    const userIds = snapshot.docs.map((doc) => doc.data().userId);
    const profiles = await getUserProfiles(userIds);

    // Format response
    const requests = snapshot.docs.map((doc) => {
      const data = doc.data() as JoinRequestData;
      const profile = profiles.get(data.userId);

      return {
        id: doc.id,
        userId: data.userId,
        status: data.status,
        message: data.message,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || null,
        reviewedBy: data.reviewedBy,
        rejectionReason: data.rejectionReason,
        user: profile
          ? {
              id: data.userId,
              displayName: profile.displayName || 'Unknown User',
              handle: profile.handle,
              avatarUrl: profile.avatarUrl,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        requests,
        total: requests.length,
      },
    });
  } catch (error) {
    logger.error('[join-requests] GET error', { error });
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Approve or reject a join request
// ============================================

const reviewSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(500).optional(),
});

export const PATCH = withAuthValidationAndErrors(
  reviewSchema,
  async (request, context: { params: Promise<{ spaceId: string }> }, body: z.infer<typeof reviewSchema>, respond) => {
    const params = await context.params;
    const spaceId = params.spaceId as string;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error('Space ID is required', 'VALIDATION_ERROR', {
        status: HttpStatus.BAD_REQUEST,
      });
    }

    // Check if user is a space leader
    const isLeader = await isSpaceLeader(spaceId, userId, campusId);
    if (!isLeader) {
      return respond.error('Only space leaders can review join requests', 'FORBIDDEN', {
        status: HttpStatus.FORBIDDEN,
      });
    }

    // Get the join request
    const requestRef = dbAdmin.collection('spaceJoinRequests').doc(body.requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return respond.error('Join request not found', 'RESOURCE_NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const requestData = requestDoc.data() as JoinRequestData;

    // Validate the request belongs to this space
    if (requestData.spaceId !== spaceId || requestData.campusId !== campusId) {
      return respond.error('Join request not found', 'RESOURCE_NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    // Check if already reviewed
    if (requestData.status !== 'pending') {
      return respond.error(
        `This request has already been ${requestData.status}`,
        'VALIDATION_ERROR',
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    if (body.action === 'approve') {
      // Approve: Add user as member and update request
      const batch = dbAdmin.batch();

      // Update request status
      batch.update(requestRef, {
        status: 'approved',
        reviewedAt: now,
        reviewedBy: userId,
        updatedAt: now,
      });

      // Create membership
      const compositeId = `${spaceId}_${requestData.userId}`;
      const memberRef = dbAdmin.collection('spaceMembers').doc(compositeId);

      batch.set(
        memberRef,
        addSecureCampusMetadata({
          spaceId,
          userId: requestData.userId,
          role: 'member',
          joinedAt: now,
          isActive: true,
          permissions: ['post', 'comment', 'react'],
          joinMethod: 'approval',
          joinMetadata: {
            requestId: body.requestId,
            approvedBy: userId,
          },
        }),
        { merge: true }
      );

      // Update space member count
      const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
      batch.update(spaceRef, {
        memberCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      });

      await batch.commit();

      logger.info('[join-requests] Approved join request', {
        requestId: body.requestId,
        spaceId,
        requestUserId: requestData.userId,
        approvedBy: userId,
      });

      // Notify the user that their request was approved
      const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
      const spaceName = spaceDoc.data()?.name || 'the space';

      await createNotification({
        userId: requestData.userId,
        type: 'space_join',
        category: 'spaces',
        title: `Welcome to ${spaceName}!`,
        body: 'Your request to join has been approved.',
        actionUrl: `/spaces/${spaceId}`,
        metadata: {
          spaceId,
          spaceName,
          actorId: userId,
        },
      });

      return respond.success({
        message: 'Join request approved',
        requestId: body.requestId,
        status: 'approved',
      });
    } else {
      // Reject: Update request status
      await requestRef.update({
        status: 'rejected',
        reviewedAt: now,
        reviewedBy: userId,
        rejectionReason: body.rejectionReason || null,
        updatedAt: now,
      });

      logger.info('[join-requests] Rejected join request', {
        requestId: body.requestId,
        spaceId,
        requestUserId: requestData.userId,
        rejectedBy: userId,
        reason: body.rejectionReason,
      });

      // Notify the user that their request was rejected
      const spaceDocForReject = await dbAdmin.collection('spaces').doc(spaceId).get();
      const spaceNameForReject = spaceDocForReject.data()?.name || 'the space';

      await createNotification({
        userId: requestData.userId,
        type: 'system',
        category: 'spaces',
        title: `Your request to join ${spaceNameForReject} was declined`,
        body: body.rejectionReason || 'The space leader has declined your request.',
        actionUrl: `/spaces/browse`,
        metadata: {
          spaceId,
          spaceName: spaceNameForReject,
          rejectionReason: body.rejectionReason,
        },
      });

      return respond.success({
        message: 'Join request rejected',
        requestId: body.requestId,
        status: 'rejected',
      });
    }
  }
);
