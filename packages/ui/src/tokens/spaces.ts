/**
 * Minimal spaces token set after motion cleanup.
 */

export type WarmthLevel = 'hot' | 'warm' | 'cool' | 'dormant';
export type AmbientGlowLevel = 'none' | 'subtle' | 'active';

export interface SpacesGoldConfig {
  primary: string;
  light: string;
  dark: string;
  glow: string;
  glowSubtle: string;
  glowSoft: string;
}

export interface SpacesMotionConfig {
  page: {
    shellFade: number;
    glowPulse: number;
    noiseDelay: number;
  };
  state: {
    duration: number;
    flashDuration: number;
  };
  stagger: {
    sections: number;
    identity: number;
    grid: number;
  };
  card: {
    duration: number;
    hoverGlowMultiplier: number;
    orbitHoverY: number;
  };
  warmth: Record<WarmthLevel, { level: WarmthLevel; glow: number; pulse: boolean }>;
  board: {
    slideX: number;
    duration: number;
  };
  glass: {
    opacity: number;
    dissolve: number;
    blur: number;
  };
  crossing: {
    total: number;
    glassDissolve: number;
    goldFlash: number;
    headerBorder: number;
    feedStagger: number;
    welcomeCard: {
      enter: number;
      hold: number;
      exit: number;
    };
  };
  energy: {
    dotDelay: number;
    pulseDuration: number;
  };
}

export const SPACES_GOLD: SpacesGoldConfig = {
  primary: '#FFD700',
  light: '#FFE680',
  dark: '#7A5E00',
  glow: 'rgba(255, 215, 0, 0.22)',
  glowSubtle: 'rgba(255, 215, 0, 0.14)',
  glowSoft: 'rgba(255, 215, 0, 0.09)',
};

export const SPACES_MOTION: SpacesMotionConfig = {
  page: {
    shellFade: 0.24,
    glowPulse: 0.6,
    noiseDelay: 0.06,
  },
  state: {
    duration: 0.2,
    flashDuration: 0.28,
  },
  stagger: {
    sections: 0.06,
    identity: 0.04,
    grid: 0.03,
  },
  card: {
    duration: 0.15,
    hoverGlowMultiplier: 1,
    orbitHoverY: 0,
  },
  warmth: {
    dormant: { level: 'dormant', glow: 0, pulse: false },
    cool: { level: 'cool', glow: 0.04, pulse: false },
    warm: { level: 'warm', glow: 0.08, pulse: false },
    hot: { level: 'hot', glow: 0.12, pulse: true },
  },
  board: {
    slideX: 12,
    duration: 0.18,
  },
  glass: {
    opacity: 0.08,
    dissolve: 0.2,
    blur: 12,
  },
  crossing: {
    total: 2.2,
    glassDissolve: 0.3,
    goldFlash: 0.24,
    headerBorder: 0.35,
    feedStagger: 0.03,
    welcomeCard: {
      enter: 0.32,
      hold: 1.2,
      exit: 0.2,
    },
  },
  energy: {
    dotDelay: 0.03,
    pulseDuration: 1.4,
  },
};

export const AMBIENT_GLOW: Record<string, string> = {
  empty: 'none',
  onboarding: 'radial-gradient(ellipse 110% 70% at 50% 0%, rgba(255, 215, 0, 0.10), transparent)',
  active: 'radial-gradient(ellipse 110% 70% at 50% 0%, rgba(255, 255, 255, 0.06), transparent)',
};

export function getWarmthLevel(activityCount: number): WarmthLevel {
  if (activityCount >= 20) return 'hot';
  if (activityCount >= 5) return 'warm';
  if (activityCount >= 1) return 'cool';
  return 'dormant';
}

export function getWarmthConfig(activityCount: number) {
  return SPACES_MOTION.warmth[getWarmthLevel(activityCount)];
}

export function getEnergyDotCount(activityCount: number): 0 | 1 | 2 | 3 {
  if (activityCount <= 0) return 0;
  if (activityCount < 5) return 1;
  if (activityCount < 12) return 2;
  return 3;
}

export function getAmbientGlow(state: string, identityProgress: number = 0): string {
  if (state === 'onboarding') {
    const alpha = Math.min(0.14, 0.05 + identityProgress * 0.02);
    return `radial-gradient(ellipse 110% 70% at 50% 0%, rgba(255, 215, 0, ${alpha}), transparent)`;
  }
  if (state === 'active') {
    return AMBIENT_GLOW.active;
  }
  return AMBIENT_GLOW.empty;
}
