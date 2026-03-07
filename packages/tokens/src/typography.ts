// Typography design tokens

/**
 * HIVE Typography System
 *
 * All-in Geist: one family, differentiated by weight + tracking.
 * This is the Vercel/Linear/SF startup pattern.
 *
 * - Geist: Headlines (bold, tight tracking) + body text
 * - Geist Mono: Technical content, stats, labels
 */
export const typography = {
  fontFamily: {
    display: ['Geist', 'SF Pro Display', 'system-ui', 'sans-serif'],
    body: ['Geist', 'SF Pro Text', 'system-ui', 'sans-serif'],
    mono: ['Geist Mono', 'SF Mono', 'ui-monospace', 'monospace'],

    sans: ['Geist', 'SF Pro Text', 'system-ui', 'sans-serif'],
  },

  // ─── SEMANTIC TYPE SCALE (10 tokens, 3 tiers) ────────────────────────
  //
  // Display (Clash Display):  page-title · section-title · card-title
  // Body    (Geist):          body · body-sm · ui
  // Data    (Geist Mono):     data · data-sm · label · meta
  //
  semantic: {
    'page-title':    { size: '32px', weight: '600', lineHeight: '1.1', tracking: '-0.03em', family: 'display' },
    'section-title': { size: '24px', weight: '600', lineHeight: '1.2', tracking: '-0.02em', family: 'display' },
    'card-title':    { size: '20px', weight: '500', lineHeight: '1.3', tracking: '-0.01em', family: 'display' },
    'body':          { size: '15px', weight: '400', lineHeight: '1.5', tracking: '0',       family: 'body' },
    'body-sm':       { size: '14px', weight: '400', lineHeight: '1.5', tracking: '0',       family: 'body' },
    'ui':            { size: '14px', weight: '500', lineHeight: '1.4', tracking: '0',       family: 'body' },
    'data':          { size: '14px', weight: '500', lineHeight: '1.3', tracking: '0',       family: 'mono' },
    'data-sm':       { size: '12px', weight: '500', lineHeight: '1.3', tracking: '0',       family: 'mono' },
    'label':         { size: '11px', weight: '500', lineHeight: '1.0', tracking: '0.08em',  family: 'mono' },
    'meta':          { size: '11px', weight: '400', lineHeight: '1.3', tracking: '0',       family: 'mono' },
  },

  fontSize: {
    // Semantic scale (canonical)
    'type-page-title': '2rem',       // 32px
    'type-section-title': '1.5rem',  // 24px
    'type-card-title': '1.25rem',    // 20px
    'type-body': '0.9375rem',        // 15px
    'type-body-sm': '0.875rem',      // 14px
    'type-ui': '0.875rem',           // 14px
    'type-data': '0.875rem',         // 14px
    'type-data-sm': '0.75rem',       // 12px
    'type-label': '0.6875rem',       // 11px
    'type-meta': '0.6875rem',        // 11px

    // Legacy sizes (kept for compatibility — used in existing components)
    'display-lg': '2rem',         // 32px → page-title
    'display-sm': '1.5rem',       // 24px → section-title
    'heading-xl': '1.25rem',      // 20px → card-title
    'heading-lg': '1.5rem',       // 24px → section-title (used in legal pages, territory)
    'heading-sm': '0.875rem',     // 14px → body-sm
    'body-lg': '1rem',            // 16px (used in discover, territory — no exact semantic match)
    'body-chat': '0.9375rem',     // 15px → body
    'body-md': '0.875rem',        // 14px → body-sm
    'body-sm': '0.75rem',         // 12px → data-sm
    'body-meta': '0.6875rem',     // 11px → label/meta

    // Legacy aliases (Tailwind override values)
    xs: '0.75rem',               // 12px (matches data-sm)
    sm: '0.75rem',               // 12px
    base: '0.875rem',            // 14px
    lg: '1rem',                  // 16px
    xl: '1.125rem',              // 18px
    '2xl': '1.25rem',            // 20px
  },
  fontWeight: {
    normal: '400',               // Body text
    medium: '500',               // Emphasized text, data, UI chrome
    semibold: '600',             // Headings

    // Legacy aliases
    light: '300',
    bold: '700',
  },
  lineHeight: {
    none: '1',
    tight: '1.1',
    snug: '1.3',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  letterSpacing: {
    display: '-0.03em',           // Page titles
    heading: '-0.02em',           // Section titles
    subtle: '-0.01em',            // Card titles
    normal: '0',                  // Body, data
    label: '0.08em',              // Section labels (uppercase)

    // Legacy aliases
    tightest: '-0.04em',
    tighter: '-0.05em',
    tight: '-0.025em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
    caps: '0.18em',
    'caps-wide': '0.24em',
    'caps-wider': '0.32em',
  },
} as const;

export type TypographyToken = keyof typeof typography; 