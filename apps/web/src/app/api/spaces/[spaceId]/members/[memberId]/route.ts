import { z } from "zod";
import * as admin from "firebase-admin";
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { HttpStatus } from "@/lib/api-response-types";
import { logger } from "@/lib/logger";
import { dbAdmin } from "@/lib/firebase-admin";
import { Result } from "@hive/core";
import {
  createServerSpaceManagementService,
  getServerSpaceRepository,
  getCategoryRules,
  canRemoveLeaders,
  normalizeCategory,
  type SpaceMemberRole,
  type SpaceCategoryValue,
  type SpaceServiceCallbacks,
  type SpaceMemberData,
} from "@hive/core/server";
import { enforceSpaceRules } from "@/lib/space-rules-middleware";

/**
 * Single Member Operations API - DDD Compliant
 *
 * PATCH  /api/spaces/[spaceId]/members/[memberId] - Update member role
 * DELETE /api/spaces/[spaceId]/members/[memberId] - Remove member
 *
 * Uses SpaceManagementService for DDD-compliant operations.
 */

const UpdateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'moderator', 'member', 'guest'])
});

/**
 * Create callbacks for DDD SpaceManagementService
 */
function createSpaceCallbacks(campusId: string): SpaceServiceCallbacks {
  return {
    findSpaceMember: async (spaceId: string, userId: string): Promise<Result<SpaceMemberData | null>> => {
      try {
        const query = dbAdmin.collection('spaceMembers')
          .where('spaceId', '==', spaceId)
          .where('userId', '==', userId)
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
    updateSpaceMember: async (spaceId: string, userId: string, updates: Record<string, unknown>): Promise<Result<void>> => {
      try {
        const query = dbAdmin.collection('spaceMembers')
          .where('spaceId', '==', spaceId)
          .where('userId', '==', userId)
          .where('campusId', '==', campusId)
          .limit(1);
        const snapshot = await query.get();
        if (!snapshot.empty) {
          const updateData: Record<string, unknown> = {};
          if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
          if (updates.role) updateData.role = updates.role;
          if (updates.permissions) updateData.permissions = updates.permissions;
          if (updates.leftAt) updateData.leftAt = admin.firestore.FieldValue.serverTimestamp();
          if (updates.removedAt) updateData.removedAt = admin.firestore.FieldValue.serverTimestamp();
          if (updates.removedBy) updateData.removedBy = updates.removedBy;
          updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
          await snapshot.docs[0].ref.update(updateData);
        }
        return Result.ok<void>();
      } catch (error) {
        return Result.fail<void>(`Failed to update member: ${error}`);
      }
    }
  };
}

// PATCH /api/spaces/[spaceId]/members/[memberId] - Update a member's role
export const PATCH = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; memberId: string }> },
  respond
) => {
  const { spaceId, memberId } = await params;
  const requesterId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  // Validate payload
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond.error("Invalid request body", "INVALID_INPUT", { status: HttpStatus.BAD_REQUEST });
  }
  const parse = UpdateMemberRoleSchema.safeParse(body);
  if (!parse.success) {
    return respond.error("Invalid role", "VALIDATION_ERROR", { status: HttpStatus.BAD_REQUEST });
  }
  const { role: newRole } = parse.data;

  const promotePermission = await enforceSpaceRules(spaceId, requesterId, 'members:promote');
  if (!promotePermission.allowed) {
    return respond.error(promotePermission.reason || "Permission denied", "FORBIDDEN", {
      status: HttpStatus.FORBIDDEN,
    });
  }

  // Create the space management service with callbacks for member updates
  const spaceService = createServerSpaceManagementService(
    { userId: requesterId, campusId },
    createSpaceCallbacks(campusId)
  );

  // Use the DDD service to change member role
  const result = await spaceService.changeMemberRole(requesterId, {
    spaceId,
    targetUserId: memberId,
    newRole: newRole as SpaceMemberRole,
  });

  if (result.isFailure) {
    const errorMsg = result.error ?? "Failed to update member role";
    if (errorMsg.includes('permission') || errorMsg.includes('owner') || errorMsg.includes('admin')) {
      return respond.error(errorMsg, "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
    }
    if (errorMsg.includes('not found') || errorMsg.includes('not a member')) {
      return respond.error(errorMsg, "RESOURCE_NOT_FOUND", { status: HttpStatus.NOT_FOUND });
    }
    return respond.error(errorMsg, "UPDATE_FAILED", { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }

  logger.info('Member role updated', { spaceId, memberId, newRole, by: requesterId });
  return respond.success({ message: 'Member updated', role: newRole });
});

// DELETE /api/spaces/[spaceId]/members/[memberId] - Remove a member
export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; memberId: string }> },
  respond
) => {
  const { spaceId, memberId } = await params;
  const requesterId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  const removePermission = await enforceSpaceRules(spaceId, requesterId, 'members:remove');
  if (!removePermission.allowed) {
    return respond.error(removePermission.reason || "Permission denied", "FORBIDDEN", {
      status: HttpStatus.FORBIDDEN,
    });
  }

  // Check if target member is a leader and if category allows leader removal
  const LEADER_ROLES = new Set(['owner', 'admin', 'moderator']);

  const membershipDoc = await dbAdmin
    .collection('spaceMembers')
    .doc(`${spaceId}_${memberId}`)
    .get();

  if (membershipDoc.exists) {
    const memberRole = membershipDoc.data()?.role as string | undefined;

    // If target is a leader, check category rules
    if (memberRole && LEADER_ROLES.has(memberRole)) {
      const spaceRepo = getServerSpaceRepository();
      const spaceResult = await spaceRepo.findById(spaceId);

      if (spaceResult.isSuccess) {
        const space = spaceResult.getValue();
        const category = normalizeCategory(space.category.value || 'student_org') as SpaceCategoryValue;

        if (!canRemoveLeaders(category)) {
          const rules = getCategoryRules(category);
          return respond.error(
            `Leaders cannot be removed from ${rules.leadershipDescription} spaces. Contact an administrator.`,
            'FORBIDDEN',
            {
              status: HttpStatus.FORBIDDEN,
              details: {
                category,
                reason: 'leader_removal_not_allowed',
              },
            }
          );
        }
      }
    }
  }

  // Create the space management service with callbacks for member updates
  const spaceService = createServerSpaceManagementService(
    { userId: requesterId, campusId },
    createSpaceCallbacks(campusId)
  );

  // Use the DDD service to remove member
  const result = await spaceService.removeMember(requesterId, {
    spaceId,
    targetUserId: memberId,
  });

  if (result.isFailure) {
    const errorMsg = result.error ?? "Failed to remove member";
    if (errorMsg.includes('permission') || errorMsg.includes('owner') || errorMsg.includes('admin') || errorMsg.includes('moderator')) {
      return respond.error(errorMsg, "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
    }
    if (errorMsg.includes('not found') || errorMsg.includes('not a member')) {
      return respond.error(errorMsg, "RESOURCE_NOT_FOUND", { status: HttpStatus.NOT_FOUND });
    }
    return respond.error(errorMsg, "DELETE_FAILED", { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }

  logger.info('Member removed from space', { spaceId, memberId, by: requesterId });
  return respond.success({ message: 'Member removed' });
});
