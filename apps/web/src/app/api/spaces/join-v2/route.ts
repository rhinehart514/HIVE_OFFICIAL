import { z } from "zod";
import * as admin from 'firebase-admin';
import { Result } from "@hive/core/domain";
import {
  createServerSpaceManagementService,
  type SpaceMemberData,
  type SpaceServiceCallbacks
} from "@hive/core/server";
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from "@/lib/logger";
import { withAuthValidationAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { validateSpaceJoinability, addSecureCampusMetadata } from "@/lib/secure-firebase-queries";
import { HttpStatus } from "@/lib/api-response-types";
import { notifySpaceJoin } from "@/lib/notification-service";

/**
 * Space Join API v2
 * - Idempotent join
 * - Reactivates inactive membership
 * - Records join method and optional metadata
 */
const joinV2Schema = z.object({
  spaceId: z.string().min(1, "Space ID is required"),
  joinMethod: z.enum(['manual', 'invite', 'approval', 'auto']).optional(),
  inviteCode: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const POST = withAuthValidationAndErrors(
  joinV2Schema,
  async (request, _context, body: z.infer<typeof joinV2Schema>, respond) => {
    const { spaceId, inviteCode, metadata } = body;
    const joinMethod = body.joinMethod ?? 'manual';
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    // SECURITY: Validate ability to join with campus isolation
    const joinValidation = await validateSpaceJoinability(userId, spaceId);
    if (!joinValidation.canJoin) {
      const status = joinValidation.error === 'Space not found' ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
      const code = status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      return respond.error(joinValidation.error!, code, { status });
    }

    const space = joinValidation.space!;

    // Create callbacks for DDD service
    const callbacks: SpaceServiceCallbacks = {
      saveSpaceMember: async (member: SpaceMemberData): Promise<Result<void>> => {
        try {
          // P0 SECURITY FIX: Use composite key to prevent duplicate memberships
          // Format: {spaceId}_{userId} ensures one document per user per space
          const compositeId = `${member.spaceId}_${member.userId}`;
          const memberRef = dbAdmin.collection('spaceMembers').doc(compositeId);

          // Use set with merge to handle both create and reactivation atomically
          await memberRef.set(addSecureCampusMetadata({
            spaceId: member.spaceId,
            userId: member.userId,
            role: member.role,
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            isActive: member.isActive,
            permissions: member.permissions,
            joinMethod: member.joinMethod,
            joinMetadata: { inviteCode: inviteCode || null, ...(metadata || {}) }
          }), { merge: true });

          logger.info('[join-v2] Member saved successfully', {
            spaceId: member.spaceId,
            userId: member.userId,
            compositeId
          });
          return Result.ok<void>();
        } catch (error: unknown) {
          // Extract detailed error information
          const errorCode = (error as { code?: string })?.code;
          const errorMessage = error instanceof Error ? error.message : String(error);

          logger.error('[join-v2] saveSpaceMember failed', {
            code: errorCode,
            message: errorMessage,
            spaceId: member.spaceId,
            userId: member.userId,
            campusId: campusId
          });

          // Return specific error for permission issues
          if (errorCode === 'permission-denied') {
            return Result.fail<void>('PERMISSION_DENIED: Check Firestore rules for spaceMembers collection');
          }
          return Result.fail<void>(`Failed to save space member: ${errorMessage}`);
        }
      },
      findSpaceMember: async (spaceIdParam: string, userIdParam: string): Promise<Result<SpaceMemberData | null>> => {
        try {
          // P0 SECURITY FIX: Use direct document lookup with composite key (faster, atomic)
          const compositeId = `${spaceIdParam}_${userIdParam}`;
          const doc = await dbAdmin.collection('spaceMembers').doc(compositeId).get();

          if (!doc.exists) {
            // Fallback: Check for legacy documents with query (for migration period)
            const legacyQuery = dbAdmin.collection('spaceMembers')
              .where('spaceId', '==', spaceIdParam)
              .where('userId', '==', userIdParam)
              .where('campusId', '==', campusId)
              .limit(1);
            const legacySnapshot = await legacyQuery.get();
            if (legacySnapshot.empty) {
              return Result.ok(null);
            }
            const legacyData = legacySnapshot.docs[0].data();
            return Result.ok({
              spaceId: legacyData.spaceId,
              userId: legacyData.userId,
              campusId: legacyData.campusId,
              role: legacyData.role,
              joinedAt: legacyData.joinedAt?.toDate?.() || new Date(),
              isActive: legacyData.isActive,
              permissions: legacyData.permissions || ['post'],
              joinMethod: legacyData.joinMethod || 'manual'
            });
          }

          const data = doc.data()!;
          // Verify campus isolation
          if (data.campusId !== campusId) {
            return Result.ok(null);
          }

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
          // P0 SECURITY FIX: Use composite key for direct document update
          const compositeId = `${spaceIdParam}_${userIdParam}`;
          const memberRef = dbAdmin.collection('spaceMembers').doc(compositeId);
          const doc = await memberRef.get();

          if (doc.exists && doc.data()?.campusId === campusId) {
            const updateData: Record<string, unknown> = { ...updates };
            if (updates.joinedAt) updateData.joinedAt = admin.firestore.FieldValue.serverTimestamp();
            updateData.joinMetadata = { inviteCode: inviteCode || null, ...(metadata || {}) };
            await memberRef.update(updateData);
          } else {
            // Fallback: Try legacy query for migration period
            const legacyQuery = dbAdmin.collection('spaceMembers')
              .where('spaceId', '==', spaceIdParam)
              .where('userId', '==', userIdParam)
              .where('campusId', '==', campusId)
              .limit(1);
            const snapshot = await legacyQuery.get();
            if (!snapshot.empty) {
              const updateData: Record<string, unknown> = { ...updates };
              if (updates.joinedAt) updateData.joinedAt = admin.firestore.FieldValue.serverTimestamp();
              updateData.joinMetadata = { inviteCode: inviteCode || null, ...(metadata || {}) };
              await snapshot.docs[0].ref.update(updateData);
            }
          }
          return Result.ok<void>();
        } catch (error) {
          return Result.fail<void>(`Failed to update member: ${error}`);
        }
      },
      updateSpaceMetrics: async (spaceIdParam: string, metrics): Promise<Result<void>> => {
        try {
          const spaceRef = dbAdmin.collection('spaces').doc(spaceIdParam);
          const updates: Record<string, unknown> = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
          if (metrics.memberCountDelta) {
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

    const joinResult = await spaceService.joinSpace(userId, {
      spaceId,
      joinMethod,
      inviteCode,
      metadata
    });

    if (joinResult.isFailure) {
      const errorMessage = joinResult.error || 'Failed to join space';

      // Return appropriate HTTP status based on error type
      if (errorMessage.includes('Already a member')) {
        return respond.error(errorMessage, "CONFLICT", { status: HttpStatus.CONFLICT });
      }
      if (errorMessage.includes('PERMISSION_DENIED')) {
        logger.error('[join-v2] Permission denied - Firestore rules issue', { userId, spaceId });
        return respond.error('Permission denied. Please contact support.', "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
      }
      if (errorMessage.includes('not found') || errorMessage.includes('NOT_FOUND')) {
        return respond.error(errorMessage, "RESOURCE_NOT_FOUND", { status: HttpStatus.NOT_FOUND });
      }

      logger.error('[join-v2] Failed to join space via DDD service', {
        error: errorMessage,
        userId,
        spaceId,
        campusId: campusId
      });
      return respond.error(errorMessage, "INTERNAL_ERROR", { status: HttpStatus.INTERNAL_SERVER_ERROR });
    }

    const result = joinResult.getValue().data;

    logger.info('✅ User joined space via DDD (v2)', {
      userId,
      spaceId,
      joinMethod,
      isReactivation: result.isReactivation,
      endpoint: '/api/spaces/join-v2'
    });

    // Notify space leaders about new member (only for new joins, not reactivations)
    if (!result.isReactivation) {
      try {
        // Get user's name for notification
        const userDoc = await dbAdmin.collection('users').doc(userId).get();
        const userName = userDoc.data()?.fullName || 'Someone';

        // Find space leaders/admins to notify
        const leadersSnapshot = await dbAdmin.collection('spaceMembers')
          .where('spaceId', '==', spaceId)
          .where('campusId', '==', campusId)
          .where('role', 'in', ['owner', 'admin', 'leader'])
          .where('isActive', '==', true)
          .get();

        // Notify each leader
        const notifyPromises = leadersSnapshot.docs.map(doc => {
          const leaderUserId = doc.data().userId;
          return notifySpaceJoin({
            leaderUserId,
            newMemberId: userId,
            newMemberName: userName,
            spaceId,
            spaceName: space.name,
          });
        });

        await Promise.all(notifyPromises);
      } catch (notifyError) {
        // Don't fail the join if notification fails
        logger.warn('Failed to send space join notification', {
          error: notifyError instanceof Error ? notifyError.message : String(notifyError),
          spaceId,
          userId,
        });
      }
    }

    return respond.success({
      space: { id: spaceId, name: space.name, type: space.type, description: space.description },
      membership: { userId, role: result.role, isActive: true, joinMethod }
    }, { message: 'Successfully joined the space' });
  }
);
