"use server";

import { dbAdmin } from "@/lib/firebase-admin";
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { logger } from "@/lib/logger";
import { HttpStatus } from "@/lib/api-response-types";
import type { MemberRole } from "@hive/core";
import { withCache } from '../../../../../../lib/cache-headers';

/**
 * GET /api/spaces/[spaceId]/membership/me
 *
 * Lightweight endpoint returning the current user's membership context.
 * Designed for HiveLab tool runtime context - single document fetch, no pagination.
 *
 * Returns:
 * - role: MemberRole
 * - joinedAt: ISO timestamp
 * - daysInSpace: number of days since joining
 * - isNewMember: true if joined less than 7 days ago
 * - permissions: derived from role
 *
 * @version 1.0.0 - HiveLab Phase 1 (Jan 2026)
 */

const LEADER_ROLES = ["owner", "admin", "moderator"];
const NEW_MEMBER_THRESHOLD_DAYS = 7;

const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond,
) => {
  try {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    // Single document query for current user's membership
    const membershipSnapshot = await dbAdmin
      .collection("spaceMembers")
      .where("spaceId", "==", spaceId)
      .where("userId", "==", userId)
      .where("isActive", "==", true)
      // campusId single-field index is exempted — skip Firestore filter
      .limit(1)
      .get();

    // User is not a member - return guest context
    if (membershipSnapshot.empty) {
      // Check if space exists and is public
      const spaceDoc = await dbAdmin.collection("spaces").doc(spaceId).get();

      if (!spaceDoc.exists) {
        return respond.error("Space not found", "RESOURCE_NOT_FOUND", {
          status: HttpStatus.NOT_FOUND,
        });
      }

      const spaceData = spaceDoc.data();
      const isPublic = spaceData?.visibility !== "private";

      // For public spaces, return guest context
      // For private spaces, deny access
      if (!isPublic) {
        return respond.error("Membership required", "FORBIDDEN", {
          status: HttpStatus.FORBIDDEN,
        });
      }

      return respond.success({
        isMember: false,
        role: "guest" as MemberRole,
        joinedAt: null,
        daysInSpace: 0,
        isNewMember: false,
        permissions: buildPermissions("guest"),
      });
    }

    const memberData = membershipSnapshot.docs[0].data();
    const role = (memberData.role || "member") as MemberRole;
    const joinedAt = memberData.joinedAt;

    // Calculate tenure
    const { daysInSpace, isNewMember } = calculateTenure(joinedAt);

    // Fetch user profile for display name
    const userDoc = await dbAdmin.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    return respond.success({
      isMember: true,
      userId,
      displayName: userData?.displayName || userData?.handle || null,
      role,
      joinedAt: joinedAt || null,
      joinMethod: memberData.joinMethod || null,
      daysInSpace,
      isNewMember,
      permissions: buildPermissions(role),
    });
  } catch (error) {
    logger.error(
      "Get user membership error at /api/spaces/[spaceId]/membership/me",
      { error: error instanceof Error ? error.message : String(error) }
    );
    return respond.error("Internal server error", "INTERNAL_ERROR", {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * Calculate tenure information from join date
 */
function calculateTenure(joinedAt: string | null | undefined): {
  daysInSpace: number;
  isNewMember: boolean;
} {
  if (!joinedAt) {
    return { daysInSpace: 0, isNewMember: true };
  }

  const joinDate = new Date(joinedAt);
  const now = new Date();
  const diffMs = now.getTime() - joinDate.getTime();
  const daysInSpace = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isNewMember = daysInSpace < NEW_MEMBER_THRESHOLD_DAYS;

  return { daysInSpace, isNewMember };
}

/**
 * Build permissions object from role
 */
function buildPermissions(role: MemberRole): {
  canPost: boolean;
  canDeployTools: boolean;
  canModerate: boolean;
  canManageMembers: boolean;
  canAccessAdmin: boolean;
} {
  const isLeader = LEADER_ROLES.includes(role);
  const isAdmin = ["owner", "admin"].includes(role);

  return {
    canPost: role !== "guest",
    canDeployTools: isLeader,
    canModerate: isLeader,
    canManageMembers: isAdmin,
    canAccessAdmin: isAdmin,
  };
}

export const GET = withCache(_GET, 'SHORT');
