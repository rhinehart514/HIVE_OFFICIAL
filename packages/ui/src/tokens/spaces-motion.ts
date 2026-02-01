/**
 * Spaces Motion Tokens
 *
 * Motion timing and values for the Spaces vertical slice:
 * - Hub (discovery)
 * - Threshold (decision)
 * - Crossing ceremony (joining)
 * - Residence (participation)
 *
 * Follows HIVE motion philosophy:
 * - Luxuriously slow for ceremonies
 * - Responsive for interactions
 * - Gold for earned moments
 */

// ============================================
// CROSSING CEREMONY TIMING
// ============================================

export const SPACES_MOTION = {
  /**
   * Crossing Ceremony - When user joins a space
   * Total: ~2.5s for the full experience
   */
  crossing: {
    /** Total ceremony duration (reference only) */
    total: 2.5,
    /** Glass barrier dissolves (blur 8px → 0) */
    glassDissolve: 0.3,
    /** GoldFlash pulse */
    goldFlash: 0.2,
    /** Welcome card timings */
    welcomeCard: {
      /** Card enters (border draws, content reveals) */
      enter: 0.5,
      /** Card holds on screen */
      hold: 0.5,
      /** Card fades up and exits */
      exit: 0.2,
    },
    /** Header border draws in */
    headerBorder: 0.4,
    /** Delay between feed items */
    feedStagger: 0.05,
    /** Number of feed items to animate */
    feedItemCount: 10,
  },

  /**
   * Board/Room Transitions
   * When switching between boards in sidebar
   */
  board: {
    /** Horizontal slide distance (px) */
    slideX: 20,
    /** Transition duration */
    duration: 0.3,
  },

  /**
   * Warmth Levels
   * Activity-based glow intensity for space cards
   * Based on recentMessageCount (messages in last 24h)
   */
  warmth: {
    /** Hot: 20+ messages - prominent gold glow with pulse */
    hot: {
      glow: 0.15,
      pulse: true,
      threshold: 20,
    },
    /** Warm: 5-19 messages - subtle gold glow */
    warm: {
      glow: 0.08,
      pulse: false,
      threshold: 5,
    },
    /** Cool: 1-4 messages - faint white glow */
    cool: {
      glow: 0.03,
      pulse: false,
      threshold: 1,
    },
    /** Dormant: 0 messages - no glow */
    dormant: {
      glow: 0,
      pulse: false,
      threshold: 0,
    },
  },

  /**
   * Stagger Delays
   * For animating sequences
   */
  stagger: {
    /** Identity cards in constellation */
    identity: 0.15,
    /** Feed items on load */
    feed: 0.05,
    /** Grid items (organizations) */
    grid: 0.08,
    /** Page sections */
    sections: 0.1,
  },

  /**
   * Page Transitions
   * Hub entrance and state changes
   */
  page: {
    /** Shell fade in duration */
    shellFade: 0.4,
    /** Noise overlay fade delay */
    noiseDelay: 0.2,
    /** Ambient glow pulse duration */
    glowPulse: 0.6,
    /** Content stagger per section */
    contentStagger: 0.1,
  },

  /**
   * Card Interactions
   * Hover and active states
   */
  card: {
    /** Hover lift distance (px) */
    hoverY: -4,
    /** Orbit card hover lift (px) */
    orbitHoverY: -2,
    /** Glow intensity multiplier on hover */
    hoverGlowMultiplier: 1.5,
    /** Transition duration */
    duration: 0.2,
  },

  /**
   * Energy Dots
   * Activity indicator animation
   */
  energy: {
    /** Pulse animation duration */
    pulseDuration: 2,
    /** Delay between dots */
    dotDelay: 0.15,
  },

  /**
   * State Transitions
   * Moving between hub states
   */
  state: {
    /** Transition between states */
    duration: 0.5,
    /** Gold flash on state change */
    flashDuration: 0.2,
  },

  /**
   * Glass Barrier (Threshold)
   * Visual barrier for non-members
   */
  glass: {
    /** Blur amount in pixels */
    blur: 8,
    /** Content opacity behind glass */
    opacity: 0.4,
    /** Dissolve animation duration */
    dissolve: 0.3,
  },

  /**
   * Abbreviated Motion (Return Visits)
   * Faster animations for users who've seen full ceremony
   */
  abbreviated: {
    /** Quick fade for returning users */
    fadeDuration: 0.5,
    /** Skip welcome card */
    skipWelcome: true,
    /** Reduced stagger */
    stagger: 0.03,
  },
} as const;

// ============================================
// WARMTH UTILITY FUNCTIONS
// ============================================

export type WarmthLevel = 'hot' | 'warm' | 'cool' | 'dormant';

/**
 * Get warmth level from message count
 */
export function getWarmthLevel(recentMessageCount: number): WarmthLevel {
  if (recentMessageCount >= SPACES_MOTION.warmth.hot.threshold) return 'hot';
  if (recentMessageCount >= SPACES_MOTION.warmth.warm.threshold) return 'warm';
  if (recentMessageCount >= SPACES_MOTION.warmth.cool.threshold) return 'cool';
  return 'dormant';
}

/**
 * Get warmth config for a message count
 */
export function getWarmthConfig(recentMessageCount: number) {
  const level = getWarmthLevel(recentMessageCount);
  return {
    level,
    ...SPACES_MOTION.warmth[level],
  };
}

/**
 * Get energy dot count (1-3) from message count
 */
export function getEnergyDotCount(recentMessageCount: number): 1 | 2 | 3 {
  if (recentMessageCount >= 20) return 3;
  if (recentMessageCount >= 5) return 2;
  return 1;
}

// ============================================
// GOLD PALETTE (Spaces-specific)
// ============================================

export const SPACES_GOLD = {
  /** Primary gold for earned moments */
  primary: '#FFD700',
  /** Lighter gold for accents */
  light: '#FFDF33',
  /** Darker gold for depth */
  dark: '#B8860B',
  /** Glow for active spaces */
  glow: 'rgba(255, 215, 0, 0.4)',
  /** Subtle glow for onboarding */
  glowSubtle: 'rgba(255, 215, 0, 0.15)',
  /** Soft glow for ambient effects */
  glowSoft: 'rgba(255, 215, 0, 0.08)',
  /** Ultra soft for background radials */
  glowUltraSoft: 'rgba(255, 215, 0, 0.04)',
} as const;

// ============================================
// AMBIENT GLOW CONFIGURATIONS
// ============================================

export const AMBIENT_GLOW = {
  /** No glow (empty state) */
  none: 'transparent',
  /** Subtle gold (onboarding with 1 claim) */
  subtle: `radial-gradient(ellipse 80% 50% at 50% 0%, ${SPACES_GOLD.glowUltraSoft}, transparent)`,
  /** Medium gold (onboarding with 2 claims) */
  medium: `radial-gradient(ellipse 80% 50% at 50% 0%, ${SPACES_GOLD.glowSoft}, transparent)`,
  /** Full gold (onboarding complete, celebration) */
  full: `radial-gradient(ellipse 80% 50% at 50% 0%, ${SPACES_GOLD.glowSubtle}, transparent)`,
  /** Active state (warm white) */
  active: `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255, 255, 255, 0.04), transparent)`,
} as const;

export type AmbientGlowLevel = keyof typeof AMBIENT_GLOW;

/**
 * Get ambient glow based on state and identity progress
 */
export function getAmbientGlow(
  state: 'empty' | 'onboarding' | 'active',
  identityProgress: number
): string {
  if (state === 'empty') return AMBIENT_GLOW.none;
  if (state === 'active') return AMBIENT_GLOW.active;

  // Onboarding: gold intensity based on claims
  if (identityProgress === 1) return AMBIENT_GLOW.subtle;
  if (identityProgress === 2) return AMBIENT_GLOW.medium;
  if (identityProgress === 3) return AMBIENT_GLOW.full;

  return AMBIENT_GLOW.none;
}

// ============================================
// TYPE EXPORTS
// ============================================

export type SpacesMotionConfig = typeof SPACES_MOTION;
export type SpacesGoldConfig = typeof SPACES_GOLD;
