"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { Result } from "@hive/core/domain";
import {
  createServerSpaceManagementService,
  getServerSpaceRepository,
  type SpaceMemberData,
  type SpaceServiceCallbacks
} from "@hive/core/server";
import { logger } from "@/lib/structured-logger";
import {
  withAuthValidationAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import {
  CURRENT_CAMPUS_ID,
  addSecureCampusMetadata,
} from "@/lib/secure-firebase-queries";
import { HttpStatus } from "@/lib/api-response-types";

const BatchInviteSchema = z.object({
  action: z.literal("invite"),
  members: z.array(z.object({
    userId: z.string(),
    role: z.enum(["member", "moderator", "admin"]),
  })).min(1).max(50), // Max 50 at a time
});

const BatchUpdateRolesSchema = z.object({
  action: z.literal("updateRoles"),
  updates: z.array(z.object({
    userId: z.string(),
    role: z.enum(["member", "moderator", "admin"]),
  })).min(1).max(50),
});

const BatchRemoveSchema = z.object({
  action: z.literal("remove"),
  userIds: z.array(z.string()).min(1).max(50),
  reason: z.string().optional(),
});

const BatchOperationSchema = z.discriminatedUnion("action", [
  BatchInviteSchema,
  BatchUpdateRolesSchema,
  BatchRemoveSchema,
]);

type BatchOperationInput = z.infer<typeof BatchOperationSchema>;
type BatchResult = {
  success: boolean;
  userId: string;
  error?: string;
};

/**
 * Validate space and check leader permissions
 */
async function validateSpaceAndLeaderPermission(spaceId: string, userId: string) {
  const spaceRepo = getServerSpaceRepository();
  const spaceResult = await spaceRepo.findById(spaceId);

  if (spaceResult.isFailure) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: "Space not found" };
  }

  const space = spaceResult.getValue();

  if (space.campusId.id !== CURRENT_CAMPUS_ID) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Access denied" };
  }

  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', CURRENT_CAMPUS_ID)
    .limit(1)
    .get();

  if (membershipSnapshot.empty) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Membership required" };
  }

  const membership = membershipSnapshot.docs[0].data();
  const role = membership.role;

  // Only owners and admins can do batch operations
  if (!["owner", "admin"].includes(role)) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Only leaders can perform batch operations" };
  }

  return { ok: true as const, space, membership, role };
}

/**
 * Create callbacks for DDD SpaceManagementService
 */
function createSpaceCallbacks(): SpaceServiceCallbacks {
  return {
    saveSpaceMember: async (member: SpaceMemberData): Promise<Result<void>> => {
      try {
        const memberRef = dbAdmin.collection('spaceMembers').doc();
        await memberRef.set(addSecureCampusMetadata({
          spaceId: member.spaceId,
          userId: member.userId,
          role: member.role,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
          isActive: member.isActive,
          permissions: member.permissions,
          joinMethod: member.joinMethod,
          isOnline: false
        }));
        return Result.ok<void>();
      } catch (error) {
        return Result.fail<void>(`Failed to save space member: ${error}`);
      }
    },
    findSpaceMember: async (spaceIdParam: string, userIdParam: string): Promise<Result<SpaceMemberData | null>> => {
      try {
        const query = dbAdmin.collection('spaceMembers')
          .where('spaceId', '==', spaceIdParam)
          .where('userId', '==', userIdParam)
          .where('campusId', '==', CURRENT_CAMPUS_ID)
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
    updateSpaceMember: async (spaceIdParam: string, userIdParam: string, updates: Record<string, unknown>): Promise<Result<void>> => {
      try {
        const query = dbAdmin.collection('spaceMembers')
          .where('spaceId', '==', spaceIdParam)
          .where('userId', '==', userIdParam)
          .where('campusId', '==', CURRENT_CAMPUS_ID)
          .limit(1);
        const snapshot = await query.get();
        if (!snapshot.empty) {
          const updateData: Record<string, unknown> = {};
          if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
          if (updates.role) updateData.role = updates.role;
          if (updates.permissions) updateData.permissions = updates.permissions;
          if (updates.joinedAt) updateData.joinedAt = admin.firestore.FieldValue.serverTimestamp();
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
}

/**
 * POST /api/spaces/[spaceId]/members/batch
 *
 * Perform batch member operations:
 * - invite: Add multiple members at once
 * - updateRoles: Update roles for multiple members
 * - remove: Remove multiple members
 */
export const POST = withAuthValidationAndErrors(
  BatchOperationSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    body: BatchOperationInput,
    respond,
  ) => {
    const requesterId = getUserId(request as AuthenticatedRequest);
    const { spaceId } = await params;

    const validation = await validateSpaceAndLeaderPermission(spaceId, requesterId);
    if (!validation.ok) {
      const code = validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      return respond.error(validation.message, code, { status: validation.status });
    }

    const spaceService = createServerSpaceManagementService(
      { userId: requesterId, campusId: CURRENT_CAMPUS_ID },
      createSpaceCallbacks()
    );

    const results: BatchResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    if (body.action === "invite") {
      // Batch invite
      for (const member of body.members) {
        try {
          // Verify user exists
          const userDoc = await dbAdmin.collection("users").doc(member.userId).get();
          if (!userDoc.exists) {
            results.push({ success: false, userId: member.userId, error: "User not found" });
            failureCount++;
            continue;
          }

          const inviteResult = await spaceService.inviteMember(requesterId, {
            spaceId,
            targetUserId: member.userId,
            role: member.role as 'member' | 'moderator' | 'admin' | 'owner' | 'guest'
          });

          if (inviteResult.isFailure) {
            results.push({ success: false, userId: member.userId, error: inviteResult.error || "Failed to invite" });
            failureCount++;
          } else {
            results.push({ success: true, userId: member.userId });
            successCount++;
          }
        } catch (error) {
          results.push({ success: false, userId: member.userId, error: error instanceof Error ? error.message : "Unknown error" });
          failureCount++;
        }
      }
    } else if (body.action === "updateRoles") {
      // Batch role update
      for (const update of body.updates) {
        try {
          const roleChangeResult = await spaceService.changeMemberRole(requesterId, {
            spaceId,
            targetUserId: update.userId,
            newRole: update.role as 'member' | 'moderator' | 'admin' | 'owner' | 'guest'
          });

          if (roleChangeResult.isFailure) {
            results.push({ success: false, userId: update.userId, error: roleChangeResult.error || "Failed to update role" });
            failureCount++;
          } else {
            results.push({ success: true, userId: update.userId });
            successCount++;
          }
        } catch (error) {
          results.push({ success: false, userId: update.userId, error: error instanceof Error ? error.message : "Unknown error" });
          failureCount++;
        }
      }
    } else if (body.action === "remove") {
      // Batch remove
      for (const userId of body.userIds) {
        try {
          const removeResult = await spaceService.removeMember(requesterId, {
            spaceId,
            targetUserId: userId,
            reason: body.reason
          });

          if (removeResult.isFailure) {
            results.push({ success: false, userId, error: removeResult.error || "Failed to remove" });
            failureCount++;
          } else {
            results.push({ success: true, userId });
            successCount++;
          }
        } catch (error) {
          results.push({ success: false, userId, error: error instanceof Error ? error.message : "Unknown error" });
          failureCount++;
        }
      }
    }

    // Log the batch operation
    await dbAdmin
      .collection("spaces")
      .doc(spaceId)
      .collection("activity")
      .add({
        type: `batch_${body.action}`,
        performedBy: requesterId,
        details: {
          action: body.action,
          totalRequested: results.length,
          successCount,
          failureCount,
        },
        timestamp: new Date(),
      });

    logger.info('Batch member operation completed', {
      requesterId,
      spaceId,
      action: body.action,
      successCount,
      failureCount,
      endpoint: '/api/spaces/[spaceId]/members/batch'
    });

    return respond.success({
      action: body.action,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      }
    });
  }
);
