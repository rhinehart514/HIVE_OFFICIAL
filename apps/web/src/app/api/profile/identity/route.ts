/**
 * Identity Fetch API
 *
 * GET /api/profile/identity
 *
 * Returns consolidated identity data for the current user:
 * - Basic profile (major, graduationYear, residenceType, interests, communityIdentities)
 * - Major space (if exists) with unlock status
 * - Home space (if exists)
 * - Community spaces
 *
 * Used by /spaces TerritorySection to display personalized identity quadrants
 */

import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

export const GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  if (!isFirebaseConfigured) {
    return respond.error('Service unavailable', 'SERVICE_UNAVAILABLE', { status: 503 });
  }

  // Fetch user profile
  const userRef = dbAdmin.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return respond.error('User not found', 'USER_NOT_FOUND', { status: 404 });
  }

  const userData = userDoc.data();
  if (!userData) {
    return respond.error('User data not found', 'USER_DATA_NOT_FOUND', { status: 404 });
  }

  // Basic identity data
  const identity: {
    major: string | null;
    graduationYear: number | null;
    residenceType: string | null;
    interests: string[];
    communityIdentities: Record<string, unknown>;
    majorSpace: {
      id: string;
      name: string;
      majorName: string;
      isUnlocked: boolean;
    } | null;
    homeSpace: {
      id: string;
      name: string;
    } | null;
    communitySpaces: Array<{
      id: string;
      name: string;
      communityType: string | null;
    }>;
  } = {
    major: userData.major || null,
    graduationYear: userData.graduationYear || null,
    residenceType: userData.residenceType || null,
    interests: userData.interests || [],
    communityIdentities: userData.communityIdentities || {},
    majorSpace: null,
    homeSpace: null,
    communitySpaces: [],
  };

  // Fetch major space if exists
  if (userData.majorSpaceId) {
    const majorSpaceRef = dbAdmin.collection('spaces').doc(userData.majorSpaceId);
    const majorSpaceDoc = await majorSpaceRef.get();
    if (majorSpaceDoc.exists) {
      const majorSpaceData = majorSpaceDoc.data();
      identity.majorSpace = {
        id: userData.majorSpaceId,
        name: majorSpaceData?.name || userData.major,
        majorName: majorSpaceData?.majorName || userData.major,
        isUnlocked: majorSpaceData?.isUnlocked || false,
        // Never expose unlockThreshold to client
      };
    }
  } else if (userData.major) {
    // Try to find major space by majorName
    const majorSpacesSnapshot = await dbAdmin
      .collection('spaces')
      .where('campusId', '==', campusId)
      .where('identityType', '==', 'major')
      .where('majorName', '==', userData.major)
      .limit(1)
      .get();

    if (!majorSpacesSnapshot.empty) {
      const majorSpaceDoc = majorSpacesSnapshot.docs[0];
      const majorSpaceData = majorSpaceDoc?.data();
      if (majorSpaceDoc && majorSpaceData) {
        identity.majorSpace = {
          id: majorSpaceDoc.id,
          name: majorSpaceData.name || userData.major,
          majorName: majorSpaceData.majorName || userData.major,
          isUnlocked: majorSpaceData.isUnlocked || false,
        };
      }
    }
  }

  // Fetch home space if exists
  if (userData.homeSpaceId) {
    const homeSpaceRef = dbAdmin.collection('spaces').doc(userData.homeSpaceId);
    const homeSpaceDoc = await homeSpaceRef.get();
    if (homeSpaceDoc.exists) {
      const homeSpaceData = homeSpaceDoc.data();
      identity.homeSpace = {
        id: userData.homeSpaceId,
        name: homeSpaceData?.name || 'Home',
      };
    }
  }

  // Fetch community spaces
  const communitySpaceIds = userData.communitySpaceIds || [];

  if (communitySpaceIds.length > 0) {
    for (const spaceId of communitySpaceIds) {
      const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
      const spaceDoc = await spaceRef.get();
      if (spaceDoc.exists) {
        const spaceData = spaceDoc.data();
        identity.communitySpaces.push({
          id: spaceId,
          name: spaceData?.name || 'Community',
          communityType: spaceData?.communityType || null,
        });
      }
    }
  }

  logger.info('Identity fetched successfully', {
    component: 'identity-api',
    userId,
  });

  return respond.success({ identity });
});
