/**
 * Search API v2 - Future implementation placeholder
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { getCampusFromEmail, getDefaultCampusId } from '@/lib/campus-context';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = new URL(request.url).searchParams;
  let campusId = searchParams.get('campusId');

  // Get campusId from query param, user auth, or default
  if (!campusId) {
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

  campusId = campusId.toLowerCase();

  return NextResponse.json(
    { error: 'Search API v2 is not yet implemented', campusId },
    { status: 501 }
  );
}
