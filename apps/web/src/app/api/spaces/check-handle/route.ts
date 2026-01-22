import { NextResponse, type NextRequest } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { withAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/spaces/check-handle?handle=myhandle
 *
 * Checks if a space handle (slug) is available.
 * Returns suggestion if taken.
 *
 * DRAMA.md: This endpoint supports the dramatic handle claim moment.
 * The frontend adds the 400ms anticipation pause.
 */
export const GET = withAuthAndErrors(async (request, context, respond) => {
  const req = request as AuthenticatedRequest;
  const campusId = getCampusId(req);
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get('handle')?.toLowerCase();

  if (!handle) {
    return respond.error('Handle required', 'VALIDATION_ERROR', { status: 400 });
  }

  // Validate format
  const handleRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
  if (!handleRegex.test(handle) || handle.length < 3 || handle.length > 20) {
    return respond.error('Invalid handle format', 'VALIDATION_ERROR', { status: 400 });
  }

  try {
    // Check if handle exists as a slug within this campus
    const spaceSnapshot = await dbAdmin
      .collection('spaces')
      .where('campusId', '==', campusId)
      .where('slug', '==', handle)
      .limit(1)
      .get();

    if (spaceSnapshot.empty) {
      return respond.success({ available: true, handle });
    }

    // Handle is taken - generate suggestion
    let suggestion: string | null = null;

    // Try adding numbers
    for (let i = 1; i <= 99; i++) {
      const candidate = `${handle}${i}`;
      if (candidate.length <= 20) {
        const suggestionSnapshot = await dbAdmin
          .collection('spaces')
          .where('campusId', '==', campusId)
          .where('slug', '==', candidate)
          .limit(1)
          .get();

        if (suggestionSnapshot.empty) {
          suggestion = candidate;
          break;
        }
      }
    }

    return respond.success({
      available: false,
      handle,
      suggestion,
    });
  } catch (error) {
    console.error('Handle check error:', error);
    return respond.error('Check failed', 'INTERNAL_ERROR', { status: 500 });
  }
});
