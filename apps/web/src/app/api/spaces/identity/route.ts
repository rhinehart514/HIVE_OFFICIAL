/**
 * Identity Claims API
 *
 * Handles identity space claims (residential, major, greek).
 * These are special 1-per-type spaces that define campus identity.
 *
 * GET - Fetch user's identity claims
 * POST - Claim an identity space
 */

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { getServerSpaceRepository } from '@hive/core/server';
import { withCache } from '../../../../lib/cache-headers';

// ============================================================
// Types
// ============================================================

const IDENTITY_TYPES = ['residential', 'major', 'greek'] as const;
type IdentityType = (typeof IDENTITY_TYPES)[number];

interface IdentityClaim {
  id: string;
  userId: string;
  type: IdentityType;
  spaceId: string;
  spaceName: string;
  spaceAvatarUrl?: string;
  memberCount: number;
  claimedAt: Date;
}

// ============================================================
// Validation Schemas
// ============================================================

const claimIdentitySchema = z.object({
  type: z.enum(IDENTITY_TYPES),
  spaceId: z.string().min(1, 'Space ID is required'),
});

// ============================================================
// GET /api/spaces/identity - Fetch user's identity claims
// ============================================================

const _GET = withAuthAndErrors(async (request, context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  logger.info('Fetching identity claims', {
    userId,
    campusId,
    endpoint: '/api/spaces/identity',
  });

  try {
    // Query identity_claims collection for this user
    const claimsSnapshot = await dbAdmin
      .collection('identity_claims')
      .where('userId', '==', userId)
      .where('campusId', '==', campusId)
      .get();

    const claims: Record<IdentityType, IdentityClaim | null> = {
      residential: null,
      major: null,
      greek: null,
    };

    // Process claims and fetch space details
    const spaceRepo = getServerSpaceRepository();

    for (const doc of claimsSnapshot.docs) {
      const data = doc.data();
      const type = data.type as IdentityType;
      const spaceId = data.spaceId as string;

      // Fetch space details
      const spaceResult = await spaceRepo.findById(spaceId);
      if (spaceResult.isSuccess) {
        const space = spaceResult.getValue();
        claims[type] = {
          id: doc.id,
          userId,
          type,
          spaceId,
          spaceName: space.name.value,
          spaceAvatarUrl: space.iconURL || undefined,
          memberCount: space.memberCount,
          claimedAt: data.claimedAt?.toDate?.() || new Date(),
        };
      }
    }

    return respond.success({ claims });
  } catch (error) {
    logger.error('Failed to fetch identity claims', { error, userId });
    return respond.error('Failed to fetch identity claims', 'INTERNAL_ERROR', {
      status: 500,
    });
  }
});

// ============================================================
// POST /api/spaces/identity - Claim an identity space
// ============================================================

type ClaimIdentityData = z.infer<typeof claimIdentitySchema>;

export const POST = withAuthValidationAndErrors(
  claimIdentitySchema,
  async (request, context, body: ClaimIdentityData, respond) => {
    const { type, spaceId } = body;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    logger.info('Claiming identity space', {
      userId,
      campusId,
      type,
      spaceId,
      endpoint: '/api/spaces/identity',
    });

    try {
      // Check if user already has this identity type claimed
      const existingClaim = await dbAdmin
        .collection('identity_claims')
        .where('userId', '==', userId)
        .where('campusId', '==', campusId)
        .where('type', '==', type)
        .limit(1)
        .get();

      if (!existingClaim.empty) {
        return respond.error(
          `You already have a ${type} identity claimed. Remove it first to claim a different one.`,
          'ALREADY_CLAIMED',
          { status: 400 }
        );
      }

      // Verify the space exists and is the correct type
      const spaceRepo = getServerSpaceRepository();
      const spaceResult = await spaceRepo.findById(spaceId);

      if (spaceResult.isFailure) {
        return respond.error('Space not found', 'NOT_FOUND', { status: 404 });
      }

      const space = spaceResult.getValue();

      // Verify campus isolation
      if (space.campusId.id !== campusId) {
        return respond.error('Space not found', 'NOT_FOUND', { status: 404 });
      }

      // Verify space category matches identity type
      const categoryToType: Record<string, IdentityType> = {
        residential: 'residential',
        residential_spaces: 'residential',
        greek: 'greek',
        greek_life_spaces: 'greek',
        academic: 'major',
        academics: 'major',
        major: 'major',
      };

      const spaceCategory = space.category.value.toLowerCase();
      const expectedType = categoryToType[spaceCategory];

      // For majors, we allow any academic space
      const isValidType =
        expectedType === type ||
        (type === 'major' && ['academic', 'academics'].includes(spaceCategory));

      if (!isValidType && type !== 'greek') {
        // Greek spaces can be claimed regardless of category
        return respond.error(
          `This space cannot be claimed as your ${type} identity`,
          'INVALID_SPACE_TYPE',
          { status: 400 }
        );
      }

      // Create the identity claim
      const claimRef = dbAdmin.collection('identity_claims').doc();
      const claimData = {
        userId,
        campusId,
        type,
        spaceId,
        claimedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await claimRef.set(claimData);

      // Also add user as a member of the space if not already
      const existingMembership = await dbAdmin
        .collection('spaceMembers')
        .where('userId', '==', userId)
        .where('spaceId', '==', spaceId)
        .limit(1)
        .get();

      if (existingMembership.empty) {
        // Add as member
        await dbAdmin.collection('spaceMembers').add({
          userId,
          spaceId,
          campusId,
          role: 'member',
          isActive: true,
          joinedAt: new Date(),
          lastVisited: new Date(),
          notifications: 0,
          pinned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Increment member count
        const spaceDocRef = dbAdmin.collection('spaces').doc(spaceId);
        await spaceDocRef.update({
          'metrics.memberCount': (space.memberCount || 0) + 1,
          updatedAt: new Date(),
        });
      }

      logger.info('Identity space claimed', {
        userId,
        type,
        spaceId,
        claimId: claimRef.id,
      });

      return respond.success({
        message: `Successfully claimed ${type} identity`,
        claim: {
          id: claimRef.id,
          type,
          spaceId,
          spaceName: space.name.value,
          spaceAvatarUrl: space.iconURL || undefined,
          memberCount: space.memberCount,
          claimedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to claim identity space', { error, userId, type, spaceId });
      return respond.error('Failed to claim identity', 'INTERNAL_ERROR', {
        status: 500,
      });
    }
  }
);

// ============================================================
// DELETE /api/spaces/identity - Remove an identity claim
// ============================================================

const removeIdentitySchema = z.object({
  type: z.enum(IDENTITY_TYPES),
});

export const DELETE = withAuthValidationAndErrors(
  removeIdentitySchema,
  async (request, context, body: z.infer<typeof removeIdentitySchema>, respond) => {
    const { type } = body;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    logger.info('Removing identity claim', {
      userId,
      campusId,
      type,
      endpoint: '/api/spaces/identity',
    });

    try {
      // Find the existing claim
      const claimSnapshot = await dbAdmin
        .collection('identity_claims')
        .where('userId', '==', userId)
        .where('campusId', '==', campusId)
        .where('type', '==', type)
        .limit(1)
        .get();

      if (claimSnapshot.empty) {
        return respond.error(
          `No ${type} identity claim found`,
          'NOT_FOUND',
          { status: 404 }
        );
      }

      const claimDoc = claimSnapshot.docs[0];

      // Delete the claim
      await claimDoc?.ref.delete();

      logger.info('Identity claim removed', {
        userId,
        type,
        claimId: claimDoc?.id,
      });

      return respond.success({
        message: `Successfully removed ${type} identity`,
      });
    } catch (error) {
      logger.error('Failed to remove identity claim', { error, userId, type });
      return respond.error('Failed to remove identity', 'INTERNAL_ERROR', {
        status: 500,
      });
    }
  }
);

export const GET = withCache(_GET, 'SHORT');
