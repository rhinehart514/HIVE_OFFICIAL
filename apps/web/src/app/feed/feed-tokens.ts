/**
 * Feed Design Tokens
 *
 * Visual hierarchy and density configuration for the Feed surface.
 * These tokens ensure consistent treatment across all feed sections.
 */

// ============================================
// VISUAL HIERARCHY
// ============================================

export type FeedPriority = 'primary' | 'secondary' | 'tertiary';

interface HierarchyConfig {
  background: string;
  border: string;
  title: string;
  cardBg: string;
  cardBorder: string;
  cardHover: string;
}

/**
 * Visual hierarchy tokens for feed sections.
 *
 * Primary: TODAY section - highest prominence, user's attention first
 * Secondary: YOUR SPACES, THIS WEEK - standard prominence
 * Tertiary: DISCOVER, CREATIONS - lower prominence, supportive
 */
export const FEED_HIERARCHY: Record<FeedPriority, HierarchyConfig> = {
  primary: {
    // TODAY section - highest prominence
    background: 'bg-white/[0.06]',
    border: 'border-white/[0.12]',
    title: 'text-title font-semibold text-white',
    cardBg: 'bg-white/[0.06]',
    cardBorder: 'border-white/[0.06]',
    cardHover: 'hover:bg-white/[0.06]',
  },
  secondary: {
    // YOUR SPACES, THIS WEEK - standard prominence
    background: 'bg-white/[0.06]',
    border: 'border-white/[0.06]',
    title: 'text-body-lg font-medium text-white/90',
    cardBg: 'bg-white/[0.06]',
    cardBorder: 'border-white/[0.06]',
    cardHover: 'hover:bg-white/[0.06]',
  },
  tertiary: {
    // DISCOVER, CREATIONS - lower prominence
    background: 'bg-transparent',
    border: 'border-white/[0.06]',
    title: 'text-body font-medium text-white/70',
    cardBg: 'bg-white/[0.06]',
    cardBorder: 'border-white/[0.06]',
    cardHover: 'hover:bg-white/[0.06]',
  },
};

// ============================================
// DENSITY MODES
// ============================================

export type FeedDensity = 'compact' | 'comfortable' | 'spacious';

interface DensityConfig {
  sectionGap: string;
  cardPadding: string;
  cardGap: string;
  maxItems: {
    spaces: number;
    activity: number;
    events: number;
    tools: number;
    discover: number;
  };
  tiltIntensity: number;
}

/**
 * Density configuration for feed layout.
 *
 * Compact: More information, less whitespace
 * Comfortable: Balanced (default)
 * Spacious: Fewer items, more breathing room
 */
export const FEED_DENSITY: Record<FeedDensity, DensityConfig> = {
  compact: {
    sectionGap: 'gap-6',
    cardPadding: 'p-3',
    cardGap: 'gap-2',
    maxItems: {
      spaces: 4,
      activity: 10,
      events: 6,
      tools: 4,
      discover: 3,
    },
    tiltIntensity: 3,
  },
  comfortable: {
    sectionGap: 'gap-8',
    cardPadding: 'p-4',
    cardGap: 'gap-3',
    maxItems: {
      spaces: 3,
      activity: 8,
      events: 4,
      tools: 3,
      discover: 2,
    },
    tiltIntensity: 5,
  },
  spacious: {
    sectionGap: 'gap-10',
    cardPadding: 'p-5',
    cardGap: 'gap-4',
    maxItems: {
      spaces: 2,
      activity: 6,
      events: 3,
      tools: 2,
      discover: 2,
    },
    tiltIntensity: 6,
  },
};

// ============================================
// SECTION PRIORITY MAPPING
// ============================================

export type FeedSection =
  | 'today'
  | 'spaces'
  | 'activity'
  | 'events'
  | 'creations'
  | 'discover';

/**
 * Maps each feed section to its visual priority level.
 */
export const SECTION_PRIORITY: Record<FeedSection, FeedPriority> = {
  today: 'primary',
  spaces: 'secondary',
  activity: 'secondary',
  events: 'secondary',
  creations: 'tertiary',
  discover: 'tertiary',
};

// ============================================
// MOTION DELAYS
// ============================================

/**
 * Stagger delays for section animations (in seconds).
 */
export const SECTION_DELAYS: Record<FeedSection, number> = {
  today: 0.1,
  spaces: 0.2,
  activity: 0.25,
  events: 0.3,
  creations: 0.4,
  discover: 0.5,
};

// ============================================
// HELPERS
// ============================================

/**
 * Get hierarchy config for a section.
 */
export function getSectionHierarchy(section: FeedSection): HierarchyConfig {
  return FEED_HIERARCHY[SECTION_PRIORITY[section]];
}

/**
 * Get animation delay for a section.
 */
export function getSectionDelay(section: FeedSection): number {
  return SECTION_DELAYS[section];
}

/**
 * Get max items for a section based on density.
 */
export function getMaxItems(
  section: 'spaces' | 'activity' | 'events' | 'tools' | 'discover',
  density: FeedDensity
): number {
  return FEED_DENSITY[density].maxItems[section];
}
