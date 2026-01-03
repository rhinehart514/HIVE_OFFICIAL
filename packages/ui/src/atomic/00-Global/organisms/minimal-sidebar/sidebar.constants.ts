/**
 * MinimalSidebar Constants
 * Resend/YC/SF-inspired design values
 */

// Dimensions
export const SIDEBAR_WIDTH_COLLAPSED = 64;
export const SIDEBAR_WIDTH_EXPANDED = 240;

// LocalStorage keys
export const STORAGE_KEY_EXPANDED = 'hive-sidebar-expanded';
export const STORAGE_KEY_SPACES_OPEN = 'hive-sidebar-spaces-open';

// Colors (Resend-inspired, ultra-minimal)
export const SIDEBAR_COLORS = {
  bg: '#0A0A0A',
  bgHover: 'rgba(255,255,255,0.03)',
  bgActive: 'rgba(255,255,255,0.06)',
  textPrimary: '#FAFAFA',
  textSecondary: '#71717A',
  textMuted: '#52525B',
  border: 'rgba(255,255,255,0.04)',
  gold: '#FFD700',
  goldDim: 'rgba(255,215,0,0.7)',
} as const;

// Animation configs
export const SIDEBAR_SPRING = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

export const LABEL_TRANSITION = {
  duration: 0.1,
};

export const DROPDOWN_TRANSITION = {
  duration: 0.15,
  ease: [0.23, 1, 0.32, 1] as const,
};

// Display limits
export const MAX_VISIBLE_SPACES = 5;
