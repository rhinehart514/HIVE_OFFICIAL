"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
import { logger } from "@/lib/structured-logger";
import { HttpStatus } from "@/lib/api-response-types";
import { getServerSpaceRepository } from "@hive/core/server";

const MembershipQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  role: z.enum(["owner", "admin", "moderator", "member", "guest"]).optional(),
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

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond,
) => {
  try {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const queryParams = MembershipQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    const validation = await validateSpaceAndMembership(spaceId, userId);
    if (!validation.ok) {
      const code =
        validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      return respond.error(validation.message, code, { status: validation.status });
    }

    let membersQuery = dbAdmin
      .collection("spaceMembers")
      .where("spaceId", "==", spaceId)
      .where("isActive", "==", true)
      .where("campusId", "==", CURRENT_CAMPUS_ID);

    if (queryParams.role) {
      membersQuery = membersQuery.where("role", "==", queryParams.role);
    }

    membersQuery = membersQuery
      .orderBy("joinedAt", "desc")
      .offset(queryParams.offset)
      .limit(queryParams.limit);

    const membersSnapshot = await membersQuery.get();

    const totalSnapshot = await dbAdmin
      .collection("spaceMembers")
      .where("spaceId", "==", spaceId)
      .where("isActive", "==", true)
      .where("campusId", "==", CURRENT_CAMPUS_ID)
      .get();

    const memberPromises = membersSnapshot.docs.map(async (memberDoc) => {
      const memberData = memberDoc.data();
      const memberId = memberData.userId || memberDoc.id;

      try {
        const userDoc = await dbAdmin.collection("users").doc(memberId).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        return {
          userId: memberId,
          membership: {
            role: memberData.role,
            joinedAt: memberData.joinedAt,
            joinMethod: memberData.joinMethod,
           joinReason: memberData.joinReason,
          },
          profile: userData
            ? {
                handle: userData.handle,
                displayName: userData.displayName,
                avatar: userData.avatar,
                major: userData.major,
                classYear: userData.classYear,
                bio: userData.bio,
              }
            : null,
        };
      } catch (error) {
        logger.error("Error fetching user profile", {
          memberId,
          error: { error: error instanceof Error ? error.message : String(error) },
        });
        return {
          userId: memberId,
          membership: {
            role: memberData.role,
            joinedAt: memberData.joinedAt,
            joinMethod: memberData.joinMethod,
            joinReason: memberData.joinReason,
          },
          profile: null,
        };
      }
    });

    const members = await Promise.all(memberPromises);

    const membersByRole = members.reduce((acc, member) => {
      const memberRole = member.membership.role;
      if (!acc[memberRole]) {
        acc[memberRole] = [];
      }
      acc[memberRole].push(member);
      return acc;
    }, {} as Record<string, typeof members>);

    const roleCounts = Object.entries(membersByRole).reduce(
      (acc, [role, entries]) => ({
        ...acc,
        [role]: entries.length,
      }),
      {} as Record<string, number>,
    );

    // Build space info from DDD aggregate
    const space = validation.space;
    const spaceInfo = {
      id: space.spaceId.value,
      name: space.name.value,
      slug: space.slug?.value,
      description: space.description.value,
      type: space.category.value,
      memberCount: space.memberCount,
      isVerified: space.isVerified,
    };

    return respond.success({
      space: spaceInfo,
      requestingUser: {
        userId,
        role: validation.membership.role,
        joinedAt: validation.membership.joinedAt,
      },
      members,
      membersByRole,
      pagination: {
        limit: queryParams.limit,
        offset: queryParams.offset,
        totalCount: totalSnapshot.size,
        hasMore: queryParams.offset + queryParams.limit < totalSnapshot.size,
        nextOffset:
          queryParams.offset + queryParams.limit < totalSnapshot.size
            ? queryParams.offset + queryParams.limit
            : null,
      },
      roleCounts: {
        ...roleCounts,
        total: totalSnapshot.size,
      },
      filters: {
        role: queryParams.role ?? null,
      },
    });
  } catch (error) {
    logger.error(
      "Get space membership error at /api/spaces/[spaceId]/membership",
      { error: error instanceof Error ? error.message : String(error) },
    );
    return respond.error("Internal server error", "INTERNAL_ERROR", {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
