/**
 * Space Claim API
 *
 * Allows leaders to claim pre-seeded unclaimed spaces.
 * Grants provisional access immediately while awaiting admin verification.
 *
 * Flow:
 * 1. User finds their org in browse/search
 * 2. Submits claim with role + optional proof
 * 3. Gets provisional access immediately (can start setting up)
 * 4. Admin verifies within 24h
 * 5. Space status: unclaimed → claimed (stealth) → verified (live)
 */
import { z } from "zod";
import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from "@/lib/structured-logger";
import {
  withAuthValidationAndErrors,
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { addSecureCampusMetadata } from "@/lib/secure-firebase-queries";
import { HttpStatus } from "@/lib/api-response-types";
import {
  getServerSpaceRepository,
} from '@hive/core/server';
import { ProfileId, type LeaderProofType, getSystemTemplateForCategory } from '@hive/core';
import { createBulkNotifications } from '@/lib/notification-service';
import { withCache } from '../../../../lib/cache-headers';
import { normalizeSpaceType } from '@/lib/space-rules-middleware';
import { getSpaceTypeRules } from '@/lib/space-type-rules';

const claimSpaceSchema = z.object({
  spaceId: z.string().min(1, "Space ID is required"),
  role: z.string().min(1, "Your role in the organization is required"),
  proofType: z.enum(['email', 'document', 'social', 'referral', 'none']).optional(),
  proofUrl: z.string().url().optional(),
});

type ClaimSpacePayload = z.infer<typeof claimSpaceSchema>;

/**
 * POST /api/spaces/claim
 * Submit a claim for an unclaimed space
 */
export const POST = withAuthValidationAndErrors(
  claimSpaceSchema,
  async (request, _context, body: ClaimSpacePayload, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { spaceId, role, proofType = 'none', proofUrl } = body;

    try {
      // Load the space using DDD repository
      const spaceRepo = getServerSpaceRepository();
      const spaceResult = await spaceRepo.findById(spaceId);

      if (spaceResult.isFailure) {
        return respond.error('Space not found', 'RESOURCE_NOT_FOUND', {
          status: HttpStatus.NOT_FOUND,
        });
      }

      const space = spaceResult.getValue();

      // Campus isolation check
      if (space.campusId.id !== campusId) {
        return respond.error('Access denied for this campus', 'FORBIDDEN', {
          status: HttpStatus.FORBIDDEN,
        });
      }

      // Enforce space-type claim rules
      const normalizedSpaceType = normalizeSpaceType(space.category?.value);
      const spaceTypeRules = getSpaceTypeRules(normalizedSpaceType);

      if (normalizedSpaceType === 'campus_living' || spaceTypeRules.membership.joinMethod === 'automatic') {
        return respond.error(
          'Campus living spaces cannot be claimed manually',
          'BUSINESS_RULE_VIOLATION',
          { status: HttpStatus.BAD_REQUEST }
        );
      }

      if (normalizedSpaceType === 'university_organizations' && !['email', 'document'].includes(proofType)) {
        return respond.error(
          'University organizations require email or document proof for claims',
          'BUSINESS_RULE_VIOLATION',
          { status: HttpStatus.BAD_REQUEST }
        );
      }

      if (normalizedSpaceType === 'greek_life' && proofType === 'none') {
        return respond.error(
          'Greek life claims require leadership proof',
          'BUSINESS_RULE_VIOLATION',
          { status: HttpStatus.BAD_REQUEST }
        );
      }

      // Check if space is claimable (must be unclaimed)
      if (space.isClaimed) {
        return respond.error(
          'This space has already been claimed',
          'CONFLICT',
          { status: HttpStatus.CONFLICT }
        );
      }

      // Check for existing pending claim from any user
      const existingClaim = space.pendingLeaderRequests.find(r => r.status === 'pending');
      if (existingClaim) {
        return respond.error(
          'This space has a pending claim from another user',
          'CONFLICT',
          { status: HttpStatus.CONFLICT }
        );
      }

      // Get user info for the claim record
      const userDoc = await dbAdmin.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return respond.error('User profile not found', 'RESOURCE_NOT_FOUND', {
          status: HttpStatus.NOT_FOUND,
        });
      }

      const userData = userDoc.data() ?? {};
      const userEmail = userData.email || userData.primaryEmail || 'unknown@buffalo.edu';
      const userName = userData.displayName || userData.fullName || userData.handle || 'Unknown User';

      // Submit the claim request using domain model
      const claimResult = space.submitClaimRequest({
        profileId: ProfileId.create(userId).getValue(),
        role,
        proofType: proofType as LeaderProofType,
        proofUrl,
      });

      if (claimResult.isFailure) {
        return respond.error(
          claimResult.error || 'Failed to submit claim',
          'VALIDATION_ERROR',
          { status: HttpStatus.BAD_REQUEST }
        );
      }

      // Save the updated space
      const saveResult = await spaceRepo.save(space);
      if (saveResult.isFailure) {
        logger.error('[claim] Failed to save space', {
          spaceId,
          error: saveResult.error,
        });
        return respond.error('Failed to save claim', 'INTERNAL_ERROR', {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        });
      }

      // Create claim record in builderRequests for admin queue
      const claimRef = dbAdmin.collection('builderRequests').doc();
      await claimRef.set({
        ...addSecureCampusMetadata({
          type: 'claim',
          spaceId,
          spaceName: space.name.value,
          spaceCategory: space.category?.value || 'student_org',
          userId,
          userEmail,
          userName,
          role,
          proofType,
          proofUrl: proofUrl || null,
          status: 'pending',
          provisionalAccessGranted: true,
          submittedAt: admin.firestore.FieldValue.serverTimestamp(),
          // 7-day expiry if not reviewed
          expiresAt: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          ),
        }),
      });

      // Also add user as member with owner role
      const memberRef = dbAdmin.collection('spaceMembers').doc(`${spaceId}_${userId}`);
      await memberRef.set({
        ...addSecureCampusMetadata({
          spaceId,
          userId,
          role: 'owner',
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true,
          permissions: ['admin', 'post', 'moderate', 'invite', 'manage'],
          joinMethod: 'claim',
          isProvisional: true,
        }),
      });

      // Auto-deploy template tools to sidebar based on space category
      // This is the "holy shit" moment - space has tools immediately after claim
      const template = getSystemTemplateForCategory(space.category?.value);
      const placedToolsRef = dbAdmin.collection('spaces').doc(spaceId).collection('placed_tools');

      for (const slot of template.slots) {
        const toolRef = placedToolsRef.doc();
        await toolRef.set({
          ...addSecureCampusMetadata({
            toolId: slot.toolId,
            spaceId,
            placement: 'sidebar',
            order: slot.order,
            isActive: true,
            source: 'system',
            placedBy: userId,
            placedAt: admin.firestore.FieldValue.serverTimestamp(),
            configOverrides: slot.config || {},
            visibility: 'all',
            titleOverride: slot.name,
            isEditable: true,
            state: {},
            stateUpdatedAt: null,
          }),
        });
      }

      logger.info('[claim] Template auto-deployed', {
        spaceId,
        templateId: template.id,
        toolsDeployed: template.slots.length,
        endpoint: '/api/spaces/claim',
      });

      logger.info('[claim] Space claimed with provisional access', {
        claimId: claimRef.id,
        spaceId,
        spaceName: space.name.value,
        userId,
        role,
        proofType,
        endpoint: '/api/spaces/claim',
      });

      // Notify waitlist members that a leader has claimed the space (non-blocking)
      notifyWaitlistMembersOfClaim(spaceId, campusId, space.name.value, userName).catch(err => {
        logger.warn('[claim] Failed to notify waitlist members', {
          error: err instanceof Error ? err.message : String(err),
          spaceId,
        });
      });

      return respond.created(
        {
          claimId: claimRef.id,
          space: {
            id: spaceId,
            name: space.name.value,
            status: 'claimed',
            publishStatus: 'stealth',
            type: normalizedSpaceType,
          },
          provisionalAccess: true,
          message: 'Space claimed! You have provisional access while we verify your leadership.',
          setupProgress: space.setupProgress,
        },
        { message: 'Space claimed successfully' }
      );
    } catch (error) {
      logger.error('[claim] Failed to claim space', {
        userId,
        spaceId,
        error: error instanceof Error ? error.message : String(error),
      });
      return respond.error('Failed to claim space', 'INTERNAL_ERROR', {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
);

/**
 * GET /api/spaces/claim
 * Get user's pending and past claims
 */
const _GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  try {
    const claimsSnapshot = await dbAdmin
      .collection('builderRequests')
      .where('type', '==', 'claim')
      .where('userId', '==', userId)
      .where('campusId', '==', campusId)
      .orderBy('submittedAt', 'desc')
      .limit(20)
      .get();

    const claims = claimsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        spaceId: data.spaceId,
        spaceName: data.spaceName,
        role: data.role,
        proofType: data.proofType,
        status: data.status,
        provisionalAccessGranted: data.provisionalAccessGranted,
        submittedAt: data.submittedAt?.toDate?.()?.toISOString() ?? null,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() ?? null,
        reviewNotes: data.reviewNotes ?? null,
      };
    });

    return respond.success({ claims });
  } catch (error) {
    logger.error('[claim] Failed to load claims', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to load claims', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * Notify waitlist members when a space has been claimed by a leader.
 * This is a meaningful signal -- it means the space is about to become active.
 */
async function notifyWaitlistMembersOfClaim(
  spaceId: string,
  campusId: string,
  spaceName: string,
  claimerName: string
): Promise<void> {
  // Find all waitlist members for this space
  const waitlistSnapshot = await dbAdmin.collection('spaceWaitlists')
    .where('spaceId', '==', spaceId)
    .where('campusId', '==', campusId)
    .get();

  if (waitlistSnapshot.empty) {
    logger.debug('[claim] No waitlist members to notify', { spaceId });
    return;
  }

  const waitlistUserIds = waitlistSnapshot.docs.map(doc => doc.data().userId as string);

  const notifiedCount = await createBulkNotifications(waitlistUserIds, {
    type: 'space_join',
    category: 'spaces',
    title: `${spaceName} now has a leader!`,
    body: `${claimerName} claimed ${spaceName}. The space is getting set up -- join now to be a founding member.`,
    actionUrl: `/spaces/${spaceId}`,
    metadata: {
      spaceId,
      spaceName,
      actorName: claimerName,
    },
  });

  // Mark waitlist members as notified
  const batch = dbAdmin.batch();
  waitlistSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, { notified: true, notifiedAt: new Date().toISOString() });
  });
  await batch.commit();

  logger.info('[claim] Waitlist members notified of space claim', {
    spaceId,
    spaceName,
    waitlistCount: waitlistUserIds.length,
    notifiedCount,
  });
}

export const GET = withCache(_GET, 'SHORT');
