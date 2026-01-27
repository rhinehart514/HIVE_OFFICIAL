import { NextResponse } from 'next/server';
import { getCatalog } from '@/server/onboarding-catalog-store';

/**
 * GET /api/onboarding/catalog
 * Returns the onboarding catalog (majors, interests, year range) for a campus.
 * Query params:
 *   - campusId: optional campus identifier (defaults to 'default')
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campusId = searchParams.get('campusId') || 'default';

  const catalog = getCatalog(campusId);

  return NextResponse.json({
    success: true,
    data: catalog,
  });
}
