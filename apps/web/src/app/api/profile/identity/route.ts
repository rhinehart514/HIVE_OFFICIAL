import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import { logger } from '@/lib/logger';
import { enforceRateLimit } from '@/lib/secure-rate-limiter';

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

export async function GET(request: NextRequest) {
  // Rate limit
  const rateLimitResult = await enforceRateLimit('standard', request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: rateLimitResult.error || 'Too many requests',
      },
      { status: rateLimitResult.status }
    );
  }

  const session = await getSession(request);
  if (!session?.userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userId = session.userId;
  const campusId = session.campusId || 'ub-buffalo';

  if (!isFirebaseConfigured) {
    return NextResponse.json(
      { success: false, error: 'Service unavailable' },
      { status: 503 }
    );
  }

  try {
    // Fetch user profile
    const userRef = dbAdmin.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User data not found' },
        { status: 404 }
      );
    }

    // Basic identity data
    const identity: any = {
      major: userData.major || null,
      graduationYear: userData.graduationYear || null,
      residenceType: userData.residenceType || null,
      interests: userData.interests || [],
      communityIdentities: userData.communityIdentities || {},
    };

    // Fetch major space if exists
    let majorSpace: any = null;
    if (userData.majorSpaceId) {
      const majorSpaceRef = dbAdmin.collection('spaces').doc(userData.majorSpaceId);
      const majorSpaceDoc = await majorSpaceRef.get();
      if (majorSpaceDoc.exists) {
        const majorSpaceData = majorSpaceDoc.data();
        majorSpace = {
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
          majorSpace = {
            id: majorSpaceDoc.id,
            name: majorSpaceData.name || userData.major,
            majorName: majorSpaceData.majorName || userData.major,
            isUnlocked: majorSpaceData.isUnlocked || false,
          };
        }
      }
    }

    identity.majorSpace = majorSpace;

    // Fetch home space if exists
    let homeSpace: any = null;
    if (userData.homeSpaceId) {
      const homeSpaceRef = dbAdmin.collection('spaces').doc(userData.homeSpaceId);
      const homeSpaceDoc = await homeSpaceRef.get();
      if (homeSpaceDoc.exists) {
        const homeSpaceData = homeSpaceDoc.data();
        homeSpace = {
          id: userData.homeSpaceId,
          name: homeSpaceData?.name || 'Home',
        };
      }
    }

    identity.homeSpace = homeSpace;

    // Fetch community spaces
    const communitySpaces: any[] = [];
    const communitySpaceIds = userData.communitySpaceIds || [];

    if (communitySpaceIds.length > 0) {
      for (const spaceId of communitySpaceIds) {
        const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
        const spaceDoc = await spaceRef.get();
        if (spaceDoc.exists) {
          const spaceData = spaceDoc.data();
          communitySpaces.push({
            id: spaceId,
            name: spaceData?.name || 'Community',
            communityType: spaceData?.communityType || null,
          });
        }
      }
    }

    identity.communitySpaces = communitySpaces;

    logger.info('Identity fetched successfully', {
      component: 'identity-api',
      userId,
    });

    return NextResponse.json({
      success: true,
      identity,
    });
  } catch (error) {
    logger.error('Failed to fetch identity', {
      error: { error: error instanceof Error ? error.message : String(error) },
      component: 'identity-api',
      userId,
    });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch identity' },
      { status: 500 }
    );
  }
}
