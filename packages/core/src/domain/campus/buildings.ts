/**
 * Campus Buildings Domain
 *
 * Entities and value objects for campus buildings, study spaces,
 * and location-based services. Powers the "Study Spot Finder" hero demo.
 *
 * Data source: UB campus maps and public building information
 */

import {
  type GeoLocation,
  type DayOfWeek,
  type DailyHours,
  getCurrentDayOfWeek,
  parseTimeToMinutes,
  getCurrentTimeMinutes,
  calculateDistance,
  estimateWalkingTime,
} from './dining';

// =============================================================================
// Value Objects
// =============================================================================

/** Building types */
export type BuildingType =
  | 'library'
  | 'academic'
  | 'student-center'
  | 'residence'
  | 'recreation'
  | 'dining'
  | 'administrative'
  | 'research';

/** Noise level for study spaces */
export type NoiseLevel = 'silent' | 'quiet' | 'moderate' | 'social';

/** Amenities available */
export type Amenity =
  | 'power-outlets'
  | 'wifi'
  | 'printing'
  | 'whiteboards'
  | 'reservable-rooms'
  | 'computers'
  | 'cafe'
  | 'vending'
  | 'restrooms'
  | 'accessible'
  | 'natural-light'
  | 'air-conditioning';

/** Study space types */
export type StudySpaceType =
  | 'open-seating'
  | 'quiet-zone'
  | 'group-room'
  | 'computer-lab'
  | 'reading-room'
  | 'cafe-seating'
  | 'outdoor';

// =============================================================================
// Entities
// =============================================================================

/**
 * A study space within a building
 */
export interface StudySpace {
  /** Unique identifier */
  id: string;
  /** Parent building ID */
  buildingId: string;
  /** Display name */
  name: string;
  /** Floor number or description */
  floor: string;
  /** Type of study space */
  type: StudySpaceType;
  /** Noise level */
  noiseLevel: NoiseLevel;
  /** Estimated seating capacity */
  seatingCapacity: number;
  /** Whether reservations are needed/available */
  reservable: boolean;
  /** Amenities available */
  amenities: Amenity[];
  /** Whether there are power outlets at most seats */
  hasPowerOutlets: boolean;
  /** Brief description or tips */
  description?: string;
  /** Hours if different from building */
  customHours?: DailyHours[];
  /** Image URL */
  imageUrl?: string;
  /** Popular times (0-100 busyness score by hour) */
  popularTimes?: Record<number, number>;
  /** Whether currently operational */
  isActive: boolean;
}

/**
 * A campus building
 */
export interface Building {
  /** Unique identifier */
  id: string;
  /** Campus this building belongs to */
  campusId: string;
  /** Display name */
  name: string;
  /** Common abbreviation */
  abbreviation?: string;
  /** Short description */
  description?: string;
  /** Building type */
  type: BuildingType;
  /** Street address */
  address?: string;
  /** Geographic coordinates */
  coordinates?: GeoLocation;
  /** Operating hours */
  hours: DailyHours[];
  /** Building-wide amenities */
  amenities: Amenity[];
  /** Number of floors */
  floors?: number;
  /** Study spaces within this building */
  studySpaces: StudySpace[];
  /** Whether building has good study spots */
  goodForStudying: boolean;
  /** Overall noise level (average of study spaces) */
  typicalNoiseLevel?: NoiseLevel;
  /** Image URL */
  imageUrl?: string;
  /** Whether currently operational */
  isActive: boolean;
  /** Last data update timestamp */
  lastUpdated: string;
  /** Data source */
  dataSource: 'scraped' | 'manual' | 'api';
}

/**
 * Computed status for a building at current time
 */
export interface BuildingStatus {
  building: Building;
  /** Whether building is currently open */
  isOpen: boolean;
  /** Minutes until closing if open */
  minutesUntilClose?: number;
  /** Next opening time if closed */
  nextOpenTime?: string;
  /** Study spaces that are currently available */
  availableStudySpaces: StudySpaceStatus[];
  /** Walking time from user location */
  walkingTime?: number;
  /** Distance in meters */
  distanceMeters?: number;
}

/**
 * Computed status for a study space
 */
export interface StudySpaceStatus {
  space: StudySpace;
  /** Building info */
  buildingName: string;
  buildingId: string;
  /** Whether currently available */
  isAvailable: boolean;
  /** Current busyness estimate (0-100) */
  currentBusyness?: number;
  /** Busyness description */
  busynessLabel?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a building is currently open
 */
export function isBuildingOpen(building: Building): boolean {
  const today = getCurrentDayOfWeek();
  const todayHours = building.hours.find(h => h.day === today);

  if (!todayHours || !todayHours.isOpen || !todayHours.openTime || !todayHours.closeTime) {
    return false;
  }

  const currentMinutes = getCurrentTimeMinutes();
  const openMinutes = parseTimeToMinutes(todayHours.openTime);
  const closeMinutes = parseTimeToMinutes(todayHours.closeTime);

  // Handle 24-hour buildings
  if (closeMinutes <= openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/**
 * Get minutes until building closes
 */
export function getBuildingMinutesUntilClose(building: Building): number | null {
  if (!isBuildingOpen(building)) return null;

  const today = getCurrentDayOfWeek();
  const todayHours = building.hours.find(h => h.day === today);

  if (!todayHours?.closeTime) return null;

  const currentMinutes = getCurrentTimeMinutes();
  const closeMinutes = parseTimeToMinutes(todayHours.closeTime);

  if (closeMinutes < currentMinutes) {
    return (24 * 60 - currentMinutes) + closeMinutes;
  }

  return closeMinutes - currentMinutes;
}

/**
 * Get current busyness estimate for a study space
 */
export function getCurrentBusyness(space: StudySpace): number | null {
  if (!space.popularTimes) return null;

  const currentHour = new Date().getHours();
  return space.popularTimes[currentHour] ?? null;
}

/**
 * Get busyness label from score
 */
export function getBusynessLabel(score: number): string {
  if (score < 25) return 'Usually empty';
  if (score < 50) return 'Not too busy';
  if (score < 75) return 'Moderately busy';
  return 'Very busy';
}

/**
 * Get noise level description
 */
export function getNoiseLevelDescription(level: NoiseLevel): string {
  const descriptions: Record<NoiseLevel, string> = {
    silent: 'Silent zone - no talking',
    quiet: 'Quiet - whispers only',
    moderate: 'Moderate - low conversation OK',
    social: 'Social - group work friendly',
  };
  return descriptions[level];
}

/**
 * Score a study space based on user preferences
 */
export function scoreStudySpace(
  space: StudySpace,
  preferences: {
    noisePreference?: NoiseLevel;
    needsPower?: boolean;
    needsReservable?: boolean;
    preferredType?: StudySpaceType;
  }
): number {
  let score = 50; // Base score

  // Noise level match
  if (preferences.noisePreference) {
    const noiseLevels: NoiseLevel[] = ['silent', 'quiet', 'moderate', 'social'];
    const prefIndex = noiseLevels.indexOf(preferences.noisePreference);
    const spaceIndex = noiseLevels.indexOf(space.noiseLevel);
    const diff = Math.abs(prefIndex - spaceIndex);

    if (diff === 0) score += 30;
    else if (diff === 1) score += 15;
    else score -= 10;
  }

  // Power outlets
  if (preferences.needsPower) {
    if (space.hasPowerOutlets) {
      score += 25;
    } else {
      score -= 20;
    }
  }

  // Reservable rooms
  if (preferences.needsReservable) {
    if (space.reservable) {
      score += 20;
    } else {
      score -= 15;
    }
  }

  // Space type preference
  if (preferences.preferredType && space.type === preferences.preferredType) {
    score += 15;
  }

  // Busyness penalty
  const busyness = getCurrentBusyness(space);
  if (busyness !== null) {
    if (busyness > 75) score -= 15;
    else if (busyness < 25) score += 10;
  }

  // Capacity bonus for larger spaces
  if (space.seatingCapacity > 50) score += 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Get full status for a building
 */
export function getBuildingStatus(
  building: Building,
  userLocation?: GeoLocation
): BuildingStatus {
  const isOpen = isBuildingOpen(building);
  const minutesUntilClose = isOpen ? getBuildingMinutesUntilClose(building) : undefined;

  // Calculate distance if user location provided
  let walkingTime: number | undefined;
  let distanceMeters: number | undefined;
  if (userLocation && building.coordinates) {
    distanceMeters = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      building.coordinates.latitude,
      building.coordinates.longitude
    );
    walkingTime = estimateWalkingTime(distanceMeters);
  }

  // Get available study spaces
  const availableStudySpaces: StudySpaceStatus[] = building.studySpaces
    .filter(space => space.isActive)
    .map(space => {
      const busyness = getCurrentBusyness(space);
      return {
        space,
        buildingName: building.name,
        buildingId: building.id,
        isAvailable: isOpen, // Simplified - could check individual space hours
        currentBusyness: busyness ?? undefined,
        busynessLabel: busyness !== null ? getBusynessLabel(busyness) : undefined,
      };
    });

  // Find next opening time if closed
  let nextOpenTime: string | undefined;
  if (!isOpen) {
    const today = getCurrentDayOfWeek();
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayIndex = days.indexOf(today);
    const currentMinutes = getCurrentTimeMinutes();

    const todayHours = building.hours.find(h => h.day === today);
    if (todayHours?.isOpen && todayHours.openTime) {
      const openMinutes = parseTimeToMinutes(todayHours.openTime);
      if (openMinutes > currentMinutes) {
        nextOpenTime = todayHours.openTime;
      }
    }

    if (!nextOpenTime) {
      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (todayIndex + i) % 7;
        const nextDayHours = building.hours.find(h => h.day === days[nextDayIndex]);
        if (nextDayHours?.isOpen && nextDayHours.openTime) {
          nextOpenTime = `${days[nextDayIndex]} ${nextDayHours.openTime}`;
          break;
        }
      }
    }
  }

  return {
    building,
    isOpen,
    minutesUntilClose: minutesUntilClose ?? undefined,
    nextOpenTime,
    availableStudySpaces,
    walkingTime,
    distanceMeters: distanceMeters ? Math.round(distanceMeters) : undefined,
  };
}

// =============================================================================
// DTOs
// =============================================================================

/**
 * DTO for study spot search results
 */
export interface StudySpotSearchDTO {
  spots: Array<{
    space: StudySpace;
    building: {
      id: string;
      name: string;
      abbreviation?: string;
    };
    score: number;
    isAvailable: boolean;
    walkingTime?: number;
    busyness?: number;
    busynessLabel?: string;
  }>;
  meta: {
    total: number;
    openNow: number;
    filters: {
      noiseLevel?: NoiseLevel;
      needsPower?: boolean;
      needsReservable?: boolean;
    };
  };
}

/**
 * DTO for study spot recommendation
 */
export interface StudySpotRecommendationDTO {
  recommended: {
    space: StudySpace;
    building: {
      id: string;
      name: string;
      abbreviation?: string;
    };
    score: number;
    walkingTime?: number;
  };
  reason: string;
  alternatives: Array<{
    space: StudySpace;
    building: {
      id: string;
      name: string;
    };
    score: number;
  }>;
}
