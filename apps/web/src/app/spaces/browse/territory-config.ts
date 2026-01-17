/**
 * Territory Config - Category-Specific Discovery Atmospheres
 *
 * Each category is a TERRITORY with distinct:
 * - Rhythm/timing (fast vs slow springs)
 * - Visual energy (snappy vs breathing)
 * - Ambient gradient accent
 *
 * Cards ARE the atmosphere now. No floating fragments.
 *
 * @version 5.0.0 - Expanded 8-category system (Jan 2026)
 */

// ============================================
// TYPES
// ============================================

export type CategoryKey =
  | 'all'           // Everything
  | 'academics'     // Study groups, major-specific
  | 'social'        // Greek life, social clubs
  | 'professional'  // Career, networking
  | 'interests'     // Hobbies, sports, gaming
  | 'cultural'      // Cultural orgs, identity
  | 'service'       // Volunteer, community
  | 'official';     // University-run

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
  /** Icon for category (emoji or component key) */
  icon?: string;
}

// ============================================
// TERRITORY: ALL
// Dense constellation, fast rhythm, everything
// ============================================

const ALL_TERRITORY: TerritoryConfig = {
  name: 'Trending',
  tagline: 'What\'s buzzing right now',
  staggerMs: 80,
  baseDelayMs: 200,
  springStiffness: 500,
  springDamping: 30,
  icon: '🔥',
};

// ============================================
// TERRITORY: ACADEMICS
// Study groups, major-specific, research
// ============================================

const ACADEMICS_TERRITORY: TerritoryConfig = {
  name: 'Academics',
  tagline: 'Study groups & major communities',
  staggerMs: 120,
  baseDelayMs: 250,
  springStiffness: 450,
  springDamping: 32,
  gradientAccent: 'rgba(59,130,246,0.02)', // Blue tint
  icon: '📚',
};

// ============================================
// TERRITORY: SOCIAL
// Greek life, social clubs, party culture
// ============================================

const SOCIAL_TERRITORY: TerritoryConfig = {
  name: 'Social',
  tagline: 'Greek life & social scenes',
  staggerMs: 100,
  baseDelayMs: 200,
  springStiffness: 480,
  springDamping: 28,
  gradientAccent: 'rgba(255,215,0,0.015)', // Gold tint
  icon: '🎉',
};

// ============================================
// TERRITORY: PROFESSIONAL
// Career, networking, business clubs
// ============================================

const PROFESSIONAL_TERRITORY: TerritoryConfig = {
  name: 'Professional',
  tagline: 'Career growth & networking',
  staggerMs: 140,
  baseDelayMs: 280,
  springStiffness: 420,
  springDamping: 34,
  gradientAccent: 'rgba(34,197,94,0.015)', // Green tint
  icon: '💼',
};

// ============================================
// TERRITORY: INTERESTS
// Hobbies, sports, gaming, arts
// ============================================

const INTERESTS_TERRITORY: TerritoryConfig = {
  name: 'Interests',
  tagline: 'Hobbies, sports & gaming',
  staggerMs: 60, // Fast, energetic
  baseDelayMs: 150,
  springStiffness: 550,
  springDamping: 26,
  gradientAccent: 'rgba(168,85,247,0.015)', // Purple tint
  icon: '🎮',
};

// ============================================
// TERRITORY: CULTURAL
// Cultural orgs, identity groups, heritage
// ============================================

const CULTURAL_TERRITORY: TerritoryConfig = {
  name: 'Cultural',
  tagline: 'Heritage & identity communities',
  staggerMs: 130,
  baseDelayMs: 260,
  springStiffness: 430,
  springDamping: 33,
  gradientAccent: 'rgba(251,146,60,0.015)', // Orange tint
  icon: '🌍',
};

// ============================================
// TERRITORY: SERVICE
// Volunteer, community service, philanthropy
// ============================================

const SERVICE_TERRITORY: TerritoryConfig = {
  name: 'Service',
  tagline: 'Giving back & making impact',
  staggerMs: 150,
  baseDelayMs: 300,
  springStiffness: 400,
  springDamping: 35,
  gradientAccent: 'rgba(236,72,153,0.015)', // Pink tint
  icon: '🤝',
};

// ============================================
// TERRITORY: OFFICIAL
// University-run, departments, admin
// ============================================

const OFFICIAL_TERRITORY: TerritoryConfig = {
  name: 'Official',
  tagline: 'University channels & resources',
  staggerMs: 160,
  baseDelayMs: 320,
  springStiffness: 380,
  springDamping: 36,
  gradientAccent: 'rgba(255,255,255,0.02)',
  icon: '🏛️',
};

// ============================================
// EXPORTS
// ============================================

export const TERRITORIES: Record<CategoryKey, TerritoryConfig> = {
  all: ALL_TERRITORY,
  academics: ACADEMICS_TERRITORY,
  social: SOCIAL_TERRITORY,
  professional: PROFESSIONAL_TERRITORY,
  interests: INTERESTS_TERRITORY,
  cultural: CULTURAL_TERRITORY,
  service: SERVICE_TERRITORY,
  official: OFFICIAL_TERRITORY,
};

export function getTerritory(category: CategoryKey): TerritoryConfig {
  return TERRITORIES[category] || ALL_TERRITORY;
}

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  all: 'Trending',
  academics: 'Academics',
  social: 'Social',
  professional: 'Professional',
  interests: 'Interests',
  cultural: 'Cultural',
  service: 'Service',
  official: 'Official',
};

// Category icons for use in UI
export const CATEGORY_ICONS: Record<CategoryKey, string> = {
  all: '🔥',
  academics: '📚',
  social: '🎉',
  professional: '💼',
  interests: '🎮',
  cultural: '🌍',
  service: '🤝',
  official: '🏛️',
};
