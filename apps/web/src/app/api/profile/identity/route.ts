/**
 * Identity API
 *
 * GET /api/profile/identity
 * Returns consolidated identity data for the current user
 *
 * POST /api/profile/identity
 * Claims an identity space (residential, major, greek)
 *
 * Used by /spaces to display and manage identity quadrants
 */

import { z } from 'zod';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

const ClaimIdentitySchema = z.object({
  type: z.enum(['residential', 'major', 'greek']),
  spaceId: z.string().min(1),
});

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

/**
 * POST /api/profile/identity
 * Claim an identity space (residential, major, greek)
 */
export const POST = withAuthValidationAndErrors(
  ClaimIdentitySchema,
  async (request, _context, body, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!isFirebaseConfigured) {
      return respond.error('Service unavailable', 'SERVICE_UNAVAILABLE', { status: 503 });
    }

    const { type, spaceId } = body;

    // Verify the space exists and is the correct type
    const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
    const spaceDoc = await spaceRef.get();

    if (!spaceDoc.exists) {
      return respond.error('Space not found', 'RESOURCE_NOT_FOUND', { status: 404 });
    }

    const spaceData = spaceDoc.data();
    if (!spaceData) {
      return respond.error('Space data not found', 'RESOURCE_NOT_FOUND', { status: 404 });
    }

    // Verify campus isolation
    if (spaceData.campusId !== campusId) {
      return respond.error('Access denied - campus mismatch', 'FORBIDDEN', { status: 403 });
    }

    // Map identity type to space category
    const expectedCategories: Record<string, string[]> = {
      residential: ['residential', 'housing', 'dorm'],
      major: ['academics', 'major', 'department'],
      greek: ['greek', 'fraternity', 'sorority'],
    };

    const category = spaceData.category?.toLowerCase() || '';
    const isValidCategory = expectedCategories[type]?.some(c => category.includes(c));

    if (!isValidCategory && spaceData.identityType !== type) {
      return respond.error(
        `This space is not a valid ${type} identity space`,
        'INVALID_INPUT',
        { status: 400 }
      );
    }

    // Update user profile with identity claim
    const userRef = dbAdmin.collection('users').doc(userId);
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    // Set the appropriate field based on type
    switch (type) {
      case 'residential':
        updateData.homeSpaceId = spaceId;
        updateData.residenceType = spaceData.name;
        break;
      case 'major':
        updateData.majorSpaceId = spaceId;
        updateData.major = spaceData.majorName || spaceData.name;
        break;
      case 'greek': {
        // Add to community identities
        const userDoc = await userRef.get();
        const existingIdentities = userDoc.data()?.communityIdentities || {};
        updateData.communityIdentities = {
          ...existingIdentities,
          greek: spaceId,
        };
        // Also track in communitySpaceIds array
        const existingCommunitySpaces = userDoc.data()?.communitySpaceIds || [];
        if (!existingCommunitySpaces.includes(spaceId)) {
          updateData.communitySpaceIds = [...existingCommunitySpaces, spaceId];
        }
        break;
      }
    }

    await userRef.update(updateData);

    // Also add user as member of the space if not already
    const membershipQuery = await dbAdmin
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (membershipQuery.empty) {
      await dbAdmin.collection('spaceMembers').add({
        spaceId,
        userId,
        campusId,
        role: 'member',
        isActive: true,
        joinedAt: new Date().toISOString(),
        source: 'identity_claim',
      });
    }

    logger.info('Identity claimed successfully', {
      component: 'identity-api',
      userId,
      type,
      spaceId,
    });

    return respond.success({
      type,
      spaceId,
      spaceName: spaceData.name,
      message: 'Identity claimed successfully',
    });
  }
);
