/**
 * Tool Context Validation Middleware
 *
 * Validates that users have appropriate permissions to create tools
 * in specific contexts (space, profile, feed).
 */

import type { Firestore } from 'firebase-admin/firestore';

/**
 * Context validation result
 */
export interface ContextValidationResult {
  valid: boolean;
  context?: {
    type: 'space' | 'profile' | 'feed';
    id: string;
    name: string;
  };
  error?: string;
  details?: string;
}

/**
 * Validate tool context and permissions
 *
 * @param contextType - Type of context (space, profile, feed, or null)
 * @param contextId - ID of the context entity (spaceId for spaces)
 * @param userId - ID of the user creating the tool
 * @param db - Firestore instance
 * @returns Validation result with context info or error
 */
export async function validateToolContext(
  contextType: string | undefined | null,
  contextId: string | undefined | null,
  userId: string,
  db: Firestore
): Promise<ContextValidationResult> {
  // No context is valid (legacy tools, personal tools)
  if (!contextType) {
    return { valid: true };
  }

  // Validate context type
  if (!['space', 'profile', 'feed'].includes(contextType)) {
    return {
      valid: false,
      error: 'Invalid context type',
      details: 'Context type must be one of: space, profile, feed',
    };
  }

  // Profile context - always valid for the user's own profile
  if (contextType === 'profile') {
    return {
      valid: true,
      context: {
        type: 'profile',
        id: userId,
        name: 'My Profile',
      },
    };
  }

  // Feed context - not yet implemented
  if (contextType === 'feed') {
    return {
      valid: false,
      error: 'Feed tools are coming soon',
      details: 'Feed context is not yet available. Please use space or profile context.',
    };
  }

  // Space context - requires validation
  if (contextType === 'space') {
    if (!contextId) {
      return {
        valid: false,
        error: 'spaceId required for space context',
        details: 'You must provide a spaceId when creating a tool for a space.',
      };
    }

    // Check if space exists
    const spaceDoc = await db.collection('spaces').doc(contextId).get();

    if (!spaceDoc.exists) {
      return {
        valid: false,
        error: 'Space not found',
        details: `Space with ID "${contextId}" does not exist.`,
      };
    }

    const spaceData = spaceDoc.data();

    // Check user has builder permission (admin, leader, builder roles)
    const memberSnapshot = await db.collection('spaceMembers')
      .where('userId', '==', userId)
      .where('spaceId', '==', contextId)
      .where('status', '==', 'active')
      .where('role', 'in', ['owner', 'admin', 'leader', 'builder'])
      .limit(1)
      .get();

    if (memberSnapshot.empty) {
      return {
        valid: false,
        error: 'Not authorized to build for this space',
        details: 'You must have owner, admin, leader, or builder role to create tools for this space.',
      };
    }

    return {
      valid: true,
      context: {
        type: 'space',
        id: contextId,
        name: spaceData?.name || 'Unknown Space',
      },
    };
  }

  return {
    valid: false,
    error: 'Invalid context configuration',
    details: 'Context validation failed for unknown reason.',
  };
}

/**
 * Check if user has builder permission for a space
 *
 * @param spaceId - ID of the space
 * @param userId - ID of the user
 * @param db - Firestore instance
 * @returns true if user has builder permission
 */
export async function hasBuilderPermission(
  spaceId: string,
  userId: string,
  db: Firestore
): Promise<boolean> {
  const memberSnapshot = await db.collection('spaceMembers')
    .where('userId', '==', userId)
    .where('spaceId', '==', spaceId)
    .where('status', '==', 'active')
    .where('role', 'in', ['owner', 'admin', 'leader', 'builder'])
    .limit(1)
    .get();

  return !memberSnapshot.empty;
}

/**
 * Get user's role in a space
 *
 * @param spaceId - ID of the space
 * @param userId - ID of the user
 * @param db - Firestore instance
 * @returns User's role or null if not a member
 */
export async function getUserSpaceRole(
  spaceId: string,
  userId: string,
  db: Firestore
): Promise<string | null> {
  const memberSnapshot = await db.collection('spaceMembers')
    .where('userId', '==', userId)
    .where('spaceId', '==', spaceId)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (memberSnapshot.empty) {
    return null;
  }

  const memberData = memberSnapshot.docs[0].data();
  return memberData.role || null;
}

/**
 * Validate context at tool creation time
 * This is a convenience wrapper that combines context validation with error formatting
 */
export async function validateContextForToolCreation(
  contextType: string | undefined | null,
  contextId: string | undefined | null,
  userId: string,
  db: Firestore
): Promise<{
  valid: boolean;
  context?: { type: 'space' | 'profile' | 'feed'; id: string; name: string };
  errorMessage?: string;
  statusCode?: number;
}> {
  const result = await validateToolContext(contextType, contextId, userId, db);

  if (!result.valid) {
    return {
      valid: false,
      errorMessage: result.error,
      statusCode: result.error?.includes('Not authorized') ? 403 : 400,
    };
  }

  return {
    valid: true,
    context: result.context,
  };
}
