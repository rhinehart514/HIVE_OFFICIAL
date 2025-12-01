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
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import {
  CURRENT_CAMPUS_ID,
  addSecureCampusMetadata,
} from "@/lib/secure-firebase-queries";
import { HttpStatus } from "@/lib/api-response-types";

const GetMembersQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  role: z.enum(["owner", "admin", "moderator", "member", "guest"]).optional(),
  search: z.string().optional(),
  includeOffline: z.coerce.boolean().default(true),
});

const InviteMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(["member", "moderator", "admin"]).default("member"),
});

const UpdateMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(["member", "moderator", "admin"]).optional(),
  action: z.enum(["suspend", "unsuspend"]).optional(),
  reason: z.string().optional(),
});

const RemoveMemberQuerySchema = z.object({
  userId: z.string(),
  reason: z.string().optional(),
});

/**
 * Validate space using DDD repository and check membership
 */
async function validateSpaceAndMembership(spaceId: string, userId: string) {
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
    if (!space.isPublic) {
      return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Membership required" };
    }
    return { ok: true as const, space, membership: { role: 'guest' } };
  }

  return { ok: true as const, space, membership: membershipSnapshot.docs[0].data() };
}

async function findActiveMember(spaceId: string, userId: string) {
  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', CURRENT_CAMPUS_ID)
    .limit(1)
    .get();

  if (membershipSnapshot.empty) {
    return {
      ok: false as const,
      status: HttpStatus.NOT_FOUND,
      message: "Member not found",
    };
  }

  return {
    ok: true as const,
    membership: membershipSnapshot.docs[0].data(),
  };
}

function ensureRoleChangeAllowed(
  requesterRole: string | undefined,
  targetRole: string | undefined,
  newRole?: string,
) {
  const canManageMembers = requesterRole === "owner" || requesterRole === "admin";
  if (!canManageMembers) {
    return { ok: false as const, message: "Insufficient permissions to manage members" };
  }

  if (targetRole === "owner" || newRole === "owner") {
    return { ok: false as const, message: "Cannot modify owner role" };
  }

  if ((targetRole === "admin" || newRole === "admin") && requesterRole !== "owner") {
    return { ok: false as const, message: "Only owners can manage admin roles" };
  }

  if (targetRole === "moderator" && requesterRole !== "owner") {
    return { ok: false as const, message: "Only owners can manage moderator roles" };
  }

  return { ok: true as const };
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
          // Suspend-related fields
          if (updates.isSuspended !== undefined) updateData.isSuspended = updates.isSuspended;
          if (updates.suspendedAt) updateData.suspendedAt = admin.firestore.FieldValue.serverTimestamp();
          if (updates.suspendedBy) updateData.suspendedBy = updates.suspendedBy;
          if (updates.suspensionReason) updateData.suspensionReason = updates.suspensionReason;
          if (updates.unsuspendedAt) updateData.unsuspendedAt = admin.firestore.FieldValue.serverTimestamp();
          if (updates.unsuspendedBy) updateData.unsuspendedBy = updates.unsuspendedBy;
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

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond,
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  const validation = await validateSpaceAndMembership(spaceId, userId);
  if (!validation.ok) {
    const code =
      validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
    return respond.error(validation.message, code, { status: validation.status });
  }

  const queryParams = GetMembersQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );

  const roleFilter = queryParams.role;
  let memberQuery = dbAdmin
    .collection("spaceMembers")
    .where("spaceId", "==", spaceId)
    .where("isActive", "==", true)
    .where("campusId", "==", CURRENT_CAMPUS_ID);

  if (roleFilter) {
    memberQuery = memberQuery.where("role", "==", roleFilter);
  }

  memberQuery = memberQuery
    .orderBy("joinedAt", "desc")
    .offset(queryParams.offset)
    .limit(queryParams.limit);

  const membersSnapshot = await memberQuery.get();
  const members: Array<Record<string, unknown>> = [];

  for (const doc of membersSnapshot.docs) {
    const memberData = doc.data();
    const memberId = memberData.userId || doc.id;

    const userDoc = await dbAdmin.collection("users").doc(memberId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    if (!userData) continue;

    const activitySnapshot = await dbAdmin
      .collection("activityEvents")
      .where("userId", "==", memberId)
      .where("spaceId", "==", spaceId)
      .where("type", "in", ["post_created", "comment_created"])
      .get();

    const postCount = activitySnapshot.docs.filter(
      (activity) => activity.data().type === "post_created",
    ).length;

    const memberRecord = {
      id: memberId,
      name: userData.fullName || userData.displayName || "Unknown User",
      username: userData.handle || userData.email?.split("@")[0] || "unknown",
      avatar: userData.photoURL,
      bio: userData.bio || userData.about,
      role: memberData.role || "member",
      status: memberData.isOnline ? "online" : "offline",
      joinedAt: memberData.joinedAt?.toDate
        ? memberData.joinedAt.toDate()
        : memberData.joinedAt
          ? new Date(memberData.joinedAt)
          : new Date(),
      lastActive: memberData.lastActive?.toDate
        ? memberData.lastActive.toDate()
        : memberData.lastActive
          ? new Date(memberData.lastActive)
          : new Date(),
      isVerified: Boolean(userData.isVerified),
      badges: userData.badges || [],
      stats: {
        postsCount: postCount,
        likesReceived: 0,
        eventsAttended: 0,
        contributionScore: postCount * 10,
      },
      interests: userData.interests || [],
      major: userData.major,
      graduationYear: userData.graduationYear,
      location: userData.location,
      socialLinks: userData.socialLinks || {},
      permissions: {
        canMessage: memberData.role !== "guest",
        canViewProfile: true,
        canInviteOthers: ["owner", "admin", "moderator"].includes(memberData.role),
      },
      spaceRole: memberData.role,
      isOnline: Boolean(memberData.isOnline),
    };

    if (queryParams.search) {
      const searchLower = queryParams.search.toLowerCase();
      const matchesSearch =
        (memberRecord.name?.toLowerCase() || "").includes(searchLower) ||
        (memberRecord.username?.toLowerCase() || "").includes(searchLower) ||
        (memberRecord.bio && memberRecord.bio.toLowerCase().includes(searchLower)) ||
        (memberRecord.interests || []).some((interest: string) =>
          interest.toLowerCase().includes(searchLower),
        );
      if (!matchesSearch) continue;
    }

    if (!queryParams.includeOffline && memberRecord.status === "offline") {
      continue;
    }

    members.push(memberRecord);
  }

  const roleOrder: Record<string, number> = { owner: 5, admin: 4, moderator: 3, member: 2, guest: 1 };
  members.sort((a, b) => {
    const roleDiff =
      (roleOrder[b.role as keyof typeof roleOrder] || 1) -
      (roleOrder[a.role as keyof typeof roleOrder] || 1);
    if (roleDiff !== 0) return roleDiff;
    if (a.status !== "offline" && b.status === "offline") return -1;
    if (a.status === "offline" && b.status !== "offline") return 1;
    return new Date(b.joinedAt as string | number | Date).getTime() - new Date(a.joinedAt as string | number | Date).getTime();
  });

  const totalMembersSnapshot = await dbAdmin
    .collection("spaceMembers")
    .where("spaceId", "==", spaceId)
    .where("isActive", "==", true)
    .where("campusId", "==", CURRENT_CAMPUS_ID)
    .get();

  const onlineMembers = members.filter((member) => member.status !== "offline").length;

  return respond.success({
    members,
    summary: {
      totalMembers: totalMembersSnapshot.size,
      onlineMembers,
      activeMembers: members.filter((member) => {
        const daysSinceActive =
          (Date.now() - new Date(member.lastActive as string | number | Date).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceActive <= 7;
      }).length,
    },
    pagination: {
      limit: queryParams.limit,
      offset: queryParams.offset,
      hasMore: membersSnapshot.size === queryParams.limit,
      nextOffset: membersSnapshot.size === queryParams.limit
        ? queryParams.offset + queryParams.limit
        : null,
    },
  });
});

export const POST = withAuthValidationAndErrors(
  InviteMemberSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    body,
    respond,
  ) => {
    try {
      const inviterId = getUserId(request as AuthenticatedRequest);
      const { spaceId } = await params;

      // Verify inviter has permission using DDD validation
      const validation = await validateSpaceAndMembership(spaceId, inviterId);
      if (!validation.ok) {
        const code =
          validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
        return respond.error(validation.message, code, { status: validation.status });
      }

      // Verify target user exists
      const userDoc = await dbAdmin.collection("users").doc(body.userId).get();
      if (!userDoc.exists) {
        return respond.error("User not found", "RESOURCE_NOT_FOUND", {
          status: HttpStatus.NOT_FOUND,
        });
      }

      // Use DDD SpaceManagementService
      const spaceService = createServerSpaceManagementService(
        { userId: inviterId, campusId: CURRENT_CAMPUS_ID },
        createSpaceCallbacks()
      );

      const inviteResult = await spaceService.inviteMember(inviterId, {
        spaceId,
        targetUserId: body.userId,
        role: body.role as 'member' | 'moderator' | 'admin' | 'owner' | 'guest'
      });

      if (inviteResult.isFailure) {
        const errorMessage = inviteResult.error || 'Failed to invite member';
        if (errorMessage.includes('already a member') || errorMessage.includes('User is already')) {
          return respond.error(errorMessage, "CONFLICT", { status: HttpStatus.CONFLICT });
        }
        if (errorMessage.includes('Insufficient permissions')) {
          return respond.error(errorMessage, "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
        }
        logger.error('Failed to invite member via DDD', { error: errorMessage, inviterId, spaceId, targetUserId: body.userId });
        return respond.error(errorMessage, "INTERNAL_ERROR", { status: HttpStatus.INTERNAL_SERVER_ERROR });
      }

      const result = inviteResult.getValue().data;

      logger.info('✅ Member invited via DDD', {
        inviterId,
        spaceId,
        targetUserId: body.userId,
        role: result.role,
        isReactivation: result.isReactivation,
        endpoint: '/api/spaces/[spaceId]/members'
      });

      return respond.success({
        success: true,
        message: "Member invited successfully",
        member: {
          id: body.userId,
          role: result.role,
        },
      });
    } catch (error) {
      logger.error(
        "Error inviting member at /api/spaces/[spaceId]/members",
        { error: error instanceof Error ? error.message : String(error) },
      );
      return respond.error("Failed to invite member", "INTERNAL_ERROR", {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

export const PATCH = withAuthValidationAndErrors(
  UpdateMemberSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    body,
    respond,
  ) => {
    const requesterId = getUserId(request as AuthenticatedRequest);
    const { spaceId } = await params;

    // Verify requester has permission using DDD validation
    const validation = await validateSpaceAndMembership(spaceId, requesterId);
    if (!validation.ok) {
      const code =
        validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      return respond.error(validation.message, code, { status: validation.status });
    }

    const targetMembership = await findActiveMember(spaceId, body.userId);
    if (!targetMembership.ok) {
      return respond.error(targetMembership.message, targetMembership.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN", {
        status: targetMembership.status,
      });
    }

    const oldRole = targetMembership.membership.role;

    // Handle role changes via DDD service
    if (body.role && body.role !== oldRole) {
      const spaceService = createServerSpaceManagementService(
        { userId: requesterId, campusId: CURRENT_CAMPUS_ID },
        createSpaceCallbacks()
      );

      const roleChangeResult = await spaceService.changeMemberRole(requesterId, {
        spaceId,
        targetUserId: body.userId,
        newRole: body.role as 'member' | 'moderator' | 'admin' | 'owner' | 'guest'
      });

      if (roleChangeResult.isFailure) {
        const errorMessage = roleChangeResult.error || 'Failed to change role';
        if (errorMessage.includes('Only leaders') || errorMessage.includes('permission')) {
          return respond.error(errorMessage, "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
        }
        logger.error('Failed to change member role via DDD', { error: errorMessage, requesterId, spaceId, targetUserId: body.userId });
        return respond.error(errorMessage, "INTERNAL_ERROR", { status: HttpStatus.INTERNAL_SERVER_ERROR });
      }
    }

    // Handle suspend/unsuspend actions via DDD service
    if (body.action === "suspend" || body.action === "unsuspend") {
      const spaceService = createServerSpaceManagementService(
        { userId: requesterId, campusId: CURRENT_CAMPUS_ID },
        createSpaceCallbacks()
      );

      if (body.action === "suspend") {
        const suspendResult = await spaceService.suspendMember(requesterId, {
          spaceId,
          targetUserId: body.userId,
          reason: body.reason
        });

        if (suspendResult.isFailure) {
          const errorMessage = suspendResult.error || 'Failed to suspend member';
          if (errorMessage.includes('permission')) {
            return respond.error(errorMessage, "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
          }
          logger.error('Failed to suspend member via DDD', { error: errorMessage, requesterId, spaceId, targetUserId: body.userId });
          return respond.error(errorMessage, "INTERNAL_ERROR", { status: HttpStatus.INTERNAL_SERVER_ERROR });
        }
      } else {
        const unsuspendResult = await spaceService.unsuspendMember(requesterId, {
          spaceId,
          targetUserId: body.userId,
          reason: body.reason
        });

        if (unsuspendResult.isFailure) {
          const errorMessage = unsuspendResult.error || 'Failed to unsuspend member';
          if (errorMessage.includes('permission')) {
            return respond.error(errorMessage, "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
          }
          logger.error('Failed to unsuspend member via DDD', { error: errorMessage, requesterId, spaceId, targetUserId: body.userId });
          return respond.error(errorMessage, "INTERNAL_ERROR", { status: HttpStatus.INTERNAL_SERVER_ERROR });
        }
      }
    }

    // Record activity
    await dbAdmin
      .collection("spaces")
      .doc(spaceId)
      .collection("activity")
      .add({
        type: "member_role_changed",
        performedBy: requesterId,
        targetUserId: body.userId,
        details: {
          oldRole,
          newRole: body.role || oldRole,
          action: body.action || "role_change",
          reason: body.reason,
        },
        timestamp: new Date(),
      });

    logger.info('✅ Member updated via DDD', {
      requesterId,
      spaceId,
      targetUserId: body.userId,
      action: body.action || 'role_change',
      oldRole,
      newRole: body.role || oldRole,
      endpoint: '/api/spaces/[spaceId]/members'
    });

    return respond.success({
      message: `Member ${body.action || "updated"} successfully`,
      updates: {
        role: body.role || oldRole,
        action: body.action
      },
    });
  },
);

export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond,
) => {
  const requesterId = getUserId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  const query = RemoveMemberQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!query.success) {
    return respond.error("User ID is required", "INVALID_INPUT", {
      status: HttpStatus.BAD_REQUEST,
    });
  }

  // Verify requester has permission using DDD validation
  const validation = await validateSpaceAndMembership(spaceId, requesterId);
  if (!validation.ok) {
    const code =
      validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
    return respond.error(validation.message, code, { status: validation.status });
  }

  // Use DDD SpaceManagementService
  const spaceService = createServerSpaceManagementService(
    { userId: requesterId, campusId: CURRENT_CAMPUS_ID },
    createSpaceCallbacks()
  );

  const removeResult = await spaceService.removeMember(requesterId, {
    spaceId,
    targetUserId: query.data.userId,
    reason: query.data.reason
  });

  if (removeResult.isFailure) {
    const errorMessage = removeResult.error || 'Failed to remove member';
    if (errorMessage.includes('Cannot remove') || errorMessage.includes('owner')) {
      return respond.error(errorMessage, "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
    }
    if (errorMessage.includes('Only owners')) {
      return respond.error(errorMessage, "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
    }
    if (errorMessage.includes('Insufficient permissions')) {
      return respond.error(errorMessage, "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
    }
    if (errorMessage.includes('not a member')) {
      return respond.error(errorMessage, "RESOURCE_NOT_FOUND", { status: HttpStatus.NOT_FOUND });
    }
    logger.error('Failed to remove member via DDD', { error: errorMessage, requesterId, spaceId, targetUserId: query.data.userId });
    return respond.error(errorMessage, "INTERNAL_ERROR", { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }

  const result = removeResult.getValue().data;

  // Record activity (kept separate from DDD for audit purposes)
  await dbAdmin
    .collection("spaces")
    .doc(spaceId)
    .collection("activity")
    .add({
      type: "member_removed",
      performedBy: requesterId,
      targetUserId: query.data.userId,
      details: {
        removedRole: result.previousRole,
        reason: query.data.reason,
      },
      timestamp: new Date(),
    });

  logger.info('✅ Member removed via DDD', {
    requesterId,
    spaceId,
    targetUserId: query.data.userId,
    previousRole: result.previousRole,
    endpoint: '/api/spaces/[spaceId]/members'
  });

  return respond.success({ message: "Member removed successfully" });
});
