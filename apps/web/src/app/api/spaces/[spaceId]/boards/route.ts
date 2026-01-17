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

/**
 * Board CRUD API - Chat channels within a space
 *
 * Uses SpaceChatService for DDD-compliant operations.
 *
 * GET   /api/spaces/[spaceId]/boards - List all boards
 * POST  /api/spaces/[spaceId]/boards - Create a new board (leaders only)
 */

const CreateBoardSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['general', 'topic', 'event']),
  description: z.string().max(200).optional(),
  linkedEventId: z.string().optional(),
  canPost: z.enum(['all', 'members', 'leaders']).default('members'),
});

/**
 * Create permission check callback for SpaceChatService
 */
function createPermissionChecker(): CheckPermissionFn {
  return async (userId: string, spaceId: string, requiredRole: 'member' | 'leader' | 'owner' | 'read') => {
    // 'read' permission allows non-members to view public spaces
    if (requiredRole === 'read') {
      // First check if user is a member (any level)
      const memberCheck = await checkSpacePermission(spaceId, userId, 'member');
      if (memberCheck.hasPermission) {
        return { allowed: true, role: memberCheck.role };
      }
      // If not a member, check if space is public (allow guest access)
      const guestCheck = await checkSpacePermission(spaceId, userId, 'guest');
      if (guestCheck.hasPermission && guestCheck.space?.isPublic) {
        return { allowed: true, role: 'guest' };
      }
      return { allowed: false };
    }

    // For other roles, use standard permission check
    const permCheck = await checkSpacePermission(spaceId, userId, requiredRole);
    if (!permCheck.hasPermission) {
      // Check guest access for public spaces (fallback for 'member' role)
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
 * Create user profile getter callback for SpaceChatService
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
 * GET /api/spaces/[spaceId]/boards - List all boards for a space
 */
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const { spaceId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  if (!spaceId) {
    return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
  }

  // Create the chat service with DDD repositories
  const chatService = createServerSpaceChatService(
    { userId, campusId },
    {
      checkPermission: createPermissionChecker(),
      getUserProfile: createProfileGetter(),
    }
  );

  const result = await chatService.listBoards(userId, spaceId);

  if (result.isFailure) {
    logger.error('Failed to fetch boards', { error: result.error, spaceId });
    return respond.error(result.error ?? "Failed to fetch boards", "FETCH_FAILED", { status: 500 });
  }

  const serviceResult = result.getValue();
  const boards = serviceResult.data;

  // Transform to API response format
  const apiBoards = boards.map(board => {
    const dto = board.toDTO();
    return {
      id: board.id,
      name: dto.name,
      type: dto.type,
      description: dto.description,
      linkedEventId: dto.linkedEventId,
      messageCount: dto.messageCount,
      participantCount: dto.participantCount,
      isDefault: dto.isDefault,
      isLocked: dto.isLocked,
      canPost: dto.canPost,
      createdAt: dto.createdAt instanceof Date ? dto.createdAt.toISOString() : null,
      lastActivityAt: dto.lastActivityAt instanceof Date ? dto.lastActivityAt.toISOString() : null,
    };
  });

  logger.info(`Boards listed for space: ${spaceId}`, { spaceId, boardCount: apiBoards.length });

  return respond.success({ boards: apiBoards, total: apiBoards.length });
});

/**
 * POST /api/spaces/[spaceId]/boards - Create a new board (leaders only)
 */
type CreateBoardData = z.output<typeof CreateBoardSchema>;

export const POST = withAuthValidationAndErrors(
  CreateBoardSchema as z.ZodType<CreateBoardData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: CreateBoardData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // SECURITY: Scan board name and description for XSS/injection
    // SecurityScanner.scanInput returns { level, threats, sanitized } - check level for dangerous content
    const nameScan = SecurityScanner.scanInput(data.name);
    if (nameScan.level === 'dangerous') {
      logger.warn("XSS attempt blocked in board name", { userId, spaceId, threats: nameScan.threats });
      return respond.error("Board name contains invalid content", "INVALID_INPUT", { status: 400 });
    }
    if (data.description) {
      const descScan = SecurityScanner.scanInput(data.description);
      if (descScan.level === 'dangerous') {
        logger.warn("XSS attempt blocked in board description", { userId, spaceId, threats: descScan.threats });
        return respond.error("Board description contains invalid content", "INVALID_INPUT", { status: 400 });
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

    const result = await chatService.createBoard(userId, {
      spaceId,
      name: data.name,
      type: data.type,
      description: data.description,
      linkedEventId: data.linkedEventId,
      canPost: data.canPost,
    });

    if (result.isFailure) {
      logger.error('Failed to create board', { error: result.error, spaceId });
      return respond.error(result.error ?? "Failed to create board", "CREATE_FAILED", { status: 500 });
    }

    const serviceResult = result.getValue();
    const { boardId, name, type } = serviceResult.data;

    logger.info(`Board created: ${boardId} in space ${spaceId}`, {
      spaceId,
      boardId,
      boardName: name,
      userId
    });

    return respond.success({
      message: "Board created successfully",
      board: {
        id: boardId,
        name,
        type,
      }
    }, { status: 201 });
  }
);
