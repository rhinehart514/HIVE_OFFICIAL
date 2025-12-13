import { z } from "zod";
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { HttpStatus } from "@/lib/api-response-types";
import { logger } from "@/lib/structured-logger";
import { createServerSpaceManagementService, type SpaceMemberRole } from "@hive/core/server";

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

  // Create the space management service
  const spaceService = createServerSpaceManagementService({ userId: requesterId, campusId });

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

  // Create the space management service
  const spaceService = createServerSpaceManagementService({ userId: requesterId, campusId });

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
