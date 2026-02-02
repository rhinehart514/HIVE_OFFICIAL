/**
 * Event-Board Auto-Linking Service
 *
 * Automatically creates a chat board when an event is created in a space.
 * This enables event-specific discussions in the space's chat system.
 *
 * @example
 * // After creating an event:
 * await autoLinkEventToBoard({
 *   eventId: 'event_123',
 *   eventTitle: 'Spring Study Session',
 *   spaceId: 'space_456',
 *   userId: 'user_789',
 *   campusId: 'ub-buffalo',
 * });
 */

import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import {
  createServerSpaceChatService,
  type CheckPermissionFn,
  type GetUserProfileFn,
} from '@hive/core/server';
import { checkSpacePermission } from '@/lib/space-permission-middleware';

// ============================================================
// Types
// ============================================================

export interface EventBoardLinkInput {
  eventId: string;
  eventTitle: string;
  spaceId: string;
  userId: string;
  campusId: string;
}

export interface EventBoardLinkResult {
  success: boolean;
  boardId?: string;
  boardName?: string;
  error?: string;
}

// ============================================================
// Configuration
// ============================================================

/**
 * Settings for auto-linking behavior
 */
export const AUTO_LINK_CONFIG = {
  /** Maximum length for board name (truncate event title) */
  maxBoardNameLength: 50,

  /** Prefix for auto-generated board names */
  boardNamePrefix: '',

  /** Suffix for auto-generated board names */
  boardNameSuffix: '',

  /** Default permission level for event boards */
  defaultCanPost: 'members' as const,

  /** Whether to create boards for past events */
  createForPastEvents: false,
};

// ============================================================
// Helpers
// ============================================================

/**
 * Create permission check callback for SpaceChatService
 */
function createPermissionChecker(): CheckPermissionFn {
  return async (userId: string, spaceId: string, requiredRole: 'member' | 'admin' | 'owner' | 'read') => {
    // Map 'read' to 'member' for permission checking (read access requires at least member)
    const mappedRole = requiredRole === 'read' ? 'member' : requiredRole;
    const permCheck = await checkSpacePermission(spaceId, userId, mappedRole);
    if (!permCheck.hasPermission) {
      // Check guest access for public spaces
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
 * Truncate and sanitize event title for board name
 */
function sanitizeBoardName(eventTitle: string): string {
  let name = eventTitle.trim();

  // Add prefix/suffix if configured
  if (AUTO_LINK_CONFIG.boardNamePrefix) {
    name = `${AUTO_LINK_CONFIG.boardNamePrefix}${name}`;
  }
  if (AUTO_LINK_CONFIG.boardNameSuffix) {
    name = `${name}${AUTO_LINK_CONFIG.boardNameSuffix}`;
  }

  // Truncate if too long
  if (name.length > AUTO_LINK_CONFIG.maxBoardNameLength) {
    name = name.substring(0, AUTO_LINK_CONFIG.maxBoardNameLength - 3) + '...';
  }

  return name;
}

// ============================================================
// Main Function
// ============================================================

/**
 * Automatically create a chat board linked to an event
 *
 * This function:
 * 1. Creates a new board with type='event'
 * 2. Links it to the event via linkedEventId
 * 3. Uses the event title as the board name
 *
 * @param input - Event and space information
 * @returns Result with board ID if successful
 */
export async function autoLinkEventToBoard(
  input: EventBoardLinkInput
): Promise<EventBoardLinkResult> {
  const { eventId, eventTitle, spaceId, userId, campusId } = input;

  try {
    // Check if a board already exists for this event
    const existingBoard = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('boards')
      .where('linkedEventId', '==', eventId)
      .limit(1)
      .get();

    if (!existingBoard.empty) {
      const existingDoc = existingBoard.docs[0];
      logger.info('Board already exists for event', {
        eventId,
        boardId: existingDoc.id,
        spaceId,
      });
      return {
        success: true,
        boardId: existingDoc.id,
        boardName: existingDoc.data().name,
      };
    }

    // Create the chat service with DDD repositories
    const chatService = createServerSpaceChatService(
      { userId, campusId },
      {
        checkPermission: createPermissionChecker(),
        getUserProfile: createProfileGetter(),
      }
    );

    // Create the board
    const boardName = sanitizeBoardName(eventTitle);
    const result = await chatService.createBoard(userId, {
      spaceId,
      name: boardName,
      type: 'event',
      description: `Discussion for: ${eventTitle}`,
      linkedEventId: eventId,
      canPost: AUTO_LINK_CONFIG.defaultCanPost,
    });

    if (result.isFailure) {
      logger.error('Failed to create event board', {
        error: result.error,
        eventId,
        spaceId,
      });
      return {
        success: false,
        error: result.error ?? 'Failed to create board',
      };
    }

    const { data } = result.getValue();

    logger.info('Event board auto-linked successfully', {
      eventId,
      boardId: data.boardId,
      boardName: data.name,
      spaceId,
    });

    return {
      success: true,
      boardId: data.boardId,
      boardName: data.name,
    };
  } catch (error) {
    logger.error('Error auto-linking event to board', {
      error: error instanceof Error ? error.message : String(error),
      eventId,
      spaceId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Remove the board linked to an event (when event is deleted)
 *
 * @param eventId - The event ID
 * @param spaceId - The space ID
 * @param userId - The user performing the deletion
 * @param campusId - The campus ID
 */
export async function unlinkEventBoard(
  eventId: string,
  spaceId: string,
  userId: string,
  campusId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the board linked to this event
    const boardQuery = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('boards')
      .where('linkedEventId', '==', eventId)
      .limit(1)
      .get();

    if (boardQuery.empty) {
      // No board to unlink
      return { success: true };
    }

    const boardDoc = boardQuery.docs[0];
    const boardId = boardDoc.id;

    // Create the chat service
    const chatService = createServerSpaceChatService(
      { userId, campusId },
      {
        checkPermission: createPermissionChecker(),
        getUserProfile: createProfileGetter(),
      }
    );

    // Archive the board instead of deleting (preserve messages)
    const result = await chatService.archiveBoard(userId, spaceId, boardId);

    if (result.isFailure) {
      logger.error('Failed to archive event board', {
        error: result.error,
        eventId,
        boardId,
        spaceId,
      });
      return {
        success: false,
        error: result.error ?? 'Failed to archive board',
      };
    }

    logger.info('Event board archived successfully', {
      eventId,
      boardId,
      spaceId,
    });

    return { success: true };
  } catch (error) {
    logger.error('Error unlinking event board', {
      error: error instanceof Error ? error.message : String(error),
      eventId,
      spaceId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Find the board linked to an event
 *
 * @param eventId - The event ID
 * @param spaceId - The space ID
 * @returns The board ID if found
 */
export async function findEventBoard(
  eventId: string,
  spaceId: string
): Promise<{ boardId: string; boardName: string } | null> {
  try {
    const boardQuery = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('boards')
      .where('linkedEventId', '==', eventId)
      .limit(1)
      .get();

    if (boardQuery.empty) {
      return null;
    }

    const boardDoc = boardQuery.docs[0];
    return {
      boardId: boardDoc.id,
      boardName: boardDoc.data().name,
    };
  } catch (error) {
    logger.error('Error finding event board', {
      error: error instanceof Error ? error.message : String(error),
      eventId,
      spaceId,
    });
    return null;
  }
}

export default autoLinkEventToBoard;
