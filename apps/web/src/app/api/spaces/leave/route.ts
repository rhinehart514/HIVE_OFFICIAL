import { z } from "zod";
import * as admin from 'firebase-admin';
import { Result } from "@hive/core/domain";
import {
  createServerSpaceManagementService,
  type SpaceMemberData,
  type SpaceServiceCallbacks
} from "@hive/core/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { withAuthValidationAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { validateSecureSpaceMembership, addSecureCampusMetadata } from "@/lib/secure-firebase-queries";
import {
  incrementMemberCount,
  isShardedMemberCountEnabled
} from "@/lib/services/sharded-member-counter.service";
import { normalizeSpaceType } from "@/lib/space-rules-middleware";
import { getSpaceTypeRules } from "@/lib/space-type-rules";

const leaveSpaceSchema = z.object({
  spaceId: z.string().min(1, "Space ID is required"),
  leaveReason: z.enum(['housing_change', 'semester_end', 'other']).optional(),
});

/**
 * Leave a space manually - Updated for DDD with flat collection structure
 * POST /api/spaces/leave
 */
export const POST = withAuthValidationAndErrors(
  leaveSpaceSchema,
  async (request, _context, body: z.infer<typeof leaveSpaceSchema>, respond) => {
    const { spaceId, leaveReason } = body;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    // SECURITY: Use secure membership validation with campus isolation
    const membershipValidation = await validateSecureSpaceMembership(userId, spaceId);

    if (!membershipValidation.isValid) {
      const status = membershipValidation.error === 'Space not found' ? 404 : 403;
      return respond.error(membershipValidation.error!, "RESOURCE_NOT_FOUND", { status });
    }

    const space = membershipValidation.space!;
    // memberData available if needed for additional leave logic
    void membershipValidation.membership;

    // Enforce space-type leave restrictions
    const rawSpaceType = (space as { category?: string; type?: string }).category || space.type;
    const spaceType = normalizeSpaceType(rawSpaceType);
    const leaveRestriction = getSpaceTypeRules(spaceType).membership.leaveRestriction || 'none';
    if (leaveRestriction === 'housing_change_only' && leaveReason !== 'housing_change') {
      return respond.error(
        'Members of campus living spaces can only leave when housing assignment changes',
        "BUSINESS_RULE_VIOLATION",
        { status: 400 }
      );
    }
    if (leaveRestriction === 'semester_end' && leaveReason !== 'semester_end') {
      return respond.error(
        'Members of this space can only leave at semester end',
        "BUSINESS_RULE_VIOLATION",
        { status: 400 }
      );
    }

    // Create callbacks for DDD service
    const callbacks: SpaceServiceCallbacks = {
      findSpaceMember: async (spaceIdParam: string, userIdParam: string): Promise<Result<SpaceMemberData | null>> => {
        try {
          const query = dbAdmin.collection('spaceMembers')
            .where('spaceId', '==', spaceIdParam)
            .where('userId', '==', userIdParam)
            .where('campusId', '==', campusId)
            .limit(1);
          const snapshot = await query.get();
          if (snapshot.empty) {
            return Result.ok(null);
          }
          const doc = snapshot.docs[0];
          const data = doc.data();
          return Result.ok({
            spaceId: data.spaceId,
            userId: data.userId,
            campusId: data.campusId,
            role: data.role,
            joinedAt: data.joinedAt?.toDate?.() || new Date(),
            isActive: data.isActive,
            permissions: data.permissions || ['post'],
            joinMethod: data.joinMethod || 'manual'
          });
        } catch (error) {
          return Result.fail(`Failed to find member: ${error}`);
        }
      },
      updateSpaceMember: async (spaceIdParam: string, userIdParam: string, updates): Promise<Result<void>> => {
        try {
          const query = dbAdmin.collection('spaceMembers')
            .where('spaceId', '==', spaceIdParam)
            .where('userId', '==', userIdParam)
            .where('campusId', '==', campusId)
            .limit(1);
          const snapshot = await query.get();
          if (!snapshot.empty) {
            const updateData: Record<string, unknown> = {};
            if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
            if (updates.leftAt) updateData.leftAt = admin.firestore.FieldValue.serverTimestamp();
            await snapshot.docs[0].ref.update(updateData);
          }
          return Result.ok<void>();
        } catch (error) {
          return Result.fail<void>(`Failed to update member: ${error}`);
        }
      },
      updateSpaceMetrics: async (spaceIdParam: string, metrics): Promise<Result<void>> => {
        try {
          // SCALING FIX: Use sharded counters for memberCount to handle 200+ writes/sec
          if (metrics.memberCountDelta && isShardedMemberCountEnabled()) {
            await incrementMemberCount(spaceIdParam, metrics.memberCountDelta);
            logger.debug('[leave] Used sharded member counter', { spaceId: spaceIdParam, delta: metrics.memberCountDelta });
          }

          // Update space document (activeMembers still uses inline, memberCount uses sharded when enabled)
          const spaceRef = dbAdmin.collection('spaces').doc(spaceIdParam);
          const updates: Record<string, unknown> = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

          // Fallback to inline counter if sharding not enabled
          if (metrics.memberCountDelta && !isShardedMemberCountEnabled()) {
            updates['metrics.memberCount'] = admin.firestore.FieldValue.increment(metrics.memberCountDelta);
          }
          if (metrics.activeCountDelta) {
            updates['metrics.activeMembers'] = admin.firestore.FieldValue.increment(metrics.activeCountDelta);
          }
          await spaceRef.update(updates);
          return Result.ok<void>();
        } catch (error) {
          return Result.fail<void>(`Failed to update metrics: ${error}`);
        }
      }
    };

    // Use DDD SpaceManagementService
    const spaceService = createServerSpaceManagementService(
      { userId, campusId: campusId },
      callbacks
    );

    const leaveResult = await spaceService.leaveSpace(userId, { spaceId });

    if (leaveResult.isFailure) {
      const errorMessage = leaveResult.error || 'Failed to leave space';
      if (errorMessage.includes('only owner')) {
        return respond.error(errorMessage, "BUSINESS_RULE_VIOLATION", { status: 409 });
      }
      if (errorMessage.includes('Not a member')) {
        return respond.error(errorMessage, "RESOURCE_NOT_FOUND", { status: 404 });
      }
      logger.error('Failed to leave space via DDD service', { error: errorMessage, userId, spaceId });
      return respond.error(errorMessage, "INTERNAL_ERROR", { status: 500 });
    }

    const result = leaveResult.getValue().data;

    // Record leave activity with secure campus metadata (kept separate from DDD for audit purposes)
    const activityRef = dbAdmin.collection('activityEvents').doc();
    await activityRef.set(addSecureCampusMetadata({
      userId,
      type: 'space_leave',
      spaceId,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      metadata: {
        spaceName: space.name,
        spaceType: space.type,
        previousRole: result.previousRole,
        leaveReason: leaveReason || null,
        leaveRestriction,
      }
    }));

    logger.info('✅ User left space via DDD successfully', {
      userId,
      spaceId,
      spaceName: space.name,
      previousRole: result.previousRole,
      endpoint: '/api/spaces/leave'
    });

    return respond.success({
      space: {
        id: spaceId,
        name: space.name,
        type: space.type,
        description: space.description
      }
    }, {
      message: "Successfully left the space"
    });

  }
);
