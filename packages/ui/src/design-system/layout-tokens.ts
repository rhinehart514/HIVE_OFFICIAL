/**
 * HIVE Design System - Layout Tokens
 *
 * Exported constants for layout dimensions that must be consistent
 * across components. These values correspond to Tailwind utilities
 * and are used for spacing calculations, scroll offsets, etc.
 *
 * Usage:
 *   import { HEADER_HEIGHT, SIDEBAR_WIDTH } from '@hive/ui/design-system/layout-tokens';
 *   <div style={{ paddingTop: HEADER_HEIGHT }}>
 *
 * Tailwind equivalents:
 *   h-14 = 56px (HEADER_HEIGHT)
 *   w-[260px] = 260px (SIDEBAR_WIDTH)
 *   w-[280px] = 280px (MOBILE_NAV_WIDTH)
 */

// Header & Navigation
export const HEADER_HEIGHT = 56; // h-14, desktop sidebar header & mobile header
export const HEADER_HEIGHT_CLASS = 'h-14';

// Sidebar
export const SIDEBAR_WIDTH = 260; // Desktop sidebar width
export const SIDEBAR_WIDTH_CLASS = 'w-[260px]';
export const SIDEBAR_COLLAPSED_WIDTH = 72; // When sidebar is collapsed (future)

// Mobile Navigation
export const MOBILE_NAV_WIDTH = 280; // Mobile slide-out nav
export const MOBILE_NAV_WIDTH_CLASS = 'w-[280px]';
export const MOBILE_HEADER_HEIGHT = 56; // Same as desktop for consistency
export const MOBILE_BOTTOM_NAV_HEIGHT = 0; // No bottom nav currently

// Content Constraints
export const MAX_CONTENT_WIDTH = 768; // max-w-3xl for standard content
export const MAX_CONTENT_WIDTH_CLASS = 'max-w-3xl';
export const CONTENT_PADDING_X = 32; // px-8
export const CONTENT_PADDING_Y = 24; // py-6

// Spacing Scale (Tailwind 4px base)
export const SPACING = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// Border Radius Scale
export const RADIUS = {
  sm: 6, // rounded
  md: 8, // rounded-lg
  lg: 12, // rounded-xl
  xl: 16, // rounded-2xl
  '2xl': 24, // rounded-3xl
  full: 9999, // rounded-full
} as const;

// Z-Index Scale
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
} as const;

// Animation Timings (ms)
export const DURATION = {
  instant: 0,
  fast: 100,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

// Easing Curves
export const EASE = {
  default: [0.25, 0.1, 0.25, 1], // CSS ease
  out: [0, 0, 0.2, 1], // ease-out
  in: [0.4, 0, 1, 1], // ease-in
  inOut: [0.4, 0, 0.2, 1], // ease-in-out
  spring: [0.175, 0.885, 0.32, 1.275], // Bounce effect
  premium: [0.22, 1, 0.36, 1], // HIVE signature - smooth deceleration
} as const;

// Standalone export for direct import (matches entry-motion.ts)
export const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;
