import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

/**
 * POST /api/spaces/request
 *
 * Request a new space that doesn't exist yet.
 * Creates a space request record for admins to review.
 */
export const POST = withAuthValidationAndErrors(async (request: AuthenticatedRequest) => {
  const userId = getUserId(request);
  const campusId = getCampusId(request);

  try {
    const body = await request.json();
    const { requestedName, message } = body;

    if (!requestedName) {
      return NextResponse.json(
        { error: 'Space name is required' },
        { status: 400 }
      );
    }

    // Create space request
    const requestRef = await dbAdmin.collection('spaceRequests').add({
      requestedName: requestedName.trim(),
      message: message || '',
      requestedBy: userId,
      requestedAt: new Date().toISOString(),
      status: 'pending', // pending, approved, rejected
      campusId: campusId,
    });

    logger.info('Space request created', {
      requestId: requestRef.id,
      requestedName,
      userId,
      campusId,
    });

    return NextResponse.json({
      success: true,
      requestId: requestRef.id,
    });
  } catch (error) {
    logger.error('Error creating space request', { error, userId, campusId });
    return NextResponse.json(
      { error: 'Failed to create space request' },
      { status: 500 }
    );
  }
});
