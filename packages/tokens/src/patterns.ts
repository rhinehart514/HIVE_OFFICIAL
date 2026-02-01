// Component Pattern Tokens - HIVE Design System
// Pre-composed patterns for consistent component styling

/**
 * PATTERN PHILOSOPHY
 * ------------------
 * Patterns are pre-composed Tailwind class strings for common use cases.
 * They enforce the monochrome discipline: white-on-void, gold only for status.
 *
 * KEY RULES:
 * - Primary buttons: Solid white, rounded-3xl (24px)
 * - Secondary buttons: Ghost/outline, rounded-3xl
 * - Cards/modals: rounded-2xl (16px)
 * - Inputs: rounded-xl (12px)
 * - Focus rings: WHITE, never gold
 * - Gold: Only for logo and leader status indicators
 * - Typography: 400-600 weight max, never bold/black
 */

// ============================================
// GLASS MORPHISM (Standard Surfaces)
// ============================================
// Borders: default 5-6%, hover 10-12%, focus 20-30%
// Shadows: Flat by default. shadow-lg for elevated, shadow-2xl for floating.

export const GLASS = {
  /** Standard glass surface - cards, containers */
  surface: 'bg-white/[0.02] border border-white/[0.06]',
  /** With backdrop blur - for premium moments */
  surfaceBlur: 'bg-white/[0.02] backdrop-blur-md border border-white/[0.06]',
  /** Hover state for interactive glass */
  hover: 'hover:bg-white/[0.04] hover:border-white/[0.12]',
  /** Focus state for inputs */
  focus: 'focus:bg-white/[0.05] focus:border-white/30',
  /** Selected state - monochrome, no gold */
  selected: 'bg-white/[0.06] border-white/20',
  /** Elevated surface (modals, popovers) */
  elevated: 'bg-[#141414] border border-white/[0.08] shadow-2xl',
  /** Modal surface - ChatGPT style */
  modal: 'bg-[#141414] border border-white/[0.08] rounded-2xl shadow-2xl',
} as const;

// ============================================
// CARD PATTERNS
// ============================================
// Cards use rounded-2xl (16px). Glass surface with subtle borders.

export const CARD = {
  /** Default card - glass surface */
  default: 'bg-white/[0.02] border border-white/[0.06] rounded-2xl',
  /** Interactive card with hover states */
  interactive: 'bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300',
  /** Selected card - monochrome highlight, no gold */
  selected: 'bg-white/[0.06] border border-white/20 rounded-2xl',
} as const;

// ============================================
// INPUT PATTERNS
// ============================================
// Ghost style default. Rounded-xl (12px). Focus: bg + border brighten, white ring.

export const INPUT = {
  /** Ghost input (default) - forms, settings */
  default: 'h-11 px-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.05] focus:border-white/20 transition-all duration-200',
  /** With focus ring - for critical inputs */
  withRing: 'h-11 px-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.05] focus:border-white/20 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-all duration-200',
  /** Legacy aliases */
  boxed: 'h-11 px-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.05] focus:border-white/20 transition-all duration-200',
  ghost: 'h-10 px-3 bg-transparent border-0 text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.02] rounded-xl transition-all duration-200',
} as const;

// ============================================
// BUTTON PATTERNS
// ============================================
// Primary: Solid white. Secondary: Ghost/outline. Never gold for CTAs.

export const BUTTON = {
  /** Primary (CTA) - Solid white, rounded-3xl */
  primary: 'h-12 px-8 rounded-3xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-all duration-300 disabled:bg-neutral-900/80 disabled:text-neutral-700 disabled:cursor-not-allowed inline-flex items-center justify-center',
  /** Secondary - Ghost/outline, rounded-3xl */
  secondary: 'h-12 px-8 rounded-3xl bg-transparent text-white text-sm font-medium border border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 inline-flex items-center justify-center',
  /** Ghost - text only, tertiary actions */
  ghost: 'px-3 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors inline-flex items-center justify-center',
  /** Icon button - square, rounded-xl */
  icon: 'w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200 inline-flex items-center justify-center',
} as const;

// ============================================
// BADGE PATTERNS
// ============================================
// Badges use rounded-full. Gold ONLY for leader status indicators.

export const BADGE = {
  /** Default badge - subtle gray */
  default: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/[0.06] text-white/50',
  /** Leader badge - gold for earned distinction ONLY (logo/leader status) */
  leader: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-500/[0.1] text-gold-500 border border-gold-500/30',
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
// Focus rings are ALWAYS white, NEVER gold. Accessibility requires visible focus.

export const FOCUS = {
  /** Standard focus ring - WHITE with offset */
  ring: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
  /** Inner focus (no offset) - for constrained spaces */
  inner: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset',
  /** Subtle focus (border only) - for inputs */
  subtle: 'focus:outline-none focus:border-white/30',
  /** None - explicitly remove focus ring (use sparingly, ensure alternative indicator) */
  none: 'focus:outline-none',
} as const;

// ============================================
// TYPOGRAPHY PATTERNS
// ============================================
// Never bold (700+). Max weight is semibold (600) for headlines only.
// Use opacity for hierarchy: 90% emphasis, 70% primary, 50% secondary, 30% disabled.

export const TYPOGRAPHY = {
  /** Display - hero titles (40-48px, semibold) */
  display: 'text-[40px] md:text-[48px] font-semibold tracking-[-0.02em] leading-[1.1] text-white/90',
  /** Title XL - page titles (32px, normal weight) */
  titleXl: 'text-[32px] font-normal tracking-tight leading-[1.2] text-white/90',
  /** Title LG - section headers (24px, medium) */
  titleLg: 'text-[24px] font-medium tracking-[-0.01em] leading-[1.3] text-white/90',
  /** Title - card titles (20px, medium) */
  title: 'text-[20px] font-medium leading-[1.4] text-white/90',
  /** Body LG - large body (17px) */
  bodyLg: 'text-[17px] font-normal leading-[1.5] text-white/70',
  /** Body - default body (15px) */
  body: 'text-[15px] font-normal leading-[1.6] text-white/70',
  /** Body SM - secondary text (13px) */
  bodySm: 'text-[13px] font-normal leading-[1.5] text-white/50',
  /** Label - labels, uppercase (12px, medium) */
  label: 'text-[12px] font-medium uppercase tracking-wide leading-[1.4] text-white/50',
  /** Caption - timestamps, meta (11px) */
  caption: 'text-[11px] font-normal leading-[1.4] text-white/30',

  // Legacy aliases (for compatibility)
  heading: 'text-[32px] font-normal tracking-tight text-white/90',
  section: 'text-[24px] font-medium tracking-[-0.01em] text-white/90',
  cardTitle: 'text-[20px] font-medium text-white/90',
  secondary: 'text-[13px] text-white/50',
  meta: 'text-[11px] text-white/30',
} as const;

// ============================================
// MOTION TIER PATTERNS (class names for motion)
// ============================================
// Micro: 150-200ms, Standard: 300-400ms, Cinematic: 500-800ms

export const MOTION_TIERS = {
  /** Micro: Hover, focus, toggles (150-200ms, ease-out) */
  micro: 'duration-200 ease-out',
  /** Standard: Transitions, panels (300-400ms, silk easing) */
  standard: 'duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
  /** Cinematic: Entry, celebration (500-800ms, spring/premium) */
  cinematic: 'duration-500 ease-[cubic-bezier(0.165,0.84,0.44,1)]',
  /** Reduced motion fallback (instant) */
  reduced: 'duration-0',

  // Legacy aliases
  t1: 'duration-500 ease-[cubic-bezier(0.165,0.84,0.44,1)]',
  t2: 'duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
  t3: 'duration-200 ease-out',
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

// ============================================
// EMPTY STATE PATTERNS
// ============================================
// Invisible until needed. No illustrations. Quiet placeholder or nothing.

export const EMPTY_STATE = {
  /** Container - minimal, centered */
  container: 'flex flex-col items-center justify-center py-12 text-center',
  /** Title - subtle, not attention-grabbing */
  title: 'text-[15px] font-medium text-white/50',
  /** Description - very subtle */
  description: 'text-[13px] text-white/30 mt-2',
  /** Action - appears naturally when relevant */
  action: 'mt-4',
} as const;

// ============================================
// LOADING PATTERNS
// ============================================
// Simple spinner only. No skeleton shimmer. Don't fake content shapes.

export const LOADING = {
  /** Spinner container */
  container: 'flex items-center justify-center py-12',
  /** Spinner - simple rotating circle */
  spinner: 'w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin',
} as const;

// ============================================
// MODAL PATTERNS (ChatGPT style)
// ============================================

export const MODAL = {
  /** Backdrop - dark overlay, no blur or minimal */
  backdrop: 'fixed inset-0 bg-black/60',
  /** Content container - centered, elevated */
  content: 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#141414] border border-white/[0.08] rounded-2xl shadow-2xl',
} as const;

// ============================================
// TOAST PATTERNS
// ============================================

export const TOAST = {
  /** Container - bottom-right slide */
  container: 'fixed bottom-4 right-4 z-[600]',
  /** Toast item */
  item: 'bg-[#141414] border border-white/[0.08] rounded-xl shadow-lg px-4 py-3',
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
export type EmptyStatePattern = keyof typeof EMPTY_STATE;
export type LoadingPattern = keyof typeof LOADING;
export type ModalPattern = keyof typeof MODAL;
export type ToastPattern = keyof typeof TOAST;
