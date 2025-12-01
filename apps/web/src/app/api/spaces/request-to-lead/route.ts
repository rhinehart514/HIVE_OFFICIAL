import { z } from 'zod';
import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import {
  withAuthValidationAndErrors,
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { CURRENT_CAMPUS_ID, addSecureCampusMetadata } from '@/lib/secure-firebase-queries';
import { HttpStatus } from '@/lib/api-response-types';
import { getServerSpaceRepository } from '@hive/core/server';

const requestToLeadSchema = z.object({
  spaceId: z.string().min(1, 'Space ID is required'),
  motivation: z
    .string()
    .min(50, 'Please provide at least 50 characters explaining your motivation')
    .max(1000, 'Motivation must be under 1000 characters'),
  experience: z
    .string()
    .min(10, 'Please describe relevant experience')
    .max(500, 'Experience must be under 500 characters'),
  plans: z
    .string()
    .min(30, 'Please describe your plans for the space')
    .max(1000, 'Plans must be under 1000 characters'),
  timeCommitment: z.enum(['5-10hrs/week', '10-15hrs/week', '15-20hrs/week', '20+hrs/week']),
  hasAgreedToTerms: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the builder terms'),
});

type RequestToLeadPayload = z.infer<typeof requestToLeadSchema>;

const BUILDER_ROLES = new Set(['owner', 'admin', 'builder']);

export const POST = withAuthValidationAndErrors(
  requestToLeadSchema,
  async (
    request,
    _context,
    body: RequestToLeadPayload,
    respond,
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const {
      spaceId,
      motivation,
      experience,
      plans,
      timeCommitment,
    } = body;

    try {
      // Use DDD repository for space validation
      const spaceRepo = getServerSpaceRepository();
      const spaceResult = await spaceRepo.findById(spaceId);

      if (spaceResult.isFailure) {
        return respond.error('Space not found', 'RESOURCE_NOT_FOUND', {
          status: HttpStatus.NOT_FOUND,
        });
      }

      const space = spaceResult.getValue();

      if (space.campusId.id !== CURRENT_CAMPUS_ID) {
        return respond.error('Access denied for this campus', 'FORBIDDEN', {
          status: HttpStatus.FORBIDDEN,
        });
      }

      // Prevent duplicate or unnecessary requests
      const activeMembership = await dbAdmin
        .collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .where('campusId', '==', CURRENT_CAMPUS_ID)
        .limit(1)
        .get();

      if (!activeMembership.empty) {
        const currentRole = activeMembership.docs[0].data().role as string | undefined;
        if (currentRole && BUILDER_ROLES.has(currentRole)) {
          return respond.error(
            'You already have elevated permissions in this space',
            'CONFLICT',
            { status: HttpStatus.CONFLICT },
          );
        }
      }

      const existingPending = await dbAdmin
        .collection('builderRequests')
        .where('spaceId', '==', spaceId)
        .where('userId', '==', userId)
        .where('status', '==', 'pending')
        .where('campusId', '==', CURRENT_CAMPUS_ID)
        .limit(1)
        .get();

      if (!existingPending.empty) {
        return respond.error(
          'You already have a pending builder request for this space',
          'CONFLICT',
          { status: HttpStatus.CONFLICT },
        );
      }

      const userDoc = await dbAdmin.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return respond.error('User profile not found', 'RESOURCE_NOT_FOUND', {
          status: HttpStatus.NOT_FOUND,
        });
      }

      const userData = userDoc.data() ?? {};
      const userEmail =
        userData.email || userData.primaryEmail || userData.contactEmail || 'unknown@buffalo.edu';
      const userName =
        userData.displayName || userData.fullName || userData.handle || 'Unknown User';

      const requestRef = dbAdmin.collection('builderRequests').doc();
      const submittedAt = admin.firestore.FieldValue.serverTimestamp();
      const expiryDate = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      );

      await requestRef.set({
        ...addSecureCampusMetadata({
          spaceId,
          spaceName: space.name.value,
          spaceType: space.category.value || 'unknown',
          userId,
          userEmail,
          userName,
          motivation,
          experience,
          plans,
          timeCommitment,
          status: 'pending' as const,
          hasAgreedToTerms: true,
          submittedAt,
          expiresAt: expiryDate,
        }),
      });

      logger.info('Builder request submitted', {
        requestId: requestRef.id,
        spaceId,
        userId,
        endpoint: '/api/spaces/request-to-lead',
      });

      return respond.created(
        {
          requestId: requestRef.id,
          space: {
            id: spaceId,
            name: space.name.value,
            type: space.category.value || 'unknown',
          },
        },
        { message: 'Builder request submitted successfully' },
      );
    } catch (error) {
      logger.error('Failed to submit builder request', {
        userId,
        spaceId,
        error: { error: error instanceof Error ? error.message : String(error) },
      });
      return respond.error('Failed to submit builder request', 'INTERNAL_ERROR', {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

export const GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);

  try {
    const requestsSnapshot = await dbAdmin
      .collection('builderRequests')
      .where('userId', '==', userId)
      .where('campusId', '==', CURRENT_CAMPUS_ID)
      .orderBy('submittedAt', 'desc')
      .limit(20)
      .get();

    const requests = requestsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        status: data.status ?? 'pending',
        spaceId: data.spaceId,
        spaceName: data.spaceName,
        timeCommitment: data.timeCommitment,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() ?? null,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() ?? null,
        reviewNotes: data.reviewNotes ?? null,
      };
    });

    return respond.success({ requests });
  } catch (error) {
    logger.error('Failed to load builder requests', {
      userId,
      error: { error: error instanceof Error ? error.message : String(error) },
    });
    return respond.error('Failed to load builder requests', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
