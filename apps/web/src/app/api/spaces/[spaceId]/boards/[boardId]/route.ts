import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { SecurityScanner } from "@/lib/secure-input-validation";
import {
  createServerSpaceChatService,
  type CheckPermissionFn,
  type GetUserProfileFn,
} from "@hive/core/server";
import type { BoardPermission } from "@hive/core";
import { withCache } from '../../../../../../lib/cache-headers';

/**
 * Board single-item CRUD API - DDD Compliant
 *
 * GET    /api/spaces/[spaceId]/boards/[boardId] - Get board details
 * PATCH  /api/spaces/[spaceId]/boards/[boardId] - Update board (leaders only)
 * DELETE /api/spaces/[spaceId]/boards/[boardId] - Archive board (leaders only)
 *
 * Uses SpaceChatService for DDD-compliant operations.
 */

const UpdateBoardSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  canPost: z.enum(['all', 'members', 'leaders']).optional(),
  order: z.number().int().min(0).optional(),
  isLocked: z.boolean().optional(),
});

/**
 * Create permission check callback for SpaceChatService
 */
function createPermissionChecker(): CheckPermissionFn {
  return async (userId: string, spaceId: string, requiredRole: 'member' | 'admin' | 'owner' | 'read') => {
    if (requiredRole === 'read') {
      const memberCheck = await checkSpacePermission(spaceId, userId, 'member');
      if (memberCheck.hasPermission) {
        return { allowed: true, role: memberCheck.role };
      }
      const guestCheck = await checkSpacePermission(spaceId, userId, 'guest');
      if (guestCheck.hasPermission && guestCheck.space?.isPublic) {
        return { allowed: true, role: 'guest' };
      }
      return { allowed: false };
    }
    const permCheck = await checkSpacePermission(spaceId, userId, requiredRole);
    if (!permCheck.hasPermission) {
      if (requiredRole === 'member') {
        const guestCheck = await checkSpacePermission(spaceId, userId, 'guest');
        if (guestCheck.hasPermission && guestCheck.space?.isPublic) {
          return { allowed: true, role: 'guest' };
        }
      }
      return { allowed: false };
    }
    return { allowed: true, role: permCheck.role };
  };
}

/**
 * Create user profile getter callback
 */
function createProfileGetter(): GetUserProfileFn {
  return async (userId: string) => {
    const userDoc = await dbAdmin.collection('profiles').doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }
    const data = userDoc.data()!;
    return {
      displayName: data.displayName || data.name || 'Member',
      avatarUrl: data.avatarUrl || data.photoURL,
    };
  };
}

/**
 * GET /api/spaces/[spaceId]/boards/[boardId] - Get board details
 */
const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; boardId: string }> },
  respond
) => {
  const { spaceId, boardId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);

  if (!spaceId || !boardId) {
    return respond.error("Space ID and Board ID are required", "INVALID_INPUT", { status: 400 });
  }

  // Check permission - members can view boards
  const permCheck = await checkSpacePermission(spaceId, userId, 'member');
  if (!permCheck.hasPermission) {
    // Allow guest access to public spaces
    if (permCheck.code !== 'NOT_FOUND') {
      const guestCheck = await checkSpacePermission(spaceId, userId, 'guest');
      if (!guestCheck.hasPermission || !guestCheck.space?.isPublic) {
        return respond.error(permCheck.error ?? "Permission denied", permCheck.code ?? "FORBIDDEN", { status: 403 });
      }
    } else {
      return respond.error(permCheck.error ?? "Space not found", permCheck.code ?? "NOT_FOUND", { status: 404 });
    }
  }

  try {
    const boardDoc = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('boards')
      .doc(boardId)
      .get();

    if (!boardDoc.exists) {
      return respond.error("Board not found", "NOT_FOUND", { status: 404 });
    }

    const data = boardDoc.data()!;

    if (data.isArchived) {
      return respond.error("Board has been archived", "ARCHIVED", { status: 410 });
    }

    const board = {
      id: boardDoc.id,
      name: data.name,
      type: data.type || 'general',
      description: data.description,
      linkedEventId: data.linkedEventId,
      messageCount: data.messageCount || 0,
      participantCount: data.participantCount || 0,
      isDefault: data.isDefault || false,
      isLocked: data.isLocked || false,
      canPost: data.canPost || 'members',
      pinnedMessageIds: data.pinnedMessageIds || [],
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      lastActivityAt: data.lastActivityAt?.toDate?.()?.toISOString() || null,
    };

    return respond.success({ board });
  } catch (error) {
    logger.error('Failed to fetch board', { error, spaceId, boardId });
    return respond.error("Failed to fetch board", "FETCH_FAILED", { status: 500 });
  }
});

/**
 * PATCH /api/spaces/[spaceId]/boards/[boardId] - Update board (leaders only)
 */
type UpdateBoardData = z.output<typeof UpdateBoardSchema>;

export const PATCH = withAuthValidationAndErrors(
  UpdateBoardSchema as z.ZodType<UpdateBoardData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string; boardId: string }> },
    data: UpdateBoardData,
    respond
  ) => {
    const { spaceId, boardId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId || !boardId) {
      return respond.error("Space ID and Board ID are required", "INVALID_INPUT", { status: 400 });
    }

    // SECURITY: Scan board name and description for XSS/injection attacks
    if (data.name) {
      const nameScan = SecurityScanner.scanInput(data.name);
      if (nameScan.level === 'dangerous') {
        logger.warn("XSS attempt blocked in board name update", {
          userId, spaceId, boardId, threats: nameScan.threats
        });
        return respond.error("Board name contains invalid content", "INVALID_INPUT", { status: 400 });
      }
    }
    if (data.description) {
      const descScan = SecurityScanner.scanInput(data.description);
      if (descScan.level === 'dangerous') {
        logger.warn("XSS attempt blocked in board description update", {
          userId, spaceId, boardId, threats: descScan.threats
        });
        return respond.error("Description contains invalid content", "INVALID_INPUT", { status: 400 });
      }
    }

    // Create the chat service with DDD repositories
    const chatService = createServerSpaceChatService(
      { userId, campusId },
      {
        checkPermission: createPermissionChecker(),
        getUserProfile: createProfileGetter(),
      }
    );

    const result = await chatService.updateBoard(userId, {
      spaceId,
      boardId,
      name: data.name,
      description: data.description,
      canPost: data.canPost as BoardPermission | undefined,
      isLocked: data.isLocked,
    });

    if (result.isFailure) {
      const errorMsg = result.error ?? "Failed to update board";
      if (errorMsg.includes('leader')) {
        return respond.error(errorMsg, "FORBIDDEN", { status: 403 });
      }
      if (errorMsg.includes('not found')) {
        return respond.error(errorMsg, "NOT_FOUND", { status: 404 });
      }
      if (errorMsg.includes('archived')) {
        return respond.error(errorMsg, "ARCHIVED", { status: 410 });
      }
      return respond.error(errorMsg, "UPDATE_FAILED", { status: 500 });
    }

    logger.info(`Board updated: ${boardId} in space ${spaceId}`, {
      spaceId,
      boardId,
      updatedFields: Object.keys(data),
      userId
    });

    return respond.success({
      message: "Board updated successfully",
      board: {
        id: boardId,
        ...data
      }
    });
  }
);

/**
 * DELETE /api/spaces/[spaceId]/boards/[boardId] - Archive board (leaders only)
 *
 * Note: We soft-delete (archive) boards to preserve message history
 */
export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; boardId: string }> },
  respond
) => {
  const { spaceId, boardId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  if (!spaceId || !boardId) {
    return respond.error("Space ID and Board ID are required", "INVALID_INPUT", { status: 400 });
  }

  // Create the chat service with DDD repositories
  const chatService = createServerSpaceChatService(
    { userId, campusId },
    {
      checkPermission: createPermissionChecker(),
      getUserProfile: createProfileGetter(),
    }
  );

  const result = await chatService.archiveBoard(userId, spaceId, boardId);

  if (result.isFailure) {
    const errorMsg = result.error ?? "Failed to archive board";
    if (errorMsg.includes('leader')) {
      return respond.error(errorMsg, "FORBIDDEN", { status: 403 });
    }
    if (errorMsg.includes('not found')) {
      return respond.error(errorMsg, "NOT_FOUND", { status: 404 });
    }
    if (errorMsg.includes('default')) {
      return respond.error(errorMsg, "INVALID_OPERATION", { status: 400 });
    }
    return respond.error(errorMsg, "DELETE_FAILED", { status: 500 });
  }

  logger.info(`Board archived: ${boardId} in space ${spaceId}`, {
    spaceId,
    boardId,
    userId
  });

  return respond.success({
    message: "Board archived successfully",
    boardId
  });
});

export const GET = withCache(_GET, 'SHORT');
