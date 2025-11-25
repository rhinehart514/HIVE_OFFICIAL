// Border radius design tokens - Heavy Radius Design

export const radius = {
  none: '0',                    // No radius
  sm: '0.5rem',                 // 8px - Small elements
  md: '0.75rem',                // 12px - Standard elements
  lg: '1rem',                   // 16px - Cards, buttons
  xl: '1.5rem',                 // 24px - Large cards
  '2xl': '2rem',                // 32px - Hero elements
  full: '9999px',               // Perfect circles
} as const;

/**
 * Semantic radius tokens - Use these in components
 * Maps to foundation radius values for consistency
 */
export const semanticRadius = {
  // Interactive elements
  button: radius.lg,            // 16px - All buttons
  input: radius.lg,             // 16px - Inputs, selects, textareas
  badge: radius.full,           // Pills, tags
  chip: radius.full,            // Filter chips

  // Containers
  card: radius['2xl'],          // 32px - Cards, surfaces
  cardInner: radius.xl,         // 24px - Nested cards, sections
  modal: radius['2xl'],         // 32px - Modals, sheets
  popover: radius.xl,           // 24px - Dropdowns, tooltips

  // Media
  avatar: radius.full,          // Circular avatars
  avatarSquare: radius.lg,      // Square avatars
  thumbnail: radius.lg,         // Image thumbnails

  // Feedback
  toast: radius.xl,             // 24px - Toast notifications
  alert: radius.xl,             // 24px - Inline alerts
} as const;

export type RadiusToken = keyof typeof radius;
export type SemanticRadiusToken = keyof typeof semanticRadius;