/**
 * HIVE Spatial Depth System
 *
 * 2026 Design System - Everything exists in a Z-axis stack.
 * Users should feel depth, not flatness.
 *
 * Elevation Scale (6 levels):
 * - Level 0: Page backgrounds (deepest)
 * - Level 1: Cards at rest (content surfaces)
 * - Level 2: Hover states (lifted cards)
 * - Level 3: Floating UI (toolbars, dropdowns)
 * - Level 4: Modals, overlays
 * - Level 5: Celebrations (transcends all)
 */

import { cn } from './utils';

// ===== ELEVATION PRESETS =====

/**
 * Elevation level configuration
 */
export const elevationLevels = {
  0: {
    zIndex: 'z-0',
    shadow: '',
    description: 'Page backgrounds, deepest layer',
  },
  1: {
    zIndex: 'z-10',
    shadow: 'shadow-lg',
    description: 'Cards at rest, content surfaces',
  },
  2: {
    zIndex: 'z-20',
    shadow: 'shadow-xl',
    transform: '-translate-y-2',
    description: 'Hover states, lifted cards',
  },
  3: {
    zIndex: 'z-30',
    shadow: 'shadow-2xl',
    description: 'Floating UI, toolbars, dropdowns',
  },
  4: {
    zIndex: 'z-40',
    shadow: 'shadow-[0_40px_80px_rgba(0,0,0,0.4)]',
    description: 'Modals, overlays',
  },
  5: {
    zIndex: 'z-50',
    shadow: '',
    description: 'Celebrations, transcends all',
  },
} as const;

/**
 * Quick elevation class helpers
 */
export const elevation = {
  /** Level 0: Background, no elevation */
  background: 'z-0',

  /** Level 1: Cards at rest */
  rest: 'z-10 shadow-lg',

  /** Level 2: Hover state with lift */
  hover: 'z-20 shadow-xl -translate-y-2',

  /** Level 3: Floating UI */
  floating: 'z-30 shadow-2xl',

  /** Level 4: Modals */
  modal: 'z-40 shadow-[0_40px_80px_rgba(0,0,0,0.4)]',

  /** Level 5: Celebrations (no shadow, uses glow) */
  celebration: 'z-50',
} as const;

/**
 * Get elevation classes for a specific level
 */
export function getElevation(level: 0 | 1 | 2 | 3 | 4 | 5): string {
  const config = elevationLevels[level];
  const transform = 'transform' in config ? config.transform : undefined;
  return cn(config.zIndex, config.shadow, transform);
}

// ===== SHADOW PRESETS =====

/**
 * Shadow scale for manual use
 */
export const shadows = {
  /** Subtle shadow for Level 1 */
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',

  /** Default shadow for Level 1 */
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',

  /** Elevated shadow for Level 1-2 */
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',

  /** Lifted shadow for Level 2 (hover) */
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',

  /** Floating shadow for Level 3 */
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  /** Modal shadow for Level 4 */
  dramatic: '0 40px 80px rgba(0, 0, 0, 0.4)',

  /** Card hover shadow */
  cardHover: '0 24px 48px rgba(0, 0, 0, 0.3)',

  /** Deep card shadow */
  cardDeep: '0 32px 64px rgba(0, 0, 0, 0.4)',
} as const;

// ===== PERSPECTIVE PATTERNS =====

/**
 * Perspective configuration for 3D effects
 */
export const perspective = {
  /** Subtle 3D tilt for hero cards */
  hero: {
    perspective: 1000,
    rotateX: 2,
    rotateY: -2,
  },

  /** Card tilt on hover */
  card: {
    perspective: 800,
    rotateX: 1,
    rotateY: -1,
  },

  /** Dropdown emergence from depth */
  dropdown: {
    initialRotateX: -2,
    animateRotateX: 0,
  },
} as const;

/**
 * Framer Motion perspective style helper
 */
export function getPerspectiveStyle(type: keyof typeof perspective) {
  const config = perspective[type];
  if ('perspective' in config) {
    return { perspective: config.perspective };
  }
  return {};
}

/**
 * Framer Motion perspective animation for hover
 */
export function getPerspectiveHover(type: 'hero' | 'card') {
  const config = perspective[type];
  return {
    rotateX: config.rotateX,
    rotateY: config.rotateY,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 25,
    },
  };
}

// ===== DEPTH RELATIONSHIPS =====

/**
 * Visual weight distribution helpers
 * Heavier elements = lower, Lighter elements = float
 */
export const depthRelationships = {
  /** Background anchor - heaviest, stays in place */
  anchor: cn('relative', elevation.background),

  /** Content layer - primary content cards */
  content: cn('relative', elevation.rest),

  /** Interactive layer - responds to interaction */
  interactive: cn('relative transition-all duration-200'),

  /** Floating layer - toolbars, quick actions */
  floating: cn('fixed', elevation.floating),

  /** Overlay layer - modals, dialogs */
  overlay: cn('fixed inset-0', elevation.modal),
} as const;

// ===== CARD DEPTH PRESETS =====

/**
 * Complete card depth classes with hover behavior
 */
export const cardDepth = {
  /** Standard card with hover lift */
  default: cn(
    elevation.rest,
    'transition-all duration-200',
    'hover:shadow-xl hover:-translate-y-2'
  ),

  /** Interactive card with pronounced lift */
  interactive: cn(
    elevation.rest,
    'transition-all duration-200',
    'hover:shadow-[0_24px_48px_rgba(0,0,0,0.3)] hover:-translate-y-2',
    'active:shadow-xl active:-translate-y-1'
  ),

  /** Hero card with maximum lift */
  hero: cn(
    'z-10 shadow-xl',
    'transition-all duration-300',
    'hover:shadow-[0_32px_64px_rgba(0,0,0,0.4)] hover:-translate-y-3'
  ),

  /** Static card - no hover effects */
  static: elevation.rest,

  /** Floating card - always elevated */
  floating: elevation.floating,
} as const;

// ===== MODAL BACKDROP =====

/**
 * Modal backdrop presets
 */
export const backdrop = {
  /** Standard modal backdrop */
  modal: 'fixed inset-0 bg-black/60 backdrop-blur-sm',

  /** Light backdrop for sheets */
  sheet: 'fixed inset-0 bg-black/40 backdrop-blur-[4px]',

  /** Heavy backdrop for celebrations */
  celebration: 'fixed inset-0 bg-black/80 backdrop-blur-md',
} as const;

// ===== FRAMER MOTION VARIANTS =====

/**
 * Framer Motion variants for elevation transitions
 */
export const elevationVariants = {
  /** Card rest to hover */
  card: {
    rest: {
      y: 0,
      boxShadow: shadows.lg,
    },
    hover: {
      y: -8,
      boxShadow: shadows.cardHover,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 25,
      },
    },
    pressed: {
      y: -4,
      boxShadow: shadows.xl,
      transition: { duration: 0.1 },
    },
  },

  /** Floating UI emergence */
  floating: {
    initial: {
      opacity: 0,
      y: -6,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 28,
      },
    },
    exit: {
      opacity: 0,
      y: -6,
      scale: 0.98,
      transition: { duration: 0.15 },
    },
  },

  /** Modal entrance */
  modal: {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      y: 10,
      transition: { duration: 0.2 },
    },
  },
};

// ===== UTILITY FUNCTIONS =====

/**
 * Combine elevation with additional classes
 */
export function withElevation(
  level: keyof typeof elevation,
  additionalClasses?: string
): string {
  return cn(elevation[level], additionalClasses);
}

/**
 * Get appropriate shadow for dark backgrounds
 */
export function getDarkShadow(intensity: 'light' | 'medium' | 'heavy'): string {
  switch (intensity) {
    case 'light':
      return shadows.lg;
    case 'medium':
      return shadows.cardHover;
    case 'heavy':
      return shadows.dramatic;
    default:
      return shadows.lg;
  }
}

/**
 * Check if an element should use floating elevation
 * (dropdowns, popovers, tooltips)
 */
export function isFloatingElement(elementType: string): boolean {
  const floatingTypes = [
    'dropdown',
    'popover',
    'tooltip',
    'menu',
    'select',
    'combobox',
    'command',
  ];
  return floatingTypes.includes(elementType.toLowerCase());
}

/**
 * Get the appropriate backdrop for modal type
 */
export function getBackdrop(
  modalType: 'modal' | 'sheet' | 'celebration'
): string {
  return backdrop[modalType];
}
