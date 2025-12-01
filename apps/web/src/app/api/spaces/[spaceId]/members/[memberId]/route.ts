import { z } from "zod";
import * as admin from 'firebase-admin';
import { dbAdmin } from "@/lib/firebase-admin";
import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from "@/lib/middleware";
import { HttpStatus } from "@/lib/api-response-types";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
import { logger } from "@/lib/structured-logger";
import { getServerSpaceRepository } from "@hive/core/server";

const UpdateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'moderator', 'member', 'guest'])
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
    return { ok: true as const, space, membership: { role: 'guest' }, membershipRef: null };
  }

  return {
    ok: true as const,
    space,
    membership: membershipSnapshot.docs[0].data(),
    membershipRef: membershipSnapshot.docs[0].ref
  };
}

/**
 * Get membership for a specific user (target member)
 */
async function getMembershipByUserId(spaceId: string, userId: string) {
  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', CURRENT_CAMPUS_ID)
    .limit(1)
    .get();

  if (membershipSnapshot.empty) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: "Member not found" };
  }

  return {
    ok: true as const,
    membership: membershipSnapshot.docs[0].data(),
    membershipRef: membershipSnapshot.docs[0].ref
  };
}

// PATCH /api/spaces/[spaceId]/members/[memberId] - Update a member's role (flat membership model)
export const PATCH = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; memberId: string }> },
  respond
) => {
  const { spaceId, memberId } = await params;
  const requesterId = getUserId(request as AuthenticatedRequest);

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

  // Validate space and requester membership using DDD
  const validation = await validateSpaceAndMembership(spaceId, requesterId);
  if (!validation.ok) {
    const code =
      validation.status === HttpStatus.NOT_FOUND ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
    return respond.error(validation.message, code, { status: validation.status });
  }
  const requesterRole = validation.membership.role as string;

  // Get target member
  const targetMembership = await getMembershipByUserId(spaceId, memberId);
  if (!targetMembership.ok) {
    return respond.error(targetMembership.message, "RESOURCE_NOT_FOUND", { status: targetMembership.status });
  }
  const targetRole = targetMembership.membership.role as string;

  // Permission checks
  const canManageMembers = ['owner', 'admin'].includes(requesterRole);
  const canModerateAdmins = requesterRole === 'owner';
  if (!canManageMembers) {
    return respond.error("Insufficient permissions to update members", "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
  }
  if (targetRole === 'owner') {
    return respond.error("Cannot change role of space owner", "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
  }
  if (targetRole === 'admin' && !canModerateAdmins) {
    return respond.error("Only owners can change admin roles", "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
  }

  // Apply update
  await targetMembership.membershipRef.update({
    role: newRole,
    roleChangedAt: admin.firestore.FieldValue.serverTimestamp(),
    roleChangedBy: requesterId
  });

  logger.info('Member role updated', { spaceId, memberId, newRole, by: requesterId });
  return respond.success({ message: 'Member updated', role: newRole });
});

// DELETE /api/spaces/[spaceId]/members/[memberId] - Remove a member (soft remove: mark inactive)
export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; memberId: string }> },
  respond
) => {
  const { spaceId, memberId } = await params;
  const requesterId = getUserId(request as AuthenticatedRequest);

  // Validate space and requester membership using DDD
  const validation = await validateSpaceAndMembership(spaceId, requesterId);
  if (!validation.ok) {
    const code =
      validation.status === HttpStatus.NOT_FOUND ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
    return respond.error(validation.message, code, { status: validation.status });
  }
  const requesterRole = validation.membership.role as string;

  // Get target member
  const targetMembership = await getMembershipByUserId(spaceId, memberId);
  if (!targetMembership.ok) {
    return respond.error(targetMembership.message, "RESOURCE_NOT_FOUND", { status: targetMembership.status });
  }
  const targetRole = targetMembership.membership.role as string;

  // Permission checks
  const canRemoveMembers = ['owner', 'admin', 'moderator'].includes(requesterRole);
  if (!canRemoveMembers) {
    return respond.error("Insufficient permissions to remove members", "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
  }
  if (targetRole === 'owner') {
    return respond.error("Cannot remove space owner", "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
  }
  if (targetRole === 'admin' && requesterRole !== 'owner') {
    return respond.error("Only owners can remove admins", "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
  }
  if (targetRole === 'moderator' && !['owner', 'admin'].includes(requesterRole)) {
    return respond.error("Only admins and owners can remove moderators", "FORBIDDEN", { status: HttpStatus.FORBIDDEN });
  }

  // Soft-remove and update metrics atomically
  const batch = dbAdmin.batch();
  batch.update(targetMembership.membershipRef, {
    isActive: false,
    leftAt: admin.firestore.FieldValue.serverTimestamp(),
    removedBy: requesterId
  });
  batch.update(dbAdmin.collection('spaces').doc(spaceId), {
    'metrics.memberCount': admin.firestore.FieldValue.increment(-1),
    'metrics.activeMembers': admin.firestore.FieldValue.increment(-1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await batch.commit();

  logger.info('Member removed from space', { spaceId, memberId, by: requesterId });
  return respond.success({ message: 'Member removed' });
});
