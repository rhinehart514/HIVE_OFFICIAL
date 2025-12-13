/**
 * Space Category Constants
 *
 * Single source of truth for HIVE's 4 space categories.
 * Maps between database values, CampusLabs branches, and UI labels.
 */

/**
 * The 4 canonical database category values
 * These are stored in Firestore and used in all API contracts
 */
export const SPACE_CATEGORIES = {
  STUDENT_ORG: 'student_org',
  UNIVERSITY_ORG: 'university_org',
  GREEK_LIFE: 'greek_life',
  RESIDENTIAL: 'residential',
} as const;

export type SpaceCategoryValue = typeof SPACE_CATEGORIES[keyof typeof SPACE_CATEGORIES];

/**
 * CampusLabs branch IDs to HIVE category mapping
 */
export const CAMPUSLABS_BRANCH_TO_CATEGORY: Record<number, SpaceCategoryValue> = {
  1419: SPACE_CATEGORIES.STUDENT_ORG,
  360210: SPACE_CATEGORIES.UNIVERSITY_ORG,
  360211: SPACE_CATEGORIES.GREEK_LIFE,
  360212: SPACE_CATEGORIES.RESIDENTIAL,
};

/**
 * Category metadata for UI display
 */
export const SPACE_CATEGORY_META: Record<SpaceCategoryValue, {
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  [SPACE_CATEGORIES.STUDENT_ORG]: {
    label: 'Student Organization',
    shortLabel: 'Student Org',
    description: 'Student-run clubs, societies, and interest groups',
    icon: '👥',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  [SPACE_CATEGORIES.UNIVERSITY_ORG]: {
    label: 'University Organization',
    shortLabel: 'University Org',
    description: 'Official university departments, services, and programs',
    icon: '🎓',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  [SPACE_CATEGORIES.GREEK_LIFE]: {
    label: 'Greek Life',
    shortLabel: 'Greek Life',
    description: 'Fraternities, sororities, and Greek councils',
    icon: '🏛️',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  [SPACE_CATEGORIES.RESIDENTIAL]: {
    label: 'Residential',
    shortLabel: 'Residential',
    description: 'Residence halls, dorms, and housing communities',
    icon: '🏠',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
};

/**
 * Legacy category name mapping
 * Used for backwards compatibility with old data and admin UI
 */
export const LEGACY_CATEGORY_MAP: Record<string, SpaceCategoryValue> = {
  // Admin UI names (with _spaces suffix)
  'university_spaces': SPACE_CATEGORIES.UNIVERSITY_ORG,
  'residential_spaces': SPACE_CATEGORIES.RESIDENTIAL,
  'greek_life_spaces': SPACE_CATEGORIES.GREEK_LIFE,
  'student_spaces': SPACE_CATEGORIES.STUDENT_ORG,

  // Old seed route names
  'student_organizations': SPACE_CATEGORIES.STUDENT_ORG,
  'university_organizations': SPACE_CATEGORIES.UNIVERSITY_ORG,
  'campus_living': SPACE_CATEGORIES.RESIDENTIAL,
  'fraternity_and_sorority': SPACE_CATEGORIES.GREEK_LIFE,

  // Old domain categories
  'club': SPACE_CATEGORIES.STUDENT_ORG,
  'dorm': SPACE_CATEGORIES.RESIDENTIAL,
  'academic': SPACE_CATEGORIES.UNIVERSITY_ORG,
  'social': SPACE_CATEGORIES.STUDENT_ORG,
  'general': SPACE_CATEGORIES.STUDENT_ORG,
  'study-group': SPACE_CATEGORIES.STUDENT_ORG,
  'event': SPACE_CATEGORIES.STUDENT_ORG,
  'resource': SPACE_CATEGORIES.UNIVERSITY_ORG,
  'sports': SPACE_CATEGORIES.STUDENT_ORG,
};

/**
 * Normalize any category string to the canonical value
 */
export function normalizeCategory(input: string): SpaceCategoryValue {
  // Already canonical
  if (Object.values(SPACE_CATEGORIES).includes(input as SpaceCategoryValue)) {
    return input as SpaceCategoryValue;
  }

  // Legacy mapping
  if (input in LEGACY_CATEGORY_MAP) {
    return LEGACY_CATEGORY_MAP[input]!;
  }

  // Default
  return SPACE_CATEGORIES.STUDENT_ORG;
}

/**
 * Get all category values
 */
export function getAllCategories(): SpaceCategoryValue[] {
  return Object.values(SPACE_CATEGORIES);
}

/**
 * Check if a string is a valid category
 */
export function isValidCategory(value: string): value is SpaceCategoryValue {
  return Object.values(SPACE_CATEGORIES).includes(value as SpaceCategoryValue);
}
