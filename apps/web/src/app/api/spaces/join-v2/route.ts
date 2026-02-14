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
import {
  incrementMemberCount,
  isShardedMemberCountEnabled
} from "@/lib/services/sharded-member-counter.service";
import { checkMajorSpaceUnlock } from "@/lib/services/space-unlock.service";
import { DEFAULT_ACTIVATION_THRESHOLD } from "@hive/core/domain";
import { enforceJoinRules } from "@/lib/space-rules-middleware";

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

    // CHECK 1: Validate user is not banned/suspended
    const userDoc = await dbAdmin.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.banned === true) {
        return respond.error('Your account has been suspended', "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
      }
      if (userData?.spaceBanned === true) {
        return respond.error('You have been banned from joining spaces', "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
      }
    }

    // CHECK 2: Validate ability to join with campus isolation
    const joinValidation = await validateSpaceJoinability(userId, spaceId);
    if (!joinValidation.canJoin) {
      const status = joinValidation.error === 'Space not found' ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
      const code = status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      return respond.error(joinValidation.error!, code, { status });
    }

    const space = joinValidation.space!;

    // CHECK 2.5: Enforce space-type join rules (method, max spaces, approval policy)
    const joinRules = await enforceJoinRules(spaceId, userId, joinMethod);
    if (!joinRules.allowed) {
      const isConflict = joinRules.reason?.toLowerCase().includes('already a member');
      return respond.error(
        joinRules.reason || 'Join rules were not met',
        isConflict ? 'CONFLICT' : 'BUSINESS_RULE_VIOLATION',
        {
          status: isConflict ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST,
          details: {
            requiredJoinMethod: joinRules.joinMethod,
            approvalProcess: joinRules.approvalProcess,
          },
        }
      );
    }

    // Approval-mode spaces require join-request workflow unless joining with invite code
    if (joinRules.requiresApproval && !inviteCode) {
      return respond.error(
        'This space requires an approval request before joining',
        'BUSINESS_RULE_VIOLATION',
        {
          status: HttpStatus.BAD_REQUEST,
          details: {
            requiredJoinMethod: joinRules.joinMethod,
            approvalProcess: joinRules.approvalProcess,
          },
        }
      );
    }

    // CHECK 3: Validate user is not banned from this specific space
    const spaceBanDoc = await dbAdmin.collection('spaceBans')
      .where('spaceId', '==', spaceId)
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (!spaceBanDoc.empty) {
      return respond.error('You have been banned from this space', "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
    }

    // CHECK 4: Validate space is not full (if member limit is set)
    if (space.memberLimit && space.memberLimit > 0) {
      const currentMemberCount = space.metrics?.memberCount || space.memberCount || 0;
      if (currentMemberCount >= space.memberLimit) {
        return respond.error('This space has reached its member limit', "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
      }
    }

    // Create callbacks for DDD service
    const callbacks: SpaceServiceCallbacks = {
      saveSpaceMember: async (member: SpaceMemberData): Promise<Result<void>> => {
        try {
          // P0 SECURITY FIX: Use composite key to prevent duplicate memberships
          // Format: {spaceId}_{userId} ensures one document per user per space
          const compositeId = `${member.spaceId}_${member.userId}`;
          const memberRef = dbAdmin.collection('spaceMembers').doc(compositeId);

          // Determine if this is a founding member (joined before threshold reached)
          const currentCount = space.metrics?.memberCount || space.memberCount || 0;
          const threshold = space.activationThreshold ?? DEFAULT_ACTIVATION_THRESHOLD;
          const isFoundingMember = currentCount < threshold;

          // Use set with merge to handle both create and reactivation atomically
          await memberRef.set(addSecureCampusMetadata({
            spaceId: member.spaceId,
            userId: member.userId,
            role: member.role,
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            isActive: member.isActive,
            permissions: member.permissions,
            joinMethod: member.joinMethod,
            joinMetadata: { inviteCode: inviteCode || null, ...(metadata || {}) },
            isFoundingMember, // Track founding members who joined before threshold
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
          // SCALING FIX: Use sharded counters for memberCount to handle 200+ writes/sec
          if (metrics.memberCountDelta && isShardedMemberCountEnabled()) {
            await incrementMemberCount(spaceIdParam, metrics.memberCountDelta);
            logger.debug('[join-v2] Used sharded member counter', { spaceId: spaceIdParam, delta: metrics.memberCountDelta });
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

    // Check if this join triggers a major space unlock
    let unlockResult = null;
    // Check if this join triggers quorum-based space activation
    let activationResult: {
      justActivated: boolean;
      activationStatus: 'ghost' | 'gathering' | 'open';
      memberCount: number;
      threshold: number;
      membersNeeded: number;
    } | null = null;

    if (!result.isReactivation) {
      // === QUORUM-BASED ACTIVATION CHECK ===
      try {
        const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
        const spaceDoc = await spaceRef.get();
        const spaceData = spaceDoc.data();

        if (spaceData) {
          const currentMemberCount = (spaceData.memberCount || 0) + 1; // +1 for the join we just processed
          const threshold = spaceData.activationThreshold ?? DEFAULT_ACTIVATION_THRESHOLD;
          const previousStatus = spaceData.activationStatus || 'ghost';
          const isClaimed = Boolean(spaceData.createdBy || spaceData.creatorId);

          // Calculate new activation status
          let newStatus: 'ghost' | 'gathering' | 'open';
          if (isClaimed) {
            // Claimed spaces are always open
            newStatus = 'open';
          } else if (currentMemberCount === 0) {
            newStatus = 'ghost';
          } else if (currentMemberCount < threshold) {
            newStatus = 'gathering';
          } else {
            newStatus = 'open';
          }

          const justActivated = previousStatus !== 'open' && newStatus === 'open';

          // Update space if activation status changed
          if (previousStatus !== newStatus) {
            const updates: Record<string, unknown> = {
              activationStatus: newStatus,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (justActivated) {
              updates.activatedAt = admin.firestore.FieldValue.serverTimestamp();
            }
            await spaceRef.update(updates);

            logger.info('[join-v2] Space activation status updated', {
              spaceId,
              previousStatus,
              newStatus,
              memberCount: currentMemberCount,
              threshold,
              justActivated,
            });
          }

          // Build activation result for response
          activationResult = {
            justActivated,
            activationStatus: newStatus,
            memberCount: currentMemberCount,
            threshold,
            membersNeeded: Math.max(0, threshold - currentMemberCount),
          };

          if (justActivated) {
            logger.info('🎉 Space activated via quorum!', {
              spaceId,
              spaceName: space.name,
              memberCount: currentMemberCount,
              threshold,
              activatedBy: userId,
            });
          }
        }
      } catch (activationError) {
        // Don't fail the join if activation check fails
        logger.warn('[join-v2] Failed to check space activation', {
          error: activationError instanceof Error ? activationError.message : String(activationError),
          spaceId,
          userId,
        });
      }

      // === MAJOR SPACE UNLOCK CHECK ===
      try {
        // Check if space should unlock (only for major spaces)
        const unlockCheck = await checkMajorSpaceUnlock(spaceId);

        if (unlockCheck.unlocked) {
          logger.info('🎉 Major space unlocked!', {
            spaceId,
            majorName: space.name,
            newMemberCount: unlockCheck.newMemberCount,
            notifiedCount: unlockCheck.notifiedCount,
            unlockedBy: userId,
          });

          unlockResult = {
            unlocked: true,
            majorName: space.name,
            spaceId,
          };
        } else if (unlockCheck.error) {
          logger.warn('Unlock check failed (non-critical)', {
            spaceId,
            error: unlockCheck.error,
          });
        }
      } catch (unlockError) {
        // Don't fail the join if unlock check fails
        logger.error('Failed to check major space unlock', {
          error: unlockError instanceof Error ? unlockError.message : String(unlockError),
          spaceId,
          userId,
        });
      }
    }

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

      // Trigger member_join automations (welcome messages, etc.)
      try {
        const userDoc = await dbAdmin.collection('users').doc(userId).get();
        const memberName = userDoc.data()?.fullName || userDoc.data()?.displayName || 'Member';

        // Find and execute member_join automations
        const automationsSnapshot = await dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .collection('automations')
          .where('trigger.type', '==', 'member_join')
          .where('enabled', '==', true)
          .get();

        if (!automationsSnapshot.empty) {
          logger.info('[join-v2] Triggering member_join automations', {
            spaceId,
            userId,
            automationCount: automationsSnapshot.size,
          });

          // Execute each automation inline (fire-and-forget for speed)
          automationsSnapshot.docs.forEach(async (doc) => {
            const automation = doc.data();
            try {
              await executeWelcomeAutomation(
                automation,
                doc.id,
                spaceId,
                campusId,
                userId,
                memberName
              );

              // Record success
              await doc.ref.update({
                'stats.timesTriggered': admin.firestore.FieldValue.increment(1),
                'stats.successCount': admin.firestore.FieldValue.increment(1),
                'stats.lastTriggered': admin.firestore.FieldValue.serverTimestamp(),
              });

              logger.info('[join-v2] Welcome automation executed', {
                automationId: doc.id,
                automationName: automation.name,
                spaceId,
                newMemberId: userId,
              });
            } catch (autoError) {
              // Record failure
              await doc.ref.update({
                'stats.timesTriggered': admin.firestore.FieldValue.increment(1),
                'stats.failureCount': admin.firestore.FieldValue.increment(1),
                'stats.lastTriggered': admin.firestore.FieldValue.serverTimestamp(),
              });

              logger.error('[join-v2] Welcome automation failed', {
                automationId: doc.id,
                error: autoError instanceof Error ? autoError.message : String(autoError),
              });
            }
          });
        }
      } catch (automationError) {
        // Don't fail the join if automation fails
        logger.warn('[join-v2] Failed to trigger automations', {
          error: automationError instanceof Error ? automationError.message : String(automationError),
          spaceId,
          userId,
        });
      }
    }

    return respond.success({
      space: { id: spaceId, name: space.name, type: space.type, description: space.description },
      membership: { userId, role: result.role, isActive: true, joinMethod },
      unlock: unlockResult, // Include unlock data if space was unlocked
      activation: activationResult // Include quorum activation info
    }, { message: 'Successfully joined the space' });
  }
);

/**
 * Execute a welcome message automation
 * Sends the configured welcome message to the appropriate board
 */
async function executeWelcomeAutomation(
  automation: admin.firestore.DocumentData,
  automationId: string,
  spaceId: string,
  campusId: string,
  newMemberId: string,
  memberName: string
): Promise<void> {
  const action = automation.action;

  // Only handle send_message actions for now
  if (action?.type !== 'send_message') {
    logger.warn('[join-v2] Unsupported automation action type', {
      automationId,
      actionType: action?.type,
    });
    return;
  }

  const config = action.config || {};
  let boardId = config.boardId || 'general';
  let content = config.content || 'Welcome to our space!';

  // Interpolate member variables
  content = content
    .replace(/\{member\}/g, memberName)
    .replace(/\{member\.name\}/g, memberName)
    .replace(/\{member\.id\}/g, newMemberId);

  // Find the target board
  const boardsRef = dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('boards');

  if (boardId === 'general') {
    // Find the general board by name
    const generalBoard = await boardsRef
      .where('name', '==', 'General')
      .limit(1)
      .get();

    if (!generalBoard.empty) {
      boardId = generalBoard.docs[0].id;
    } else {
      // Try finding any board
      const anyBoard = await boardsRef.limit(1).get();
      if (!anyBoard.empty) {
        boardId = anyBoard.docs[0].id;
      } else {
        logger.error('[join-v2] No board found for welcome message', {
          automationId,
          spaceId,
        });
        return;
      }
    }
  }

  // Create the welcome message
  const messageRef = boardsRef.doc(boardId).collection('messages').doc();

  await messageRef.set({
    id: messageRef.id,
    spaceId,
    boardId,
    content,
    authorId: 'system', // System-generated message
    authorName: '🤖 HIVE Bot',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    type: 'system',
    metadata: {
      isAutomation: true,
      automationId,
      automationName: automation.name,
      triggerType: 'member_join',
      triggeredBy: newMemberId,
    },
    campusId,
  });

  logger.info('[join-v2] Welcome message sent', {
    messageId: messageRef.id,
    automationId,
    spaceId,
    boardId,
    newMemberId,
  });
}
