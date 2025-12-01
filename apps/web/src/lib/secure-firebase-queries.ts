/**
 * Secure Firebase Queries with Campus Isolation
 *
 * Server-side utilities for Firebase Admin SDK that enforce campus isolation
 * CRITICAL: All space-related queries MUST use these functions
 */

import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import * as admin from 'firebase-admin';
import { getDefaultCampusId } from './campus-context';

/**
 * @deprecated Use getCampusId(request) or getCampusIdFromAuth(auth) instead.
 * This constant exists only for backwards compatibility during migration.
 */
export const CURRENT_CAMPUS_ID = getDefaultCampusId();

/**
 * Validates that a space belongs to the specified campus and user has access
 * @param spaceId - The space to validate
 * @param userId - Optional user ID for logging
 * @param campusId - Campus to validate against (defaults to CURRENT_CAMPUS_ID for backwards compat)
 */
export async function validateSecureSpaceAccess(
  spaceId: string,
  userId?: string,
  campusId: string = CURRENT_CAMPUS_ID
): Promise<{
  isValid: boolean;
  space?: admin.firestore.DocumentData;
  error?: string;
}> {
  try {
    const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();

    if (!spaceDoc.exists) {
      return { isValid: false, error: 'Space not found' };
    }

    const spaceData = spaceDoc.data()!;

    // Critical: Validate campus isolation
    if (spaceData.campusId !== campusId) {
      logger.error('SECURITY: Cross-campus space access blocked', {
        spaceId,
        spaceCampusId: spaceData.campusId,
        currentCampusId: campusId,
        userId
      });
      return { isValid: false, error: 'Access denied - campus mismatch' };
    }

    // Validate space is active
    if (!spaceData.isActive) {
      return { isValid: false, error: 'Space is not active' };
    }

    return { isValid: true, space: spaceData };
  } catch (error) {
    logger.error('Error validating secure space access', { spaceId, userId, error: { error: error instanceof Error ? error.message : String(error) } });
    return { isValid: false, error: 'Validation failed' };
  }
}

/**
 * Get a campus-isolated spaces query
 * @param campusId - Campus to filter by (defaults to CURRENT_CAMPUS_ID for backwards compat)
 */
export function getSecureSpacesQuery(campusId: string = CURRENT_CAMPUS_ID) {
  return dbAdmin.collection('spaces')
    .where('campusId', '==', campusId)
    .where('isActive', '==', true);
}

/**
 * Get spaces with cursor-based pagination (simplified to avoid compound indexes)
 * @param options.campusId - Campus to filter by (defaults to CURRENT_CAMPUS_ID)
 */
export async function getSecureSpacesWithCursor({
  filterType,
  searchTerm,
  limit = 50,
  _cursor,
  _orderBy = 'createdAt',
  _orderDirection = 'desc',
  campusId = CURRENT_CAMPUS_ID
}: {
  filterType?: string;
  searchTerm?: string;
  limit?: number;
  _cursor?: string;
  _orderBy?: string;
  _orderDirection?: 'asc' | 'desc';
  campusId?: string;
}): Promise<{
  spaces: admin.firestore.DocumentData[];
  nextCursor?: string;
  hasMore: boolean;
}> {
  try {
    // Simplified query to avoid compound index requirements
    // Only use campus isolation and active status
    let query = dbAdmin.collection('spaces')
      .where('campusId', '==', campusId)
      .where('isActive', '==', true);

    // For development: limit to reasonable number
    query = query.limit(Math.min(limit + 1, 100));

    const snapshot = await query.get();
    let docs = snapshot.docs;

    // Client-side filtering to avoid compound index requirements
    if (filterType && filterType !== 'all') {
      docs = docs.filter(doc => doc.data().type === filterType);
    }

    if (searchTerm) {
      docs = docs.filter(doc => {
        const data = doc.data();
        return data.name_lowercase?.includes(searchTerm.toLowerCase()) ||
               data.description?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Apply limit after filtering
    const hasMore = docs.length > limit;
    const spaces = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore && spaces.length > 0 ? spaces[spaces.length - 1].id : undefined;

    return {
      spaces: spaces.map(doc => ({ id: doc.id, ...doc.data() })),
      nextCursor,
      hasMore
    };
  } catch (error) {
    logger.error('Error in getSecureSpacesWithCursor:', { error: error instanceof Error ? error.message : String(error) });
    return {
      spaces: [],
      nextCursor: undefined,
      hasMore: false
    };
  }
}

/**
 * Get campus-isolated space membership query
 * Optimized: Uses composite index (spaceId + campusId + isActive + joinedAt)
 * @param spaceId - Space to get members for
 * @param campusId - Campus to filter by (defaults to CURRENT_CAMPUS_ID)
 */
export function getSecureSpaceMembersQuery(spaceId: string, campusId: string = CURRENT_CAMPUS_ID) {
  return dbAdmin.collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('campusId', '==', campusId)
    .where('isActive', '==', true)
    .orderBy('joinedAt', 'desc');
}

/**
 * Validates user membership in a space with campus isolation
 * @param userId - User to validate
 * @param spaceId - Space to check membership for
 * @param campusId - Campus to validate against (defaults to CURRENT_CAMPUS_ID)
 */
export async function validateSecureSpaceMembership(
  userId: string,
  spaceId: string,
  campusId: string = CURRENT_CAMPUS_ID
): Promise<{
  isValid: boolean;
  membership?: admin.firestore.DocumentData;
  membershipRef?: admin.firestore.DocumentReference<admin.firestore.DocumentData>;
  space?: admin.firestore.DocumentData;
  error?: string;
}> {
  try {
    // First validate space access
    const spaceValidation = await validateSecureSpaceAccess(spaceId, userId, campusId);
    if (!spaceValidation.isValid) {
      return { isValid: false, error: spaceValidation.error };
    }

    // Check user membership - optimized query order
    const membershipQuery = dbAdmin.collection('spaceMembers')
      .where('userId', '==', userId)
      .where('campusId', '==', campusId)
      .where('isActive', '==', true)
      .where('spaceId', '==', spaceId)
      .limit(1);

    const membershipSnapshot = await membershipQuery.get();

    if (membershipSnapshot.empty) {
      return { isValid: false, error: 'User is not a member of this space' };
    }

    const membershipDoc = membershipSnapshot.docs[0];
    const membershipData = membershipDoc.data();

    return {
      isValid: true,
      membership: membershipData,
      membershipRef: membershipDoc.ref,
      space: spaceValidation.space
    };
  } catch (error) {
    logger.error('Error validating secure space membership', { userId, spaceId, error: { error: error instanceof Error ? error.message : String(error) } });
    return { isValid: false, error: 'Validation failed' };
  }
}

/**
 * Validates if user can join a specific space (campus + space rules)
 * @param userId - User wanting to join
 * @param spaceId - Space to join
 * @param campusId - Campus to validate against (defaults to CURRENT_CAMPUS_ID)
 */
export async function validateSpaceJoinability(
  userId: string,
  spaceId: string,
  campusId: string = CURRENT_CAMPUS_ID
): Promise<{
  canJoin: boolean;
  space?: admin.firestore.DocumentData;
  error?: string;
}> {
  try {
    // Validate space access
    const spaceValidation = await validateSecureSpaceAccess(spaceId, userId, campusId);
    if (!spaceValidation.isValid) {
      return { canJoin: false, error: spaceValidation.error };
    }

    const space = spaceValidation.space!;

    // Check if space is private
    if (space.isPrivate) {
      return { canJoin: false, error: 'Space is private and requires invitation' };
    }

    // Check if user is already a member - optimized query order
    const existingMemberQuery = dbAdmin.collection('spaceMembers')
      .where('userId', '==', userId)
      .where('campusId', '==', campusId)
      .where('isActive', '==', true)
      .where('spaceId', '==', spaceId)
      .limit(1);

    const existingSnapshot = await existingMemberQuery.get();
    if (!existingSnapshot.empty) {
      return { canJoin: false, error: 'User is already a member' };
    }

    // Greek life exclusive check
    if (space.type === 'greek_life') {
      const greekMemberQuery = dbAdmin.collection('spaceMembers')
        .where('userId', '==', userId)
        .where('isActive', '==', true);

      const greekSnapshot = await greekMemberQuery.get();

      for (const memberDoc of greekSnapshot.docs) {
        const memberData = memberDoc.data();
        const memberSpaceDoc = await dbAdmin.collection('spaces').doc(memberData.spaceId).get();

        if (memberSpaceDoc.exists) {
          const memberSpace = memberSpaceDoc.data()!;
          if (memberSpace.type === 'greek_life' && memberSpace.campusId === campusId) {
            return { canJoin: false, error: 'User can only join one Greek life organization' };
          }
        }
      }
    }

    return { canJoin: true, space };
  } catch (error) {
    logger.error('Error validating space joinability', { userId, spaceId, error: { error: error instanceof Error ? error.message : String(error) } });
    return { canJoin: false, error: 'Validation failed' };
  }
}

/**
 * Add campus metadata to any document being created
 * @param data - Document data to enhance
 * @param campusId - Campus to add (defaults to CURRENT_CAMPUS_ID)
 */
export function addSecureCampusMetadata(data: Record<string, unknown>, campusId: string = CURRENT_CAMPUS_ID): Record<string, unknown> {
  return {
    ...data,
    campusId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

/**
 * Audit security violations
 * @param operation - The operation that triggered the violation
 * @param details - Additional details about the violation
 * @param campusId - Campus context (defaults to CURRENT_CAMPUS_ID)
 */
export function auditSecurityViolation(
  operation: string,
  details: Record<string, unknown>,
  campusId: string = CURRENT_CAMPUS_ID
): void {
  logger.error('SECURITY_VIOLATION', {
    operation,
    timestamp: new Date().toISOString(),
    currentCampusId: campusId,
    ...details
  });

  // In production, trigger alerts
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to monitoring service
  }
}

/**
 * Get secure user data with campus validation
 * @param userId - User to fetch
 * @param campusId - Campus to validate against (defaults to CURRENT_CAMPUS_ID)
 */
export async function getSecureUserData(userId: string, campusId: string = CURRENT_CAMPUS_ID): Promise<{
  isValid: boolean;
  user?: admin.firestore.DocumentData;
  error?: string;
}> {
  try {
    const userDoc = await dbAdmin.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return { isValid: false, error: 'User not found' };
    }

    const userData = userDoc.data()!;

    // Validate user belongs to specified campus
    if (userData.campusId !== campusId) {
      auditSecurityViolation('cross_campus_user_access', {
        userId,
        userCampus: userData.campusId,
        currentCampus: campusId
      }, campusId);
      return { isValid: false, error: 'User not authorized for this campus' };
    }

    return { isValid: true, user: userData };
  } catch (error) {
    logger.error('Error getting secure user data', { userId, error: { error: error instanceof Error ? error.message : String(error) } });
    return { isValid: false, error: 'User validation failed' };
  }
}
import 'server-only';
