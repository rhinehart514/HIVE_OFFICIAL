/**
 * Permission Checker
 *
 * Checks if a user has permission for a specific action.
 * Handles _own vs _any distinction for content permissions.
 */

import { checkSpacePermission } from '@/lib/space-permission-middleware';
import {
  resolveUserPermissions,
  type Permission,
  type UserRole,
  type UserPermissions,
} from '@/lib/permission-system';
import { getSpaceTypeRules, type SpaceType } from '@/lib/space-type-rules';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  role?: UserRole;
}

/**
 * Permission pairs that have _own/_any variants
 */
const OWNERSHIP_PERMISSION_PAIRS: Record<string, { own: Permission; any: Permission }> = {
  'posts:edit': { own: 'posts:edit_own', any: 'posts:edit_any' },
  'posts:delete': { own: 'posts:delete_own', any: 'posts:delete_any' },
  'events:edit': { own: 'events:edit_own', any: 'events:edit_any' },
  'events:delete': { own: 'events:delete_own', any: 'events:delete_any' },
  'messages:edit': { own: 'messages:edit_own', any: 'messages:edit_any' },
  'messages:delete': { own: 'messages:delete_own', any: 'messages:delete_any' },
};

/**
 * Check if user has permission for an action, with ownership consideration
 *
 * @param userId - The user requesting the action
 * @param spaceId - The space where the action is performed
 * @param permission - The permission to check (e.g., 'posts:delete')
 * @param resourceOwnerId - Optional: the owner of the resource being acted upon
 */
export async function checkPermission(
  userId: string,
  spaceId: string,
  permission: Permission,
  resourceOwnerId?: string
): Promise<PermissionCheckResult> {
  try {
    // Get user's membership and role in the space
    const membershipCheck = await checkSpacePermission(spaceId, userId, 'member');

    if (!membershipCheck.hasPermission) {
      // Check if space is public for guest access
      if (membershipCheck.code === 'NOT_MEMBER') {
        const guestCheck = await checkSpacePermission(spaceId, userId, 'guest');
        if (guestCheck.hasPermission && guestCheck.space?.isPublic) {
          // Guest can only view
          if (permission === 'members:view' || permission === 'tools:view') {
            return { allowed: true, role: 'guest' };
          }
          return { allowed: false, reason: 'Guests cannot perform this action' };
        }
      }
      return {
        allowed: false,
        reason: membershipCheck.error || 'Not a member of this space',
      };
    }

    const userRole = membershipCheck.role as UserRole;

    // Get space type and rules for permission resolution
    // Note: space.type may not always be available, default to hive_exclusive
    const spaceType = 'hive_exclusive' as SpaceType;
    const spaceRules = getSpaceTypeRules(spaceType);

    // Build user permissions object
    const userPermissions: UserPermissions = {
      userId,
      spaceId,
      role: userRole,
    };

    // Resolve effective permissions
    const effectivePermissions = resolveUserPermissions(userPermissions, spaceType, spaceRules);

    // Check for _own/_any permission variants
    const permissionPair = OWNERSHIP_PERMISSION_PAIRS[permission];

    if (permissionPair) {
      // This permission has ownership variants
      const hasAnyPermission = effectivePermissions.includes(permissionPair.any);
      const hasOwnPermission = effectivePermissions.includes(permissionPair.own);

      if (hasAnyPermission) {
        // User can act on any resource
        return { allowed: true, role: userRole };
      }

      if (hasOwnPermission) {
        // User can only act on their own resources
        if (!resourceOwnerId) {
          return { allowed: false, reason: 'Resource owner ID required for ownership check' };
        }

        if (resourceOwnerId === userId) {
          return { allowed: true, role: userRole };
        }

        return {
          allowed: false,
          reason: 'You can only modify your own content',
        };
      }

      return {
        allowed: false,
        reason: `Missing permission: ${permission}`,
      };
    }

    // Standard permission check (no ownership variants)
    if (effectivePermissions.includes(permission)) {
      return { allowed: true, role: userRole };
    }

    return {
      allowed: false,
      reason: `Missing permission: ${permission}`,
    };
  } catch (error) {
    logger.error('Permission check failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      spaceId,
      permission,
    });
    return { allowed: false, reason: 'Permission check failed' };
  }
}

/**
 * Get all effective permissions for a user in a space
 */
export async function getUserPermissionsInSpace(
  userId: string,
  spaceId: string
): Promise<{ role: UserRole | null; permissions: Permission[] }> {
  try {
    const membershipCheck = await checkSpacePermission(spaceId, userId, 'member');

    if (!membershipCheck.hasPermission) {
      // Check for guest access
      const guestCheck = await checkSpacePermission(spaceId, userId, 'guest');
      if (guestCheck.hasPermission && guestCheck.space?.isPublic) {
        return { role: 'guest', permissions: ['members:view'] };
      }
      return { role: null, permissions: [] };
    }

    const userRole = membershipCheck.role as UserRole;
    // Note: space.type may not always be available, default to hive_exclusive
    const spaceType = 'hive_exclusive' as SpaceType;
    const spaceRules = getSpaceTypeRules(spaceType);

    const userPermissions: UserPermissions = {
      userId,
      spaceId,
      role: userRole,
    };

    const effectivePermissions = resolveUserPermissions(userPermissions, spaceType, spaceRules);

    return { role: userRole, permissions: effectivePermissions };
  } catch (error) {
    logger.error('Failed to get user permissions', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      spaceId,
    });
    return { role: null, permissions: [] };
  }
}

/**
 * Check if user can perform action on a specific resource
 * Fetches the resource owner automatically
 */
export async function checkResourcePermission(
  userId: string,
  spaceId: string,
  resourceType: 'post' | 'event' | 'message',
  resourceId: string,
  action: 'edit' | 'delete'
): Promise<PermissionCheckResult> {
  try {
    // Map resource type to collection path
    const collectionMap: Record<string, string> = {
      post: `spaces/${spaceId}/posts`,
      event: `spaces/${spaceId}/events`,
      message: `spaces/${spaceId}/messages`,
    };

    const collection = collectionMap[resourceType];
    if (!collection) {
      return { allowed: false, reason: 'Invalid resource type' };
    }

    // Fetch the resource to get owner
    const resourceDoc = await dbAdmin.collection(collection).doc(resourceId).get();
    if (!resourceDoc.exists) {
      return { allowed: false, reason: 'Resource not found' };
    }

    const resourceData = resourceDoc.data()!;
    const resourceOwnerId = resourceData.authorId || resourceData.createdBy || resourceData.userId;

    if (!resourceOwnerId) {
      return { allowed: false, reason: 'Resource owner not found' };
    }

    // Build the permission string
    const permission = `${resourceType}s:${action}` as Permission;

    return checkPermission(userId, spaceId, permission, resourceOwnerId);
  } catch (error) {
    logger.error('Resource permission check failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      spaceId,
      resourceType,
      resourceId,
    });
    return { allowed: false, reason: 'Permission check failed' };
  }
}
