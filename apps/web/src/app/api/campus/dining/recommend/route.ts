/**
 * Dining Recommendation API
 *
 * GET /api/campus/dining/recommend - Get a smart recommendation for where to eat
 *
 * Scoring factors:
 * 1. Must be open (required)
 * 2. Time until closing (prefer not closing soon)
 * 3. Dietary match if specified
 * 4. Walking distance if coordinates provided
 * 5. Price range preference
 * 6. Avoid high wait times during peak hours
 * 7. Random factor for variety
 *
 * Query params:
 * - dietary: Comma-separated dietary requirements
 * - lat, lng: User coordinates for distance
 * - maxWalkTime: Maximum acceptable walk time in minutes
 * - priceMax: Maximum price range (1-4)
 * - mood: 'quick', 'sit-down', 'healthy', 'comfort', 'late-night'
 *
 * SECURITY: campusId is derived from authenticated user session, not query params
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';
import { getCampusId as getCampusIdFromRequest, getDefaultCampusId, getCampusFromEmail } from '@/lib/campus-context';
import { getCurrentUser } from '@/lib/server-auth';
import {
  type DiningLocation,
  type DiningRecommendationDTO,
  isDiningLocationOpen,
  getMinutesUntilClose,
  getCurrentMealPeriod,
  calculateDistance,
  estimateWalkingTime,
} from '@hive/core';

// Query param schema - campusId removed for security
const RecommendQuerySchema = z.object({
  dietary: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  maxWalkTime: z.coerce.number().min(1).max(60).optional(),
  priceMax: z.coerce.number().min(1).max(4).optional(),
  mood: z.enum(['quick', 'sit-down', 'healthy', 'comfort', 'late-night']).optional(),
});

// Mood to location type mapping
const MOOD_TYPE_PREFERENCES: Record<string, string[]> = {
  quick: ['cafe', 'convenience', 'food-court'],
  'sit-down': ['dining-hall', 'restaurant'],
  healthy: ['dining-hall', 'cafe'], // Dining halls have salad bars
  comfort: ['dining-hall', 'restaurant', 'food-court'],
  'late-night': ['convenience'], // Hubie's etc
};

// Mood to dietary preference hints
const MOOD_DIETARY_HINTS: Record<string, string[]> = {
  healthy: ['vegetarian', 'vegan'],
};

interface ScoredLocation {
  location: DiningLocation;
  isOpen: boolean;
  minutesUntilClose?: number;
  currentMealPeriod?: ReturnType<typeof getCurrentMealPeriod>;
  walkingTime?: number;
  distanceMeters?: number;
  score: number;
  reasons: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = RecommendQuerySchema.parse({
      dietary: searchParams.get('dietary') || undefined,
      lat: searchParams.get('lat') || undefined,
      lng: searchParams.get('lng') || undefined,
      maxWalkTime: searchParams.get('maxWalkTime') || undefined,
      priceMax: searchParams.get('priceMax') || undefined,
      mood: searchParams.get('mood') || undefined,
    });

    // SECURITY: Get campusId from authenticated user session, not query params
    // Falls back to default for unauthenticated users (dining info is semi-public)
    let campusId: string;
    try {
      campusId = await getCampusIdFromRequest(request);
    } catch {
      // For unauthenticated users viewing dining recommendations, use default campus
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

    // Fetch all active dining locations
    const snapshot = await dbAdmin
      .collection(`campusData/${campusId}/dining`)
      .where('isActive', '==', true)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        ApiResponseHelper.error('No dining locations available', 'NO_DATA'),
        { status: HttpStatus.NOT_FOUND }
      );
    }

    const locations: DiningLocation[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DiningLocation[];

    // Score each location
    const scored: ScoredLocation[] = locations.map((location) => {
      const isOpen = isDiningLocationOpen(location);
      const minutesUntilClose = isOpen ? getMinutesUntilClose(location) : undefined;
      const currentMealPeriod = isOpen ? getCurrentMealPeriod(location) : null;

      let score = 0;
      const reasons: string[] = [];

      // MUST BE OPEN - disqualify if closed
      if (!isOpen) {
        return {
          location,
          isOpen: false,
          score: -1000,
          reasons: ['Currently closed'],
        };
      }

      // Base score for being open
      score += 50;
      reasons.push('Currently open');

      // Time until closing (prefer not closing soon)
      if (minutesUntilClose !== undefined && minutesUntilClose !== null) {
        if (minutesUntilClose > 120) {
          score += 30;
        } else if (minutesUntilClose > 60) {
          score += 20;
        } else if (minutesUntilClose > 30) {
          score += 10;
          reasons.push('Closing in about an hour');
        } else {
          score -= 10;
          reasons.push('Closing soon');
        }
      }

      // Dietary match
      if (params.dietary) {
        const required = params.dietary.split(',').map((d) => d.trim().toLowerCase());
        const available = location.dietaryOptions.map((d) => d.toLowerCase());
        const matches = required.filter((r) => available.includes(r));

        if (matches.length === required.length) {
          score += 40;
          reasons.push(`Has ${matches.join(', ')} options`);
        } else if (matches.length > 0) {
          score += 20;
          reasons.push(`Partial dietary match: ${matches.join(', ')}`);
        } else {
          score -= 20;
        }
      }

      // Walking distance
      let walkingTime: number | undefined;
      let distanceMeters: number | undefined;
      if (params.lat && params.lng && location.coordinates) {
        distanceMeters = calculateDistance(
          params.lat,
          params.lng,
          location.coordinates.latitude,
          location.coordinates.longitude
        );
        walkingTime = estimateWalkingTime(distanceMeters);

        // Filter by max walk time if specified
        if (params.maxWalkTime && walkingTime > params.maxWalkTime) {
          score -= 50;
          reasons.push('Too far to walk');
        } else if (walkingTime <= 5) {
          score += 30;
          reasons.push('Very close by');
        } else if (walkingTime <= 10) {
          score += 20;
          reasons.push('Short walk');
        } else if (walkingTime <= 15) {
          score += 10;
        }
      }

      // Price range
      if (params.priceMax && location.priceRange > params.priceMax) {
        score -= 15;
        reasons.push('Above price preference');
      } else if (location.priceRange === 1) {
        score += 10;
        reasons.push('Budget-friendly');
      }

      // Mood matching
      if (params.mood) {
        const preferredTypes = MOOD_TYPE_PREFERENCES[params.mood];
        if (preferredTypes?.includes(location.type)) {
          score += 25;
          reasons.push(`Good for ${params.mood} mood`);
        }

        // Check if mood suggests dietary preference
        const dietaryHints = MOOD_DIETARY_HINTS[params.mood];
        if (dietaryHints) {
          const hasHealthy = dietaryHints.some((hint) =>
            location.dietaryOptions.some((opt) => opt.toLowerCase().includes(hint))
          );
          if (hasHealthy) {
            score += 15;
          }
        }
      }

      // Wait time penalty during peak hours
      const currentHour = new Date().getHours();
      const isPeakHour = (currentHour >= 11 && currentHour <= 13) || (currentHour >= 17 && currentHour <= 19);
      if (isPeakHour && location.avgWaitTime && location.avgWaitTime > 10) {
        score -= 10;
        reasons.push('May be busy');
      }

      // Small random factor for variety (±5)
      score += Math.floor(Math.random() * 11) - 5;

      return {
        location,
        isOpen,
        minutesUntilClose: minutesUntilClose || undefined,
        currentMealPeriod: currentMealPeriod || undefined,
        walkingTime,
        distanceMeters: distanceMeters ? Math.round(distanceMeters) : undefined,
        score,
        reasons,
      };
    });

    // Filter to only open locations and sort by score
    const validOptions = scored
      .filter((s) => s.isOpen)
      .sort((a, b) => b.score - a.score);

    if (validOptions.length === 0) {
      return NextResponse.json(
        ApiResponseHelper.error('No dining locations are currently open', 'ALL_CLOSED'),
        { status: HttpStatus.NOT_FOUND }
      );
    }

    const recommended = validOptions[0];
    const alternatives = validOptions.slice(1, 4);

    // Build response
    const response: DiningRecommendationDTO = {
      recommended: {
        location: recommended.location,
        isOpen: true,
        currentMealPeriod: recommended.currentMealPeriod || undefined,
        minutesUntilClose: recommended.minutesUntilClose,
      },
      reason: recommended.reasons.slice(0, 3).join('. '),
      alternatives: alternatives.map((alt) => ({
        location: alt.location,
        isOpen: true,
        currentMealPeriod: alt.currentMealPeriod || undefined,
        minutesUntilClose: alt.minutesUntilClose,
      })),
      factors: {
        isOpen: true,
        closingSoon: (recommended.minutesUntilClose || 999) < 60,
        matchesDietary: params.dietary
          ? recommended.reasons.some((r) => r.includes('dietary') || r.includes('options'))
          : true,
        walkingTime: recommended.walkingTime,
        priceRange: recommended.location.priceRange,
      },
    };

    logger.info('Dining recommendation generated', {
      component: 'dining-recommend',
      recommended: recommended.location.name,
      score: recommended.score,
      mood: params.mood,
      validOptions: validOptions.length,
    });

    return NextResponse.json(ApiResponseHelper.success(response), {
      headers: {
        'Cache-Control': 'no-cache', // Recommendations should be fresh
      },
    });
  } catch (error) {
    logger.error('Error generating dining recommendation', { component: 'dining-recommend' }, error instanceof Error ? error : undefined);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        ApiResponseHelper.error('Invalid query parameters', 'VALIDATION_ERROR'),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    return NextResponse.json(
      ApiResponseHelper.error('Failed to generate recommendation', 'INTERNAL_ERROR'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
