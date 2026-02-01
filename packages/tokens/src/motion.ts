// Motion design tokens - HIVE Motion System
// Single source of truth for all motion values

/**
 * MOTION PHILOSOPHY
 * -----------------
 * Motion is intentional. Match tier to context.
 *
 * TIMING TIERS:
 * - Micro: 150-200ms, ease-out — Hover, focus, toggles
 * - Standard: 300-400ms, cubic-bezier(0.23, 1, 0.32, 1) — Transitions, panels
 * - Cinematic: 500-800ms, spring/premium — Entry, celebration
 *
 * SIGNATURE MOTIONS:
 * - Reveal: Fade + slide up (y: 20px → 0)
 * - Surface: Scale from 0.95 + fade
 * - Blur transition: Filter blur for screen changes
 * - Stagger: 50-80ms between list items
 *
 * REDUCED MOTION:
 * Always provide duration-0 fallback for prefers-reduced-motion.
 */

// ============================================
// CONSOLIDATED MOTION EXPORT (convenient access)
// ============================================

export const MOTION = {
  duration: {
    instant: 50,      // Micro feedback
    micro: 100,       // State changes
    snap: 150,        // Toggles
    quick: 200,       // Hover effects
    standard: 300,    // Most animations (DEFAULT)
    smooth: 400,      // Modals
    flowing: 500,     // Page transitions
    gentle: 600,      // Word reveals, gentle entrances (About page)
    dramatic: 700,    // Celebrations ONLY
    slow: 800,        // Container animations (About page)
    hero: 1200,       // Hero entrances, major reveals (About page)
  },
  ease: {
    default: [0.23, 1, 0.32, 1] as const,      // Smooth, natural
    snap: [0.25, 0.1, 0.25, 1] as const,       // Quick, decisive
    dramatic: [0.165, 0.84, 0.44, 1] as const, // Cinematic (achievements)
    premium: [0.22, 1, 0.36, 1] as const,      // Apple/OpenAI feel
  },
  spring: {
    snappy: { stiffness: 400, damping: 30 },   // Buttons
    default: { stiffness: 200, damping: 25 },  // General
    gentle: { stiffness: 100, damping: 20 },   // Modals
    bouncy: { stiffness: 300, damping: 15 },   // Celebrations
  },
} as const;

// ============================================
// FRAMER MOTION ARRAYS (use in components)
// ============================================

export const easingArrays = {
  // PRIMARY: Use for 90% of animations
  default: [0.23, 1, 0.32, 1] as const,      // Smooth, natural (Vercel-inspired)
  silk: [0.23, 1, 0.32, 1] as const,         // Alias for default - premium feel

  // SNAP: Use for toggles, checkboxes, instant feedback
  snap: [0.25, 0.1, 0.25, 1] as const,       // Quick, decisive

  // DRAMATIC: Use for achievements, rituals, major moments ONLY
  dramatic: [0.165, 0.84, 0.44, 1] as const, // Cinematic, special

  // DIRECTIONAL: For entrances/exits
  out: [0, 0, 0.2, 1] as const,              // Ease out only
  in: [0.4, 0, 1, 1] as const,               // Ease in only
} as const;

// Duration in seconds (for Framer Motion)
export const durationSeconds = {
  instant: 0.05,      // 50ms - Immediate feedback
  micro: 0.1,         // 100ms - Micro-interactions
  snap: 0.15,         // 150ms - Button presses, toggles
  quick: 0.2,         // 200ms - Fast interactions
  standard: 0.3,      // 300ms - Default transitions
  smooth: 0.4,        // 400ms - Smooth movements
  flowing: 0.5,       // 500ms - Layout changes
  gentle: 0.6,        // 600ms - Word reveals, gentle entrances (About page)
  dramatic: 0.7,      // 700ms - Special moments
  slow: 0.8,          // 800ms - Container animations (About page)
  orchestrated: 1.0,  // 1000ms - Full sequences
  hero: 1.2,          // 1200ms - Hero entrances, major reveals (About page)
} as const;

// Spring physics presets
export const springPresets = {
  // Snappy: Quick, decisive (buttons, toggles)
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  },
  // Default: Balanced responsiveness
  default: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25,
  },
  // Gentle: Slow, smooth (modals, sheets)
  gentle: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 20,
  },
  // Bouncy: Playful (achievements, celebrations)
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 15,
  },
  // SNAP Nav: Decisive navigation motion - HIVE signature
  snapNav: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 25,
    mass: 0.5,
  },
} as const;

// ============================================
// HIVE SIGNATURE TRANSITIONS
// ============================================
// These create the SNAP→HOLD→SNAP rhythm that defines HIVE motion

// SNAP spring - decisive nav motion (sidebar, nav items)
export const SPRING_SNAP_NAV = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 25,
  mass: 0.5,
};

// PUNCH transition - instant arrival with micro-ease
export const PUNCH_TRANSITION = {
  duration: 0.12,
  ease: [0.22, 0, 0.36, 1] as const,
};

// SNAP transition - micro-impact for hover/active states
export const SNAP_TRANSITION = {
  duration: 0.08,
  ease: [0.32, 0, 0.67, 0] as const,
};

// Tinder-optimized springs for card interactions
export const tinderSprings = {
  // Card lift on hover - bouncy with mass for weight
  cardLift: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 20,
    mass: 0.8,
  },
  // Quick snap back after interaction
  snapBack: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 25,
  },
  // Gentle settling after card lands
  settle: {
    type: 'spring' as const,
    stiffness: 150,
    damping: 18,
  },
  // Achievement/celebration pop
  bounce: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 12,
  },
} as const;

// Stagger configurations
export const staggerPresets = {
  fast: 0.03,     // Fast lists
  word: 0.03,     // Word-by-word reveals (About page)
  default: 0.05,  // Standard stagger
  section: 0.08,  // Section stagger (About page)
  slow: 0.1,      // Dramatic reveals
} as const;

// ============================================
// CSS STRINGS (for Tailwind/CSS)
// ============================================

export const motion = {
  // CSS cubic-bezier strings
  easing: {
    // PRIMARY
    default: 'cubic-bezier(0.23, 1, 0.32, 1)',
    silk: 'cubic-bezier(0.23, 1, 0.32, 1)',

    // SNAP
    snap: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    interactive: 'cubic-bezier(0.25, 0.1, 0.25, 1)',

    // DRAMATIC
    dramatic: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
    layout: 'cubic-bezier(0.165, 0.84, 0.44, 1)',

    // DIRECTIONAL
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',

    // Legacy aliases (map to core)
    liquid: 'cubic-bezier(0.23, 1, 0.32, 1)',
    magnetic: 'cubic-bezier(0.23, 1, 0.32, 1)',
    reveal: 'cubic-bezier(0.23, 1, 0.32, 1)',
    easeOut: 'cubic-bezier(0.23, 1, 0.32, 1)',
    spring: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    cinematic: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
  },
  
  // Duration Scale - Orchestrated timing (aligned with hive-motion.ts)
  duration: {
    instant: '0.1s',        // Micro-interactions
    snap: '0.15s',          // Button presses
    quick: '0.2s',          // Button press, toggle
    smooth: '0.25s',        // Hover states
    liquid: '0.35s',        // Card movements
    flowing: '0.5s',        // Layout changes
    cascade: '0.75s',       // Sequential animations
    dramatic: '1.0s',       // Space activation, major state change
    orchestrated: '1.2s',   // Full sequences, achievement moments
    cinematic: '1.0s',      // Cinematic moments
  },
  
  // Cascade Timing - For ripple effects and orchestrated sequences
  cascade: {
    wave: '0.03s',          // Ultra-fast wave effects (18ms)
    ripple: '0.05s',        // Standard ripple spread (30ms)
    stagger: '0.08s',       // Sequential element reveals (48ms)
    sequence: '0.12s',      // Deliberate orchestrated sequences (72ms)
    milestone: '0.15s',     // Major milestone celebrations (90ms)
    cinematic: '0.2s',      // Epic space activation moments (120ms)
  },
  
  // Orchestration timing patterns for complex sequences
  orchestration: {
    // Tool creation sequence timing
    toolCreation: {
      elementAppear: '0.1s',     // Individual elements appear
      elementConnect: '0.08s',   // Elements connect magnetically
      toolComplete: '0.15s',     // Tool completion celebration
      plantDelay: '0.3s',        // Delay before planting
    },
    
    // Space activation sequence timing
    spaceActivation: {
      rippleStart: '0s',         // Immediate ripple from activation point
      connectedElements: '0.05s', // Connected UI elements respond
      secondaryWave: '0.3s',     // Secondary wave for distant elements
      celebration: '0.8s',       // Celebration sequence starts
    },
    
    // Feed update sequence timing
    feedUpdate: {
      newItemAppear: '0.1s',     // New feed item appears
      existingItemShift: '0.05s', // Existing items shift
      readIndicator: '0.2s',     // Read/unread indicators update
    },
    
    // Builder progression timing
    builderProgression: {
      skillUnlock: '0.2s',       // New skill unlocks
      badgeAppear: '0.15s',      // Achievement badge appears
      rightsPropagation: '0.1s', // New rights propagate through UI
    }
  },
  
  // Transform Values - Consistent scaling and movement
  transform: {
    // Scale transforms
    scaleHover: '1.02',     // Subtle hover scale
    scaleTap: '0.98',       // Press down scale
    scaleModal: '1.05',     // Modal entrance scale
    
    // Translation values
    moveHover: '-2px',      // Upward hover movement
    movePress: '0px',       // Return to baseline
    moveSlide: '20px',      // Slide in/out distance
    
    // Rotation values
    rotateSubtle: '1deg',   // Subtle rotation
    rotateMedium: '3deg',   // Medium rotation
    rotateFull: '360deg',   // Full rotation
  },
  
  // Spring Physics - For realistic motion feel
  spring: {
    // Mass - weight feeling
    light: '0.5',          // Light, snappy elements
    normal: '0.8',         // Standard weight
    heavy: '1.2',          // Substantial elements
    
    // Stiffness - responsiveness
    soft: '200',           // Gentle, flowing
    medium: '400',         // Balanced response
    firm: '600',           // Quick, decisive
    snap: '800',           // Immediate snap
    
    // Damping - settle behavior
    loose: '15',           // Some overshoot
    balanced: '25',        // Smooth settle
    tight: '30',           // Quick settle
    overdamped: '40',      // No overshoot
  },
  
  // Magnetic Zones - Tool assembly physics
  magnetic: {
    near: '20px',          // Detection zone
    snap: '8px',           // Snap threshold
    release: '40px',       // Release distance
  },
} as const;

// Performance optimization constants
export const performance = {
  willChange: {
    transform: 'transform',
    opacity: 'opacity',
    auto: 'auto',
    scroll: 'scroll-position',
  },
  
  transformOrigin: {
    center: 'center',
    top: 'top',
    bottom: 'bottom',
    left: 'left',
    right: 'right',
  },
  
  backfaceVisibility: {
    visible: 'visible',
    hidden: 'hidden',
  },
} as const;

// ============================================
// PHASE 5: MICRO-INTERACTION PRESETS
// ============================================
// Premium feel through consistent, refined motion

/**
 * Button press feedback - deeper press, shadow response
 */
export const buttonPressVariants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  hover: {
    scale: 1.02,
    y: -1,
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  tap: {
    scale: 0.97,
    y: 1,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    transition: { type: 'spring', stiffness: 500, damping: 30 },
  },
} as const;

/**
 * Card hover - ambient lift with subtle shadow
 */
export const cardHoverVariants = {
  rest: {
    y: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  hover: {
    y: -2,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
} as const;

/**
 * Message entry animation - slide up with fade
 */
export const messageEntryVariants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.23, 1, 0.32, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: {
      duration: 0.15,
    },
  },
} as const;

/**
 * Success moment - check draw with settle bounce
 */
export const successVariants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: [0, 1.2, 1],
    opacity: 1,
    transition: {
      scale: {
        type: 'spring',
        stiffness: 400,
        damping: 12,
      },
      opacity: {
        duration: 0.15,
      },
    },
  },
} as const;

/**
 * Error shake - physics-based shake
 */
export const errorShakeVariants = {
  initial: { x: 0 },
  shake: {
    x: [-4, 4, -4, 4, -2, 2, 0],
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
      duration: 0.4,
    },
  },
} as const;

/**
 * Page transition - fade with subtle shift
 */
export const pageTransitionVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.25,
      ease: [0.22, 1, 0.36, 1],
    },
  },
} as const;

/**
 * Modal entrance - scale up with backdrop
 */
export const modalVariants = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  },
  content: {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: 10,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: {
        duration: 0.15,
      },
    },
  },
} as const;

/**
 * Dropdown menu - slide down with stagger
 */
export const dropdownVariants = {
  container: {
    initial: { opacity: 0, y: -6, scale: 0.98 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.03,
      },
    },
    exit: {
      opacity: 0,
      y: -6,
      scale: 0.98,
      transition: { duration: 0.15 },
    },
  },
  item: {
    initial: { opacity: 0, x: -8 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.15 },
    },
  },
} as const;

/**
 * Selection ring expand
 */
export const selectionVariants = {
  unselected: {
    scale: 1,
    boxShadow: '0 0 0 0px rgba(255,215,0,0)',
  },
  selected: {
    scale: 1,
    boxShadow: '0 0 0 2px rgba(255,215,0,0.3)',
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
} as const;

/**
 * Reduced motion fallbacks
 */
export const reducedMotionVariants = {
  fadeOnly: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.15 } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  },
  instant: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
} as const;

// ============================================
// SIGNATURE MOTION VARIANTS (HIVE Design Principles)
// ============================================

/**
 * Reveal: Fade + slide up (y: 20px → 0)
 * Use for: List items, cards, content entry
 */
export const revealVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
} as const;

/**
 * Surface: Scale from 0.95 + fade
 * Use for: Modals, popovers, dropdowns
 */
export const surfaceVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
} as const;

/**
 * Stagger container for list children
 * Use with staggerPresets for timing
 */
export const staggerContainerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05, // 50-80ms between items
    },
  },
} as const;

// Types
export type MotionToken = keyof typeof motion;
export type MotionEasing = keyof typeof motion.easing;
export type MotionDuration = keyof typeof motion.duration;
export type MotionCascade = keyof typeof motion.cascade;
export type EasingArray = keyof typeof easingArrays;
export type DurationSeconds = keyof typeof durationSeconds;
export type SpringPreset = keyof typeof springPresets;
export type TinderSpring = keyof typeof tinderSprings;
export type StaggerPreset = keyof typeof staggerPresets;
