/**
 * Territory Config - Category-Specific Discovery Atmospheres
 *
 * Each category is a TERRITORY with distinct:
 * - Rhythm/timing (fast vs slow springs)
 * - Visual energy (snappy vs breathing)
 * - Ambient gradient accent
 *
 * Cards ARE the atmosphere now. No floating fragments.
 */

// ============================================
// TYPES
// ============================================

export type CategoryKey = 'all' | 'student_org' | 'university_org' | 'greek_life';

export interface TerritoryConfig {
  /** Display name */
  name: string;
  /** Short description */
  tagline: string;
  /** Stagger timing between cards (ms) */
  staggerMs: number;
  /** Base delay before cards start (ms) */
  baseDelayMs: number;
  /** Spring stiffness (higher = snappier) */
  springStiffness: number;
  /** Spring damping */
  springDamping: number;
  /** Background gradient accent (subtle) */
  gradientAccent?: string;
}

// ============================================
// TERRITORY: ALL
// Dense constellation, fast rhythm, everything
// ============================================

const ALL_TERRITORY: TerritoryConfig = {
  name: 'All',
  tagline: 'Everything happening now',
  staggerMs: 80,
  baseDelayMs: 200,
  springStiffness: 500,
  springDamping: 30,
};

// ============================================
// TERRITORY: STUDENT ORGS
// Message-heavy, chaotic, club basement energy
// ============================================

const STUDENT_ORG_TERRITORY: TerritoryConfig = {
  name: 'Student Orgs',
  tagline: 'The real campus life',
  staggerMs: 60, // Faster, more chaotic
  baseDelayMs: 150,
  springStiffness: 600, // Snappier
  springDamping: 25,
};

// ============================================
// TERRITORY: UNIVERSITY
// Space-focused, slower rhythm, institutional calm
// ============================================

const UNIVERSITY_TERRITORY: TerritoryConfig = {
  name: 'University',
  tagline: 'Official channels, real value',
  staggerMs: 150, // Slower, breathing room
  baseDelayMs: 300,
  springStiffness: 400,
  springDamping: 35,
  gradientAccent: 'rgba(255,255,255,0.02)',
};

// ============================================
// TERRITORY: GREEK LIFE
// Event-driven, chapter clusters, social energy
// ============================================

const GREEK_LIFE_TERRITORY: TerritoryConfig = {
  name: 'Greek Life',
  tagline: 'Chapter life, organized',
  staggerMs: 100,
  baseDelayMs: 200,
  springStiffness: 480,
  springDamping: 28,
  gradientAccent: 'rgba(255,215,0,0.015)',
};

// ============================================
// EXPORTS
// ============================================

export const TERRITORIES: Record<CategoryKey, TerritoryConfig> = {
  all: ALL_TERRITORY,
  student_org: STUDENT_ORG_TERRITORY,
  university_org: UNIVERSITY_TERRITORY,
  greek_life: GREEK_LIFE_TERRITORY,
};

export function getTerritory(category: CategoryKey): TerritoryConfig {
  return TERRITORIES[category] || ALL_TERRITORY;
}

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  all: 'All',
  student_org: 'Student Orgs',
  university_org: 'University',
  greek_life: 'Greek Life',
};
