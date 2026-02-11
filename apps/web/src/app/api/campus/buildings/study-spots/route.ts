/**
 * Study Spots API
 *
 * GET /api/campus/buildings/study-spots - Find study spots with smart filtering
 *
 * Query params:
 * - noiseLevel: 'silent' | 'quiet' | 'moderate' | 'social'
 * - needsPower: boolean - Filter to spots with power outlets
 * - needsReservable: boolean - Filter to reservable rooms
 * - type: StudySpaceType filter
 * - openNow: boolean - Only currently available spots
 * - lat, lng: User location for distance/time calculation
 * - sortBy: 'score' | 'distance' | 'busyness' | 'capacity' (default: 'score')
 * - limit: Max results (default: 10)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  type NoiseLevel,
  type StudySpaceType,
  getBuildingStatus,
  scoreStudySpace,
  getCurrentBusyness,
  getBusynessLabel,
  getNoiseLevelDescription,
  isBuildingOpen,
  UB_BUILDINGS,
} from '@hive/core';
import { withCache } from '../../../../../lib/cache-headers';

export const dynamic = 'force-dynamic';

interface StudySpotResult {
  space: {
    id: string;
    name: string;
    floor: string;
    type: StudySpaceType;
    noiseLevel: NoiseLevel;
    noiseLevelDescription: string;
    seatingCapacity: number;
    reservable: boolean;
    amenities: string[];
    hasPowerOutlets: boolean;
    description?: string;
    imageUrl?: string;
  };
  building: {
    id: string;
    name: string;
    abbreviation?: string;
    address?: string;
  };
  score: number;
  isAvailable: boolean;
  walkingTime?: number;
  distanceMeters?: number;
  busyness?: number;
  busynessLabel?: string;
}

async function _GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query params
    const noiseLevel = searchParams.get('noiseLevel') as NoiseLevel | null;
    const needsPower = searchParams.get('needsPower') === 'true';
    const needsReservable = searchParams.get('needsReservable') === 'true';
    const spaceType = searchParams.get('type') as StudySpaceType | null;
    const openNow = searchParams.get('openNow') !== 'false'; // Default true
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
    const sortBy = (searchParams.get('sortBy') || 'score') as 'score' | 'distance' | 'busyness' | 'capacity';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // User location if provided
    const userLocation = lat && lng ? { latitude: lat, longitude: lng } : undefined;

    // Build preferences for scoring
    const preferences = {
      noisePreference: noiseLevel || undefined,
      needsPower,
      needsReservable,
      preferredType: spaceType || undefined,
    };

    // Collect all study spots with their building info
    const allSpots: StudySpotResult[] = [];

    for (const building of UB_BUILDINGS) {
      // Skip closed buildings if openNow filter
      const buildingIsOpen = isBuildingOpen(building);
      if (openNow && !buildingIsOpen) {
        continue;
      }

      // Get building status for walking time
      const buildingStatus = getBuildingStatus(building, userLocation);

      for (const space of building.studySpaces) {
        // Skip inactive spaces
        if (!space.isActive) continue;

        // Apply filters
        if (needsPower && !space.hasPowerOutlets) continue;
        if (needsReservable && !space.reservable) continue;
        if (spaceType && space.type !== spaceType) continue;

        // Calculate score
        const score = scoreStudySpace(space, preferences);
        const busyness = getCurrentBusyness(space);

        allSpots.push({
          space: {
            id: space.id,
            name: space.name,
            floor: space.floor,
            type: space.type,
            noiseLevel: space.noiseLevel,
            noiseLevelDescription: getNoiseLevelDescription(space.noiseLevel),
            seatingCapacity: space.seatingCapacity,
            reservable: space.reservable,
            amenities: space.amenities,
            hasPowerOutlets: space.hasPowerOutlets,
            description: space.description,
            imageUrl: space.imageUrl,
          },
          building: {
            id: building.id,
            name: building.name,
            abbreviation: building.abbreviation,
            address: building.address,
          },
          score,
          isAvailable: buildingIsOpen,
          walkingTime: buildingStatus.walkingTime,
          distanceMeters: buildingStatus.distanceMeters,
          busyness: busyness ?? undefined,
          busynessLabel: busyness !== null ? getBusynessLabel(busyness) : undefined,
        });
      }
    }

    // Sort
    switch (sortBy) {
      case 'distance':
        allSpots.sort((a, b) => (a.distanceMeters || 9999) - (b.distanceMeters || 9999));
        break;
      case 'busyness':
        // Lower busyness is better
        allSpots.sort((a, b) => (a.busyness || 50) - (b.busyness || 50));
        break;
      case 'capacity':
        allSpots.sort((a, b) => b.space.seatingCapacity - a.space.seatingCapacity);
        break;
      case 'score':
      default:
        allSpots.sort((a, b) => b.score - a.score);
    }

    // Limit results
    const results = allSpots.slice(0, limit);

    // Get top recommendation
    const topRecommendation = results.length > 0 ? results[0] : null;
    let recommendationReason = '';

    if (topRecommendation) {
      const reasons: string[] = [];

      if (topRecommendation.busyness !== undefined && topRecommendation.busyness < 30) {
        reasons.push('currently not busy');
      }
      if (topRecommendation.space.hasPowerOutlets && needsPower) {
        reasons.push('has power outlets');
      }
      if (noiseLevel && topRecommendation.space.noiseLevel === noiseLevel) {
        reasons.push(`${noiseLevel} environment`);
      }
      if (topRecommendation.walkingTime && topRecommendation.walkingTime < 5) {
        reasons.push(`only ${topRecommendation.walkingTime} min walk`);
      }

      recommendationReason = reasons.length > 0
        ? `Best match: ${reasons.join(', ')}`
        : 'Best overall match for your preferences';
    }

    // Stats
    const stats = {
      total: allSpots.length,
      openNow: allSpots.filter((s) => s.isAvailable).length,
      byNoiseLevel: {
        silent: allSpots.filter((s) => s.space.noiseLevel === 'silent').length,
        quiet: allSpots.filter((s) => s.space.noiseLevel === 'quiet').length,
        moderate: allSpots.filter((s) => s.space.noiseLevel === 'moderate').length,
        social: allSpots.filter((s) => s.space.noiseLevel === 'social').length,
      },
      withPower: allSpots.filter((s) => s.space.hasPowerOutlets).length,
      reservable: allSpots.filter((s) => s.space.reservable).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        spots: results,
        recommendation: topRecommendation
          ? {
              spot: topRecommendation,
              reason: recommendationReason,
            }
          : null,
        stats,
        filters: {
          noiseLevel,
          needsPower,
          needsReservable,
          type: spaceType,
          openNow,
          sortBy,
          limit,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch study spots' },
      { status: 500 }
    );
  }
}

export const GET = withCache(_GET, 'LONG');
