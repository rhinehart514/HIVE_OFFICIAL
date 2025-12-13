import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { logger } from "@/lib/structured-logger";
import {
  createServerSpaceChatService,
  type CheckPermissionFn,
  type GetUserProfileFn,
} from "@hive/core/server";
import { dbAdmin } from "@/lib/firebase-admin";

/**
 * Inline Component State API
 *
 * GET /api/spaces/[spaceId]/components/[componentId] - Get component state
 *
 * Returns the component display state including:
 * - Configuration (poll question, options, etc.)
 * - Aggregated state (vote counts, RSVP counts)
 * - User's participation (if any)
 */

/**
 * Create permission check callback
 */
function createPermissionChecker(): CheckPermissionFn {
  return async (userId: string, spaceId: string, requiredRole: 'member' | 'leader' | 'owner') => {
    const permCheck = await checkSpacePermission(spaceId, userId, requiredRole);
    if (!permCheck.hasPermission) {
      // Allow guest access to public spaces for member-level operations
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
 * GET /api/spaces/[spaceId]/components/[componentId] - Get component state
 */
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; componentId: string }> },
  respond
) => {
  const { spaceId, componentId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  if (!spaceId || !componentId) {
    return respond.error("Space ID and Component ID are required", "INVALID_INPUT", { status: 400 });
  }

  // Create the chat service with DDD repositories
  const chatService = createServerSpaceChatService(
    { userId, campusId },
    {
      checkPermission: createPermissionChecker(),
      getUserProfile: createProfileGetter(),
    }
  );

  const result = await chatService.getComponentState(userId, spaceId, componentId);

  if (result.isFailure) {
    const errorMsg = result.error ?? "Failed to fetch component state";
    if (errorMsg.includes('Access denied')) {
      return respond.error(errorMsg, "FORBIDDEN", { status: 403 });
    }
    return respond.error(errorMsg, "FETCH_FAILED", { status: 500 });
  }

  const displayState = result.getValue().data;

  if (!displayState) {
    return respond.error("Component not found", "NOT_FOUND", { status: 404 });
  }

  logger.info('Component state fetched', { spaceId, componentId, userId });

  return respond.success({
    component: displayState
  });
});
