// Motion design tokens - HIVE Motion System
// Single source of truth for all motion values

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
  dramatic: 0.7,      // 700ms - Special moments
  orchestrated: 1.0,  // 1000ms - Full sequences
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
} as const;

// Stagger configurations
export const staggerPresets = {
  fast: 0.03,     // Fast lists
  default: 0.05,  // Standard stagger
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

// Types
export type MotionToken = keyof typeof motion;
export type MotionEasing = keyof typeof motion.easing;
export type MotionDuration = keyof typeof motion.duration;
export type MotionCascade = keyof typeof motion.cascade;
export type EasingArray = keyof typeof easingArrays;
export type DurationSeconds = keyof typeof durationSeconds;
export type SpringPreset = keyof typeof springPresets;
export type StaggerPreset = keyof typeof staggerPresets;
