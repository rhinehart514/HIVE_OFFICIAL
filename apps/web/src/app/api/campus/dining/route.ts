/**
 * Campus Dining API
 *
 * GET /api/campus/dining - List all dining locations with status
 *
 * Query params:
 * - type: Filter by location type (dining-hall, cafe, etc.)
 * - dietary: Filter by dietary options (vegetarian, vegan, halal, etc.)
 * - openNow: If true, only return currently open locations
 * - sortBy: Sort by 'name', 'distance', 'closing-soon' (requires lat/lng for distance)
 * - lat, lng: User coordinates for distance calculation
 *
 * SECURITY: campusId is derived from authenticated user session, not query params
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';
import { getCampusId as getCampusIdFromRequest, getDefaultCampusId } from '@/lib/campus-context';
import { getCurrentUser } from '@/lib/middleware/auth';
import {
  type DiningLocation,
  type DiningLocationStatus,
  isDiningLocationOpen,
  getMinutesUntilClose,
  getCurrentMealPeriod,
  calculateDistance,
  estimateWalkingTime,
} from '@hive/core';

// Query param schema - campusId removed for security
const DiningQuerySchema = z.object({
  type: z.enum(['dining-hall', 'food-court', 'cafe', 'restaurant', 'convenience', 'food-truck']).optional(),
  dietary: z.string().optional(), // Comma-separated list
  openNow: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'distance', 'closing-soon']).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

interface DiningWithDistance extends DiningLocationStatus {
  walkingTime?: number;
  distanceMeters?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query params
    const params = DiningQuerySchema.parse({
      type: searchParams.get('type') || undefined,
      dietary: searchParams.get('dietary') || undefined,
      openNow: searchParams.get('openNow') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      lat: searchParams.get('lat') || undefined,
      lng: searchParams.get('lng') || undefined,
    });

    // SECURITY: Get campusId from authenticated user session, not query params
    // Falls back to default for unauthenticated users (dining info is semi-public)
    let campusId: string;
    try {
      campusId = await getCampusIdFromRequest(request);
    } catch {
      // For unauthenticated users viewing dining info, use default campus
      const user = await getCurrentUser(request);
      if (user?.email) {
        const { getCampusFromEmail } = await import('@/lib/campus-context');
        try {
          campusId = getCampusFromEmail(user.email);
        } catch {
          campusId = getDefaultCampusId();
        }
      } else {
        campusId = getDefaultCampusId();
      }
    }

    // Fetch all dining locations for campus
    const diningRef = dbAdmin.collection(`campusData/${campusId}/dining`);
    let query = diningRef.where('isActive', '==', true);

    // Apply type filter at query level if specified
    if (params.type) {
      query = query.where('type', '==', params.type);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json(
        ApiResponseHelper.success({
          locations: [],
          meta: {
            total: 0,
            openNow: 0,
            lastUpdated: new Date().toISOString(),
          },
        })
      );
    }

    let locations: DiningLocation[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DiningLocation[];

    // Filter by dietary options (client-side filter for array contains)
    if (params.dietary) {
      const dietaryFilters = params.dietary.split(',').map(d => d.trim().toLowerCase());
      locations = locations.filter(loc =>
        dietaryFilters.every(diet =>
          loc.dietaryOptions.some(opt => opt.toLowerCase() === diet)
        )
      );
    }

    // Build status objects with computed fields
    let results: DiningWithDistance[] = locations.map(location => {
      const isOpen = isDiningLocationOpen(location);
      const minutesUntilClose = isOpen ? getMinutesUntilClose(location) : undefined;
      const currentMealPeriod = isOpen ? getCurrentMealPeriod(location) : null;

      const status: DiningWithDistance = {
        location,
        isOpen,
        currentMealPeriod: currentMealPeriod || undefined,
        minutesUntilClose: minutesUntilClose || undefined,
      };

      // Calculate distance if user coordinates provided
      if (params.lat && params.lng && location.coordinates) {
        const distanceMeters = calculateDistance(
          params.lat,
          params.lng,
          location.coordinates.latitude,
          location.coordinates.longitude
        );
        status.distanceMeters = Math.round(distanceMeters);
        status.walkingTime = estimateWalkingTime(distanceMeters);
      }

      return status;
    });

    // Filter by open now
    if (params.openNow === 'true') {
      results = results.filter(r => r.isOpen);
    }

    // Sort results
    switch (params.sortBy) {
      case 'distance':
        results.sort((a, b) => (a.distanceMeters || Infinity) - (b.distanceMeters || Infinity));
        break;
      case 'closing-soon':
        results.sort((a, b) => {
          // Open locations first, then by minutes until close
          if (a.isOpen && !b.isOpen) return -1;
          if (!a.isOpen && b.isOpen) return 1;
          if (!a.isOpen && !b.isOpen) return 0;
          return (a.minutesUntilClose || Infinity) - (b.minutesUntilClose || Infinity);
        });
        break;
      case 'name':
      default:
        results.sort((a, b) => a.location.name.localeCompare(b.location.name));
        break;
    }

    const openCount = results.filter(r => r.isOpen).length;

    logger.info('Dining locations fetched', {
      component: 'dining-api',
      total: results.length,
      openNow: openCount,
      filters: {
        type: params.type,
        dietary: params.dietary,
        openNow: params.openNow,
        sortBy: params.sortBy,
      },
    });

    return NextResponse.json(
      ApiResponseHelper.success({
        locations: results,
        meta: {
          total: results.length,
          openNow: openCount,
          lastUpdated: new Date().toISOString(),
          filters: {
            type: params.type || null,
            dietary: params.dietary?.split(',') || null,
            openNow: params.openNow === 'true',
            sortBy: params.sortBy || 'name',
          },
        },
      }),
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    logger.error('Error fetching dining locations', { component: 'dining-api' }, error instanceof Error ? error : undefined);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        ApiResponseHelper.error('Invalid query parameters', 'VALIDATION_ERROR'),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    return NextResponse.json(
      ApiResponseHelper.error('Failed to fetch dining locations', 'INTERNAL_ERROR'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
