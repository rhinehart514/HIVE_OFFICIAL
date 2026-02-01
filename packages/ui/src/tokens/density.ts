/**
 * Density Tokens
 *
 * Context-dependent spacing configurations.
 * Use these to maintain consistent density across different UI contexts.
 *
 * PHILOSOPHY:
 * - Spacious for browsing/discovery (user is scanning)
 * - Balanced for working/chat (user is engaged)
 * - Compact for dense lists/dropdowns (maximum information)
 */

export const DENSITY = {
  /**
   * Spacious - for browsing and discovery
   * User is scanning, needs breathing room
   * Use: Browse pages, landing sections, card grids
   */
  spacious: {
    padding: {
      container: 24, // space-6
      card: 24,      // space-6
      section: 32,   // space-8
    },
    gap: {
      items: 24,     // space-6
      sections: 48,  // space-12
      grid: 24,      // space-6
    },
    // Tailwind class helpers
    classes: {
      padding: 'p-6',
      paddingX: 'px-6',
      paddingY: 'py-6',
      gap: 'gap-6',
      sectionGap: 'gap-12',
    },
  },

  /**
   * Balanced - for working and engagement
   * User is engaged, comfortable density
   * Use: Chat, forms, settings, profile editing
   */
  balanced: {
    padding: {
      container: 16, // space-4
      card: 20,      // space-5
      section: 24,   // space-6
    },
    gap: {
      items: 16,     // space-4
      sections: 32,  // space-8
      grid: 16,      // space-4
    },
    // Tailwind class helpers
    classes: {
      padding: 'p-4',
      paddingX: 'px-4',
      paddingY: 'py-4',
      gap: 'gap-4',
      sectionGap: 'gap-8',
    },
  },

  /**
   * Compact - for dense information
   * Maximum content, minimum chrome
   * Use: Dropdowns, member lists, sidebar items, notifications
   */
  compact: {
    padding: {
      container: 8,  // space-2
      card: 12,      // space-3
      section: 16,   // space-4
    },
    gap: {
      items: 8,      // space-2
      sections: 16,  // space-4
      grid: 8,       // space-2
    },
    // Tailwind class helpers
    classes: {
      padding: 'p-2',
      paddingX: 'px-2',
      paddingY: 'py-2',
      gap: 'gap-2',
      sectionGap: 'gap-4',
    },
  },
} as const;

/**
 * Density level type
 */
export type DensityLevel = keyof typeof DENSITY;

/**
 * Get density config for a level
 */
export function getDensityConfig(level: DensityLevel) {
  return DENSITY[level];
}

/**
 * Get Tailwind classes for a density level
 */
export function getDensityClasses(level: DensityLevel) {
  return DENSITY[level].classes;
}

/**
 * Context-based density recommendation
 */
export const DENSITY_CONTEXTS = {
  // Spacious contexts
  browse: 'spacious',
  discover: 'spacious',
  landing: 'spacious',
  cardGrid: 'spacious',

  // Balanced contexts
  chat: 'balanced',
  form: 'balanced',
  settings: 'balanced',
  profile: 'balanced',
  feed: 'balanced',

  // Compact contexts
  dropdown: 'compact',
  sidebar: 'compact',
  memberList: 'compact',
  notification: 'compact',
  tooltip: 'compact',
} as const;

export type DensityContext = keyof typeof DENSITY_CONTEXTS;

/**
 * Get recommended density for a context
 */
export function getDensityForContext(context: DensityContext): DensityLevel {
  return DENSITY_CONTEXTS[context] as DensityLevel;
}
