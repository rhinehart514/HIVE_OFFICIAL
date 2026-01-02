/**
 * HIVE Spaces Motion Variants
 * Shared animation definitions for all Spaces components
 *
 * Tier System:
 * T1: High motion (hero cards, celebrations) - y:-8, scale:1.02, glow
 * T2: Medium motion (discovery cards, filters) - y:-6, scale:1.015
 * T3: Subtle motion (widgets, headers) - y:-2 or fade
 * T4: Minimal (static text, labels) - no motion
 *
 * Usage:
 * import { spaceDiscoveryCardVariants, railWidgetVariants } from '@hive/ui/lib/motion-variants-spaces';
 * <motion.div variants={spaceDiscoveryCardVariants} initial="initial" animate="animate" whileHover="hover" />
 */

import { easingArrays, springPresets, tinderSprings, staggerPresets } from '@hive/tokens';

// ============================================
// TIER 1: HIGH MOTION (Hero Cards, Celebrations)
// ============================================

export const spaceHeroCardVariants = {
  initial: {
    opacity: 0,
    y: 40,
    scale: 0.92,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...tinderSprings.settle,
      delay: 0.1
    }
  },
  hover: {
    y: -8,
    scale: 1.02,
    boxShadow: '0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
    transition: tinderSprings.cardLift
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.96,
    transition: { duration: 0.2, ease: easingArrays.silk }
  }
};

export const spaceJoinCelebrationVariants = {
  initial: {
    opacity: 0,
    scale: 0.9
  },
  animate: {
    opacity: 1,
    scale: 1, // Removed overshoot [0.5, 1.15, 1] - confident, not bouncy
    transition: {
      duration: 0.4,
      ease: easingArrays.silk
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.3 }
  }
};

export const goldGlowPulseVariants = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(255,215,0,0)',
      '0 0 40px 20px rgba(255,215,0,0.3)',
      '0 0 0 0 rgba(255,215,0,0)'
    ],
    transition: {
      duration: 0.8,
      ease: 'easeOut'
    }
  }
};

export const kenBurnsVariants = {
  animate: {
    scale: [1, 1.05],
    transition: {
      duration: 20,
      repeat: Infinity,
      repeatType: 'reverse' as const,
      ease: 'linear'
    }
  }
};

// ============================================
// TIER 2: MEDIUM MOTION (Discovery Cards, Filters)
// ============================================

export const spaceDiscoveryCardVariants = {
  initial: {
    opacity: 0,
    y: 24,
    scale: 0.96
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springPresets.snappy
  },
  hover: {
    y: -6,
    scale: 1.015,
    boxShadow: '0 24px 48px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)',
    transition: springPresets.snappy
  },
  tap: {
    scale: 0.99,
    transition: { duration: 0.1 }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.15 }
  }
};

export const categoryPillVariants = {
  initial: {
    opacity: 0,
    x: -8
  },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      ...springPresets.snappy
    }
  }),
  hover: {
    scale: 1.02,
    transition: springPresets.snappy
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  },
  active: {
    scale: 1
  }
};

export const momentumPulseVariants = {
  live: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
  high: {
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
  quiet: {
    opacity: 1,
    scale: 1
  }
};

export const filterBarVariants = {
  initial: {
    opacity: 0,
    y: -10
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easingArrays.silk
    }
  }
};

// ============================================
// TIER 3: SUBTLE MOTION (Widgets, Headers)
// ============================================

export const railWidgetVariants = {
  initial: {
    opacity: 0,
    x: 12
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: easingArrays.silk
    }
  },
  hover: {
    y: -2,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    transition: { duration: 0.2 }
  }
};

export const nowCardVariants = {
  initial: {
    opacity: 0,
    y: 8
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: easingArrays.default
    }
  },
  hover: {
    y: -2,
    transition: { duration: 0.15 }
  },
  urgent: {
    boxShadow: [
      '0 0 0 0 rgba(255,255,255,0)',
      '0 0 8px 2px rgba(255,255,255,0.15)',
      '0 0 0 0 rgba(255,255,255,0)'
    ],
    transition: {
      duration: 2,
      repeat: Infinity
    }
  }
};

export const spaceHeaderVariants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: easingArrays.default
    }
  }
};

export const sectionRevealVariants = {
  initial: {
    opacity: 0,
    y: 8
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: easingArrays.silk
    }
  }
};

export const collapsibleVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.2, ease: easingArrays.default },
      opacity: { duration: 0.15 }
    }
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.25, ease: easingArrays.default },
      opacity: { duration: 0.2, delay: 0.05 }
    }
  }
};

export const chevronRotateVariants = {
  collapsed: {
    rotate: 0,
    transition: { duration: 0.2 }
  },
  expanded: {
    rotate: 180,
    transition: { duration: 0.2 }
  }
};

// ============================================
// TIER 4: MINIMAL (Static elements)
// ============================================

export const staticVariants = {
  initial: {},
  animate: {},
  hover: {},
  tap: {}
};

// ============================================
// SCROLL-TRIGGERED VARIANTS (for InView)
// ============================================

export const scrollRevealVariants = {
  hidden: {
    opacity: 0,
    y: 30
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easingArrays.silk
    }
  }
};

export const scrollFadeVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: easingArrays.default
    }
  }
};

export const parallaxVariants = {
  hidden: {
    y: 20
  },
  visible: (depth: number = 1) => ({
    y: 0,
    transition: {
      duration: 0.4 * depth,
      ease: easingArrays.default
    }
  })
};

// ============================================
// STAGGER CONTAINERS
// ============================================

export const sectionStaggerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerPresets.default,
      delayChildren: 0.15
    }
  }
};

export const gridStaggerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerPresets.fast,
      delayChildren: 0.1
    }
  }
};

export const heroStaggerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerPresets.slow,
      delayChildren: 0.2
    }
  }
};

export const listStaggerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1
    }
  }
};

// ============================================
// ITEM VARIANTS (for use with stagger containers)
// ============================================

export const staggerItemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springPresets.snappy
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.15 }
  }
};

export const staggerFadeItemVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.25
    }
  }
};

// ============================================
// CELEBRATION EFFECTS
// ============================================

export const confettiParticleVariants = {
  initial: {
    opacity: 1,
    scale: 0,
    x: 0,
    y: 0
  },
  animate: (i: number) => ({
    opacity: [1, 1, 0],
    scale: [0, 1, 0.5],
    x: (Math.random() - 0.5) * 200,
    y: (Math.random() - 0.5) * 200 - 80,
    rotate: Math.random() * 360, // Capped from 720 - one rotation max
    transition: {
      duration: 0.9, // Reduced from 1.2 - faster exit
      delay: i * 0.02,
      ease: easingArrays.out
    }
  })
};

export const successCheckVariants = {
  initial: {
    scale: 0,
    rotate: -90
  },
  animate: {
    scale: 1, // Removed overshoot [0, 1.2, 1] - confident appearance
    rotate: 0,
    transition: {
      ...springPresets.default, // Changed from bouncy
      delay: 0.1
    }
  }
};

// ============================================
// UTILITY: Reduced motion safe wrapper
// ============================================

export const withReducedMotion = <T extends Record<string, unknown>>(
  variants: T,
  shouldReduce: boolean
): T | typeof staticVariants => {
  return shouldReduce ? staticVariants : variants;
};
