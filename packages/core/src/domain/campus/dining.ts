/**
 * Campus Dining Domain
 *
 * Entities and value objects for campus dining locations, meal periods,
 * and dietary options. Powers the "What Should I Eat" hero demo.
 *
 * Data source: UB Campus Dining (scraped daily)
 */

// =============================================================================
// Value Objects
// =============================================================================

/** Days of the week */
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/** Meal period types */
export type MealPeriodType = 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'late-night' | 'all-day';

/** Dietary options/labels */
export type DietaryOption =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'halal'
  | 'kosher'
  | 'allergen-friendly'
  | 'organic'
  | 'local';

/** Location type for dining venues */
export type DiningLocationType =
  | 'dining-hall'      // All-you-can-eat buffet style
  | 'food-court'       // Multiple vendors
  | 'cafe'             // Coffee/snacks
  | 'restaurant'       // Sit-down
  | 'convenience'      // Grab-and-go
  | 'food-truck';      // Mobile

/** Payment methods accepted */
export type PaymentMethod =
  | 'meal-plan'
  | 'dining-dollars'
  | 'credit-card'
  | 'cash'
  | 'campus-cash';

// =============================================================================
// Entities
// =============================================================================

/**
 * Operating hours for a specific day
 */
export interface DailyHours {
  day: DayOfWeek;
  /** Whether open on this day */
  isOpen: boolean;
  /** Opening time in HH:MM 24hr format (e.g., "07:00") */
  openTime?: string;
  /** Closing time in HH:MM 24hr format (e.g., "21:00") */
  closeTime?: string;
  /** Special notes (e.g., "Closed for holidays") */
  note?: string;
}

/**
 * A meal period with specific hours and menu
 */
export interface MealPeriod {
  type: MealPeriodType;
  /** Start time in HH:MM format */
  startTime: string;
  /** End time in HH:MM format */
  endTime: string;
  /** Days this meal period is available */
  days: DayOfWeek[];
  /** Menu items or categories available during this period */
  menuHighlights?: string[];
}

/**
 * Geographic coordinates for location-based features
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

/**
 * A campus dining location
 */
export interface DiningLocation {
  /** Unique identifier */
  id: string;
  /** Campus this location belongs to */
  campusId: string;
  /** Display name */
  name: string;
  /** Short description */
  description?: string;
  /** Type of dining venue */
  type: DiningLocationType;
  /** Building name or address */
  building: string;
  /** Floor or specific location within building */
  floor?: string;
  /** Geographic coordinates for distance calculation */
  coordinates?: GeoLocation;
  /** Operating hours by day */
  hours: DailyHours[];
  /** Meal periods offered */
  mealPeriods: MealPeriod[];
  /** Dietary options available */
  dietaryOptions: DietaryOption[];
  /** Payment methods accepted */
  paymentMethods: PaymentMethod[];
  /** Average price range (1-4, like $-$$$$) */
  priceRange: 1 | 2 | 3 | 4;
  /** Popular menu items */
  popularItems?: string[];
  /** Average wait time in minutes during peak hours */
  avgWaitTime?: number;
  /** Seating capacity */
  seatingCapacity?: number;
  /** External website or menu link */
  websiteUrl?: string;
  /** Image URL for display */
  imageUrl?: string;
  /** Whether currently operational */
  isActive: boolean;
  /** Last data update timestamp */
  lastUpdated: string;
  /** Data source for attribution */
  dataSource: 'scraped' | 'manual' | 'api';
}

/**
 * Computed status for a dining location at current time
 */
export interface DiningLocationStatus {
  location: DiningLocation;
  /** Whether currently open */
  isOpen: boolean;
  /** Current meal period if open */
  currentMealPeriod?: MealPeriod;
  /** Next opening time if closed */
  nextOpenTime?: string;
  /** Minutes until closing if open */
  minutesUntilClose?: number;
  /** Time until next meal period starts */
  nextMealPeriod?: {
    period: MealPeriod;
    startsIn: number; // minutes
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the current day of week
 */
export function getCurrentDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get current time as minutes since midnight
 */
export function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Check if a dining location is currently open
 */
export function isDiningLocationOpen(location: DiningLocation): boolean {
  const today = getCurrentDayOfWeek();
  const todayHours = location.hours.find(h => h.day === today);

  if (!todayHours || !todayHours.isOpen || !todayHours.openTime || !todayHours.closeTime) {
    return false;
  }

  const currentMinutes = getCurrentTimeMinutes();
  const openMinutes = parseTimeToMinutes(todayHours.openTime);
  const closeMinutes = parseTimeToMinutes(todayHours.closeTime);

  // Handle locations that close after midnight
  if (closeMinutes < openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/**
 * Get minutes until a dining location closes
 */
export function getMinutesUntilClose(location: DiningLocation): number | null {
  if (!isDiningLocationOpen(location)) return null;

  const today = getCurrentDayOfWeek();
  const todayHours = location.hours.find(h => h.day === today);

  if (!todayHours?.closeTime) return null;

  const currentMinutes = getCurrentTimeMinutes();
  const closeMinutes = parseTimeToMinutes(todayHours.closeTime);

  // Handle closing after midnight
  if (closeMinutes < currentMinutes) {
    return (24 * 60 - currentMinutes) + closeMinutes;
  }

  return closeMinutes - currentMinutes;
}

/**
 * Get the current meal period for a location
 */
export function getCurrentMealPeriod(location: DiningLocation): MealPeriod | null {
  const today = getCurrentDayOfWeek();
  const currentMinutes = getCurrentTimeMinutes();

  for (const period of location.mealPeriods) {
    if (!period.days.includes(today)) continue;

    const startMinutes = parseTimeToMinutes(period.startTime);
    const endMinutes = parseTimeToMinutes(period.endTime);

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return period;
    }
  }

  return null;
}

/**
 * Calculate distance between two coordinates in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Estimate walking time in minutes based on distance
 * Assumes average walking speed of 5 km/h (83.3 m/min)
 */
export function estimateWalkingTime(distanceMeters: number): number {
  return Math.ceil(distanceMeters / 83.3);
}

/**
 * Get full status for a dining location
 */
export function getDiningLocationStatus(location: DiningLocation): DiningLocationStatus {
  const isOpen = isDiningLocationOpen(location);
  const currentMealPeriod = isOpen ? getCurrentMealPeriod(location) : null;
  const minutesUntilClose = isOpen ? (getMinutesUntilClose(location) ?? undefined) : undefined;

  // Find next opening time if closed
  let nextOpenTime: string | undefined;
  if (!isOpen) {
    const today = getCurrentDayOfWeek();
    const todayHours = location.hours.find(h => h.day === today);
    const currentMinutes = getCurrentTimeMinutes();

    // Check if it opens later today
    if (todayHours?.isOpen && todayHours.openTime) {
      const openMinutes = parseTimeToMinutes(todayHours.openTime);
      if (openMinutes > currentMinutes) {
        nextOpenTime = todayHours.openTime;
      }
    }

    // If not opening today, find next open day
    if (!nextOpenTime) {
      const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayIndex = days.indexOf(today);
      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (todayIndex + i) % 7;
        const nextDayHours = location.hours.find(h => h.day === days[nextDayIndex]);
        if (nextDayHours?.isOpen && nextDayHours.openTime) {
          nextOpenTime = `${days[nextDayIndex]} ${nextDayHours.openTime}`;
          break;
        }
      }
    }
  }

  return {
    location,
    isOpen,
    currentMealPeriod: currentMealPeriod || undefined,
    nextOpenTime,
    minutesUntilClose,
  };
}

// =============================================================================
// DTOs
// =============================================================================

/**
 * DTO for dining location list response
 */
export interface DiningLocationListDTO {
  locations: DiningLocationStatus[];
  meta: {
    total: number;
    openNow: number;
    lastUpdated: string;
  };
}

/**
 * DTO for dining recommendation
 */
export interface DiningRecommendationDTO {
  recommended: DiningLocationStatus;
  reason: string;
  alternatives: DiningLocationStatus[];
  factors: {
    isOpen: boolean;
    closingSoon: boolean;
    matchesDietary: boolean;
    walkingTime?: number;
    priceRange: number;
  };
}
