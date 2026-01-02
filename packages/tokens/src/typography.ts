// Typography design tokens

export const typography = {
  fontFamily: {
    sans: ['Geist Sans', 'system-ui', 'sans-serif'],
    display: ['Space Grotesk', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    // Display Scale (Hero/Marketing) - Mobile-optimized
    'display-2xl': '2.5rem',      // 40px - Hero headlines
    'display-xl': '2.25rem',      // 36px - Large headlines
    'display-lg': '2rem',         // 32px - Section headlines
    'display-md': '1.75rem',      // 28px - Page titles
    'display-sm': '1.5rem',       // 24px - Subsection titles
    
    // Heading Scale - Mobile-optimized
    'heading-xl': '1.25rem',      // 20px - Main headings
    'heading-lg': '1.125rem',     // 18px - Section headings
    'heading-md': '1rem',         // 16px - Subsection headings
    'heading-sm': '0.875rem',     // 14px - Small headings
    
    // Body Scale - Mobile-optimized
    'body-lg': '1rem',            // 16px - Large body text
    'body-chat': '0.9375rem',     // 15px - Chat messages, descriptions
    'body-md': '0.875rem',        // 14px - Standard body text
    'body-sm': '0.75rem',         // 12px - Small body text
    'body-meta': '0.6875rem',     // 11px - Metadata, timestamps
    'body-xs': '0.625rem',        // 10px - Labels, badges
    'body-2xs': '0.5rem',         // 8px - Captions
    
    // Legacy aliases for backwards compatibility - Mobile-optimized
    xs: '0.625rem',              // 10px (body-xs)
    sm: '0.75rem',               // 12px (body-sm)
    base: '0.875rem',            // 14px (body-md)
    lg: '1rem',                  // 16px (body-lg)
    xl: '1.125rem',              // 18px (heading-lg)
    '2xl': '1.25rem',            // 20px (heading-xl)
  },
  fontWeight: {
    light: '300',                // Light text
    normal: '400',               // Body text
    medium: '500',               // Emphasized text
    semibold: '600',             // Headings
    bold: '700',                 // Strong emphasis
    extrabold: '800',            // Hero headlines, statements
    black: '900',                // Maximum impact
  },
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  letterSpacing: {
    tightest: '-0.04em',          // Headlines with tension
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
    // Caps variants for uppercase text
    caps: '0.18em',               // Standard caps (labels, badges)
    'caps-wide': '0.24em',        // Wide caps (section headers)
    'caps-wider': '0.32em',       // Extra wide caps (hero labels)
  },
} as const;

export type TypographyToken = keyof typeof typography; 