// Component Pattern Tokens - HIVE Design System
// Pre-composed patterns for consistent component styling

/**
 * PATTERN PHILOSOPHY
 * ------------------
 * Patterns are pre-composed Tailwind class strings for common use cases.
 * They enforce the monochrome discipline and gold-as-reward principle.
 *
 * Use patterns when:
 * - Building new components that match existing patterns
 * - Ensuring consistency across the codebase
 * - Quick prototyping with design system compliance
 */

// ============================================
// GLASS MORPHISM (Standard Surfaces)
// ============================================

/**
 * Glass creates premium depth without heavy shadows.
 * It's atmosphere, not decoration.
 */
export const GLASS = {
  /** Standard glass surface - cards, containers */
  surface: 'bg-white/[0.02] backdrop-blur-md border border-white/[0.06]',
  /** Hover state for interactive glass */
  hover: 'hover:bg-white/[0.04] hover:border-white/[0.10]',
  /** Focus state for inputs */
  focus: 'focus:bg-white/[0.05] focus:border-white/30',
  /** Selected state with earned gold */
  selected: 'bg-white/[0.06] border-gold-500/30 shadow-[0_0_20px_rgba(255,215,0,0.1)]',
  /** Elevated surface (modals, dropdowns) */
  elevated: 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]',
} as const;

// ============================================
// CARD PATTERNS
// ============================================

export const CARD = {
  /** Default card - glass surface */
  default: 'bg-white/[0.02] backdrop-blur-md border border-white/[0.06] rounded-xl',
  /** Interactive card with hover states */
  interactive: 'bg-white/[0.02] backdrop-blur-md border border-white/[0.06] rounded-xl hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300',
  /** Selected card with earned gold state */
  selected: 'bg-white/[0.06] border border-gold-500/30 shadow-[0_0_20px_rgba(255,215,0,0.1)] rounded-xl',
  /** Hero card with gold hover glow (featured content) */
  hero: 'bg-white/[0.02] backdrop-blur-md border border-white/[0.06] rounded-xl hover:border-gold-500/20 hover:shadow-[0_0_40px_rgba(255,215,0,0.06)] transition-all duration-300',
} as const;

// ============================================
// INPUT PATTERNS
// ============================================

export const INPUT = {
  /** Boxed input - forms, settings (default) */
  boxed: 'h-11 px-4 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition-all duration-200',
  /** Underline input - onboarding, hero sections */
  underline: 'h-14 px-0 bg-transparent border-0 border-b border-neutral-800 text-white text-lg text-center placeholder:text-neutral-700 focus:outline-none focus:border-white/50 transition-all duration-300',
  /** Ghost input - search, inline editing */
  ghost: 'h-10 px-3 bg-transparent border-0 text-white placeholder:text-neutral-600 focus:outline-none focus:bg-white/[0.02] rounded-lg transition-all duration-200',
} as const;

// ============================================
// BUTTON PATTERNS
// ============================================

export const BUTTON = {
  /** Primary - white pill, most CTAs */
  primary: 'h-12 px-8 rounded-full bg-white/95 text-black text-sm font-medium hover:bg-white hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] transition-all duration-300 disabled:bg-neutral-900/80 disabled:text-neutral-700 disabled:cursor-not-allowed inline-flex items-center justify-center',
  /** Gold CTA - ONLY for final action (1% rule) */
  gold: 'h-12 px-8 rounded-full bg-gold-500 text-black text-sm font-medium hover:bg-gold-400 hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-all duration-300 inline-flex items-center justify-center',
  /** Secondary - subtle outline */
  secondary: 'h-12 px-8 rounded-full bg-white/[0.04] text-white text-sm font-medium border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-300 inline-flex items-center justify-center',
  /** Ghost - text only, tertiary actions */
  ghost: 'px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-400 transition-colors inline-flex items-center justify-center',
  /** Icon button - square, icon only */
  icon: 'w-11 h-11 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200 inline-flex items-center justify-center',
} as const;

// ============================================
// BADGE PATTERNS
// ============================================

export const BADGE = {
  /** Default badge - subtle gray */
  default: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/[0.06] text-neutral-400',
  /** Gold badge - achievements/verification ONLY */
  gold: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-500/[0.1] text-gold-500 border border-gold-500/30',
  /** Success badge */
  success: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/[0.1] text-green-400',
  /** Warning badge */
  warning: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/[0.1] text-amber-400',
  /** Error badge */
  error: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/[0.1] text-red-400',
} as const;

// ============================================
// FOCUS PATTERNS
// ============================================

export const FOCUS = {
  /** Standard focus ring - WHITE, never gold */
  ring: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
  /** Inner focus (no offset) */
  inner: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset',
  /** Subtle focus (border only) */
  subtle: 'focus:outline-none focus:border-white/30',
} as const;

// ============================================
// TYPOGRAPHY PATTERNS
// ============================================

export const TYPOGRAPHY = {
  /** Display heading - hero titles */
  display: 'text-[40px] md:text-[48px] font-semibold tracking-[-0.02em] leading-[1.1] text-white',
  /** Page heading - page titles */
  heading: 'text-[32px] font-normal tracking-tight text-white',
  /** Section heading */
  section: 'text-[24px] font-medium tracking-[-0.01em] text-white',
  /** Card title */
  cardTitle: 'text-[18px] font-medium text-white',
  /** Body text */
  body: 'text-[15px] text-neutral-400 leading-relaxed',
  /** Secondary text */
  secondary: 'text-sm text-neutral-500',
  /** Label - uppercase category */
  label: 'text-xs uppercase tracking-wide font-medium text-neutral-600',
  /** Meta - timestamps, subtle info */
  meta: 'text-xs text-neutral-600',
} as const;

// ============================================
// MOTION TIER PATTERNS (class names for motion)
// ============================================

export const MOTION_TIERS = {
  /** T1: Celebrations, achievements, major moments (500-700ms) */
  t1: 'duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)]',
  /** T2: Standard interactions, cards, filters (300ms) */
  t2: 'duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
  /** T3: Ambient motion, hovers, micro-feedback (150-200ms) */
  t3: 'duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
  /** T4: Reduced motion fallback (instant) */
  t4: 'duration-0',
} as const;

// ============================================
// ELEVATION PATTERNS (Z-axis depth)
// ============================================

export const ELEVATION = {
  /** Level 0: Page background */
  base: 'z-0',
  /** Level 1: Cards at rest */
  rest: 'z-10 shadow-lg',
  /** Level 2: Hover states, lifted cards */
  hover: 'z-20 shadow-xl -translate-y-2',
  /** Level 3: Floating UI, toolbars, dropdowns */
  floating: 'z-30 shadow-2xl',
  /** Level 4: Modals, overlays */
  modal: 'z-40 shadow-[0_40px_80px_rgba(0,0,0,0.4)]',
  /** Level 5: Celebrations, transcends all */
  celebration: 'z-50',
} as const;

// Types
export type GlassPattern = keyof typeof GLASS;
export type CardPattern = keyof typeof CARD;
export type InputPattern = keyof typeof INPUT;
export type ButtonPattern = keyof typeof BUTTON;
export type BadgePattern = keyof typeof BADGE;
export type FocusPattern = keyof typeof FOCUS;
export type TypographyPattern = keyof typeof TYPOGRAPHY;
export type MotionTier = keyof typeof MOTION_TIERS;
export type ElevationLevel = keyof typeof ELEVATION;
