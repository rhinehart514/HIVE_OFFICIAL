/**
 * Space Permission Middleware
 *
 * Centralized permission checking for space operations.
 * Handles role hierarchy: owner > admin > leader > moderator > member > guest
 *
 * @module space-permission-middleware
 */

import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';

// ============================================================
// Types
// ============================================================

export type SpaceRole = 'owner' | 'admin' | 'leader' | 'moderator' | 'member' | 'guest';

export interface SpacePermissionResult {
  hasPermission: boolean;
  code?: 'NOT_FOUND' | 'FORBIDDEN' | 'SUSPENDED' | 'NOT_MEMBER' | 'CAMPUS_MISMATCH';
  error?: string;
  role?: SpaceRole; // Convenience accessor for membership.role
  space?: {
    id: string;
    name: string;
    campusId: string;
    isPublic: boolean;
    category: string;
  };
  membership?: {
    role: SpaceRole;
    isSuspended: boolean;
    joinedAt: Date;
  };
}

export interface SpaceMembership {
  spaceId: string;
  userId: string;
  role: SpaceRole;
  isSuspended?: boolean;
  isActive?: boolean;
  joinedAt: Date | FirebaseFirestore.Timestamp;
  campusId?: string;
}

// ============================================================
// Role Hierarchy
// ============================================================

/**
 * Role levels for permission checking.
 * Higher number = more permissions.
 */
const ROLE_LEVELS: Record<SpaceRole, number> = {
  guest: 0,
  member: 1,
  moderator: 2,
  leader: 3,  // leader = admin in UI terminology
  admin: 4,
  owner: 5,
};

/**
 * Check if a role meets the minimum required level
 */
function hasRoleLevel(userRole: SpaceRole, requiredRole: SpaceRole): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

// ============================================================
// Main Permission Check
// ============================================================

/**
 * Check if a user has permission to perform an action in a space.
 *
 * @param spaceId - The space ID to check
 * @param userId - The user ID to check (can be null for unauthenticated)
 * @param requiredRole - Minimum role required for the action
 * @returns Permission check result with space and membership details
 *
 * @example
 * const result = await checkSpacePermission('space123', 'user456', 'member');
 * if (!result.hasPermission) {
 *   return respond.error(result.error, result.code, { status: 403 });
 * }
 */
export async function checkSpacePermission(
  spaceId: string,
  userId: string | null,
  requiredRole: SpaceRole | 'admin' = 'member'
): Promise<SpacePermissionResult> {
  try {
    // Normalize 'admin' to 'leader' for backward compatibility
    const normalizedRole: SpaceRole = requiredRole === 'admin' ? 'leader' : requiredRole as SpaceRole;

    // Get the space
    const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();

    if (!spaceDoc.exists) {
      return {
        hasPermission: false,
        code: 'NOT_FOUND',
        error: 'Space not found',
      };
    }

    const spaceData = spaceDoc.data()!;
    const space = {
      id: spaceId,
      name: spaceData.name || 'Unnamed Space',
      campusId: spaceData.campusId || spaceData.schoolId,
      isPublic: !spaceData.isPrivate && spaceData.visibility !== 'private',
      category: spaceData.category || spaceData.type || 'general',
    };

    // Guest access: only need public space
    if (normalizedRole === 'guest') {
      // Unauthenticated users can access public spaces
      if (!userId) {
        return space.isPublic
          ? { hasPermission: true, space }
          : { hasPermission: false, code: 'FORBIDDEN', error: 'Authentication required', space };
      }
      // Authenticated users can always access as guest
      return { hasPermission: true, space };
    }

    // For member+ roles, user must be authenticated
    if (!userId) {
      return {
        hasPermission: false,
        code: 'FORBIDDEN',
        error: 'Authentication required',
        space,
      };
    }

    // Look up membership using composite key pattern
    const compositeId = `${spaceId}_${userId}`;
    const memberDoc = await dbAdmin.collection('spaceMembers').doc(compositeId).get();

    let membership: SpaceMembership | null = null;

    if (memberDoc.exists) {
      const memberData = memberDoc.data()!;
      membership = {
        spaceId: memberData.spaceId,
        userId: memberData.userId,
        role: memberData.role as SpaceRole,
        isSuspended: memberData.isSuspended === true,
        isActive: memberData.isActive !== false,
        joinedAt: memberData.joinedAt?.toDate?.() || new Date(),
        campusId: memberData.campusId,
      };
    } else {
      // Try legacy query pattern
      const memberQuery = await dbAdmin
        .collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!memberQuery.empty) {
        const memberData = memberQuery.docs[0].data();
        membership = {
          spaceId: memberData.spaceId,
          userId: memberData.userId,
          role: memberData.role as SpaceRole,
          isSuspended: memberData.isSuspended === true,
          isActive: memberData.isActive !== false,
          joinedAt: memberData.joinedAt?.toDate?.() || new Date(),
          campusId: memberData.campusId,
        };
      }
    }

    // Also check if user is in space's leaders array (legacy pattern)
    if (!membership && spaceData.leaders?.includes(userId)) {
      logger.debug('User found in space leaders array', { spaceId, userId });
      membership = {
        spaceId,
        userId,
        role: 'leader',
        isSuspended: false,
        isActive: true,
        joinedAt: new Date(),
      };
    }

    // Check if user is space owner
    logger.info('Checking space ownership', {
      spaceId,
      userId,
      createdBy: spaceData.createdBy,
      isMatch: spaceData.createdBy === userId,
      hasMembership: !!membership
    });
    if (!membership && spaceData.createdBy === userId) {
      logger.info('User is space owner via createdBy', { spaceId, userId });
      membership = {
        spaceId,
        userId,
        role: 'owner',
        isSuspended: false,
        isActive: true,
        joinedAt: new Date(),
      };
    }

    // No membership found
    if (!membership) {
      return {
        hasPermission: false,
        code: 'NOT_MEMBER',
        error: 'You are not a member of this space',
        space,
      };
    }

    // Check if member is suspended
    if (membership.isSuspended) {
      return {
        hasPermission: false,
        code: 'SUSPENDED',
        error: 'Your membership has been suspended',
        space,
        membership: {
          role: membership.role,
          isSuspended: true,
          joinedAt: membership.joinedAt as Date,
        },
      };
    }

    // Check if member is inactive
    if (!membership.isActive) {
      return {
        hasPermission: false,
        code: 'FORBIDDEN',
        error: 'Your membership is inactive',
        space,
      };
    }

    // Check role level
    if (!hasRoleLevel(membership.role, normalizedRole)) {
      return {
        hasPermission: false,
        code: 'FORBIDDEN',
        error: `This action requires ${normalizedRole} role or higher`,
        space,
        membership: {
          role: membership.role,
          isSuspended: false,
          joinedAt: membership.joinedAt as Date,
        },
      };
    }

    // Permission granted
    return {
      hasPermission: true,
      role: membership.role, // Convenience accessor at top level
      space,
      membership: {
        role: membership.role,
        isSuspended: false,
        joinedAt: membership.joinedAt as Date,
      },
    };
  } catch (error) {
    logger.error('Error checking space permission', {
      spaceId,
      userId: userId ?? undefined,
      requiredRole,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      hasPermission: false,
      code: 'FORBIDDEN',
      error: 'Failed to check permissions',
    };
  }
}

// ============================================================
// Membership Helpers
// ============================================================

/**
 * Get a user's membership in a space.
 *
 * @param spaceId - The space ID
 * @param userId - The user ID
 * @returns The membership or null if not found
 */
export async function getSpaceMembership(
  spaceId: string,
  userId: string
): Promise<SpaceMembership | null> {
  try {
    // Try composite key first
    const compositeId = `${spaceId}_${userId}`;
    const memberDoc = await dbAdmin.collection('spaceMembers').doc(compositeId).get();

    if (memberDoc.exists) {
      const data = memberDoc.data()!;
      return {
        spaceId: data.spaceId,
        userId: data.userId,
        role: data.role as SpaceRole,
        isSuspended: data.isSuspended === true,
        isActive: data.isActive !== false,
        joinedAt: data.joinedAt?.toDate?.() || new Date(),
        campusId: data.campusId,
      };
    }

    // Fall back to query
    const memberQuery = await dbAdmin
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (memberQuery.empty) {
      return null;
    }

    const data = memberQuery.docs[0].data();
    return {
      spaceId: data.spaceId,
      userId: data.userId,
      role: data.role as SpaceRole,
      isSuspended: data.isSuspended === true,
      isActive: data.isActive !== false,
      joinedAt: data.joinedAt?.toDate?.() || new Date(),
      campusId: data.campusId,
    };
  } catch (error) {
    logger.error('Error getting space membership', {
      spaceId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Check if a user is a leader (admin, owner, or leader role) of a space.
 */
export async function isSpaceLeader(
  spaceId: string,
  userId: string
): Promise<boolean> {
  const result = await checkSpacePermission(spaceId, userId, 'leader');
  return result.hasPermission;
}

/**
 * Check if a user is a member of a space.
 */
export async function isSpaceMember(
  spaceId: string,
  userId: string
): Promise<boolean> {
  const result = await checkSpacePermission(spaceId, userId, 'member');
  return result.hasPermission;
}

/**
 * Get all spaces where a user is a leader.
 */
export async function getUserLedSpaces(
  userId: string
): Promise<Array<{ id: string; name: string; role: SpaceRole }>> {
  try {
    const memberQuery = await dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const ledSpaces: Array<{ id: string; name: string; role: SpaceRole }> = [];

    for (const doc of memberQuery.docs) {
      const data = doc.data();
      const role = data.role as SpaceRole;

      if (hasRoleLevel(role, 'leader')) {
        // Get space name
        const spaceDoc = await dbAdmin.collection('spaces').doc(data.spaceId).get();
        if (spaceDoc.exists) {
          ledSpaces.push({
            id: data.spaceId,
            name: spaceDoc.data()?.name || 'Unnamed Space',
            role,
          });
        }
      }
    }

    return ledSpaces;
  } catch (error) {
    logger.error('Error getting user led spaces', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}
