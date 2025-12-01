import { NextResponse, NextRequest } from 'next/server';
import { getServerSpaceRepository } from '@hive/core/server';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';

/**
 * Resolve a space slug to its ID using the DDD repository
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json(
      { error: 'Slug parameter is required' },
      { status: 400 }
    );
  }

  try {
    const spaceRepo = getServerSpaceRepository();

    // First try to resolve as a slug
    const slugResult = await spaceRepo.findBySlug(slug, CURRENT_CAMPUS_ID);

    if (slugResult.isSuccess) {
      const space = slugResult.getValue();
      return NextResponse.json({
        spaceId: space.spaceId.value,
        slug: space.slug?.value || slug,
        found: true
      });
    }

    // If no slug match, try to resolve as legacy space ID
    // This handles the case where old URLs with IDs are redirected here
    const idResult = await spaceRepo.findById(slug);

    if (idResult.isSuccess) {
      const space = idResult.getValue();
      // Verify campus isolation
      if (space.campusId.id === CURRENT_CAMPUS_ID) {
        return NextResponse.json({
          spaceId: space.spaceId.value,
          slug: space.slug?.value || slug,
          found: true,
          isLegacyId: true
        });
      }
    }

    // Space not found
    return NextResponse.json(
      {
        error: 'Space not found',
        slug: slug,
        found: false
      },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error resolving space slug:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle legacy space ID redirects too
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return GET(request, { params });
}
