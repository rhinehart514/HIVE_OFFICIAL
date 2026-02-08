/**
 * Single Dining Location API
 *
 * GET /api/campus/dining/[id] - Get a specific dining location with full details
 *
 * SECURITY: campusId is derived from authenticated user session, not query params
 */

import { type NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';
import { getCampusId as getCampusIdFromRequest, getDefaultCampusId, getCampusFromEmail } from '@/lib/campus-context';
import { getCurrentUser } from '@/lib/server-auth';
import {
  type DiningLocation,
  getDiningLocationStatus,
} from '@hive/core';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    // SECURITY: Get campusId from authenticated user session, not query params
    // Falls back to default for unauthenticated users (dining info is semi-public)
    let campusId: string;
    try {
      campusId = await getCampusIdFromRequest(request);
    } catch {
      // For unauthenticated users viewing dining info, use default campus
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

    if (!id) {
      return NextResponse.json(
        ApiResponseHelper.error('Location ID is required', 'MISSING_ID'),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Fetch the dining location
    const docRef = dbAdmin.doc(`campusData/${campusId}/dining/${id}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        ApiResponseHelper.error('Dining location not found', 'NOT_FOUND'),
        { status: HttpStatus.NOT_FOUND }
      );
    }

    const location = { id: doc.id, ...doc.data() } as DiningLocation;

    // Get full status
    const status = getDiningLocationStatus(location);

    logger.info('Dining location fetched', {
      component: 'dining-api',
      locationId: id,
      isOpen: status.isOpen,
    });

    return NextResponse.json(
      ApiResponseHelper.success(status),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    logger.error('Error fetching dining location', { component: 'dining-api' }, error instanceof Error ? error : undefined);

    return NextResponse.json(
      ApiResponseHelper.error('Failed to fetch dining location', 'INTERNAL_ERROR'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
