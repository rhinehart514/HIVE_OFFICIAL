// Monochrome Design Tokens - HIVE Design System
// Single source of truth for the 99% grayscale aesthetic
// Gold (#FFD700) is PRECIOUS - only for achievements, CTAs, and presence

/**
 * MONOCHROME DISCIPLINE
 * ---------------------
 * Gold appears ONLY when:
 * - User accomplishes something (claimed handle, completed step)
 * - User takes final action (Enter HIVE, Submit)
 * - Something is live/active (presence indicator)
 * - User is rewarded (achievement unlock, ritual complete)
 *
 * Everything else is grayscale. This makes gold moments feel EARNED.
 */

// ============================================
// TAILWIND CLASS STRINGS (use in components)
// ============================================

export const MONOCHROME = {
  // === GOLD (Achievement/CTA Only) ===
  /** Gold text - use for earned moments, claimed states */
  goldText: 'text-gold-500',
  /** Gold border - subtle, earned state indicator */
  goldBorder: 'border-gold-500/30',
  /** Gold background - very subtle, earned state only */
  goldBg: 'bg-gold-500/[0.04]',
  /** Gold box-shadow for glows */
  goldGlow: '0 0 20px rgba(255, 215, 0, 0.5)',
  /** Gold hover glow - final CTA buttons only */
  goldHoverGlow: '0 0 30px rgba(255, 215, 0, 0.15)',

  // === GRAYSCALE SURFACES ===
  /** Card background - barely-there glass */
  cardBg: 'bg-white/[0.02]',
  /** Card border - subtle */
  cardBorder: 'border border-white/[0.06]',
  /** Card hover border - slightly more visible */
  cardHoverBorder: 'hover:border-white/[0.12]',
  /** Card hover background - subtle lift */
  cardHoverBg: 'hover:bg-white/[0.04]',

  // === INPUT STYLING ===
  /** Underline input - onboarding/hero style */
  inputBase: 'w-full h-14 px-0 bg-transparent border-0 border-b border-neutral-800 text-white text-lg text-center placeholder:text-neutral-700 focus:outline-none focus:border-white/50 transition-all duration-300',
  /** Input focus ring - WHITE, never gold */
  inputFocus: 'focus:border-white/50 focus:ring-0',

  // === TYPOGRAPHY ===
  /** Main heading - 32px normal weight */
  heading: 'text-[32px] font-normal tracking-tight text-white',
  /** Subheading - muted */
  subheading: 'text-neutral-500',
  /** Section label - uppercase, tiny */
  sectionLabel: 'text-xs uppercase tracking-wide text-neutral-600',
  /** Disabled text */
  textDisabled: 'text-neutral-700',

  // === BUTTONS ===
  /** Primary button - white pill, most CTAs */
  buttonPrimary: 'h-12 px-8 rounded-full bg-white/95 text-black text-sm font-medium hover:bg-white hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] transition-all duration-300 disabled:bg-neutral-900/80 disabled:text-neutral-700 disabled:cursor-not-allowed flex items-center justify-center',
  /** Gold button - ONLY for final CTA (Enter HIVE, Confirm) - 1% rule */
  buttonGold: 'h-12 px-8 rounded-full bg-gold-500 text-black text-sm font-medium hover:bg-gold-400 hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-all duration-300 flex items-center justify-center',
  /** Secondary button - subtle outline */
  buttonSecondary: 'h-12 px-8 rounded-full bg-white/[0.04] text-white text-sm font-medium border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-300 flex items-center justify-center',
  /** Ghost button - text only links */
  buttonGhost: 'text-sm font-medium text-neutral-600 hover:text-neutral-400 transition-colors',

  // === SPACING RHYTHM ===
  /** Section gap - 64px */
  sectionGap: 'mb-16',
  /** Item gap - 48px */
  itemGap: 'mb-12',
  /** Component gap - 24px */
  componentGap: 'mb-6',

  // === FOCUS STATES ===
  /** Focus ring - WHITE, never gold */
  focusRing: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
} as const;

// ============================================
// RAW VALUES (for inline styles, JS calculations)
// ============================================

export const monochromeValues = {
  gold: {
    hex: '#FFD700',
    rgb: 'rgb(255, 215, 0)',
    rgba: (alpha: number) => `rgba(255, 215, 0, ${alpha})`,
  },
  surface: {
    page: '#0A0A0A',
    card: 'rgba(255, 255, 255, 0.02)',
    cardHover: 'rgba(255, 255, 255, 0.04)',
    elevated: 'rgba(255, 255, 255, 0.06)',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    medium: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.20)',
    gold: 'rgba(255, 215, 0, 0.30)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A1A1A6',
    tertiary: '#818187',
    disabled: '#525252',
    gold: '#FFD700',
  },
  glow: {
    gold: '0 0 20px rgba(255, 215, 0, 0.5)',
    goldStrong: '0 0 40px rgba(255, 215, 0, 0.6)',
    goldSubtle: '0 0 20px rgba(255, 215, 0, 0.1)',
    white: '0 0 20px rgba(255, 255, 255, 0.1)',
  },
} as const;

// ============================================
// COMPONENT PATTERNS (pre-composed classes)
// ============================================

export const monochromePatterns = {
  /** Interactive card with hover states */
  interactiveCard: `${MONOCHROME.cardBg} ${MONOCHROME.cardBorder} ${MONOCHROME.cardHoverBorder} ${MONOCHROME.cardHoverBg} rounded-xl transition-all duration-300`,

  /** Selected card with earned gold state */
  selectedCard: `bg-white/[0.06] border-gold-500/30 shadow-[0_0_20px_rgba(255,215,0,0.1)] rounded-xl`,

  /** Glass surface for containers */
  glassSurface: 'bg-white/[0.02] backdrop-blur-md border border-white/[0.06] rounded-xl',

  /** Underline input for onboarding */
  underlineInput: `${MONOCHROME.inputBase} ${MONOCHROME.inputFocus}`,
} as const;

// ============================================
// WARMTH SPECTRUM (Phase 3 - Social Signals)
// ============================================
// Spaces feel warmer as they get more active
// This creates life without breaking monochrome discipline

export const warmthSpectrum = {
  /** Empty/quiet - pure cool neutral */
  empty: {
    bg: '#0A0A0A',
    border: 'rgba(255, 255, 255, 0.04)',
    glow: 'none',
  },
  /** Quiet (1-5 members) - very subtle warmth */
  quiet: {
    bg: '#0B0A09', // Barely perceptible warm shift
    border: 'rgba(255, 255, 255, 0.06)',
    glow: 'none',
  },
  /** Active (5-20 members) - subtle amber presence */
  active: {
    bg: '#0C0B09',
    border: 'rgba(255, 215, 0, 0.08)',
    glow: '0 0 40px rgba(255, 215, 0, 0.03)',
  },
  /** Live (20+ members) - gold presence signals */
  live: {
    bg: '#0D0B08',
    border: 'rgba(255, 215, 0, 0.15)',
    glow: '0 0 60px rgba(255, 215, 0, 0.06)',
  },
} as const;

/** Calculate warmth level based on activity */
export function getWarmthLevel(memberCount: number, activeNow: number = 0): keyof typeof warmthSpectrum {
  // Heavily weight active users
  const activityScore = memberCount + (activeNow * 5);

  if (activityScore >= 40) return 'live';
  if (activityScore >= 10) return 'active';
  if (activityScore >= 3) return 'quiet';
  return 'empty';
}

// ============================================
// PRESENCE STATES (Phase 3 - Activity Signals)
// ============================================

export const presenceStates = {
  /** Live (active in last 30s) - gold solid dot with pulse */
  live: {
    dot: '#FFD700',
    ring: 'rgba(255, 215, 0, 0.4)',
    pulse: true,
  },
  /** Present (active in last 2min) - gold ring, no fill */
  present: {
    dot: 'transparent',
    ring: 'rgba(255, 215, 0, 0.5)',
    pulse: false,
  },
  /** Recent (active in last 5min) - dim gold */
  recent: {
    dot: 'rgba(255, 215, 0, 0.4)',
    ring: 'transparent',
    pulse: false,
  },
  /** Away (> 5min) - neutral gray */
  away: {
    dot: '#525252',
    ring: 'transparent',
    pulse: false,
  },
} as const;

export type PresenceState = keyof typeof presenceStates;

// Types
export type MonochromeToken = keyof typeof MONOCHROME;
export type MonochromeValue = keyof typeof monochromeValues;
export type MonochromePattern = keyof typeof monochromePatterns;
export type WarmthLevel = keyof typeof warmthSpectrum;
