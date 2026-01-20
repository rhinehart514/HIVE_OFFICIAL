/**
 * Campus Buildings API
 *
 * GET /api/campus/buildings - Get all campus buildings
 *
 * Query params:
 * - type: Filter by building type (library, academic, student-center, etc.)
 * - goodForStudying: Filter to only buildings good for studying
 * - openNow: Filter to only currently open buildings
 * - lat, lng: User location for distance calculation
 * - sortBy: 'name' | 'distance' | 'study-spaces' (default: 'name')
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  type Building,
  type BuildingType,
  getBuildingStatus,
  isBuildingOpen,
  UB_BUILDINGS,
} from '@hive/core';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query params
    const type = searchParams.get('type') as BuildingType | null;
    const goodForStudying = searchParams.get('goodForStudying') === 'true';
    const openNow = searchParams.get('openNow') === 'true';
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
    const sortBy = (searchParams.get('sortBy') || 'name') as 'name' | 'distance' | 'study-spaces';

    // Start with all buildings
    let buildings = [...UB_BUILDINGS];

    // Apply filters
    if (type) {
      buildings = buildings.filter((b) => b.type === type);
    }

    if (goodForStudying) {
      buildings = buildings.filter((b) => b.goodForStudying);
    }

    if (openNow) {
      buildings = buildings.filter((b) => isBuildingOpen(b));
    }

    // Get user location if provided
    const userLocation = lat && lng ? { latitude: lat, longitude: lng } : undefined;

    // Get full status for each building
    const buildingsWithStatus = buildings.map((building) => {
      const status = getBuildingStatus(building, userLocation);
      return {
        ...building,
        isOpen: status.isOpen,
        minutesUntilClose: status.minutesUntilClose,
        nextOpenTime: status.nextOpenTime,
        walkingTime: status.walkingTime,
        distanceMeters: status.distanceMeters,
        availableStudySpaceCount: status.availableStudySpaces.length,
      };
    });

    // Sort
    switch (sortBy) {
      case 'distance':
        if (userLocation) {
          buildingsWithStatus.sort((a, b) => (a.distanceMeters || 9999) - (b.distanceMeters || 9999));
        }
        break;
      case 'study-spaces':
        buildingsWithStatus.sort((a, b) => b.availableStudySpaceCount - a.availableStudySpaceCount);
        break;
      case 'name':
      default:
        buildingsWithStatus.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Summary stats
    const stats = {
      total: buildingsWithStatus.length,
      openNow: buildingsWithStatus.filter((b) => b.isOpen).length,
      withStudySpaces: buildingsWithStatus.filter((b) => b.studySpaces.length > 0).length,
      totalStudySpaces: buildingsWithStatus.reduce((sum, b) => sum + b.studySpaces.length, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        buildings: buildingsWithStatus,
        stats,
        filters: {
          type,
          goodForStudying,
          openNow,
          sortBy,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch buildings' },
      { status: 500 }
    );
  }
}
