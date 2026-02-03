import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { getCampusId as getCampusIdFromRequest, getDefaultCampusId, getCampusFromEmail } from '@/lib/campus-context';
import { getCurrentUser } from '@/lib/server-auth';

/**
 * GET /api/spaces/residential
 *
 * Returns residential spaces for a campus (for entry flow dropdown).
 * This is semi-public data for the entry form - users may be authenticated
 * or in the process of onboarding.
 *
 * SECURITY: campusId is derived from authenticated user session when available,
 * falls back to default for unauthenticated onboarding users.
 */
export async function GET(request: NextRequest) {
  // SECURITY: Get campusId from authenticated user session, not query params
  // Falls back to default for users in onboarding flow who may not be fully authenticated
  let campusId: string;
  try {
    campusId = await getCampusIdFromRequest(request);
  } catch {
    // For unauthenticated users in onboarding, try to get from bearer token or use default
    const user = await getCurrentUser(request);
    if (user?.email) {
      try {
        campusId = getCampusFromEmail(user.email);
      } catch {
        campusId = getDefaultCampusId();
      }
    } else {
      campusId = getDefaultCampusId();
    }
  }

  // Dev mode - return mock data if Firebase not configured
  if (!isFirebaseConfigured) {
    logger.warn('DEV MODE: Returning mock residential spaces', {
      component: 'spaces/residential',
      campusId,
    });

    return NextResponse.json({
      success: true,
      spaces: [
        { id: 'ellicott-complex', name: 'Ellicott Complex', memberCount: 245 },
        { id: 'governors-complex', name: 'Governors Complex', memberCount: 189 },
        { id: 'greiner-hall', name: 'Greiner Hall', memberCount: 156 },
        { id: 'south-lake-village', name: 'South Lake Village', memberCount: 312 },
        { id: 'flint-village', name: 'Flint Village', memberCount: 98 },
        { id: 'hadley-village', name: 'Hadley Village', memberCount: 76 },
        { id: 'creekside-village', name: 'Creekside Village', memberCount: 124 },
        { id: 'clement-hall', name: 'Clement Hall', memberCount: 87 },
      ],
    });
  }

  try {
    // Query spaces where category = 'residential'
    const spacesSnapshot = await dbAdmin
      .collection('spaces')
      .where('campusId', '==', campusId)
      .where('category', '==', 'residential')
      .where('isActive', '==', true)
      .orderBy('name', 'asc')
      .get();

    const spaces = spacesSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name as string,
      memberCount: (doc.data().memberCount as number) || 0,
    }));

    return NextResponse.json({
      success: true,
      spaces,
    });
  } catch (error) {
    logger.error('Failed to fetch residential spaces', {
      error: error instanceof Error ? error.message : String(error),
      component: 'spaces/residential',
      campusId,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to fetch residential spaces' },
      { status: 500 }
    );
  }
}
