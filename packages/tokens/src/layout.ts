// Layout Design Tokens - HIVE Design System
// Single source of truth for max-widths, breakpoints, and spacing

/**
 * LAYOUT PHILOSOPHY
 * -----------------
 * - Single-column dominance (ChatGPT/Apple pattern)
 * - When two things needed: 60/40 split (primary/context)
 * - Never 50/50 (creates competition for attention)
 * - Generous vertical rhythm - elements don't touch
 */

// ============================================
// MAX-WIDTH SCALE
// ============================================

export const MAX_WIDTHS = {
  /** 360px - Tight inputs (OTP, verification codes) */
  xs: '360px',
  /** 420px - Forms (login, simple forms) */
  sm: '420px',
  /** 512px - Content (onboarding steps, modals) */
  md: '512px',
  /** 640px - Wide content (space selection, galleries) */
  lg: '640px',
  /** 896px - Full layouts (complex forms, dashboards) */
  xl: '896px',
  /** 672px - Optimal prose (~65 chars, perfect for reading) */
  reading: '672px',
  /** 1280px - Page container (max app width) */
  page: '1280px',
} as const;

/** Tailwind class equivalents */
export const maxWidthClasses = {
  xs: 'max-w-[360px]',
  sm: 'max-w-[420px]',
  md: 'max-w-[512px]',
  lg: 'max-w-[640px]',
  xl: 'max-w-[896px]',
  reading: 'max-w-[672px]',
  page: 'max-w-[1280px]',
} as const;

// ============================================
// BREAKPOINTS
// ============================================

export const BREAKPOINTS = {
  /** Mobile: 0-639px - Single column, bottom nav */
  mobile: { min: 0, max: 639 },
  /** Tablet: 640-1023px - May show sidebar, 2 columns */
  tablet: { min: 640, max: 1023 },
  /** Desktop: 1024px+ - Full layout, expanded sidebar */
  desktop: { min: 1024, max: Infinity },
  /** Wide: 1440px+ - Centered with max-width */
  wide: { min: 1440, max: Infinity },
} as const;

/** Tailwind breakpoint values */
export const breakpointValues = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1440px',
} as const;

// ============================================
// TOUCH TARGETS
// ============================================

export const TOUCH_TARGETS = {
  /** Minimum touch target (Apple HIG) */
  minimum: '44px',
  /** Recommended touch target */
  recommended: '48px',
  /** Spacing between touch targets */
  spacing: '8px',
} as const;

// ============================================
// SPACING RHYTHM
// ============================================

export const SPACING = {
  /** Section gap - 64px between major sections */
  section: '64px',
  /** Item gap - 48px between related items */
  item: '48px',
  /** Component gap - 24px between components */
  component: '24px',
  /** Tight gap - 12px for closely related elements */
  tight: '12px',
  /** Minimal gap - 8px for inline elements */
  minimal: '8px',
} as const;

/** Tailwind spacing classes */
export const spacingClasses = {
  /** 64px - mb-16 */
  section: 'mb-16',
  /** 48px - mb-12 */
  item: 'mb-12',
  /** 24px - mb-6 */
  component: 'mb-6',
  /** 12px - mb-3 */
  tight: 'mb-3',
  /** 8px - mb-2 */
  minimal: 'mb-2',
} as const;

// ============================================
// SHELL SELECTION GUIDE
// ============================================

/**
 * Shell selection based on content type and user goal
 */
export const SHELLS = {
  /** VoidShell - Auth, onboarding, focused flows */
  void: {
    name: 'VoidShell',
    maxWidth: 'xs-lg',
    useFor: ['Auth', 'Onboarding', 'Focused flows', 'OTP verification'],
    pattern: 'single-column',
    hasNav: false,
  },
  /** UniversalShell - Main authenticated app experience */
  universal: {
    name: 'UniversalShell',
    maxWidth: 'full + sidebar',
    useFor: ['Feed', 'Spaces', 'Calendar', 'Main app'],
    pattern: 'sidebar + content',
    hasNav: true,
  },
  /** StreamShell - Vertical content flow */
  stream: {
    name: 'StreamShell',
    maxWidth: 'sm-lg',
    useFor: ['Feed', 'Notifications', 'Conversations'],
    pattern: 'single-column',
    hasNav: true,
  },
  /** GridShell - Visual browse/discovery */
  grid: {
    name: 'GridShell',
    maxWidth: 'full',
    useFor: ['Space discovery', 'Gallery', 'Browse'],
    pattern: 'responsive-grid',
    hasNav: true,
  },
  /** ProfileShell - Identity pages */
  profile: {
    name: 'ProfileShell',
    maxWidth: 'md-xl',
    useFor: ['User profile', 'Space about', 'Settings'],
    pattern: 'bento',
    hasNav: true,
  },
  /** CanvasShell - Three-panel creation */
  canvas: {
    name: 'CanvasShell',
    maxWidth: 'full',
    useFor: ['HiveLab IDE', 'Editors', 'Builders'],
    pattern: 'three-panel',
    hasNav: false,
  },
} as const;

// ============================================
// LAYOUT HEIGHTS
// ============================================

export const HEIGHTS = {
  /** Main header height */
  header: '64px',
  /** Sidebar width (expanded) */
  sidebarExpanded: '260px',
  /** Sidebar width (collapsed) */
  sidebarCollapsed: '68px',
  /** Mobile bottom nav height */
  bottomNav: '64px',
  /** Minimum button/input height */
  input: '44px',
  /** Standard button height */
  button: '48px',
} as const;

// ============================================
// CHAT SPACING (Hybrid Density)
// ============================================

/**
 * CHAT DENSITY PHILOSOPHY
 * -----------------------
 * - Generous between authors (20px) - clear conversation breaks
 * - Compact within groups (6px) - messages from same author flow
 * - Centered at 720px - optimal reading width like ChatGPT
 * - Date separators have extra breathing room (32px)
 */

export const CHAT_SPACING = {
  /** 20px - Between different authors */
  authorGap: 20,
  /** 6px - Within same author message group */
  groupGap: 6,
  /** 32px - Above and below date separators */
  dateSeparator: 32,
  /** 720px - Max width for message content (centered) */
  messageMaxWidth: 720,
  /** 20px - Padding around hero input */
  inputPadding: 20,
} as const;

/** Tailwind class equivalents for chat */
export const chatSpacingClasses = {
  authorGap: 'mt-5', // 20px
  groupGap: 'mt-1.5', // 6px
  dateSeparator: 'py-8', // 32px top+bottom
  messageMaxWidth: 'max-w-[720px]',
} as const;

// ============================================
// PANEL MOTION
// ============================================

export const PANEL_MOTION = {
  /** 300ms default transition */
  duration: 300,
  /** Silk easing - premium feel */
  ease: [0.23, 1, 0.32, 1] as const,
} as const;

// ============================================
// CONTEXT PANEL
// ============================================

export const CONTEXT_PANEL = {
  /** 360px - Desktop panel width */
  width: '360px',
  /** 80vh - Mobile bottom sheet max height */
  mobileMaxHeight: '80vh',
  /** 40% - Mobile peek snap point */
  mobilePeek: '40%',
  /** 90% - Mobile full snap point */
  mobileFull: '90%',
} as const;

// Types
export type MaxWidth = keyof typeof MAX_WIDTHS;
export type Breakpoint = keyof typeof BREAKPOINTS;
export type SpacingKey = keyof typeof SPACING;
export type ShellType = keyof typeof SHELLS;
export type ChatSpacingKey = keyof typeof CHAT_SPACING;
