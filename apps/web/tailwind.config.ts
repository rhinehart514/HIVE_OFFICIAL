import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Dark-only mode - no light theme toggle needed
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--hive-font-sans)', 'Geist Sans', 'system-ui', 'sans-serif'],
        display: ['var(--hive-font-display)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['var(--hive-font-mono)', 'JetBrains Mono', 'monospace'],
        manifesto: ['var(--hive-font-manifesto)', 'Clash Display', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Gold - primary brand accent
        gold: {
          500: '#FFD700',
          400: '#FFE033',
          600: '#E6C200',
        },
        // Foundation colors - Neutral gray scale (Apple-inspired)
        foundation: {
          black: '#000000',
          white: '#FFFFFF',
          gray: {
            1000: '#0A0A0A',  // bgBase
            900: '#141414',   // bgSurface
            800: '#1A1A1A',   // bgElevated
            750: '#242424',   // bgActive
            700: '#2A2A2A',   // borderDefault
            600: '#3A3A3A',   // borderHover
            500: '#4A4A4A',   // borderStrong
            400: '#52525B',   // textDisabled
            350: '#71717A',   // textPlaceholder
            300: '#818187',   // textSubtle
            200: '#A1A1A6',   // textSecondary
            100: '#D4D4D8',
            50: '#FAFAFA',    // textPrimary
          },
          gold: {
            500: '#FFD700',
          },
        },
        // Semantic colors using CSS variables
        background: {
          base: 'var(--hive-bg-base)',
          surface: 'var(--hive-bg-surface)',
          elevated: 'var(--hive-bg-elevated)',
          active: 'var(--hive-bg-active)',
          // Legacy aliases
          primary: 'var(--hive-background-primary)',
          secondary: 'var(--hive-background-secondary)',
          tertiary: 'var(--hive-background-tertiary)',
        },
        text: {
          primary: 'var(--hive-text-primary)',
          secondary: 'var(--hive-text-secondary)',
          subtle: 'var(--hive-text-subtle)',
          placeholder: 'var(--hive-text-placeholder)',
          disabled: 'var(--hive-text-disabled)',
          inverse: 'var(--hive-text-inverse)',
        },
        border: {
          default: 'var(--hive-border-default)',
          hover: 'var(--hive-border-hover)',
          strong: 'var(--hive-border-strong)',
          focus: 'var(--hive-border-focus)',
        },
        brand: {
          primary: 'var(--hive-brand-primary)',
          hover: 'var(--hive-brand-hover)',
        },
        status: {
          success: 'var(--hive-status-success)',
          warning: 'var(--hive-status-warning)',
          error: 'var(--hive-status-error)',
          info: 'var(--hive-status-info)',
        },
        // Glass surfaces - semi-transparent overlays
        glass: {
          bg: 'rgba(255, 255, 255, var(--opacity-ghost, 0.04))',
          border: 'rgba(255, 255, 255, var(--opacity-muted, 0.08))',
          hover: 'rgba(255, 255, 255, var(--opacity-soft, 0.10))',
          active: 'rgba(255, 255, 255, var(--opacity-visible, 0.15))',
        },
        // Semantic opacity-based colors
        overlay: {
          ghost: 'rgba(255, 255, 255, 0.04)',
          subtle: 'rgba(255, 255, 255, 0.06)',
          muted: 'rgba(255, 255, 255, 0.08)',
          soft: 'rgba(255, 255, 255, 0.10)',
          medium: 'rgba(255, 255, 255, 0.12)',
          visible: 'rgba(255, 255, 255, 0.15)',
          strong: 'rgba(255, 255, 255, 0.20)',
          prominent: 'rgba(255, 255, 255, 0.30)',
        },
      },
      fontSize: {
        // Label scale - fine print, timestamps, badges
        'label-xs': ['10px', { lineHeight: '1.4' }],
        'label-sm': ['11px', { lineHeight: '1.4' }],
        'label': ['12px', { lineHeight: '1.4' }],
        // Body scale - conversation, content
        'body-sm': ['13px', { lineHeight: '1.5' }],
        'body': ['14px', { lineHeight: '1.5' }],
        'body-lg': ['16px', { lineHeight: '1.5' }],
        // Title scale - section headers, card titles
        'title-sm': ['18px', { lineHeight: '1.3' }],
        'title': ['20px', { lineHeight: '1.3' }],
        'title-lg': ['24px', { lineHeight: '1.2' }],
        // Heading scale - page titles
        'heading-sm': ['28px', { lineHeight: '1.2' }],
        'heading': ['32px', { lineHeight: '1.1' }],
        'heading-lg': ['40px', { lineHeight: '1.1' }],
        // Display scale - hero sections
        'display-sm': ['48px', { lineHeight: '1' }],
        'display': ['56px', { lineHeight: '1' }],
        'display-lg': ['64px', { lineHeight: '1' }],
      },
      borderRadius: {
        none: '0',
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
      },
      boxShadow: {
        'hive-sm': 'var(--hive-shadow-sm)',
        'hive-md': 'var(--hive-shadow-md)',
        'hive-lg': 'var(--hive-shadow-lg)',
        'hive-xl': 'var(--hive-shadow-xl)',
        'hive-gold': 'var(--hive-shadow-gold)',
        'hive-gold-lg': 'var(--hive-shadow-gold-lg)',
        'hive-level1': 'var(--hive-shadow-level1)',
        'hive-level2': 'var(--hive-shadow-level2)',
        'hive-level3': 'var(--hive-shadow-level3)',
      },
      blur: {
        'hive-sm': 'var(--hive-blur-sm)',
        'hive-md': 'var(--hive-blur-md)',
        'hive-lg': 'var(--hive-blur-lg)',
        'hive-xl': 'var(--hive-blur-xl)',
      },
      // Perspective utilities for 3D transforms (motion primitives)
      perspective: {
        none: 'none',
        500: '500px',
        1000: '1000px',
        2000: '2000px',
      },
      // Transform style for 3D preservation
      transformStyle: {
        flat: 'flat',
        '3d': 'preserve-3d',
      },
    },
  },
  plugins: [
    // Custom perspective utility plugin
    function({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.perspective-none': { perspective: 'none' },
        '.perspective-500': { perspective: '500px' },
        '.perspective-1000': { perspective: '1000px' },
        '.perspective-2000': { perspective: '2000px' },
        '.transform-style-flat': { transformStyle: 'flat' },
        '.transform-style-3d': { transformStyle: 'preserve-3d' },
        '.backface-visible': { backfaceVisibility: 'visible' },
        '.backface-hidden': { backfaceVisibility: 'hidden' },
      });
    },
  ],
};

export default config;
