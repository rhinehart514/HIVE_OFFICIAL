/**
 * HiveLab Shared Tokens
 *
 * Centralizes styling constants for HiveLab IDE components.
 * Uses CSS variables from tokens.css - no hex fallbacks.
 */

// Shared focus ring class - white/50 per HIVE design system
export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-panel)]';

// Compact focus ring for smaller elements
export const FOCUS_RING_INSET =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset';

// Status badge config using CSS vars
export const STATUS_COLORS = {
  deployed: {
    bg: 'bg-[var(--ide-status-success-bg)]',
    text: 'text-[var(--ide-status-success)]',
  },
  published: {
    bg: 'bg-[var(--ide-status-info-bg)]',
    text: 'text-[var(--ide-status-info)]',
  },
  draft: {
    bg: 'bg-white/10',
    text: 'text-white/40',
  },
  warning: {
    bg: 'bg-[var(--ide-status-warning-bg)]',
    text: 'text-[var(--ide-status-warning)]',
  },
  error: {
    bg: 'bg-[var(--ide-status-error-bg)]',
    text: 'text-[var(--ide-status-error)]',
  },
} as const;

// Type colors for connection builder (CSS var values)
export const TYPE_COLORS = {
  string: 'var(--ide-type-string)',
  number: 'var(--ide-type-number)',
  boolean: 'var(--ide-type-boolean)',
  array: 'var(--ide-type-array)',
  object: 'var(--ide-type-object)',
} as const;

// Type colors as Tailwind classes
export const TYPE_COLOR_CLASSES = {
  string: 'text-[var(--ide-type-string)]',
  number: 'text-[var(--ide-type-number)]',
  boolean: 'text-[var(--ide-type-boolean)]',
  array: 'text-[var(--ide-type-array)]',
  object: 'text-[var(--ide-type-object)]',
} as const;

// Workshop transition for Framer Motion
export const WORKSHOP_TRANSITION = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25,
};

// Quick transition for snappy interactions
export const QUICK_TRANSITION = {
  duration: 0.15,
  ease: [0.22, 1, 0.36, 1],
};
