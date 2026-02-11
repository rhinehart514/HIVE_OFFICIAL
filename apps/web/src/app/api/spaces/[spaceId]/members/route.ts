"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { Result, GhostModeService, ViewerContext } from "@hive/core";
import type { GhostModeUser } from "@hive/core";
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
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { addSecureCampusMetadata } from "@/lib/secure-firebase-queries";
import { HttpStatus } from "@/lib/api-response-types";
import {
  incrementMemberCount,
  isShardedMemberCountEnabled
} from "@/lib/services/sharded-member-counter.service";
import { notifySpaceInvite } from "@/lib/notification-service";
import { withCache } from '../../../../../lib/cache-headers';

const GetMembersQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(), // Cursor-based pagination (member doc ID)
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
async function validateSpaceAndMembership(spaceId: string, userId: string, campusId: string) {
  const spaceRepo = getServerSpaceRepository();
  const spaceResult = await spaceRepo.findById(spaceId);

  if (spaceResult.isFailure) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: "Space not found" };
  }

  const space = spaceResult.getValue();

  if (space.campusId.id !== campusId) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Access denied" };
  }

  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', campusId)
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

async function findActiveMember(spaceId: string, userId: string, campusId: string) {
  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', campusId)
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

// Note: Role change validation is now handled by DDD SpaceManagementService

/**
 * Create callbacks for DDD SpaceManagementService
 */
function createSpaceCallbacks(campusId: string): SpaceServiceCallbacks {
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
    updateSpaceMember: async (spaceIdParam: string, userIdParam: string, updates: Record<string, unknown>): Promise<Result<void>> => {
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
        // SCALING FIX: Use sharded counters for memberCount to handle 200+ writes/sec
        if (metrics.memberCountDelta && isShardedMemberCountEnabled()) {
          await incrementMemberCount(spaceIdParam, metrics.memberCountDelta);
          logger.debug('[members] Used sharded member counter', { spaceId: spaceIdParam, delta: metrics.memberCountDelta });
        }

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
}

const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond,
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  const validation = await validateSpaceAndMembership(spaceId, userId, campusId);
  if (!validation.ok) {
    const code =
      validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
    return respond.error(validation.message, code, { status: validation.status });
  }

  const queryParams = GetMembersQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );

  const roleFilter = queryParams.role;
  let memberQuery: FirebaseFirestore.Query = dbAdmin
    .collection("spaceMembers")
    .where("spaceId", "==", spaceId)
    .where("isActive", "==", true)
    .where("campusId", "==", campusId);

  if (roleFilter) {
    memberQuery = memberQuery.where("role", "==", roleFilter);
  }

  memberQuery = memberQuery.orderBy("joinedAt", "desc");

  // Cursor-based pagination: get cursor document if provided
  if (queryParams.cursor) {
    const cursorDoc = await dbAdmin.collection("spaceMembers").doc(queryParams.cursor).get();
    if (cursorDoc.exists) {
      memberQuery = memberQuery.startAfter(cursorDoc);
    }
  }

  memberQuery = memberQuery.limit(queryParams.limit);

  const membersSnapshot = await memberQuery.get();
  const members: Array<Record<string, unknown>> = [];

  // PERFORMANCE FIX: Batch fetch all user data and activity instead of N+1 queries
  const memberIds = membersSnapshot.docs.map(doc => doc.data().userId || doc.id);

  // Helper: Chunk getAll() calls to respect Firestore 500 doc limit
  const GETALL_LIMIT = 500;
  async function chunkedGetAll<T extends FirebaseFirestore.DocumentReference>(
    refs: T[]
  ): Promise<FirebaseFirestore.DocumentSnapshot[]> {
    if (refs.length === 0) return [];
    const results: FirebaseFirestore.DocumentSnapshot[] = [];
    for (let i = 0; i < refs.length; i += GETALL_LIMIT) {
      const chunk = refs.slice(i, i + GETALL_LIMIT);
      const chunkDocs = await dbAdmin.getAll(...chunk);
      results.push(...chunkDocs);
    }
    return results;
  }

  // Batch fetch user documents (chunked for >500 members)
  const userRefs = memberIds.map(id => dbAdmin.collection("users").doc(id));
  const userDocs = await chunkedGetAll(userRefs);
  const usersById = new Map<string, FirebaseFirestore.DocumentData>();
  userDocs.forEach(doc => {
    if (doc.exists) {
      usersById.set(doc.id, doc.data()!);
    }
  });

  // Batch fetch presence data for online status (chunked for >500 members)
  const presenceRefs = memberIds.map(id => dbAdmin.collection("presence").doc(id));
  const presenceDocs = await chunkedGetAll(presenceRefs);
  const presenceById = new Map<string, FirebaseFirestore.DocumentData>();
  presenceDocs.forEach(doc => {
    if (doc.exists) {
      presenceById.set(doc.id, doc.data()!);
    }
  });

  // Batch fetch privacy settings for ghost mode filtering (chunked for >500 members)
  const privacyRefs = memberIds.map(id => dbAdmin.collection("privacySettings").doc(id));
  const privacyDocs = await chunkedGetAll(privacyRefs);
  const privacyById = new Map<string, FirebaseFirestore.DocumentData>();
  privacyDocs.forEach(doc => {
    if (doc.exists) {
      privacyById.set(doc.id, doc.data()!);
    }
  });

  // Create viewer context for ghost mode filtering
  const viewerContext = ViewerContext.authenticated({
    userId,
    campusId,
    memberOfSpaceIds: [spaceId]
  });

  // Batch fetch activity counts using chunked 'in' queries (Firestore limit: 30)
  const postCountsByUser = new Map<string, number>();
  const likesReceivedByUser = new Map<string, number>();
  const eventsAttendedByUser = new Map<string, number>();
  const BATCH_SIZE = 30;

  // Parallel batch queries for better performance
  const batchPromises: Promise<void>[] = [];

  for (let i = 0; i < memberIds.length; i += BATCH_SIZE) {
    const batchIds = memberIds.slice(i, i + BATCH_SIZE);

    // Query 1: Post counts from activityEvents
    batchPromises.push(
      dbAdmin
        .collection("activityEvents")
        .where("userId", "in", batchIds)
        .where("spaceId", "==", spaceId)
        .where("type", "==", "post_created")
        .select("userId")
        .get()
        .then((snapshot) => {
          for (const actDoc of snapshot.docs) {
            const actUserId = actDoc.data().userId;
            postCountsByUser.set(actUserId, (postCountsByUser.get(actUserId) || 0) + 1);
          }
        })
    );

    // Query 2: Likes received (reactions on user's content in this space)
    batchPromises.push(
      dbAdmin
        .collection("reactions")
        .where("authorId", "in", batchIds) // authorId = who made the original content
        .where("spaceId", "==", spaceId)
        .select("authorId")
        .get()
        .then((snapshot) => {
          for (const doc of snapshot.docs) {
            const authorId = doc.data().authorId;
            likesReceivedByUser.set(authorId, (likesReceivedByUser.get(authorId) || 0) + 1);
          }
        })
        .catch(() => {
          // Collection may not exist yet - silently continue
        })
    );

    // Query 3: Events attended (RSVPs with status 'going')
    batchPromises.push(
      dbAdmin
        .collection("rsvps")
        .where("userId", "in", batchIds)
        .where("status", "==", "going")
        .select("userId", "eventId")
        .get()
        .then(async (snapshot) => {
          // Filter to only events in this space
          const eventIds = [...new Set(snapshot.docs.map(d => d.data().eventId))];
          if (eventIds.length === 0) return;

          // Check which events belong to this space (in chunks)
          const spaceEventIds = new Set<string>();
          for (let j = 0; j < eventIds.length; j += BATCH_SIZE) {
            const eventBatch = eventIds.slice(j, j + BATCH_SIZE);
            const eventsSnapshot = await dbAdmin
              .collection("events")
              .where("__name__", "in", eventBatch)
              .where("spaceId", "==", spaceId)
              .select()
              .get();
            eventsSnapshot.docs.forEach(d => spaceEventIds.add(d.id));
          }

          // Count RSVPs for events in this space
          for (const doc of snapshot.docs) {
            const data = doc.data();
            if (spaceEventIds.has(data.eventId)) {
              eventsAttendedByUser.set(data.userId, (eventsAttendedByUser.get(data.userId) || 0) + 1);
            }
          }
        })
        .catch(() => {
          // Collection may not exist yet - silently continue
        })
    );
  }

  // Wait for all batch queries to complete
  await Promise.all(batchPromises);

  // Now build member records using the batch-fetched data
  for (const doc of membersSnapshot.docs) {
    const memberData = doc.data();
    const memberId = memberData.userId || doc.id;

    const userData = usersById.get(memberId);
    if (!userData) continue;

    // Ghost mode filtering: Check if member should be hidden from directory
    const privacyData = privacyById.get(memberId);
    const ghostModeUser: GhostModeUser = {
      id: memberId,
      ghostMode: privacyData?.ghostMode
    };

    if (GhostModeService.shouldHideFromDirectory(ghostModeUser, viewerContext, [spaceId])) {
      // Skip this member - they have ghost mode enabled
      continue;
    }

    const postCount = postCountsByUser.get(memberId) || 0;

    // Check presence collection for real-time online status
    // Presence statuses: 'online', 'away', 'ghost', 'offline'
    // Ghost mode users should appear offline to others (privacy filtering already handled above)
    const presenceData = presenceById.get(memberId);
    const isOnline = presenceData
      ? (presenceData.status === 'online' || presenceData.status === 'away') && !presenceData.isGhostMode
      : false;

    const memberRecord = {
      id: memberId,
      name: userData.fullName || userData.displayName || "Unknown User",
      username: userData.handle || userData.email?.split("@")[0] || "unknown",
      avatar: userData.photoURL,
      bio: userData.bio || userData.about,
      role: memberData.role || "member",
      status: isOnline ? "online" : "offline",
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
        likesReceived: likesReceivedByUser.get(memberId) || 0,
        eventsAttended: eventsAttendedByUser.get(memberId) || 0,
        contributionScore: postCount * 10 + (likesReceivedByUser.get(memberId) || 0) * 2 + (eventsAttendedByUser.get(memberId) || 0) * 5,
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
      isOnline,
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

  // PERFORMANCE FIX: Use cached member count from space document instead of unbounded query
  // This avoids O(N) count query that could OOM on spaces with 500+ members
  const spaceDoc = await dbAdmin.collection("spaces").doc(spaceId).get();
  const spaceData = spaceDoc.data();
  const cachedMemberCount = spaceData?.metrics?.memberCount ?? spaceData?.memberCount ?? members.length;

  const onlineMembers = members.filter((member) => member.status !== "offline").length;

  // Determine next cursor for pagination
  const hasMore = membersSnapshot.size === queryParams.limit;
  const lastDoc = membersSnapshot.docs[membersSnapshot.docs.length - 1];
  const nextCursor = hasMore && lastDoc ? lastDoc.id : null;

  return respond.success({
    members,
    summary: {
      totalMembers: cachedMemberCount,
      onlineMembers,
      activeMembers: members.filter((member) => {
        const daysSinceActive =
          (Date.now() - new Date(member.lastActive as string | number | Date).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceActive <= 7;
      }).length,
    },
    pagination: {
      limit: queryParams.limit,
      cursor: queryParams.cursor,
      hasMore,
      nextCursor,
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
      const campusId = getCampusId(request as AuthenticatedRequest);
      const { spaceId } = await params;
      const spaceRepo = getServerSpaceRepository();

      // Verify inviter has permission using DDD validation
      const validation = await validateSpaceAndMembership(spaceId, inviterId, campusId);
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
        { userId: inviterId, campusId },
        createSpaceCallbacks(campusId)
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

      // Send notification to invited user
      try {
        const inviterDoc = await dbAdmin.collection('users').doc(inviterId).get();
        const inviterName = inviterDoc.data()?.fullName || inviterDoc.data()?.displayName || 'Someone';
        const spaceName = validation.space?.name?.value || 'a space';

        await notifySpaceInvite({
          invitedUserId: body.userId,
          inviterId,
          inviterName,
          spaceId,
          spaceName,
        });
      } catch (notifyError) {
        // Don't fail the invite if notification fails
        logger.warn('Failed to send space invite notification', {
          error: notifyError instanceof Error ? notifyError.message : String(notifyError),
          spaceId,
          invitedUserId: body.userId,
        });
      }

      // Fix 3: Auto-unlock major spaces when threshold is reached
      // Check if space is a major type and should unlock after adding this member
      const spaceResult = await spaceRepo.findById(spaceId);
      if (spaceResult.isSuccess) {
        const space = spaceResult.getValue();
        if (space.identityType === 'major' && space.shouldUnlock()) {
          const unlockResult = space.unlock();
          if (unlockResult.isSuccess) {
            await spaceRepo.save(space);
            logger.info('✅ Major space auto-unlocked', {
              spaceId,
              memberCount: space.memberCount,
              threshold: space.unlockThreshold,
              endpoint: '/api/spaces/[spaceId]/members'
            });
          }
        }
      }

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
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { spaceId } = await params;

    // Verify requester has permission using DDD validation
    const validation = await validateSpaceAndMembership(spaceId, requesterId, campusId);
    if (!validation.ok) {
      const code =
        validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      return respond.error(validation.message, code, { status: validation.status });
    }

    const targetMembership = await findActiveMember(spaceId, body.userId, campusId);
    if (!targetMembership.ok) {
      return respond.error(targetMembership.message, targetMembership.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN", {
        status: targetMembership.status,
      });
    }

    const oldRole = targetMembership.membership.role;

    // Handle role changes via DDD service
    if (body.role && body.role !== oldRole) {
      const spaceService = createServerSpaceManagementService(
        { userId: requesterId, campusId },
        createSpaceCallbacks(campusId)
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
        { userId: requesterId, campusId },
        createSpaceCallbacks(campusId)
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
  const campusId = getCampusId(request as AuthenticatedRequest);
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
  const validation = await validateSpaceAndMembership(spaceId, requesterId, campusId);
  if (!validation.ok) {
    const code =
      validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
    return respond.error(validation.message, code, { status: validation.status });
  }

  // Check for provisional access restriction (pending leader verification)
  if (validation.space) {
    const userLeaderRequest = validation.space.leaderRequests?.find(
      r => r.profileId.id === requesterId && r.status === 'pending'
    );

    if (userLeaderRequest?.provisionalAccessGranted && !userLeaderRequest.reviewedAt) {
      return respond.error(
        "Member removal is disabled while your leader verification is pending. Please wait for verification to complete.",
        "PROVISIONAL_ACCESS_RESTRICTED",
        { status: HttpStatus.FORBIDDEN }
      );
    }
  }

  // Use DDD SpaceManagementService
  const spaceService = createServerSpaceManagementService(
    { userId: requesterId, campusId },
    createSpaceCallbacks(campusId)
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

export const GET = withCache(_GET, 'SHORT');
