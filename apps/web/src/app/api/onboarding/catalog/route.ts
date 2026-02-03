import { type NextRequest, NextResponse } from 'next/server';
import { getCatalog } from '@/server/onboarding-catalog-store';
import { getCampusId as getCampusIdFromRequest, getDefaultCampusId, getCampusFromEmail } from '@/lib/campus-context';
import { getCurrentUser } from '@/lib/server-auth';

/**
 * GET /api/onboarding/catalog
 * Returns the onboarding catalog (majors, interests, year range) for a campus.
 *
 * SECURITY: campusId is derived from authenticated user session when available,
 * falls back to 'default' for users in early onboarding who may not be authenticated yet.
 */
export async function GET(request: NextRequest) {
  // SECURITY: Get campusId from authenticated user session, not query params
  // Falls back to 'default' for users in early onboarding flow
  let campusId: string;
  try {
    campusId = await getCampusIdFromRequest(request);
  } catch {
    // For unauthenticated users in early onboarding, try to get from bearer token
    const user = await getCurrentUser(request);
    if (user?.email) {
      try {
        campusId = getCampusFromEmail(user.email);
      } catch {
        campusId = 'default';
      }
    } else {
      campusId = 'default';
    }
  }

  const catalog = getCatalog(campusId);

  return NextResponse.json({
    success: true,
    data: catalog,
  });
}
