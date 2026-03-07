// Component Pattern Tokens - HIVE Design System
// Pre-composed patterns for consistent component styling

/**
 * PATTERN PHILOSOPHY
 * ------------------
 * Black void + gold accent. 2 text tiers (white + white/50).
 * All buttons are pills (rounded-full). Gold for primary CTAs.
 * No glass, no blur (except overlays), no heavy shadows.
 * Focus ring: gold outline. Max 100ms transitions.
 */

// ============================================
// GLASS MORPHISM (Standard Surfaces)
// ============================================
// Borders: default 5-6%, hover 10-12%, focus 20-30%
// Shadows: Flat by default. shadow-lg for elevated, shadow-2xl for floating.

export const GLASS = {
  /** Standard surface — bg-card with subtle border */
  surface: 'bg-[#111] border border-white/[0.05]',
  /** Hover state for interactive surfaces */
  hover: 'hover:bg-[#161616]',
  /** Elevated surface (modals, popovers) — only place blur is allowed */
  elevated: 'bg-[#111] border border-white/[0.05]',
  /** Modal overlay backdrop */
  modal: 'bg-[#111] border border-white/[0.05] rounded-2xl',
} as const;

// ============================================
// CARD PATTERNS
// ============================================
// Cards use rounded-2xl (16px). Glass surface with subtle borders.

export const CARD = {
  /** Default card — bg-card with subtle border */
  default: 'bg-[#111] border border-white/[0.05] rounded-2xl',
  /** Interactive card with hover lift */
  interactive: 'bg-[#111] border border-white/[0.05] rounded-2xl hover:bg-[#161616] transition-colors duration-100',
} as const;

// ============================================
// INPUT PATTERNS
// ============================================
// Ghost style default. Rounded-xl (12px). Focus: bg + border brighten, white ring.

export const INPUT = {
  /** Default input — subtle bg, gold focus */
  default: 'h-11 px-4 bg-[#111] border border-white/[0.05] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFD700]/50 transition-colors duration-100',
  /** With focus ring — critical inputs */
  withRing: 'h-11 px-4 bg-[#111] border border-white/[0.05] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:outline-2 focus:outline-[#FFD700] transition-colors duration-100',
  /** Ghost input — no background */
  ghost: 'h-10 px-3 bg-transparent border-0 text-white placeholder:text-white/30 focus:outline-none focus:bg-white/[0.02] rounded-xl transition-colors duration-100',
} as const;

// ============================================
// BUTTON PATTERNS
// ============================================
// Primary: Solid white. Secondary: Ghost/outline. Never gold for CTAs.

export const BUTTON = {
  /** Primary — gold pill CTA */
  primary: 'h-12 px-8 rounded-full bg-[#FFD700] text-black text-sm font-semibold hover:bg-[#FFD700]/90 transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center',
  /** Secondary — ghost pill */
  secondary: 'h-12 px-8 rounded-full bg-transparent text-white text-sm font-medium border border-white/10 hover:bg-white/[0.04] transition-colors duration-100 inline-flex items-center justify-center',
  /** Ghost — text only */
  ghost: 'px-3 py-2 text-sm font-medium text-white/50 hover:text-white transition-colors duration-100 inline-flex items-center justify-center',
  /** Icon — circle button */
  icon: 'w-11 h-11 rounded-full bg-white/[0.04] border border-white/[0.05] hover:bg-white/[0.08] transition-colors duration-100 inline-flex items-center justify-center',
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
  /** Standard focus ring — gold outline */
  ring: 'focus:outline-none focus-visible:outline-2 focus-visible:outline-[#FFD700]',
  /** Inner focus (no offset) */
  inner: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] focus-visible:ring-inset',
  /** Subtle focus (border only) */
  subtle: 'focus:outline-none focus:border-white/30',
  /** None — remove focus ring (ensure alternative indicator) */
  none: 'focus:outline-none',
} as const;

// ============================================
// TYPOGRAPHY PATTERNS
// ============================================
// Never bold (700+). Max weight is semibold (600) for headlines only.
// Use opacity for hierarchy: 90% emphasis, 70% primary, 50% secondary, 30% disabled.

export const TYPOGRAPHY = {
  // ─── SEMANTIC SCALE (canonical) ──────────────────────────────────────

  /** Page title — 32px Clash Display semibold */
  'page-title': 'font-clash text-[32px] font-semibold tracking-[-0.03em] leading-[1.1] text-white',
  /** Section title — 24px Clash Display semibold */
  'section-title': 'font-clash text-[24px] font-semibold tracking-[-0.02em] leading-[1.2] text-white',
  /** Card title — 20px Clash Display medium */
  'card-title': 'font-clash text-[20px] font-medium tracking-[-0.01em] leading-[1.3] text-white',
  /** Body — 15px Geist regular */
  body: 'text-[15px] font-normal leading-[1.5] text-white',
  /** Body SM — 14px Geist regular, secondary */
  'body-sm': 'text-[14px] font-normal leading-[1.5] text-white/50',
  /** UI — 14px Geist medium, interactive chrome */
  ui: 'text-[14px] font-medium leading-[1.4] text-white',
  /** Data — 14px Geist Mono medium, counts & stats */
  data: 'font-mono text-[14px] font-medium leading-[1.3] tabular-nums text-white',
  /** Data SM — 12px Geist Mono medium, badge numbers */
  'data-sm': 'font-mono text-[12px] font-medium leading-[1.3] tabular-nums text-white',
  /** Label — 11px Geist Mono uppercase, section labels */
  label: 'font-mono text-[11px] font-medium uppercase tracking-label leading-none text-white/50',
  /** Meta — 11px Geist Mono regular, timestamps */
  meta: 'font-mono text-[11px] font-normal leading-[1.3] text-white/30',

  // ─── LEGACY ALIASES (point to semantic) ──────────────────────────────

  /** @deprecated use 'page-title' */
  display: 'font-clash text-[56px] font-semibold tracking-[-0.02em] leading-[1.1] text-white',
  /** @deprecated use 'page-title' */
  titleXl: 'font-clash text-[32px] font-semibold tracking-[-0.03em] leading-[1.1] text-white',
  /** @deprecated use 'section-title' */
  titleLg: 'font-clash text-[24px] font-semibold tracking-[-0.02em] leading-[1.2] text-white',
  /** @deprecated use 'card-title' */
  title: 'font-clash text-[20px] font-medium tracking-[-0.01em] leading-[1.3] text-white',
  /** @deprecated use 'body-sm' */
  bodySm: 'text-[14px] font-normal leading-[1.5] text-white/50',
  /** @deprecated use 'meta' */
  caption: 'font-mono text-[11px] font-normal leading-[1.3] text-white/30',
  /** @deprecated use 'page-title' */
  heading: 'font-clash text-[32px] font-semibold tracking-[-0.03em] text-white',
  /** @deprecated use 'section-title' */
  section: 'font-clash text-[24px] font-semibold tracking-[-0.02em] text-white',
  /** @deprecated use 'card-title' */
  cardTitle: 'font-clash text-[20px] font-medium tracking-[-0.01em] text-white',
  /** @deprecated use 'body' */
  bodyLg: 'text-[15px] font-normal leading-[1.5] text-white',
  /** @deprecated use 'body-sm' */
  secondary: 'text-[14px] text-white/50',
} as const;

// ============================================
// MOTION TIER PATTERNS (class names for motion)
// ============================================
// Micro: 150-200ms, Standard: 300-400ms, Cinematic: 500-800ms

export const MOTION_TIERS = {
  /** Instant — 50ms */
  instant: 'duration-50 ease-out',
  /** Micro — 100ms (max allowed) */
  micro: 'duration-100 ease-out',
  /** Standard — 100ms (same as micro, no slow transitions) */
  standard: 'duration-100 ease-out',
  /** Reduced motion fallback */
  reduced: 'duration-0',

  // Legacy aliases (all capped at 100ms)
  cinematic: 'duration-100 ease-out',
  t1: 'duration-100 ease-out',
  t2: 'duration-100 ease-out',
  t3: 'duration-100 ease-out',
  t4: 'duration-0',
} as const;

// ============================================
// ELEVATION PATTERNS (Z-axis depth)
// ============================================

export const ELEVATION = {
  /** Level 0: Page background */
  base: 'z-0',
  /** Level 1: Cards at rest */
  rest: 'z-10',
  /** Level 2: Floating UI, toolbars, dropdowns */
  floating: 'z-30',
  /** Level 3: Modals, overlays */
  modal: 'z-40',
  /** Level 4: Top layer */
  top: 'z-50',
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
