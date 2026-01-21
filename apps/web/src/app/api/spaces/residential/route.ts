import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

/**
 * GET /api/spaces/residential
 *
 * Returns residential spaces for a campus (for entry flow dropdown).
 * No auth required - this is public data for the entry form.
 *
 * Query params:
 *   campusId: Campus ID (default: 'ub-buffalo')
 */
export async function GET(request: NextRequest) {
  const campusId = request.nextUrl.searchParams.get('campusId') || 'ub-buffalo';

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
