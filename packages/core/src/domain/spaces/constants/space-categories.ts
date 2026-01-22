/**
 * Space Type Constants
 *
 * Single source of truth for HIVE space types.
 * Maps between database values, CampusLabs branches, UI quadrants, and labels.
 */

/**
 * Canonical SpaceType values stored in Firestore
 * These map 1:1 with UBLinked branches + HIVE-native
 */
export const SPACE_TYPE = {
  STUDENT_ORGANIZATIONS: 'student_organizations',    // UBLinked: Student Organizations (684 clubs)
  UNIVERSITY_ORGANIZATIONS: 'university_organizations', // UBLinked: University Departments
  GREEK_LIFE: 'greek_life',                           // UBLinked: Fraternity & Sorority Life
  CAMPUS_LIVING: 'campus_living',                     // UBLinked: Campus Living Branch
  HIVE_EXCLUSIVE: 'hive_exclusive',                   // User-created on HIVE
} as const;

export type SpaceType = typeof SPACE_TYPE[keyof typeof SPACE_TYPE];

/**
 * UI Quadrants for discovery navigation
 * These are user-facing navigation categories, not database fields
 */
export const DISCOVERY_QUADRANT = {
  MAJOR: 'major',         // Profile-driven filter (user.profile.major)
  COMMUNITY: 'community', // student_organizations
  HOME: 'home',           // campus_living
  GREEK: 'greek',         // greek_life
} as const;

export type DiscoveryQuadrant = typeof DISCOVERY_QUADRANT[keyof typeof DISCOVERY_QUADRANT];

/**
 * Map SpaceType → UI Quadrant (for display)
 */
export const SPACE_TYPE_TO_QUADRANT: Partial<Record<SpaceType, DiscoveryQuadrant>> = {
  [SPACE_TYPE.STUDENT_ORGANIZATIONS]: DISCOVERY_QUADRANT.COMMUNITY,
  [SPACE_TYPE.CAMPUS_LIVING]: DISCOVERY_QUADRANT.HOME,
  [SPACE_TYPE.GREEK_LIFE]: DISCOVERY_QUADRANT.GREEK,
  // university_organizations and hive_exclusive don't map to quadrants
};

// Legacy alias for backwards compatibility
export const SPACE_CATEGORIES = SPACE_TYPE;
export type SpaceCategoryValue = SpaceType;

/**
 * CampusLabs branch IDs to HIVE SpaceType mapping
 * Source: https://buffalo.campuslabs.com/engage/organizations
 */
export const CAMPUSLABS_BRANCH_TO_TYPE: Record<number, SpaceType> = {
  1419: SPACE_TYPE.STUDENT_ORGANIZATIONS,      // Student Organizations
  360210: SPACE_TYPE.UNIVERSITY_ORGANIZATIONS, // University Departments
  360211: SPACE_TYPE.GREEK_LIFE,               // Fraternity & Sorority Life
  360212: SPACE_TYPE.CAMPUS_LIVING,            // Campus Living Branch
};

// Legacy alias
export const CAMPUSLABS_BRANCH_TO_CATEGORY = CAMPUSLABS_BRANCH_TO_TYPE;

/**
 * SpaceType metadata for UI display
 */
export const SPACE_TYPE_META: Record<SpaceType, {
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  quadrant?: DiscoveryQuadrant;
}> = {
  [SPACE_TYPE.STUDENT_ORGANIZATIONS]: {
    label: 'Student Organization',
    shortLabel: 'Student Org',
    description: 'Student-run clubs, societies, and interest groups',
    icon: '👥',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    quadrant: DISCOVERY_QUADRANT.COMMUNITY,
  },
  [SPACE_TYPE.UNIVERSITY_ORGANIZATIONS]: {
    label: 'University Organization',
    shortLabel: 'University',
    description: 'Official university departments, services, and programs',
    icon: '🎓',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  [SPACE_TYPE.GREEK_LIFE]: {
    label: 'Greek Life',
    shortLabel: 'Greek',
    description: 'Fraternities, sororities, and Greek councils',
    icon: '🏛️',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    quadrant: DISCOVERY_QUADRANT.GREEK,
  },
  [SPACE_TYPE.CAMPUS_LIVING]: {
    label: 'Campus Living',
    shortLabel: 'Home',
    description: 'Residence halls, dorms, and housing communities',
    icon: '🏠',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    quadrant: DISCOVERY_QUADRANT.HOME,
  },
  [SPACE_TYPE.HIVE_EXCLUSIVE]: {
    label: 'HIVE Exclusive',
    shortLabel: 'HIVE',
    description: 'User-created spaces native to HIVE',
    icon: '🐝',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
};

/**
 * Discovery quadrant metadata for UI
 */
export const QUADRANT_META: Record<DiscoveryQuadrant, {
  label: string;
  description: string;
  icon: string;
  filterSource: 'profile' | 'spaceType';
  profileField?: string;
  spaceTypes?: SpaceType[];
}> = {
  [DISCOVERY_QUADRANT.MAJOR]: {
    label: 'Major',
    description: 'Spaces relevant to your field of study',
    icon: '📚',
    filterSource: 'profile',
    profileField: 'major',
  },
  [DISCOVERY_QUADRANT.COMMUNITY]: {
    label: 'Community',
    description: 'Student clubs and organizations',
    icon: '👥',
    filterSource: 'spaceType',
    spaceTypes: [SPACE_TYPE.STUDENT_ORGANIZATIONS],
  },
  [DISCOVERY_QUADRANT.HOME]: {
    label: 'Home',
    description: 'Your residential community',
    icon: '🏠',
    filterSource: 'spaceType',
    spaceTypes: [SPACE_TYPE.CAMPUS_LIVING],
  },
  [DISCOVERY_QUADRANT.GREEK]: {
    label: 'Greek',
    description: 'Fraternities and sororities',
    icon: '🏛️',
    filterSource: 'spaceType',
    spaceTypes: [SPACE_TYPE.GREEK_LIFE],
  },
};

// Legacy alias
export const SPACE_CATEGORY_META = SPACE_TYPE_META;

/**
 * Legacy category name mapping
 * Used for backwards compatibility with old data
 */
export const LEGACY_CATEGORY_MAP: Record<string, SpaceCategoryValue> = {
  // Old DDD value object names (short form)
  'student_org': SPACE_TYPE.STUDENT_ORGANIZATIONS,
  'university_org': SPACE_TYPE.UNIVERSITY_ORGANIZATIONS,
  'residential': SPACE_TYPE.CAMPUS_LIVING,

  // Admin UI names (with _spaces suffix)
  'university_spaces': SPACE_TYPE.UNIVERSITY_ORGANIZATIONS,
  'residential_spaces': SPACE_TYPE.CAMPUS_LIVING,
  'greek_life_spaces': SPACE_TYPE.GREEK_LIFE,
  'student_spaces': SPACE_TYPE.STUDENT_ORGANIZATIONS,

  // Old seed route names
  'fraternity_and_sorority': SPACE_TYPE.GREEK_LIFE,

  // Old domain categories
  'club': SPACE_TYPE.STUDENT_ORGANIZATIONS,
  'dorm': SPACE_TYPE.CAMPUS_LIVING,
  'academic': SPACE_TYPE.UNIVERSITY_ORGANIZATIONS,
  'social': SPACE_TYPE.STUDENT_ORGANIZATIONS,
  'general': SPACE_TYPE.STUDENT_ORGANIZATIONS,
  'study-group': SPACE_TYPE.STUDENT_ORGANIZATIONS,
  'event': SPACE_TYPE.STUDENT_ORGANIZATIONS,
  'resource': SPACE_TYPE.UNIVERSITY_ORGANIZATIONS,
  'sports': SPACE_TYPE.STUDENT_ORGANIZATIONS,

  // Short form aliases (validation schema)
  'uni': SPACE_TYPE.UNIVERSITY_ORGANIZATIONS,
  'student': SPACE_TYPE.STUDENT_ORGANIZATIONS,
  'greek': SPACE_TYPE.GREEK_LIFE,
};

/**
 * Normalize any category string to the canonical value
 */
export function normalizeCategory(input: string): SpaceCategoryValue {
  // Already canonical
  if (Object.values(SPACE_TYPE).includes(input as SpaceCategoryValue)) {
    return input as SpaceCategoryValue;
  }

  // Legacy mapping
  if (input in LEGACY_CATEGORY_MAP) {
    return LEGACY_CATEGORY_MAP[input]!;
  }

  // Default
  return SPACE_TYPE.STUDENT_ORGANIZATIONS;
}

/**
 * Get all category values
 */
export function getAllCategories(): SpaceCategoryValue[] {
  return Object.values(SPACE_TYPE);
}

/**
 * Check if a string is a valid category
 */
export function isValidCategory(value: string): value is SpaceCategoryValue {
  return Object.values(SPACE_TYPE).includes(value as SpaceCategoryValue);
}
