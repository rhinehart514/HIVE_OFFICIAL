// Space Layout Design Tokens
// Split Panel architecture for /s/[handle] Space Residence

/**
 * SPACES LAYOUT PHILOSOPHY
 * ------------------------
 * Linear-style split panel: sidebar (200px) + main content
 * Generous but functional - every pixel earns its place.
 *
 * Desktop: Fixed sidebar, fluid main content
 * Mobile: Collapsing sidebar to bottom sheet
 */

// ============================================
// LAYOUT DIMENSIONS
// ============================================

export const SPACE_LAYOUT = {
  /** Header height - compact but comfortable */
  headerHeight: 56,
  /** Sidebar width - enough for boards + tools */
  sidebarWidth: 200,
  /** Sidebar padding - internal spacing */
  sidebarPadding: 12,
  /** Input area height - hero input with attachment */
  inputHeight: 64,
  /** Board item height - touch-friendly */
  boardItemHeight: 36,
  /** Section gap - between sidebar sections */
  sectionGap: 24,
  /** Mobile breakpoint */
  mobileBreakpoint: 768,
} as const;

/** CSS values */
export const spaceLayoutCSS = {
  headerHeight: '56px',
  sidebarWidth: '200px',
  sidebarPadding: '12px',
  inputHeight: '64px',
  boardItemHeight: '36px',
  sectionGap: '24px',
} as const;

/** Tailwind classes */
export const spaceLayoutClasses = {
  headerHeight: 'h-14',        // 56px
  sidebarWidth: 'w-[200px]',
  sidebarPadding: 'p-3',       // 12px
  inputHeight: 'h-16',         // 64px
  boardItemHeight: 'h-9',      // 36px
  sectionGap: 'gap-6',         // 24px
} as const;

// ============================================
// SURFACE COLORS
// ============================================

export const SPACE_COLORS = {
  /** Base background - the void */
  surfaceBase: '#0A0A09',
  /** Subtle border - barely visible */
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  /** Hover surface - whisper of white */
  surfaceHover: 'rgba(255, 255, 255, 0.04)',
  /** Active/selected surface */
  surfaceActive: 'rgba(255, 255, 255, 0.08)',
  /** Online indicator - life */
  onlineIndicator: '#22C55E',
  /** Input focus ring - gold accent */
  inputFocus: 'rgba(255, 215, 0, 0.50)',
  /** Unread badge - gold */
  unreadBadge: 'var(--color-gold)',
} as const;

/** CSS variables for space surfaces */
export const spaceColorVars = {
  '--space-surface-base': SPACE_COLORS.surfaceBase,
  '--space-border-subtle': SPACE_COLORS.borderSubtle,
  '--space-surface-hover': SPACE_COLORS.surfaceHover,
  '--space-surface-active': SPACE_COLORS.surfaceActive,
  '--space-online': SPACE_COLORS.onlineIndicator,
  '--space-input-focus': SPACE_COLORS.inputFocus,
  '--space-unread': SPACE_COLORS.unreadBadge,
} as const;

// ============================================
// TYPOGRAPHY
// ============================================

export const SPACE_TYPOGRAPHY = {
  /** Space name in header */
  spaceName: {
    size: '16px',
    weight: 600,
    letterSpacing: '-0.01em',
  },
  /** Board name in sidebar */
  boardName: {
    size: '14px',
    weight: 500,
  },
  /** Section label (BOARDS, TOOLS) */
  sectionLabel: {
    size: '11px',
    weight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    opacity: 0.40,
  },
  /** Message author name */
  messageAuthor: {
    size: '14px',
    weight: 600,
  },
  /** Message content */
  messageContent: {
    size: '14px',
    weight: 400,
    lineHeight: 1.5,
  },
  /** Timestamp */
  timestamp: {
    size: '12px',
    weight: 400,
    opacity: 0.40,
  },
} as const;

/** Tailwind typography classes */
export const spaceTypographyClasses = {
  spaceName: 'text-base font-semibold tracking-tight',
  boardName: 'text-sm font-medium',
  sectionLabel: 'text-[11px] font-semibold uppercase tracking-wider text-white/40',
  messageAuthor: 'text-sm font-semibold',
  messageContent: 'text-sm font-normal leading-relaxed',
  timestamp: 'text-xs text-white/40',
} as const;

// ============================================
// MOTION
// ============================================

export const SPACE_MOTION = {
  /** Hover interactions - snappy */
  hover: {
    duration: 150,
    ease: 'ease-out',
  },
  /** Sidebar collapse - smooth */
  sidebarCollapse: {
    duration: 200,
    ease: [0.22, 1, 0.36, 1] as const, // ease-premium
  },
  /** Message appear - gentle */
  messageAppear: {
    duration: 150,
    ease: 'ease-out',
  },
  /** Board switch - instant feedback */
  boardSwitch: {
    duration: 100,
    ease: 'ease-out',
  },
} as const;

/** Framer Motion variants */
export const spaceMotionVariants = {
  /** Sidebar slide in */
  sidebarEnter: {
    initial: { opacity: 0, x: -12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -12 },
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
  /** Message entry */
  messageEnter: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  /** Board item hover */
  boardItemHover: {
    scale: 1,
    x: 2,
    transition: { duration: 0.15 },
  },
  /** Content fade on board switch */
  contentSwitch: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.1 },
  },
} as const;

// ============================================
// COMPONENT TOKENS
// ============================================

export const SPACE_COMPONENTS = {
  /** Board item in sidebar */
  boardItem: {
    height: 36,
    paddingX: 12,
    paddingY: 8,
    borderRadius: 8,
    iconSize: 16,
    gap: 8,
  },
  /** Chat input */
  chatInput: {
    minHeight: 44,
    maxHeight: 120,
    paddingX: 16,
    paddingY: 10,
    borderRadius: 12,
  },
  /** Message item */
  messageItem: {
    avatarSize: 32,
    gap: 12,
    paddingY: 8,
  },
  /** Unread divider */
  unreadDivider: {
    height: 1,
    marginY: 16,
    badgePadding: '4px 12px',
  },
  /** Tool card in feed */
  toolCard: {
    maxWidth: 320,
    padding: 16,
    borderRadius: 12,
  },
  /** Event card in feed */
  eventCard: {
    maxWidth: 400,
    padding: 16,
    borderRadius: 12,
  },
} as const;

// ============================================
// RESPONSIVE
// ============================================

export const SPACE_RESPONSIVE = {
  /** Desktop: Full sidebar */
  desktop: {
    sidebarVisible: true,
    sidebarWidth: 200,
  },
  /** Mobile: Sheet behavior */
  mobile: {
    sidebarVisible: false,
    sheetSnapPoints: ['40%', '90%'],
    sheetPeekHeight: 64,
  },
} as const;

// ============================================
// Z-INDEX LAYERS
// ============================================

export const SPACE_Z_INDEX = {
  /** Base content */
  content: 0,
  /** Sidebar (above content on mobile) */
  sidebar: 10,
  /** Header (sticky) */
  header: 20,
  /** Input (sticky bottom) */
  input: 20,
  /** Mobile sheet */
  sheet: 40,
  /** Modals */
  modal: 50,
} as const;

// ============================================
// TYPES
// ============================================

export type SpaceLayout = typeof SPACE_LAYOUT;
export type SpaceColors = typeof SPACE_COLORS;
export type SpaceTypography = typeof SPACE_TYPOGRAPHY;
export type SpaceMotion = typeof SPACE_MOTION;
export type SpaceComponents = typeof SPACE_COMPONENTS;
