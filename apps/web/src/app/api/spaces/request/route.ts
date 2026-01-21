import { z } from 'zod';
import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';

/**
 * POST /api/spaces/request
 *
 * Request a new space that doesn't exist yet.
 * Creates a space request record for admins to review.
 */

// Schema for space request
const requestSpaceSchema = z.object({
  requestedName: z.string().min(1).max(100),
  message: z.string().max(500).optional(),
});

export const POST = withAuthValidationAndErrors(
  requestSpaceSchema,
  async (request, context, body: z.infer<typeof requestSpaceSchema>, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    try {
      const { requestedName, message } = body;

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

      return respond.success(
        {
          success: true,
          requestId: requestRef.id,
        },
        { status: HttpStatus.OK }
      );
    } catch (error) {
      logger.error('Error creating space request', { error, userId, campusId });
      return respond.error(
        'Failed to create space request',
        'INTERNAL_ERROR',
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      );
    }
  }
);
