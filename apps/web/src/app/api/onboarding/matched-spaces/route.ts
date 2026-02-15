import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import { matchSpacesForInterests } from '@/lib/interest-space-matcher';
import { logger } from '@/lib/logger';

const schema = z.object({
  interests: z.array(z.string()).min(1).max(10),
  major: z.string().max(100).optional(),
  housing: z.string().max(100).optional(),
  year: z.string().max(30).optional(),
});

/**
 * POST /api/onboarding/matched-spaces
 *
 * Preview endpoint — runs interest matching and returns matched spaces
 * WITHOUT joining them. Used by the frontend to show "We found N spaces for you"
 * before the user commits.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campusId = session.campusId;
    if (!campusId) {
      return NextResponse.json({ error: 'No campus context' }, { status: 400 });
    }

    if (!isFirebaseConfigured) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { interests, major: _major, housing, year } = parsed.data;

    // Fetch org spaces for this campus
    const orgSpacesSnapshot = await dbAdmin
      .collection('spaces')
      .where('campusId', '==', campusId)
      .where('category', 'in', ['student_org', 'university_org', 'greek_life'])
      .get();

    const orgSpaces = orgSpacesSnapshot.docs.map((doc) => ({
      spaceId: doc.id,
      ...doc.data(),
    }));

    // Run matching with year/housing weighting
    const scored = matchSpacesForInterests(orgSpaces, interests, 20, { year, housing });

    // Build response with space details
    const spaces = scored.map((match) => {
      const spaceData = orgSpaces.find((s) => s.spaceId === match.spaceId) as any;
      return {
        id: match.spaceId,
        name: spaceData?.name || '',
        handle: spaceData?.slug || spaceData?.handle || match.spaceId,
        description: spaceData?.description || '',
        memberCount: spaceData?.memberCount || 0,
        category: spaceData?.category || '',
        icon: spaceData?.icon || spaceData?.emoji || null,
        score: match.score,
        matchedInterests: match.matchedInterests,
        ...(spaceData?.nextEvent && {
          nextEvent: {
            title: spaceData.nextEvent.title,
            date: spaceData.nextEvent.date,
          },
        }),
      };
    });

    return NextResponse.json({
      spaces,
      totalMatched: spaces.length,
    });
  } catch (error) {
    logger.error('Matched-spaces preview failed', {
      error: { message: error instanceof Error ? error.message : String(error) },
      endpoint: '/api/onboarding/matched-spaces',
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
